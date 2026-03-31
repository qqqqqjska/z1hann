// 见面功能模块

let currentEditingMeetingMsgIndex = null;
let isMeetingSelectionMode = false;
let selectedMeetingIds = new Set();

function toRomanNumeral(number) {
    const numerals = [
        ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
        ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
        ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
    ];

    let remaining = Math.max(1, Number(number) || 1);
    let result = '';

    numerals.forEach(([symbol, value]) => {
        while (remaining >= value) {
            result += symbol;
            remaining -= value;
        }
    });

    return result;
}

function getMeetingChapterTitle(meeting, indexFromOldest) {
    const chapterNumber = indexFromOldest + 1;
    return `Chapter ${toRomanNumeral(chapterNumber)}`;
}

function getMeetingDateLabel(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();
    const sameMonth = date.getMonth() === now.getMonth();
    const sameDay = date.getDate() === now.getDate();

    if (sameYear && sameMonth && sameDay) {
        return 'TODAY';
    }

    const monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${monthLabels[date.getMonth()]} ${date.getDate()}`;
}

function getMeetingSummaryText(meeting) {
    if (!meeting.content || meeting.content.length === 0) {
        return '暂无内容';
    }

    const text = meeting.content
        .map(entry => (entry && entry.text ? String(entry.text).trim() : ''))
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ');

    if (!text) {
        return '暂无内容';
    }

    return text.substring(0, 68) + (text.length > 68 ? '…' : '');
}

function escapeMeetingHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getMeetingCompactText(value, maxLength = 48) {
    const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (!normalized) {
        return '';
    }

    if (normalized.length <= maxLength) {
        return normalized;
    }

    return normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd() + '…';
}

function getCurrentMeetingRecord() {
    const contactId = window.iphoneSimState.currentChatContactId;
    const meetingId = window.iphoneSimState.currentMeetingId;
    const meetings = window.iphoneSimState.meetings?.[contactId];
    if (!contactId || !meetingId || !Array.isArray(meetings)) {
        return null;
    }

    return meetings.find(meeting => meeting.id === meetingId) || null;
}

function normalizeMeetingIntegration(meeting) {
    if (!meeting || typeof meeting !== 'object') {
        return { presetId: '', regexEntryKeys: [] };
    }

    let presetId = typeof meeting.integration?.presetId === 'string' ? meeting.integration.presetId : '';
    let regexEntryKeys = Array.isArray(meeting.integration?.regexEntryKeys)
        ? Array.from(new Set(meeting.integration.regexEntryKeys.map(item => String(item || '').trim()).filter(Boolean)))
        : [];

    const presetApp = getPresetAppApi();
    if (presetApp && presetId) {
        const resolvedPreset = typeof presetApp.getPresetById === 'function' ? presetApp.getPresetById(presetId) : null;
        if (resolvedPreset && resolvedPreset.uid && resolvedPreset.uid !== presetId) {
            const legacyPresetId = presetId;
            presetId = resolvedPreset.uid;
            regexEntryKeys = regexEntryKeys.map(function (key) {
                const parsedKey = parseMeetingRegexKey(key);
                if (parsedKey.presetId !== legacyPresetId) {
                    return key;
                }

                return buildMeetingRegexKey(presetId, parsedKey.entryId);
            });
        }
    }

    meeting.integration = {
        presetId,
        regexEntryKeys
    };

    return meeting.integration;
}

function buildMeetingRegexKey(presetId, entryId) {
    return `${String(presetId || '')}::${String(entryId || '')}`;
}

function parseMeetingRegexKey(key) {
    const raw = String(key || '');
    const separatorIndex = raw.indexOf('::');
    if (separatorIndex === -1) {
        return { presetId: '', entryId: '' };
    }

    return {
        presetId: raw.slice(0, separatorIndex),
        entryId: raw.slice(separatorIndex + 2)
    };
}

function getPresetAppApi() {
    return window.PresetApp && typeof window.PresetApp.getPresets === 'function' ? window.PresetApp : null;
}

function getMeetingIntegrationCollections() {
    const presetApp = getPresetAppApi();
    if (!presetApp) {
        return [];
    }

    const presetList = presetApp.getPresets();
    const presets = Array.isArray(presetList) ? presetList : [];

    return presets.map(preset => {
        const presetKey = String(preset?.uid || preset?.id || '');
        const entries = typeof presetApp.getRegexEntriesByPresetId === 'function'
            ? presetApp.getRegexEntriesByPresetId(presetKey)
            : (Array.isArray(preset.regexEntries) ? preset.regexEntries : []);
        const categories = typeof presetApp.getRegexCategoriesByPresetId === 'function'
            ? presetApp.getRegexCategoriesByPresetId(presetKey)
            : (Array.isArray(preset.regexCategories) ? preset.regexCategories : []);
        const activeItems = typeof presetApp.getActivePresetItemsById === 'function'
            ? presetApp.getActivePresetItemsById(presetKey)
            : [];
        const entryMap = new Map();
        const assignedEntryIds = new Set();

        (Array.isArray(entries) ? entries : []).forEach(entry => {
            if (!entry) {
                return;
            }
            entryMap.set(String(entry.id), Object.assign({}, entry));
        });

        const normalizedCategories = (Array.isArray(categories) ? categories : []).map(category => {
            const categoryEntries = (Array.isArray(category?.regexEntryIds) ? category.regexEntryIds : []).map(entryId => {
                return entryMap.get(String(entryId));
            }).filter(Boolean);

            categoryEntries.forEach(entry => assignedEntryIds.add(String(entry.id)));

            return {
                id: String(category?.id || ''),
                name: String(category?.name || '未分类'),
                entries: categoryEntries,
                entryKeys: categoryEntries.map(entry => buildMeetingRegexKey(presetKey, entry.id))
            };
        }).filter(category => category.entries.length > 0);

        const uncategorizedEntries = Array.from(entryMap.values()).filter(entry => !assignedEntryIds.has(String(entry.id)));
        if (uncategorizedEntries.length > 0) {
            normalizedCategories.push({
                id: '__uncategorized__',
                name: '未分类',
                entries: uncategorizedEntries,
                entryKeys: uncategorizedEntries.map(entry => buildMeetingRegexKey(presetKey, entry.id))
            });
        }

        return {
            presetId: presetKey,
            presetTitle: String(preset.title || '未命名预设'),
            activeItemCount: Array.isArray(activeItems) ? activeItems.length : 0,
            categories: normalizedCategories
        };
    });
}

function getMeetingIntegrationPresetSelection(meeting) {
    const presetApp = getPresetAppApi();
    const integration = normalizeMeetingIntegration(meeting);
    if (!presetApp || !integration.presetId) {
        return { preset: null, items: [] };
    }

    const preset = typeof presetApp.getPresetById === 'function' ? presetApp.getPresetById(integration.presetId) : null;
    const items = typeof presetApp.getActivePresetItemsById === 'function' ? presetApp.getActivePresetItemsById(integration.presetId) : [];
    return {
        preset: preset || null,
        items: Array.isArray(items) ? items : []
    };
}

function getMeetingIntegrationRegexRules(meeting) {
    const selectedKeys = new Set(normalizeMeetingIntegration(meeting).regexEntryKeys);
    const collections = getMeetingIntegrationCollections();
    const selectedRuleMap = new Map();

    collections.forEach(collection => {
        collection.categories.forEach(category => {
            category.entries.forEach(entry => {
                const ruleKey = buildMeetingRegexKey(collection.presetId, entry.id);
                if (!selectedKeys.has(ruleKey)) {
                    return;
                }

                if (!selectedRuleMap.has(ruleKey)) {
                    selectedRuleMap.set(ruleKey, {
                        key: ruleKey,
                        presetId: collection.presetId,
                        presetTitle: collection.presetTitle,
                        categoryNames: [],
                        title: String(entry.title || '未命名正则'),
                        pattern: String(entry.pattern || ''),
                        template: String(entry.template || ''),
                        replaceString: Object.prototype.hasOwnProperty.call(entry || {}, 'replaceString') ? String(entry.replaceString ?? '') : undefined,
                        trimStrings: Array.isArray(entry?.trimStrings) ? entry.trimStrings.slice() : undefined,
                        promptOnly: Boolean(entry?.promptOnly),
                        markdownOnly: Boolean(entry?.markdownOnly),
                        runOnEdit: Boolean(entry?.runOnEdit),
                        substituteRegex: Boolean(entry?.substituteRegex),
                        disabled: Boolean(entry?.disabled),
                        placement: Array.isArray(entry?.placement) ? entry.placement.slice() : [],
                        minDepth: entry?.minDepth,
                        maxDepth: entry?.maxDepth
                    });
                }

                const currentRule = selectedRuleMap.get(ruleKey);
                if (!currentRule.categoryNames.includes(category.name)) {
                    currentRule.categoryNames.push(category.name);
                }
            });
        });
    });

    return Array.from(selectedRuleMap.values());
}

function buildMeetingPresetIntegrationPrompt(meeting) {
    const selection = getMeetingIntegrationPresetSelection(meeting);
    if (!selection.preset || !selection.items.length) {
        return '';
    }

    const lines = selection.items.map((item, index) => {
        const label = String(item.en || item.name || `条目${index + 1}`).trim();
        const content = String(item.content || item.zh || '').trim();
        return `${index + 1}. ${label}${content ? `：${content}` : ''}`;
    });

    return `${lines.join('\n')}\n\n`;
}

function sanitizeMeetingPresetMessageContent(content) {
    return String(content || '')
        .replace(/<!--([\s\S]*?)-->/g, ' ')
        .replace(/\{\{[\s\S]*?\}\}/g, ' ')
        .replace(/```[a-zA-Z0-9_-]*\n?/g, '')
        .split(/\r?\n/)
        .map(function (line) {
            return line.trim();
        })
        .filter(Boolean)
        .join('\n')
        .trim();
}

function normalizeMeetingPresetMessageRole(item) {
    const rawRole = String(item?.role || '').trim().toLowerCase();
    if (rawRole === 'assistant' || rawRole === 'user' || rawRole === 'system') {
        return rawRole;
    }
    return item?.systemPrompt ? 'system' : 'system';
}

function buildMeetingPresetMessages(meeting) {
    const selection = getMeetingIntegrationPresetSelection(meeting);
    if (!selection.preset || !selection.items.length) {
        return [];
    }

    const mergedContent = selection.items.map(function (item, index) {
        const cleanedContent = sanitizeMeetingPresetMessageContent(item.content || item.zh || '');
        if (!cleanedContent) {
            return '';
        }

        return `【预设条目 ${index + 1}｜${String(item.en || item.name || '未命名条目').trim()}】\n${cleanedContent}`;
    }).filter(Boolean).join('\n\n');

    if (!mergedContent) {
        return [];
    }

    return [{
        role: 'system',
        content: [
            `以下是本轮见面创作必须尽量遵循的高优先级预设规则，来源于接入预设《${selection.preset.title}》。`,
            `如果其中包含写作指导、输出结构、状态栏、小剧场、摘要、分支、thinking、文风约束等要求，请尽量落实到最终输出中。`,
            `若这些预设要求与默认的“只写普通下一段正文”冲突，以预设中的结构和写作要求优先；但最终仍需把全部内容放进 JSON.reply 字段。`,
            '',
            mergedContent
        ].join('\n')
    }];
}

function buildMeetingRegexIntegrationPrompt(meeting) {
    const rules = getMeetingIntegrationRegexRules(meeting);
    if (!rules.length) {
        return '';
    }

    const lines = rules.map((rule, index) => {
        const categoryLabel = rule.categoryNames.length ? ` / ${rule.categoryNames.join('、')}` : '';
        return `${index + 1}. ${rule.presetTitle}${categoryLabel} / ${rule.title}\n- 匹配：${rule.pattern || '(空)'}\n- 替换：${rule.template || '(空)'}`;
    });

    return `【接入正则】\n以下规则由用户手动勾选，请把它们理解为本次生成时需要尽量贴合的文本处理与表达规则。不要解释规则本身，只需要尽量直接生成符合这些规则处理结果的内容：\n${lines.join('\n')}\n\n`;
}

function updateMeetingIntegrationButtonState(meeting) {
    const button = document.getElementById('meeting-detail-style-btn');
    if (!button) {
        return;
    }

    const integration = normalizeMeetingIntegration(meeting || {});
    const isConfigured = Boolean(integration.presetId) || integration.regexEntryKeys.length > 0;
    button.classList.toggle('is-configured', isConfigured);
    button.setAttribute('title', isConfigured ? '已接入预设或正则' : '接入预设与正则');
}

function logMeetingAiDebug(stage, payload) {
    if (!window.console) {
        return;
    }

    const title = `[Meeting Debug] ${stage}`;
    if (typeof console.groupCollapsed === 'function') {
        console.groupCollapsed(title);
    } else {
        console.log(title);
    }

    Object.keys(payload || {}).forEach(function (key) {
        console.log(key + ':', payload[key]);
    });

    if (typeof console.groupEnd === 'function') {
        console.groupEnd();
    }

    window.__meetingAiDebug = Object.assign({}, window.__meetingAiDebug, {
        lastStage: stage,
        timestamp: Date.now()
    }, payload || {});
}

// 1. 打开见面列表页
function openMeetingsScreen(contactId) {
    if (!contactId) return;
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;

    // 隐藏资料卡，显示见面列表
    document.getElementById('ai-profile-screen').classList.add('hidden');
    document.getElementById('meetings-screen').classList.remove('hidden');
    
    renderMeetingsList(contactId);
}

// 2. 渲染见面列表
function renderMeetingsList(contactId) {
    const list = document.getElementById('meetings-list');
    const emptyState = document.getElementById('meetings-empty');
    if (!list) return;

    list.innerHTML = '';
    
    if (!window.iphoneSimState.meetings) window.iphoneSimState.meetings = {};
    if (!window.iphoneSimState.meetings[contactId]) window.iphoneSimState.meetings[contactId] = [];

    const meetings = window.iphoneSimState.meetings[contactId];

    // 处理空状态
    if (meetings.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        updateMeetingSelectionUI();
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    // 倒序排列渲染
    [...meetings].reverse().forEach(meeting => {
        const item = document.createElement('div');
        item.className = 'meeting-item';
        item.style.cursor = 'pointer';
        item.dataset.meetingId = String(meeting.id);
        
        const originalIndex = meetings.findIndex(m => m.id === meeting.id);
        const chapterTitle = getMeetingChapterTitle(meeting, originalIndex);
        const timeLabel = getMeetingDateLabel(meeting.time);
        
        const summary = getMeetingSummaryText(meeting);

        // HTML 结构：按 demo 的 editorial 列表结构输出
        item.innerHTML = `
            <div class="meeting-item-content" style="width:100%;padding-right:${isMeetingSelectionMode ? '38px' : '0'};box-sizing:border-box;position:relative;">
                <div class="meeting-item-header" style="display:flex;align-items:baseline;justify-content:space-between;gap:16px;width:100%;">
                    <span class="meeting-item-title" style="font-size:18px;color:#111;font-weight:700;font-family:'Palatino Linotype','Book Antiqua',Palatino,'Times New Roman',serif;line-height:1.3;">${chapterTitle}</span>
                    <span class="meeting-item-time" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#999;letter-spacing:.5px;white-space:nowrap;flex-shrink:0;">${timeLabel}</span>
                </div>
                <div class="meeting-item-summary" style="margin-top:8px;font-size:14px;color:#555;line-height:1.6;text-align:justify;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${summary}</div>
            </div>
            ${isMeetingSelectionMode ? `<div class="meeting-select-indicator" style="position:absolute;top:24px;right:0;display:flex;align-items:center;justify-content:center;width:22px;height:22px;border:1px solid ${selectedMeetingIds.has(meeting.id) ? '#111' : '#cfcfcf'};border-radius:50%;background:${selectedMeetingIds.has(meeting.id) ? '#111' : '#fff'};color:#fff;z-index:2;transition:all .15s ease;">${selectedMeetingIds.has(meeting.id) ? '<i class="fas fa-check" style="font-size:11px;"></i>' : ''}</div>` : ''}
        `;
        
        item.addEventListener('click', () => {
            if (isMeetingSelectionMode) {
                if (selectedMeetingIds.has(meeting.id)) {
                    selectedMeetingIds.delete(meeting.id);
                } else {
                    selectedMeetingIds.add(meeting.id);
                }
                updateMeetingSelectionIndicator(item, meeting.id);
                updateMeetingSelectionUI();
                return;
            }

            openMeetingDetail(meeting.id);
        });

        list.appendChild(item);
    });

    updateMeetingSelectionUI();
}

function updateMeetingSelectionIndicator(item, meetingId) {
    if (!item) return;

    let indicator = item.querySelector('.meeting-select-indicator');
    const isSelected = selectedMeetingIds.has(meetingId);

    if (!isMeetingSelectionMode) {
        if (indicator) indicator.remove();
        return;
    }

    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'meeting-select-indicator';
        indicator.style.position = 'absolute';
        indicator.style.top = '24px';
        indicator.style.right = '0';
        indicator.style.display = 'flex';
        indicator.style.alignItems = 'center';
        indicator.style.justifyContent = 'center';
        indicator.style.width = '22px';
        indicator.style.height = '22px';
        indicator.style.borderRadius = '50%';
        indicator.style.color = '#fff';
        indicator.style.zIndex = '2';
        indicator.style.transition = 'all .15s ease';
        item.appendChild(indicator);
    }

    indicator.style.border = `1px solid ${isSelected ? '#111' : '#cfcfcf'}`;
    indicator.style.background = isSelected ? '#111' : '#fff';
    indicator.innerHTML = isSelected ? '<i class="fas fa-check" style="font-size:11px;"></i>' : '';
}

function updateMeetingSelectionUI() {
    const selectBtn = document.getElementById('meeting-select-btn');
    const footerNewMeetingBtn = document.getElementById('meetings-footer-new-btn');
    if (selectBtn) {
        const icon = selectBtn.querySelector('i');
        selectBtn.setAttribute('aria-label', isMeetingSelectionMode ? '删除已选记录' : '进入多选模式');
        selectBtn.style.color = isMeetingSelectionMode ? '#111' : '#777';
        if (icon) {
            icon.className = isMeetingSelectionMode
                ? (selectedMeetingIds.size > 0 ? 'ri-delete-bin-line' : 'ri-check-line')
                : 'ri-menu-line';
        }
    }

    if (footerNewMeetingBtn) {
        footerNewMeetingBtn.style.display = isMeetingSelectionMode ? 'none' : 'inline-flex';
    }
}

function toggleMeetingSelectionMode() {
    if (!window.iphoneSimState.currentChatContactId) return;

    if (isMeetingSelectionMode && selectedMeetingIds.size > 0) {
        const confirmed = confirm(`确定删除已选中的 ${selectedMeetingIds.size} 条见面记录吗？`);
        if (!confirmed) return;

        const contactId = window.iphoneSimState.currentChatContactId;
        const meetings = window.iphoneSimState.meetings[contactId] || [];
        window.iphoneSimState.meetings[contactId] = meetings.filter(meeting => !selectedMeetingIds.has(meeting.id));
        selectedMeetingIds.clear();
        isMeetingSelectionMode = false;
        saveConfig();
        renderMeetingsList(contactId);
        return;
    }

    isMeetingSelectionMode = !isMeetingSelectionMode;
    if (!isMeetingSelectionMode) {
        selectedMeetingIds.clear();
    }

    const listItems = document.querySelectorAll('#meetings-list .meeting-item');
    listItems.forEach(item => {
        const meetingId = Number(item.dataset.meetingId);
        updateMeetingSelectionIndicator(item, meetingId);
    });

    updateMeetingSelectionUI();
}

// 删除单条见面记录
function deleteMeeting(contactId, meetingId) {
    if (!confirm('确定要彻底删除这条见面记录吗？删除后无法恢复。')) return;

    const meetings = window.iphoneSimState.meetings[contactId];
    // 过滤掉要删除的这条
    window.iphoneSimState.meetings[contactId] = meetings.filter(m => m.id !== meetingId);
    
    saveConfig(); // 保存到本地存储
    renderMeetingsList(contactId); // 重新渲染列表
}

// 3. 新建见面
function createNewMeeting() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    const newId = Date.now();
    
    // 获取当前已有见面次数，生成标题
    const count = (window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId]?.length || 0) + 1;
    
    const newMeeting = {
        id: newId,
        time: Date.now(),
        title: `第 ${count} 次见面`,
        content: [], // 结构: { role: 'user'|'ai', text: '...' }
        style: contact.meetingStyle || '正常',
        isFinished: false,
        integration: {
            presetId: '',
            regexEntryKeys: []
        }
    };

    if (!window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId]) window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId] = [];
    window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId].push(newMeeting);
    
    saveConfig();
    
    // 直接进入详情页
    openMeetingDetail(newId);
}

// 4. 进入详情页
function openMeetingDetail(meetingId) {
    window.iphoneSimState.currentMeetingId = meetingId;
    const meetings = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId];
    const meeting = meetings.find(m => m.id === meetingId);
    
    if (!meeting) return;

    normalizeMeetingIntegration(meeting);

    // 检查是否已设置同步选项 (仅针对未完成或新进入的)
    if (meeting.syncWithChat === undefined) {
        // 使用 setTimeout 避免阻塞 UI 渲染
        setTimeout(() => {
            if (confirm('是否将此次见面剧情与线上聊天互通？\n\n选择“确定”：\n1. 见面结束时会自动将剧情摘要同步给AI。\n2. 回到聊天时，AI会记得刚才发生的事并自然接话。\n\n选择“取消”：\n此次见面将是独立的平行宇宙，不影响线上聊天。')) {
                meeting.syncWithChat = true;
            } else {
                meeting.syncWithChat = false;
            }
            saveConfig();
        }, 100);
    }

    document.getElementById('meeting-detail-title').textContent = meeting.title;

    // 更新静态图标
    const endIconUrl = (window.iphoneSimState.meetingIcons && window.iphoneSimState.meetingIcons.end) ? window.iphoneSimState.meetingIcons.end : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkYzQjMwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTkgMjFIMWMtMS4xIDAtMi0uOS0yLTJWMWMwLTEuMS45LTIgMi0yaDhNMjEgMTJsLTUtNW01IDVsLTUgNW01LTVoLTEzIi8+PC9zdmc+';
    const continueIconUrl = (window.iphoneSimState.meetingIcons && window.iphoneSimState.meetingIcons.continue) ? window.iphoneSimState.meetingIcons.continue : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE1IDRINFYyMmgxNFYxMSIvPjxwYXRoIGQ9Ik0xNSAxNnYtMiIvPjxwYXRoIGQ9Ik04IDloMiIvPjxwYXRoIGQ9Ik0yMCA5aDIiLz48cGF0aCBkPSJNMTcuOCAxMS44TDE5IDEzIi8+PHBhdGggZD0iTTEwLjYgNi42TDEyIDgiLz48cGF0aCBkPSJNNC44IDExLjhMNiAxMyIvPjxwYXRoIGQ9Ik0xMiA0LjhMMTAuNiA2Ii8+PHBhdGggZD0iTTE5IDQuOEwxNy44IDYiLz48cGF0aCBkPSJNMTIgMTMuMkw0LjggMjAuNGEyLjggMi44IDAgMCAwIDQgNEwxNiAxNy4yIi8+PC9zdmc+';

    const endIcon = document.getElementById('meeting-end-icon');
    if (endIcon) endIcon.src = endIconUrl;
    
    const continueIcon = document.getElementById('meeting-continue-icon');
    if (continueIcon) continueIcon.src = continueIconUrl;

    // 应用自定义壁纸
    const contactId = window.iphoneSimState.currentChatContactId;
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    const detailScreen = document.getElementById('meeting-detail-screen');
    
    if (contact && contact.meetingWallpaper) {
        detailScreen.style.backgroundImage = `url(${contact.meetingWallpaper})`;
        detailScreen.style.backgroundSize = 'cover';
        detailScreen.style.backgroundPosition = 'center';
    } else {
        detailScreen.style.backgroundImage = '';
        detailScreen.style.backgroundSize = '';
        detailScreen.style.backgroundPosition = '';
    }

    document.getElementById('meeting-detail-screen').classList.remove('hidden');
    
    renderMeetingCards(meeting);
    updateMeetingIntegrationButtonState(meeting);
}

function syncMeetingAiControlsState(isGenerating) {
    const continueBtn = document.getElementById('meeting-ai-continue-btn');
    const inputEl = document.getElementById('meeting-input');

    if (continueBtn) {
        continueBtn.disabled = !!isGenerating;
        continueBtn.style.pointerEvents = isGenerating ? 'none' : '';
        continueBtn.style.opacity = isGenerating ? '0.6' : '';
    }

    if (inputEl) {
        inputEl.disabled = !!isGenerating;
    }
}

// 5. 渲染详情页卡片流
function renderMeetingCards(meeting) {
    const container = document.getElementById('meeting-card-container');
    container.innerHTML = '';
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    
    // 获取图标 URL，如果 state 中没有则使用默认值
    const editIconUrl = (window.iphoneSimState.meetingIcons && window.iphoneSimState.meetingIcons.edit) ? window.iphoneSimState.meetingIcons.edit : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTExIDRINFYyMmgxNFYxMSIvPjxwYXRoIGQ9Ik0xOC41IDIuNWEyLjEyMSAyLjEyMSAwIDAgMSAzIDNMMTIgMTVIOHYtNGw5LjUtOS41eiIvPjwvc3ZnPg==';
    const deleteIconUrl = (window.iphoneSimState.meetingIcons && window.iphoneSimState.meetingIcons.delete) ? window.iphoneSimState.meetingIcons.delete : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkYzQjMwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlsaW5lIHBvaW50cz0iMyA2IDUgNiAyMSA2Ii8+PHBhdGggZD0iTTE5IDZ2MTRhMiAyIDAgMCAxLTIgMkg3YTIgMiAwIDAgMS0yLTJWNm0zIDBUNGEyIDIgMCAwIDEgMi0yaDRhMiAyIDAgMCAxIDIgMnYyIi8+PGxpbmUgeDE9IjEwIiB5MT0iMTEiIHgyPSIxMCIgeTI9IjE3Ii8+PGxpbmUgeDE9IjE0IiB5MT0iMTEiIHgyPSIxNCIgeTI9IjE3Ii8+PC9zdmc+';

    meeting.content.forEach((msg, index) => {
        const card = document.createElement('div');
        card.className = `meeting-card meeting-editorial-block ${msg.role === 'user' ? 'user' : 'ai'}`;
        
        let avatar = '';
        let name = '';
        let roleClass = '';
        
        if (msg.role === 'user') {
            avatar = window.iphoneSimState.userProfile.avatar;
            name = '我';
            roleClass = 'meeting-card-role-user';
        } else {
            avatar = contact.avatar;
            name = contact.name; // 使用 AI 人设名
            roleClass = 'meeting-card-role-ai';
        }

        const roleLabel = msg.role === 'user' ? 'YOU' : 'CHARACTER';

        card.innerHTML = `
            <div class="meeting-editorial-role-tag ${roleClass}" style="font-family:-apple-system,sans-serif;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${msg.role === 'user' ? '#222' : '#b0b0b0'};display:flex;align-items:center;gap:10px;justify-content:${msg.role === 'user' ? 'flex-end' : 'flex-start'};">
                ${msg.role === 'user' ? '' : '<span style="display:block;width:24px;height:1px;background:#ddd;"></span>'}
                <span>${roleLabel}</span>
                ${msg.role === 'user' ? '<span style="display:block;width:24px;height:1px;background:#222;"></span>' : ''}
            </div>
            <div class="meeting-card-content" style="font-size:16px;line-height:1.92;letter-spacing:.2px;color:${msg.role === 'user' ? '#666' : '#2c2c2c'};text-align:${msg.role === 'user' ? 'right' : 'justify'};font-style:${msg.role === 'user' ? 'italic' : 'normal'};">${formatMeetingStoryHtml(msg.text, msg.role === 'ai' ? meeting : null)}</div>
            <div class="meeting-card-actions" style="position:absolute;top:0;${msg.role === 'user' ? 'left:0;padding-right:12px;' : 'right:0;padding-left:12px;'}display:flex;gap:16px;opacity:0;transition:opacity .25s;background:#fdfdfc;">
                <img src="${editIconUrl}" class="meeting-action-icon" onclick="window.editMeetingMsg(${index})" title="编辑" style="width:15px;height:15px;object-fit:contain;opacity:.7;">
                <img src="${deleteIconUrl}" class="meeting-action-icon danger" onclick="window.deleteMeetingMsg(${index})" title="删除" style="width:15px;height:15px;object-fit:contain;opacity:.7;">
            </div>
        `;
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '14px';
        card.style.position = 'relative';
        container.appendChild(card);
    });
    
    // 应用字体大小
    if (contact.meetingFontSize) {
        container.style.fontSize = `${contact.meetingFontSize}px`;
    } else {
        container.style.fontSize = '';
    }

    // 应用字体大小
    if (contact.meetingFontSize) {
        container.style.fontSize = `${contact.meetingFontSize}px`;
    } else {
        container.style.fontSize = '';
    }

    // 自动滚动到底部
    container.scrollTop = container.scrollHeight;

    syncMeetingAiControlsState(!!(meeting && meeting.isGeneratingAi));
}

// 6. 发送剧情文本
function handleSendMeetingText() {
    const input = document.getElementById('meeting-input');
    const text = input.value.trim();
    
    if (!text) return;
    if (!window.iphoneSimState.currentMeetingId || !window.iphoneSimState.currentChatContactId) return;

    const meetings = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId];
    const meeting = meetings.find(m => m.id === window.iphoneSimState.currentMeetingId);
    
    if (meeting) {
        meeting.content.push({
            role: 'user',
            text: text
        });
        meeting.suggestedActions = [];
        saveConfig();
        renderMeetingCards(meeting);
        
        // 重置输入框
        input.value = '';
        input.style.height = '24px'; 
    }
}

function getCurrentMeetingRecord() {
    if (!window.iphoneSimState.currentChatContactId || !window.iphoneSimState.currentMeetingId) return null;
    const meetings = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId] || [];
    return meetings.find(m => m.id === window.iphoneSimState.currentMeetingId) || null;
}

function sanitizeMeetingSuggestionText(text) {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    return normalized.length > 50 ? normalized.slice(0, 50) : normalized;
}

function escapeMeetingHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function splitMeetingStoryParagraphs(text) {
    const source = String(text || '').replace(/\r\n/g, '\n').trim();
    if (!source) return [];

    const explicitParagraphs = source.split(/\n{2,}/).map(item => item.trim()).filter(Boolean);
    if (explicitParagraphs.length >= 2) return explicitParagraphs;

    const normalized = source.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    const sentenceChunks = normalized.match(/[^。！？!?]+[。！？!?”』）)]*|[^。！？!?]+$/g) || [normalized];
    const paragraphs = [];
    let bucket = [];

    sentenceChunks.forEach((sentence, index) => {
        const cleanSentence = sentence.trim();
        if (!cleanSentence) return;
        bucket.push(cleanSentence);
        const shouldBreak = bucket.length >= 3 || cleanSentence.length >= 42 || index === sentenceChunks.length - 1;
        if (shouldBreak) {
            paragraphs.push(bucket.join(''));
            bucket = [];
        }
    });

    return paragraphs.length > 0 ? paragraphs : [normalized];
}

function extractMeetingRegexTemplateParts(template) {
    if (template && typeof template === 'object') {
        const hasExplicitReplace = Object.prototype.hasOwnProperty.call(template, 'replaceString');
        return {
            replacement: String(template.replaceString ?? ''),
            hasReplacement: hasExplicitReplace,
            trimStrings: Array.isArray(template.trimStrings) ? template.trimStrings.map(function (item) {
                return String(item || '').trim();
            }).filter(Boolean) : [],
            promptOnly: Boolean(template.promptOnly),
            markdownOnly: Boolean(template.markdownOnly),
            disabled: Boolean(template.disabled)
        };
    }

    const source = String(template || '').replace(/\r\n/g, '\n');
    let replacement = source;
    let trimStrings = [];
    const modes = [];

    const modeMatch = replacement.match(/\n{2,}Mode:\s*([^\n]+)\s*$/i);
    if (modeMatch) {
        replacement = replacement.slice(0, modeMatch.index);
        modeMatch[1].split(/\s*(?:[·|]|路)\s*/).forEach(function (item) {
            const value = String(item || '').trim().toLowerCase();
            if (value) {
                modes.push(value);
            }
        });
    }

    const trimMatch = replacement.match(/\n{2,}Trim:\s*([^\n]+)\s*$/i);
    if (trimMatch) {
        replacement = replacement.slice(0, trimMatch.index);
        trimStrings = trimMatch[1].split('|').map(function (item) {
            return String(item || '').trim();
        }).filter(Boolean);
    }

    return {
        replacement: replacement.trim(),
        hasReplacement: source.trim() === '' || replacement.trim() !== '' || trimStrings.length > 0 || modes.length > 0,
        trimStrings: trimStrings,
        promptOnly: modes.includes('prompt'),
        markdownOnly: modes.includes('markdown'),
        disabled: modes.includes('disabled')
    };
}

function buildMeetingRenderRegex(pattern) {
    const source = String(pattern || '').trim();
    if (!source) {
        return null;
    }

    const literalMatch = source.match(/^\/([\s\S]*)\/([a-z]*)$/i);
    try {
        if (literalMatch) {
            return new RegExp(literalMatch[1], literalMatch[2]);
        }
        return new RegExp(source, 'g');
    } catch (error) {
        return null;
    }
}

function getMeetingRegexRulePlacements(rule) {
    const placements = Array.isArray(rule?.placement) ? rule.placement.map(function (value) {
        return Number(value);
    }).filter(function (value) {
        return Number.isFinite(value);
    }) : [];

    if (placements.length > 0) {
        return placements;
    }

    const title = String(rule?.title || '').toLowerCase();
    const pattern = String(rule?.pattern || '').toLowerCase();
    const template = String(rule?.template || rule?.replaceString || '').toLowerCase();

    if (title.includes('cot') || title.includes('thinking') || pattern.includes('<thinking>') || template.includes('<thinking>')) {
        return [6];
    }

    return [2];
}

function getMeetingRenderRegexRules(meeting, placement) {
    return getMeetingIntegrationRegexRules(meeting).filter(function (rule) {
        const placements = getMeetingRegexRulePlacements(rule);
        return placements.includes(Number(placement));
    });
}

function expandMeetingReplacementTemplate(template, matchValue, captures) {
    const source = String(template || '');
    const groups = Array.isArray(captures) ? captures : [];
    let output = '';

    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        if (char !== '$' || index >= source.length - 1) {
            output += char;
            continue;
        }

        const next = source[index + 1];

        if (next === '$') {
            output += '$';
            index += 1;
            continue;
        }

        if (next === '&') {
            output += String(matchValue || '');
            index += 1;
            continue;
        }

        if (/\d/.test(next)) {
            const firstIndex = Number(next);
            const secondChar = index + 2 < source.length ? source[index + 2] : '';
            const hasSecondDigit = /\d/.test(secondChar);
            let captureIndex = Number.isFinite(firstIndex) ? firstIndex : NaN;
            let consumedDigits = 1;

            if (hasSecondDigit) {
                const doubleIndex = Number(next + secondChar);
                if (doubleIndex >= 1 && doubleIndex <= groups.length) {
                    captureIndex = doubleIndex;
                    consumedDigits = 2;
                } else if (!(captureIndex >= 1 && captureIndex <= groups.length)) {
                    captureIndex = NaN;
                }
            } else if (!(captureIndex >= 1 && captureIndex <= groups.length)) {
                captureIndex = NaN;
            }

            if (Number.isFinite(captureIndex)) {
                const captureValue = groups[captureIndex - 1];
                output += captureValue == null ? '' : String(captureValue);
                index += consumedDigits;
                continue;
            }
        }

        output += '$';
    }

    return output;
}

function applyMeetingReplacementTemplate(source, regex, template) {
    const input = String(source || '');
    const replacement = String(template || '');
    return input.replace(regex, function () {
        const args = Array.prototype.slice.call(arguments);
        const matchValue = args[0];
        const maybeGroups = args[args.length - 1];
        const hasNamedGroups = maybeGroups && typeof maybeGroups === 'object';
        const captureEndIndex = hasNamedGroups ? args.length - 3 : args.length - 2;
        const captures = args.slice(1, captureEndIndex);
        return expandMeetingReplacementTemplate(replacement, matchValue, captures);
    });
}

function applyMeetingRegexRendering(text, meeting, placement) {
    let output = String(text || '');
    const rules = getMeetingRenderRegexRules(meeting, placement);

    rules.forEach(function (rule) {
        const regex = buildMeetingRenderRegex(rule.pattern);
        if (!regex) {
            return;
        }

        const templateParts = extractMeetingRegexTemplateParts(rule);
        if (templateParts.disabled || templateParts.promptOnly) {
            return;
        }

        try {
            if (templateParts.hasReplacement) {
                output = applyMeetingReplacementTemplate(output, regex, templateParts.replacement);
            }
        } catch (error) {
        }

        templateParts.trimStrings.forEach(function (trimText) {
            if (!trimText) {
                return;
            }
            output = output.split(trimText).join('');
        });
    });

    return output;
}

function appendMeetingRenderedTextSegments(segments, text) {
    const source = String(text || '');
    if (!source.trim()) {
        return;
    }

    const htmlDocRegex = /<!doctype\s+html[\s\S]*?<\/html>|<html[\s\S]*?<\/html>|<body[\s\S]*?<\/body>/gi;
    let lastIndex = 0;
    let match = null;

    while ((match = htmlDocRegex.exec(source))) {
        if (match.index > lastIndex) {
            segments.push({ type: 'text', content: source.slice(lastIndex, match.index) });
        }

        segments.push({ type: 'htmlDoc', content: String(match[0] || '').trim() });
        lastIndex = htmlDocRegex.lastIndex;
    }

    if (lastIndex < source.length) {
        segments.push({ type: 'text', content: source.slice(lastIndex) });
    }
}

function splitMeetingRenderedSegments(text) {
    const source = String(text || '').replace(/\r\n/g, '\n');
    const segments = [];
    const htmlBlockRegex = /```html\s*([\s\S]*?)```/gi;
    let lastIndex = 0;
    let match = null;

    while ((match = htmlBlockRegex.exec(source))) {
        if (match.index > lastIndex) {
            appendMeetingRenderedTextSegments(segments, source.slice(lastIndex, match.index));
        }

        segments.push({ type: 'htmlDoc', content: String(match[1] || '').trim() });
        lastIndex = htmlBlockRegex.lastIndex;
    }

    if (lastIndex < source.length) {
        appendMeetingRenderedTextSegments(segments, source.slice(lastIndex));
    }

    return segments.filter(function (segment) {
        return String(segment.content || '').trim();
    });
}

function injectMeetingHtmlFrameRuntime(docHtml) {
    const source = String(docHtml || '').trim();
    if (!source) {
        return '';
    }

    const resetMarkup = '<style data-meeting-html-frame-reset="true">html,body{margin:0!important;padding:0!important;background:transparent!important;overflow:hidden!important;height:auto!important;min-height:0!important;}#root{min-height:0!important;}</style>';
    const runtimeMarkup = [
        '<script data-meeting-html-frame-runtime="true">',
        '(function(){',
        'if(window.__meetingFrameAutoResizeInstalled){return;}',
        'window.__meetingFrameAutoResizeInstalled=true;',
        'var lastHeight=0;',
        'var rafId=0;',
        'var pendingForce=false;',
        'var resizeObserver=null;',
        'var mutationObserver=null;',
        'function getVisibleBodyChildren(){if(!document.body){return [];}return Array.prototype.filter.call(document.body.children||[],function(node){if(!node||String(node.tagName||"").toUpperCase()==="SCRIPT"){return false;}var style=window.getComputedStyle?window.getComputedStyle(node):null;return !(style&&style.display==="none");});}',
        'function getPrimaryScaleTarget(){var root=document.getElementById("root");if(root){return root;}var children=getVisibleBodyChildren();return children.length?children[0]:null;}',
        'function getRectHeight(node){if(!node||!node.getBoundingClientRect){return 0;}var rect=node.getBoundingClientRect();return rect&&isFinite(rect.height)?Math.ceil(rect.height):0;}',
        'function getRectWidth(node){if(!node||!node.getBoundingClientRect){return 0;}var rect=node.getBoundingClientRect();return rect&&isFinite(rect.width)?Math.ceil(rect.width):0;}',
        'function getUnscaledOuterWidth(node){if(!node){return 0;}var style=window.getComputedStyle?window.getComputedStyle(node):null;var marginLeft=style?parseFloat(style.marginLeft)||0:0;var marginRight=style?parseFloat(style.marginRight)||0:0;return Math.max(node.scrollWidth||0,node.offsetWidth||0,getRectWidth(node))+marginLeft+marginRight;}',
        'function getBottomRelativeToBody(node){if(!node||!node.getBoundingClientRect||!document.body){return 0;}var rect=node.getBoundingClientRect();if(!rect||!isFinite(rect.bottom)){return 0;}var bodyRect=document.body.getBoundingClientRect?document.body.getBoundingClientRect():{top:0};var style=window.getComputedStyle?window.getComputedStyle(node):null;var marginBottom=style?parseFloat(style.marginBottom)||0:0;return Math.ceil((rect.bottom-((bodyRect&&isFinite(bodyRect.top))?bodyRect.top:0))+marginBottom);}',
        'function applyWidthFit(){',
        'var target=getPrimaryScaleTarget();',
        'if(!target){return;}',
        'var frame=null;',
        'try{frame=window.frameElement||null;}catch(e){}',
        'var availableWidth=Math.max(frame&&frame.clientWidth?frame.clientWidth:0,document.documentElement?document.documentElement.clientWidth:0,window.innerWidth||0,1);',
        'var naturalWidth=getUnscaledOuterWidth(target);',
        'var nextScale=naturalWidth>availableWidth+1?Math.max(Math.min(availableWidth/naturalWidth,1),0.1):1;',
        'if(target.__meetingFrameScale!==nextScale){',
        'target.__meetingFrameScale=nextScale;',
        'target.style.transform=nextScale<0.999?"scale("+nextScale+")":"";',
        'target.style.transformOrigin="top center";',
        '}',
        '}',
        'function getNaturalHeight(){',
        'var children=getVisibleBodyChildren();',
        'if(!children.length){return Math.max(getRectHeight(document.body),1);}',
        'var maxChildBottom=0;',
        'children.forEach(function(node){var bottom=getBottomRelativeToBody(node);if(bottom>maxChildBottom){maxChildBottom=bottom;}});',
        'return Math.max(maxChildBottom,1);',
        '}',
        'function applyHeight(force){',
        'applyWidthFit();',
        'var height=getNaturalHeight();',
        'if(!force&&Math.abs(height-lastHeight)<1){return;}',
        'lastHeight=height;',
        'try{if(window.frameElement){window.frameElement.style.height=height+"px";window.frameElement.style.minHeight="1px";}}catch(e){}',
        '}',
        'function schedule(force){',
        'pendingForce=pendingForce||Boolean(force);',
        'if(rafId){return;}',
        'var runner=window.requestAnimationFrame||function(callback){return setTimeout(callback,16);};',
        'rafId=runner(function(){var shouldForce=pendingForce;pendingForce=false;rafId=0;applyHeight(shouldForce);});',
        '}',
        'function connectResizeObserver(){',
        'if(typeof ResizeObserver==="undefined"){return;}',
        'if(resizeObserver){resizeObserver.disconnect();}',
        'resizeObserver=new ResizeObserver(function(){schedule(false);});',
        'if(document.documentElement){resizeObserver.observe(document.documentElement);}',
        'if(document.body){resizeObserver.observe(document.body);Array.prototype.forEach.call(document.body.children||[],function(node){if(node){resizeObserver.observe(node);}});}',
        '}',
        'function connectMutationObserver(){',
        'if(typeof MutationObserver==="undefined"){return;}',
        'if(mutationObserver){mutationObserver.disconnect();}',
        'mutationObserver=new MutationObserver(function(){connectResizeObserver();schedule(true);});',
        'mutationObserver.observe(document.documentElement||document,{subtree:true,childList:true,attributes:true,characterData:true});',
        '}',
        'function burst(){',
        'schedule(true);',
        '[80,220,500,900].forEach(function(delay){setTimeout(function(){schedule(true);},delay);});',
        '}',
        'connectResizeObserver();',
        'connectMutationObserver();',
        'window.addEventListener("load",burst);',
        'document.addEventListener("DOMContentLoaded",burst);',
        'document.addEventListener("transitionend",burst,true);',
        'document.addEventListener("animationend",burst,true);',
        'document.addEventListener("toggle",burst,true);',
        'document.addEventListener("click",function(event){',
        'var target=event&&event.target;',
        'if(target&&target.closest&&target.closest("summary,details,button,[role=button]")){burst();return;}',
        'schedule(false);',
        '},true);',
        'if(document.fonts&&document.fonts.ready&&typeof document.fonts.ready.then==="function"){document.fonts.ready.then(function(){connectResizeObserver();burst();}).catch(function(){});}',
        'Array.prototype.forEach.call(document.images||[],function(image){',
        'if(!image||image.complete){return;}',
        'image.addEventListener("load",burst);',
        'image.addEventListener("error",burst);',
        '});',
        'window.addEventListener("resize",burst);',
        'burst();',
        '})();',
        '</script>'
    ].join('');

    let enhanced = source;
    if (/<\/head>/i.test(enhanced)) {
        enhanced = enhanced.replace(/<\/head>/i, resetMarkup + '</head>');
    } else if (/<body\b[^>]*>/i.test(enhanced)) {
        enhanced = enhanced.replace(/<body\b[^>]*>/i, function (match) {
            return match + resetMarkup;
        });
    } else {
        enhanced = resetMarkup + enhanced;
    }

    if (/<\/body>/i.test(enhanced)) {
        enhanced = enhanced.replace(/<\/body>/i, runtimeMarkup + '</body>');
    } else {
        enhanced += runtimeMarkup;
    }

    return enhanced;
}

function buildMeetingHtmlFrame(docHtml) {
    const source = String(docHtml || '').trim();
    if (!source) {
        return '';
    }

    const frameSource = injectMeetingHtmlFrameRuntime(source);
    const resizeScript = "try{var frame=this;var d=frame.contentWindow&&frame.contentWindow.document;if(!d)return;var getVisibleBodyChildren=function(){if(!d.body){return [];}return Array.prototype.filter.call(d.body.children||[],function(node){if(!node||String(node.tagName||'').toUpperCase()==='SCRIPT'){return false;}var style=frame.contentWindow&&frame.contentWindow.getComputedStyle?frame.contentWindow.getComputedStyle(node):null;return !(style&&style.display==='none');});};var getPrimaryScaleTarget=function(){var root=d.getElementById('root');if(root){return root;}var children=getVisibleBodyChildren();return children.length?children[0]:null;};var getRectHeight=function(node){if(!node||!node.getBoundingClientRect)return 0;var rect=node.getBoundingClientRect();return rect&&isFinite(rect.height)?Math.ceil(rect.height):0;};var getRectWidth=function(node){if(!node||!node.getBoundingClientRect)return 0;var rect=node.getBoundingClientRect();return rect&&isFinite(rect.width)?Math.ceil(rect.width):0;};var getUnscaledOuterWidth=function(node){if(!node)return 0;var style=frame.contentWindow&&frame.contentWindow.getComputedStyle?frame.contentWindow.getComputedStyle(node):null;var marginLeft=style?parseFloat(style.marginLeft)||0:0;var marginRight=style?parseFloat(style.marginRight)||0:0;return Math.max(node.scrollWidth||0,node.offsetWidth||0,getRectWidth(node))+marginLeft+marginRight;};var getBottomRelativeToBody=function(node){if(!node||!node.getBoundingClientRect||!d.body)return 0;var rect=node.getBoundingClientRect();if(!rect||!isFinite(rect.bottom))return 0;var bodyRect=d.body.getBoundingClientRect?d.body.getBoundingClientRect():{top:0};var style=frame.contentWindow&&frame.contentWindow.getComputedStyle?frame.contentWindow.getComputedStyle(node):null;var marginBottom=style?parseFloat(style.marginBottom)||0:0;return Math.ceil((rect.bottom-((bodyRect&&isFinite(bodyRect.top))?bodyRect.top:0))+marginBottom);};var applyWidthFit=function(){var target=getPrimaryScaleTarget();if(!target)return;var availableWidth=Math.max(frame.clientWidth||0,d.documentElement?d.documentElement.clientWidth:0,frame.contentWindow?frame.contentWindow.innerWidth||0:0,1);var naturalWidth=getUnscaledOuterWidth(target);var nextScale=naturalWidth>availableWidth+1?Math.max(Math.min(availableWidth/naturalWidth,1),0.1):1;if(target.__meetingFrameScale!==nextScale){target.__meetingFrameScale=nextScale;target.style.transform=nextScale<0.999?'scale('+nextScale+')':'';target.style.transformOrigin='top center';}};var update=function(){applyWidthFit();var children=getVisibleBodyChildren();var h=1;if(children.length){children.forEach(function(node){var bottom=getBottomRelativeToBody(node);if(bottom>h){h=bottom;}});}else{h=Math.max(getRectHeight(d.body),1);}frame.style.height=h+'px';frame.style.minHeight='1px';};update();setTimeout(update,80);setTimeout(update,220);setTimeout(update,500);setTimeout(update,900);}catch(e){}";
    return `<div style="margin:0 0 1.15em 0;"><iframe class="meeting-html-frame" scrolling="no" sandbox="allow-scripts allow-same-origin" onload="${escapeMeetingHtml(resizeScript)}" srcdoc="${escapeMeetingHtml(frameSource)}" style="display:block;width:100%;height:1px;min-height:1px;border:0;border-radius:20px;background:transparent;overflow:hidden;"></iframe></div>`;
}

function isMeetingHtmlDocument(text) {
    return /^\s*(?:<!doctype\s+html\b|<html\b|<head\b|<body\b)/i.test(String(text || ''));
}

function shouldRenderMeetingHtmlFrame(text) {
    const source = String(text || '').trim();
    if (!source) {
        return false;
    }

    if (isMeetingHtmlDocument(source)) {
        return true;
    }

    return /^</.test(source) && /<(?:style|script)\b/i.test(source);
}

function wrapMeetingHtmlSnippet(text) {
    const source = String(text || '').trim();
    if (!source) {
        return '';
    }

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;background:transparent;">${source}</body></html>`;
}

function containsMeetingRenderableHtml(text) {
    return /<(?:div|details|summary|img|section|article|table|svg|ul|ol|li|p|blockquote|figure|pre|code|span|strong|em|h[1-6]|button|canvas|video|audio)\b/i.test(String(text || ''));
}

function stripMeetingWrapperLikeTags(text) {
    return String(text || '').replace(/<\/?([a-zA-Z][\w:-]*)\b[^>]*>/g, function (match, tagName) {
        const normalized = String(tagName || '').toLowerCase();
        return /^(?:div|details|summary|img|section|article|table|svg|ul|ol|li|p|blockquote|figure|pre|code|span|strong|em|h[1-6]|button|canvas|video|audio|style|script|head|body|html|meta|link)$/i.test(normalized)
            ? match
            : '';
    });
}

function cleanupMeetingRenderedText(text) {
    return stripMeetingWrapperLikeTags(String(text || ''))
        .replace(/<\/?thinking>/gi, '')
        .replace(/<\/?reply>/gi, '')
        .trim();
}

function cleanupMeetingPromptBodyText(text) {
    return String(text || '')
        .replace(/\r\n/g, '\n')
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        .replace(/<content\b[^>]*>/gi, '')
        .replace(/<\/content>/gi, '')
        .replace(/<reply\b[^>]*>/gi, '')
        .replace(/<\/reply>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(?:p|div|section|article|li|blockquote|pre|h[1-6])>/gi, '\n')
        .replace(/<(?:li)\b[^>]*>/gi, '- ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function extractMeetingPromptBodyText(text) {
    const source = String(text || '').trim();
    if (!source) {
        return '';
    }

    const taggedParts = [];
    const contentRegex = /<content\b[^>]*>([\s\S]*?)<\/content>/gi;
    let match = null;

    while ((match = contentRegex.exec(source))) {
        const bodyText = cleanupMeetingPromptBodyText(match[1]);
        if (bodyText) {
            taggedParts.push(bodyText);
        }
    }

    if (taggedParts.length > 0) {
        return taggedParts.join('\n\n').trim();
    }

    const sectionText = splitMeetingReplySections(source)
        .filter(function (section) {
            return section.type !== 'thinking';
        })
        .map(function (section) {
            return cleanupMeetingPromptBodyText(section.content);
        })
        .filter(Boolean)
        .join('\n\n')
        .trim();

    return sectionText || cleanupMeetingPromptBodyText(source);
}

function getMeetingPromptContextText(entry) {
    if (!entry) {
        return '';
    }

    if (entry.role === 'ai') {
        const cached = String(entry.promptText || '').trim();
        return cached || extractMeetingPromptBodyText(entry.text);
    }

    return String(entry.text || '').trim();
}

function formatMeetingTextSegment(text) {
    const source = String(text || '').trim();
    if (!source) {
        return '';
    }

    if (isMeetingHtmlDocument(source)) {
        return buildMeetingHtmlFrame(source);
    }

    if (shouldRenderMeetingHtmlFrame(source)) {
        return buildMeetingHtmlFrame(wrapMeetingHtmlSnippet(source));
    }

    const cleaned = cleanupMeetingRenderedText(source);
    if (!cleaned) {
        return '';
    }

    if (containsMeetingRenderableHtml(cleaned)) {
        return cleaned.replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>');
    }

    const paragraphs = splitMeetingStoryParagraphs(cleaned);
    if (paragraphs.length === 0) {
        return '';
    }

    return paragraphs.map(function (paragraph) {
        return `<p style="margin:0 0 1.15em 0;">${escapeMeetingHtml(paragraph)}</p>`;
    }).join('');
}

function splitMeetingReplySections(text) {
    const source = String(text || '').replace(/\r\n/g, '\n');
    const sections = [];
    const thinkingRegex = /<thinking>[\s\S]*?<\/thinking>/gi;
    let lastIndex = 0;
    let match = null;

    while ((match = thinkingRegex.exec(source))) {
        if (match.index > lastIndex) {
            sections.push({ type: 'body', content: source.slice(lastIndex, match.index) });
        }

        sections.push({ type: 'thinking', content: match[0] });
        lastIndex = thinkingRegex.lastIndex;
    }

    if (lastIndex < source.length) {
        sections.push({ type: 'body', content: source.slice(lastIndex) });
    }

    if (sections.length === 0) {
        return [{ type: 'body', content: source }];
    }

    return sections.filter(function (section) {
        return String(section.content || '').trim();
    });
}

function renderMeetingFormattedContent(text) {
    const segments = splitMeetingRenderedSegments(text);

    if (segments.length === 0) {
        return formatMeetingTextSegment(text);
    }

    return segments.map(function (segment) {
        return segment.type === 'htmlDoc'
            ? buildMeetingHtmlFrame(segment.content)
            : formatMeetingTextSegment(segment.content);
    }).join('');
}

function escapeMeetingRegExp(text) {
    return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatMeetingStoryHtml(text, meeting) {
    const sections = splitMeetingReplySections(text);

    return sections.map(function (section) {
        const placement = section.type === 'thinking' ? 6 : 2;
        const renderedText = applyMeetingRegexRendering(section.content, meeting, placement);
        return renderMeetingFormattedContent(renderedText);
    }).join('');
}

function buildMeetingSuggestionFallbacks(meeting) {
    const contactId = window.iphoneSimState.currentChatContactId;
    const contact = (window.iphoneSimState.contacts || []).find(item => item.id === contactId) || {};
    const contactName = contact.name || '对方';
    const history = Array.isArray(meeting && meeting.content) ? meeting.content : [];
    const hasAiReply = history.some(item => item && item.role === 'ai' && item.text);
    return [
        sanitizeMeetingSuggestionText(hasAiReply ? `${contactName}抬眼看向你，语气放轻了一些，把眼前的气氛继续往更深处推。` : `${contactName}停顿了一瞬，指尖轻轻收紧，让这段剧情出现新的呼吸感。`),
        sanitizeMeetingSuggestionText(`${contactName}像突然意识到了什么，目光沉下来，让原本平稳的气氛拐进新的转折。`),
        sanitizeMeetingSuggestionText(`${contactName}忽然靠近了些，呼吸和体温都压了过来，让暧昧意味一点点变浓。`)
    ];
}

function normalizeMeetingSuggestions(rawSuggestions, meeting) {
    const fallbacks = buildMeetingSuggestionFallbacks(meeting);
    const normalized = [];
    const seen = new Set();
    (Array.isArray(rawSuggestions) ? rawSuggestions : []).forEach(item => {
        const text = sanitizeMeetingSuggestionText(item);
        if (!text || seen.has(text)) return;
        seen.add(text);
        normalized.push(text);
    });
    for (let i = 0; i < fallbacks.length && normalized.length < 3; i += 1) {
        const text = sanitizeMeetingSuggestionText(fallbacks[i]);
        if (!text || seen.has(text)) continue;
        seen.add(text);
        normalized.push(text);
    }
    return normalized.slice(0, 3);
}

function stripMeetingResponseCodeFences(text) {
    return String(text || '')
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .replace(/^json\s*(?=\{)/i, '')
        .trim();
}

function decodeMeetingJsonLikeString(rawQuotedValue) {
    const raw = String(rawQuotedValue || '');
    if (!raw) {
        return '';
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        const inner = raw.replace(/^"|"$/g, '');
        return inner
            .replace(/\\u([0-9a-fA-F]{4})/g, function (_, code) {
                return String.fromCharCode(parseInt(code, 16));
            })
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\b/g, '\b')
            .replace(/\\f/g, '\f')
            .replace(/\\\//g, '/')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
    }
}

function readMeetingJsonLikeQuotedString(text, startIndex) {
    const source = String(text || '');
    if (source[startIndex] !== '"') {
        return null;
    }

    let index = startIndex + 1;
    let escaped = false;

    while (index < source.length) {
        const char = source[index];
        if (escaped) {
            escaped = false;
            index += 1;
            continue;
        }

        if (char === '\\') {
            escaped = true;
            index += 1;
            continue;
        }

        if (char === '"') {
            const raw = source.slice(startIndex, index + 1);
            return {
                raw: raw,
                value: decodeMeetingJsonLikeString(raw),
                endIndex: index + 1
            };
        }

        index += 1;
    }

    return null;
}

function extractMeetingJsonLikeStringField(text, fieldName) {
    const source = String(text || '');
    const keyRegex = new RegExp('"' + fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"\\s*:\\s*"', 'i');
    const match = keyRegex.exec(source);
    if (!match) {
        return '';
    }

    const quoteIndex = match.index + match[0].length - 1;
    const parsed = readMeetingJsonLikeQuotedString(source, quoteIndex);
    return parsed ? parsed.value : '';
}

function extractMeetingJsonLikeSuggestions(text) {
    const source = String(text || '');
    const keyRegex = /"suggestions"\s*:\s*\[/i;
    const match = keyRegex.exec(source);
    if (!match) {
        return [];
    }

    let index = match.index + match[0].length;
    const results = [];

    while (index < source.length) {
        while (index < source.length && /\s|,/.test(source[index])) {
            index += 1;
        }

        if (source[index] === ']') {
            break;
        }

        if (source[index] !== '"') {
            index += 1;
            continue;
        }

        const parsed = readMeetingJsonLikeQuotedString(source, index);
        if (!parsed) {
            break;
        }

        results.push(parsed.value);
        index = parsed.endIndex;
    }

    return results;
}

function parseMeetingAiResponse(rawText, meeting) {
    const trimmed = String(rawText || '').trim();
    if (!trimmed) return { reply: '', suggestions: buildMeetingSuggestionFallbacks(meeting) };

    let content = stripMeetingResponseCodeFences(trimmed);
    try {
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
            content = content.substring(jsonStart, jsonEnd + 1);
        }
        const parsed = JSON.parse(content);
        return {
            reply: String(parsed.reply || parsed.text || parsed.content || '').trim() || trimmed,
            suggestions: normalizeMeetingSuggestions(parsed.suggestions, meeting)
        };
    } catch (e) {
        const extractedReply = extractMeetingJsonLikeStringField(content, 'reply')
            || extractMeetingJsonLikeStringField(content, 'text')
            || extractMeetingJsonLikeStringField(content, 'content');
        const extractedSuggestions = extractMeetingJsonLikeSuggestions(content);

        if (extractedReply) {
            return {
                reply: extractedReply.trim(),
                suggestions: normalizeMeetingSuggestions(extractedSuggestions, meeting)
            };
        }

        return {
            reply: content || trimmed,
            suggestions: buildMeetingSuggestionFallbacks(meeting)
        };
    }
}

window.renderMeetingActionSuggestionMenu = function() {
    const meeting = getCurrentMeetingRecord();
    const list = document.getElementById('meeting-action-suggestion-list');
    if (!list || !meeting) return;
    const items = Array.isArray(meeting.suggestedActions) ? meeting.suggestedActions.filter(Boolean) : [];
    if (items.length === 0) {
        list.innerHTML = '<div style="padding:16px;color:#666;font-size:13px;line-height:1.5;">先输入一段剧情片段并点击一次“续写剧情”，系统会生成本轮的 3 条剧情推进建议。</div>';
        return;
    }
    list.innerHTML = items.map((text, index) => `
        <div class="create-menu-item" style="border-bottom:1px solid #f0f0f0;" onclick="window.pickMeetingActionSuggestion('${encodeURIComponent(text).replace(/'/g, '%27')}')">
            <div class="create-menu-text" style="font-size:12px;color:#999;margin-bottom:4px;">${index === 0 ? '自然剧情行动' : index === 1 ? '转折剧情行动' : 'NSFW剧情行动'}</div>
            <div class="create-menu-text" style="font-size:14px;line-height:1.45;">${text}</div>
        </div>
    `).join('');
};

window.toggleMeetingActionSuggestionMenu = function(forceOpen = null) {
    const menu = document.getElementById('meeting-action-suggestion-menu');
    if (!menu) return;
    const shouldOpen = forceOpen === null ? !menu.classList.contains('active') : !!forceOpen;
    menu.classList.toggle('active', shouldOpen);
    if (shouldOpen) window.renderMeetingActionSuggestionMenu();
};

window.pickMeetingActionSuggestion = function(encodedText) {
    const input = document.getElementById('meeting-input');
    if (!input) return;
    const text = decodeURIComponent(encodedText || '').trim();
    if (!text) return;
    input.value = text;
    input.focus();
    window.toggleMeetingActionSuggestionMenu(false);
};

function getMeetingWorldbookCategories() {
    return Array.isArray(window.iphoneSimState?.wbCategories) ? window.iphoneSimState.wbCategories : [];
}

function normalizeMeetingLinkedWorldbookIds(ids) {
    const availableIdSet = new Set(getMeetingWorldbookCategories().map(category => Number(category.id)).filter(Number.isFinite));
    if (!Array.isArray(ids)) {
        return [];
    }

    return Array.from(new Set(ids
        .map(id => Number(id))
        .filter(id => Number.isFinite(id) && availableIdSet.has(id))));
}

function getMeetingStyleSelectedWorldbookIds() {
    return normalizeMeetingLinkedWorldbookIds(
        Array.from(document.querySelectorAll('#meeting-worldbook-list .meeting-worldbook-checkbox:checked'))
            .map(checkbox => checkbox.dataset.id)
    );
}

function renderMeetingStyleWorldbookList(selectedIds) {
    const container = document.getElementById('meeting-worldbook-list');
    if (!container) {
        return;
    }

    const categories = getMeetingWorldbookCategories();
    const selectedIdSet = new Set(normalizeMeetingLinkedWorldbookIds(selectedIds));

    if (!categories.length) {
        container.innerHTML = '<div style="font-size:13px;line-height:1.6;color:#8e8e93;text-align:center;">暂无世界书分类</div>';
        return;
    }

    container.innerHTML = categories.map(category => {
        return `
            <label style="display:flex;align-items:flex-start;gap:12px;cursor:pointer;">
                <input type="checkbox" class="meeting-worldbook-checkbox" data-id="${escapeMeetingHtml(category.id)}" ${selectedIdSet.has(Number(category.id)) ? 'checked' : ''} style="margin-top:2px;">
                <span style="font-size:15px;font-weight:600;color:#111;line-height:1.35;word-break:break-all;">${escapeMeetingHtml(category.name || '未命名世界书')}</span>
            </label>
        `;
    }).join('');
}

function getMeetingLinkedWorldbookEntries(contact) {
    const selectedIds = new Set(normalizeMeetingLinkedWorldbookIds(contact?.meetingLinkedWbCategories));
    if (!selectedIds.size) {
        return [];
    }

    return (Array.isArray(window.iphoneSimState?.worldbook) ? window.iphoneSimState.worldbook : []).filter(entry => {
        return selectedIds.has(Number(entry?.categoryId)) && entry?.enabled !== false && String(entry?.content || '').trim();
    });
}

function buildMeetingWorldbookPrompt(contact) {
    const entries = getMeetingLinkedWorldbookEntries(contact);
    if (!entries.length) {
        return '';
    }

    const categoryNameMap = new Map(getMeetingWorldbookCategories().map(category => [Number(category.id), String(category.name || '未命名世界书')]));
    const lines = entries.map((entry, index) => {
        const categoryName = categoryNameMap.get(Number(entry.categoryId)) || '未分类';
        const title = String(entry.remark || (Array.isArray(entry.keys) && entry.keys.length ? entry.keys.join(' / ') : '') || `条目${index + 1}`).trim();
        const content = String(entry.content || '').trim();
        return `${index + 1}. [${categoryName}] ${title}${content ? `：${content}` : ''}`;
    });

    return `【见面关联世界书】\n以下内容来自用户为见面模式单独关联的世界书，且这些条目当前在世界书应用中处于开启状态。请将它们视为本轮线下见面的背景设定、事实约束、人物关系或世界信息，创作时尽量保持一致，不要逐条复述规则本身。\n${lines.join('\n')}\n\n`;
}

// 7. 保存文风
function saveMeetingStyle() {
    const style = document.getElementById('meeting-style-input').value.trim();
    const minWords = document.getElementById('meeting-min-words').value;
    const maxWords = document.getElementById('meeting-max-words').value;
    const meetingLinkedWbCategories = getMeetingStyleSelectedWorldbookIds();

    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (contact) {
        contact.meetingStyle = style;
        contact.meetingMinWords = minWords;
        contact.meetingMaxWords = maxWords;
        contact.meetingLinkedWbCategories = meetingLinkedWbCategories;
        saveConfig();
        document.getElementById('meeting-style-modal').classList.add('hidden');
    }
}

// 8. 结束见面
function endMeeting() {
    if (!confirm('确定结束这次见面吗？这将保存当前进度并返回见面列表。')) return;
    
    const contactId = window.iphoneSimState.currentChatContactId;
    const meetingId = window.iphoneSimState.currentMeetingId;
    const meetings = window.iphoneSimState.meetings[contactId];
    const meeting = meetings.find(m => m.id === meetingId);

    document.getElementById('meeting-detail-screen').classList.add('hidden');
    closeMeetingIntegrationModal();
    
    window.iphoneSimState.currentMeetingId = null;
    renderMeetingsList(contactId); // 刷新列表

    // 如果开启了同步，自动总结并注入聊天
    if (meeting && meeting.content && meeting.content.length > 0) {
        if (meeting.syncWithChat) {
            showNotification('正在同步见面剧情...');
            generateMeetingSummary(contactId, meeting, true); // true = inject into chat
        } else {
            // 原有逻辑：手动询问是否生成回忆
            if (confirm('是否要对本次见面剧情进行总结生成回忆？')) {
                showNotification('正在总结见面剧情...');
                generateMeetingSummary(contactId, meeting, false);
            }
        }
    }
}

async function generateMeetingSummary(contactId, meeting, injectIntoChat = false) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) {
        showNotification('联系人不存在', 2000, 'error');
        return;
    }

    const settings = window.iphoneSimState.aiSettings2.url ? window.iphoneSimState.aiSettings2 : window.iphoneSimState.aiSettings; // 优先使用副API
    if (!settings.url || !settings.key) {
        console.log('未配置API，无法自动总结见面');
        showNotification('未配置API', 2000, 'error');
        return;
    }

    let userName = '用户';
    if (contact.userPersonaId) {
        const p = Array.isArray(window.iphoneSimState.userPersonas)
            ? window.iphoneSimState.userPersonas.find(item => item.id === contact.userPersonaId)
            : null;
        if (p && p.name) userName = p.name;
    } else if (window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.name) {
        userName = window.iphoneSimState.userProfile.name;
    }
    const actorNames = typeof resolveSummaryActorNames === 'function'
        ? resolveSummaryActorNames(contact, userName)
        : { userLabel: userName || '用户', contactLabel: contact.name || '联系人' };
    userName = actorNames.userLabel;
    const contactLabel = actorNames.contactLabel;

    const meetingMessages = (Array.isArray(meeting && meeting.content) ? meeting.content : [])
        .map((m, idx) => ({
            role: m && m.role === 'user' ? 'user' : 'ai',
            time: (meeting && Number.isFinite(Number(meeting.time)) ? Number(meeting.time) : Date.now()) + idx * 60000,
            content: String(m && m.text ? m.text : '').trim(),
            type: 'meeting_text'
        }))
        .filter(item => item.content);
    const totalMessageCount = meetingMessages.length;
    if (totalMessageCount <= 0) {
        showNotification('见面内容为空', 2000);
        return;
    }

    let summary = '';
    try {
        if (typeof window.generateChannelNaturalSummary !== 'function') {
            throw new Error('summary helper unavailable');
        }
        const generated = await window.generateChannelNaturalSummary(contact, meetingMessages, {
            channel: 'chat',
            source: injectIntoChat ? 'meeting_sync' : 'meeting_summary',
            rangeLabel: meeting && meeting.title ? meeting.title : '见面剧情',
            summaryPromptMode: 'manual',
            totalMessageCount,
            sourceMessageCount: totalMessageCount,
            settings
        });
        summary = String(generated && generated.summary || '').trim();
        if (!summary) throw new Error('empty summary');
    } catch (error) {
        console.error('见面总结API请求失败:', error);
        showNotification('见面总结失败', 2000, 'error');
        return;
    }
    summary = String(summary || '').trim();

    if (summary && summary !== '无' && summary !== '无。') {
        // 1. 添加到记忆
        window.iphoneSimState.memories.push({
            id: Date.now(),
            contactId: contact.id,
            content: `【见面回忆】(${meeting.title}) ${summary}`,
            time: Date.now(),
            range: '见面剧情',
            source: injectIntoChat ? 'meeting_sync' : 'meeting_summary',
            memoryTags: injectIntoChat ? ['short_term', 'long_term'] : ['long_term'],
            importance: injectIntoChat ? 0.88 : 0.82,
            confidence: 0.92
        });

        // 2. 如果需要同步到聊天 (Inject into chat history)
        if (injectIntoChat) {
            if (!window.iphoneSimState.chatHistory[contactId]) {
                window.iphoneSimState.chatHistory[contactId] = [];
            }
            
            const systemMsg = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                time: Date.now(),
                role: 'system',
                content: `[系统事件]: 用户刚刚结束了与你的线下见面（${meeting.title}）。\n见面剧情摘要：${summary}。\n请注意：你们刚刚分开，回到了线上聊天状态。请根据见面的情况，自然地继续话题，或者对见面进行回味/吐槽/关心。`,
                type: 'system_event', // 特殊类型，不直接显示给用户
                includeInAiContext: true,
                systemEventKind: 'meeting_sync'
            };
            
            window.iphoneSimState.chatHistory[contactId].push(systemMsg);
            
            // 触发 AI 主动回复（模拟刚分开后的消息）
            setTimeout(() => {
            if (window.generateAiReply) {
                    window.generateAiReply(`（系统提示：见面结束了，用户现在回到了线上。请根据刚才的见面摘要"${summary}"，主动给用户发一条消息，自然地过渡到线上聊天。）`, contactId);
                }
            }, 2000);
        }

        saveConfig();
        
        console.log('见面剧情同步完成:', summary.substring(0, 20) + '...');
        showNotification(injectIntoChat ? '已同步见面剧情' : '见面总结完成', 2000, 'success');
    } else {
        showNotification('未生成有效内容', 2000, 'error');
    }
}

// 9. 全局工具函数：编辑和删除剧情
window.deleteMeetingMsg = function(index) {
    if (!confirm('确定删除这段剧情？')) return;
    if (!window.iphoneSimState.currentChatContactId || !window.iphoneSimState.currentMeetingId) return;

    const meeting = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId].find(m => m.id === window.iphoneSimState.currentMeetingId);
    if (meeting) {
        meeting.content.splice(index, 1);
        saveConfig();
        renderMeetingCards(meeting);
    }
}

window.editMeetingMsg = function(index) {
    if (!window.iphoneSimState.currentChatContactId || !window.iphoneSimState.currentMeetingId) return;

    const meeting = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId].find(m => m.id === window.iphoneSimState.currentMeetingId);
    if (meeting) {
        currentEditingMeetingMsgIndex = index;
        const content = meeting.content[index].text;
        document.getElementById('edit-meeting-msg-content').value = content;
        document.getElementById('edit-meeting-msg-modal').classList.remove('hidden');
    }
}

/**
 * 2. 构造见面模式的专用 Prompt
 */
function constructMeetingPrompt(contactId, newUserInput) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    const meetingId = window.iphoneSimState.currentMeetingId;
    const meetings = window.iphoneSimState.meetings[contactId];
    const currentMeeting = meetings.find(m => m.id === meetingId);
    const hasPresetInstructions = buildMeetingPresetMessages(currentMeeting).length > 0;
    const meetingWorldbookPrompt = buildMeetingWorldbookPrompt(contact);
    
    // 获取线上聊天背景摘要（不直接拼接聊天原文，避免串回消息语境）
    let chatContext = '';
    const chatHistory = window.iphoneSimState.chatHistory[contactId] || [];
    if (chatHistory.length > 0) {
        const recentChats = chatHistory
            .filter(msg => msg && msg.type !== 'system_event' && msg.content)
            .slice(-12);
        const userCount = recentChats.filter(msg => msg.role === 'user').length;
        const contactCount = recentChats.filter(msg => msg.role !== 'user').length;
        const latestFacts = recentChats.slice(-3).map(msg => {
            let content = String(msg.content || '').trim();
            if (content.length > 24) content = `${content.slice(0, 24)}…`;
            return msg.role === 'user' ? `- 用户近期提过：${content}` : `- ${contact.name}近期表现为：${content}`;
        }).join('\n');
        chatContext = [
            `你与用户在线上已有一定互动基础。`,
            `最近聊天中，用户主动表达约 ${userCount} 次，${contact.name}主动表达约 ${contactCount} 次。`,
            latestFacts
        ].filter(Boolean).join('\n');
    }

    // 基础设定
    let prompt = `你现在不是联系人本人，而是一个RP 的旁白写手 / 共创剧情引擎。\n`;
    prompt += `角色：${contact.name}。\n`;
    prompt += `联系人设：${contact.persona || '无特定人设'}。\n`;
    
    // 添加用户人设
    if (contact.userPersonaPromptOverride) {
        prompt += `用户人设：${contact.userPersonaPromptOverride}。\n`;
    } else if (contact.userPersonaId) {
        // 如果没有覆盖，尝试查找预设人设
        const p = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
        if (p && p.aiPrompt) {
            prompt += `用户人设：${p.aiPrompt}。\n`;
        }
    }

    prompt += `当前场景/文风/地点：${currentMeeting.style || '默认场景'}。\n\n`;
    
    if (chatContext) {
        prompt += `【关系背景摘要】(仅作人物关系和熟悉度参考，不代表当前仍在线上聊天)\n${chatContext}\n\n`;
    }

    if (meetingWorldbookPrompt) {
        prompt += meetingWorldbookPrompt;
    }

    prompt += `【规则】\n`;
    prompt += `1. 这是一次线下见面的RP 共写，不是聊天软件对话。你不是${contact.name}本人，也不是在替他回复消息。\n`;
    prompt += `2. 用户当前输入默认应被视为“设定补充、剧情素材、情境假设、关系假设、动作草稿、氛围关键词、片段化灵感”，优先作为世界设定或剧情条件处理，而不是直接当成角色已经说出口的话。\n`;
    prompt += `3. 只有当用户输入本身明确带有说话标记、引号、明确台词动作，或上下文清楚要求“某角色把这句话说出口”时，你才能把其中部分内容落地为角色对白；否则默认不要把整段输入直接写成‘你用气声说出口’、‘你对他说’、‘你发给他’之类行为。\n`;
    prompt += `4. 你的任务是把这些素材转化为“下一段剧情正文”，继续创作双方互动、场景氛围、心理活动、动作和环境变化，并优先表现“设定成立后会怎样”，而不是“用户说了这句话后对方怎么回”。\n`;
    prompt += `5. 除非用户输入里明确出现手机、发消息、聊天框、收到消息等设定，否则不要主动把用户输入解释成角色之间的线上消息；除非用户明确要求说出口，否则也不要主动把输入解释成当面对白。\n`;
    prompt += `6. 必须保持第三人称叙事和沉浸感，不要输出规则说明，不要分析用户，不要总结成提纲。\n`;
    prompt += hasPresetInstructions
        ? `7. 只返回 JSON；如果接入预设明确要求 Markdown、HTML、XML、代码块或特定标签结构，可以把这些内容写在 JSON.reply 字段内。\n`
        : `7. 只返回 JSON，不要返回 Markdown，不要加代码块。\n`;
    prompt += `8. JSON 格式固定为 {"reply":"下一段剧情正文","suggestions":["建议1","建议2","建议3"]}。\n`;
    prompt += `9. reply 表示你写出的本轮完整输出主体，不是对用户文本的“回复消息”。\n`;
    prompt += `10. 如果接入预设里有正文格式、状态栏、摘要、小剧场、分支、thinking、角色表或其他结构要求，请把这些内容一并放入 reply 字段中输出。\n`;
    prompt += `11. suggestions 必须恰好 3 条，每条不超过 50 个汉字，且必须写成“用户下一步可以继续喂给你”的第三人称剧情片段，明确写出角色名。不要写成“你可以回复”“你可以说”“他回你”这种消息建议。顺序固定为：最自然延续剧情 / 推动剧情转折 / 推向 NSFW。\n`;
    prompt += hasPresetInstructions
        ? `12. 当接入预设对输出结构、段落组织、格式标签、额外栏目有明确要求时，以接入预设要求优先；JSON 只是最外层包装。\n\n`
        : `12. reply 默认分成 2 到 4 段，每段 1 到 4 句；动作、心理、环境变化或关键转折尽量另起一段，避免整段文字挤成一坨。\n\n`;
    
    prompt += `【剧情回顾】\n`;
    
    // 拼接历史记录 (最近 10 条)
    const recentContent = currentMeeting.content.slice(-10);
    recentContent.forEach(card => {
        if (card.role === 'user') {
            prompt += `【用户给出的剧情素材】${card.text}\n`;
        } else {
            const promptBody = getMeetingPromptContextText(card);
            if (promptBody) {
                prompt += `【你写出的上一段正文】${promptBody}\n`;
            }
        }
    });

    if (newUserInput) {
        prompt += `【用户刚追加的剧情素材】${newUserInput}\n`;
    }

    // 添加字数要求
    let lengthInstruction = "";
    if (contact.meetingMinWords || contact.meetingMaxWords) {
        const min = contact.meetingMinWords || '50'; // 默认给个下限
        const max = contact.meetingMaxWords || '不限';
        lengthInstruction = `\n【重要限制】\n请务必将剧情正文控制在 ${min} 到 ${max} 字之间。不要过短也不要过长。\n`;
    }
    
    prompt += hasPresetInstructions
        ? `\n请根据以上内容，像 RP 一样继续创作本轮见面内容。默认把用户输入当成设定或素材，而不是已经对${contact.name}说出口的话。除非用户明确要求落地成台词，否则优先写“这个设定成立后，现场气氛、关系、动作与心理如何变化”。如果接入预设要求输出额外结构、栏目或格式，请把这些内容一并写进 JSON.reply。最终按指定 JSON 格式返回 reply 与 3 条 suggestions。`
        : `\n请根据以上内容，像 RP 一样继续创作“下一段剧情正文”。默认把用户输入当成设定或素材，而不是已经对${contact.name}说出口的话。除非用户明确要求落地成台词，否则优先写“这个设定成立后，现场气氛、关系、动作与心理如何变化”。并按指定 JSON 格式返回剧情正文与 3 条可继续喂给你的剧情片段建议。`;
    prompt += lengthInstruction; // 将字数限制放在最后，增强权重
    
    return prompt;
}

function updateMeetingIntegrationPresetTip(collections) {
    const tip = document.getElementById('meeting-integration-preset-tip');
    if (!tip) {
        return;
    }

    const selectedPresetId = document.querySelector('#meeting-integration-modal input[name="meeting-integration-preset"]:checked')?.value || '';
    const matchedCollection = (Array.isArray(collections) ? collections : []).find(collection => collection.presetId === selectedPresetId);

    if (!matchedCollection) {
        tip.textContent = '当前不接入任何预设条目';
        return;
    }

    if (matchedCollection.activeItemCount > 0) {
        tip.textContent = `将接入“${matchedCollection.presetTitle}”中已开启的 ${matchedCollection.activeItemCount} 条条目`;
        return;
    }

    tip.textContent = `“${matchedCollection.presetTitle}”当前没有开启条目`;
}

function updateMeetingIntegrationRegexSummary() {
    const summary = document.getElementById('meeting-integration-regex-summary');
    if (!summary) {
        return;
    }

    const selectedKeys = new Set();
    document.querySelectorAll('#meeting-integration-modal .meeting-integration-entry-checkbox:checked').forEach(checkbox => {
        if (checkbox.dataset.regexKey) {
            selectedKeys.add(checkbox.dataset.regexKey);
        }
    });

    summary.textContent = `已选 ${selectedKeys.size} 条正则`;
}

function updateMeetingIntegrationCategoryStates() {
    document.querySelectorAll('#meeting-integration-modal .meeting-integration-category-card').forEach(card => {
        const categoryCheckbox = card.querySelector('.meeting-integration-category-checkbox');
        const entryCheckboxes = Array.from(card.querySelectorAll('.meeting-integration-entry-checkbox'));
        if (!categoryCheckbox || entryCheckboxes.length === 0) {
            return;
        }

        const checkedCount = entryCheckboxes.filter(checkbox => checkbox.checked).length;
        categoryCheckbox.checked = checkedCount > 0 && checkedCount === entryCheckboxes.length;
        categoryCheckbox.indeterminate = checkedCount > 0 && checkedCount < entryCheckboxes.length;
    });
}

function syncMeetingIntegrationLinkedEntryCheckboxes(regexKey, checked) {
    document.querySelectorAll('#meeting-integration-modal .meeting-integration-entry-checkbox').forEach(checkbox => {
        if (checkbox.dataset.regexKey === regexKey) {
            checkbox.checked = checked;
        }
    });
}

function renderMeetingIntegrationModal(meeting) {
    const collections = getMeetingIntegrationCollections();
    const integration = normalizeMeetingIntegration(meeting);
    const presetList = document.getElementById('meeting-integration-preset-list');
    const regexList = document.getElementById('meeting-integration-regex-list');
    const hasPresetMatch = collections.some(collection => collection.presetId === integration.presetId);
    const selectedRegexKeys = new Set(integration.regexEntryKeys);

    if (presetList) {
        const presetOptions = [`
            <label class="meeting-integration-preset-option">
                <input type="radio" name="meeting-integration-preset" value="" ${hasPresetMatch ? '' : 'checked'}>
                <span class="meeting-integration-preset-card">
                    <span>
                        <span class="meeting-integration-preset-name">不接入预设</span>
                        <span class="meeting-integration-preset-meta">仅使用见面页本身的设定</span>
                    </span>
                    <span class="meeting-integration-preset-check">✓</span>
                </span>
            </label>
        `];

        collections.forEach(collection => {
            presetOptions.push(`
                <label class="meeting-integration-preset-option">
                    <input type="radio" name="meeting-integration-preset" value="${escapeMeetingHtml(collection.presetId)}" ${collection.presetId === integration.presetId ? 'checked' : ''}>
                    <span class="meeting-integration-preset-card">
                        <span>
                            <span class="meeting-integration-preset-name">${escapeMeetingHtml(collection.presetTitle)}</span>
                            <span class="meeting-integration-preset-meta">已开启 ${collection.activeItemCount} 条条目</span>
                        </span>
                        <span class="meeting-integration-preset-check">✓</span>
                    </span>
                </label>
            `);
        });

        presetList.innerHTML = collections.length
            ? presetOptions.join('')
            : '<div class="meeting-integration-empty">暂无可用预设，请先去预设应用中导入或创建。</div>';
    }

    if (regexList) {
        const regexGroups = collections.filter(collection => collection.categories.length > 0).map(collection => {
            return `
                <div class="meeting-integration-regex-group">
                    <div class="meeting-integration-regex-group-title">${escapeMeetingHtml(collection.presetTitle)}</div>
                    ${collection.categories.map(category => {
                        const categoryEntryKeys = category.entries.map(function (entry) {
                            return buildMeetingRegexKey(collection.presetId, entry.id);
                        });
                        const hasSelectedEntry = categoryEntryKeys.some(function (key) {
                            return selectedRegexKeys.has(key);
                        });
                        return `
                            <div class="meeting-integration-category-card ${hasSelectedEntry ? 'open' : ''}">
                                <div class="meeting-integration-category-header">
                                    <input type="checkbox" class="meeting-integration-category-checkbox" data-preset-id="${escapeMeetingHtml(collection.presetId)}" data-category-id="${escapeMeetingHtml(category.id)}">
                                    <button type="button" class="meeting-integration-category-trigger" aria-expanded="${hasSelectedEntry ? 'true' : 'false'}">
                                        <span class="meeting-integration-category-copy">
                                            <span class="meeting-integration-category-name">${escapeMeetingHtml(category.name)}</span>
                                        </span>
                                        <span class="meeting-integration-category-caret">⌄</span>
                                    </button>
                                </div>
                                <div class="meeting-integration-entry-list">
                                    <div class="meeting-integration-category-copy meeting-integration-category-copy-detail">
                                        <span class="meeting-integration-category-name">${escapeMeetingHtml(category.name)}</span>
                                        <span class="meeting-integration-category-meta">${category.entries.length} 条正则</span>
                                    </div>
                                    ${category.entries.map(entry => {
                                        const regexKey = buildMeetingRegexKey(collection.presetId, entry.id);
                                        return `
                                            <label class="meeting-integration-entry-row">
                                                <input type="checkbox" class="meeting-integration-entry-checkbox" data-regex-key="${escapeMeetingHtml(regexKey)}" ${selectedRegexKeys.has(regexKey) ? 'checked' : ''}>
                                                <span class="meeting-integration-entry-copy">
                                                    <span class="meeting-integration-entry-title">${escapeMeetingHtml(entry.title || '未命名正则')}</span>
                                                    <span class="meeting-integration-entry-meta">${escapeMeetingHtml(getMeetingCompactText(entry.pattern || entry.template || '')) || '无内容'}</span>
                                                </span>
                                            </label>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        });

        regexList.innerHTML = regexGroups.length
            ? regexGroups.join('')
            : '<div class="meeting-integration-empty">暂无可选正则</div>';
    }

    updateMeetingIntegrationPresetTip(collections);
    updateMeetingIntegrationCategoryStates();
    updateMeetingIntegrationRegexSummary();
}

function renderMeetingIntegrationLoadingState(message) {
    const presetList = document.getElementById('meeting-integration-preset-list');
    const regexList = document.getElementById('meeting-integration-regex-list');
    const tip = document.getElementById('meeting-integration-preset-tip');
    const loadingMessage = String(message || '正在读取预设数据...');

    if (tip) {
        tip.textContent = loadingMessage;
    }

    if (presetList) {
        presetList.innerHTML = `<div class="meeting-integration-empty">${escapeMeetingHtml(loadingMessage)}</div>`;
    }

    if (regexList) {
        regexList.innerHTML = `<div class="meeting-integration-empty">${escapeMeetingHtml(loadingMessage)}</div>`;
    }
}

async function openMeetingIntegrationModal() {
    const modal = document.getElementById('meeting-integration-modal');
    const meeting = getCurrentMeetingRecord();
    if (!modal || !meeting) {
        return;
    }

    modal.classList.remove('hidden');

    const presetApp = getPresetAppApi();
    renderMeetingIntegrationLoadingState(presetApp ? '正在读取预设数据...' : '预设应用尚未初始化');

    if (!presetApp) {
        return;
    }

    try {
        if (typeof presetApp.whenReady === 'function') {
            await presetApp.whenReady();
        }
    } catch (error) {
    }

    if (modal.classList.contains('hidden')) {
        return;
    }

    renderMeetingIntegrationModal(meeting);
}

function closeMeetingIntegrationModal() {
    const modal = document.getElementById('meeting-integration-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function saveMeetingIntegration() {
    const meeting = getCurrentMeetingRecord();
    if (!meeting) {
        closeMeetingIntegrationModal();
        return;
    }

    const selectedPresetId = document.querySelector('#meeting-integration-modal input[name="meeting-integration-preset"]:checked')?.value || '';
    const selectedRegexKeys = Array.from(new Set(Array.from(document.querySelectorAll('#meeting-integration-modal .meeting-integration-entry-checkbox:checked')).map(checkbox => checkbox.dataset.regexKey).filter(Boolean)));

    meeting.integration = {
        presetId: selectedPresetId,
        regexEntryKeys: selectedRegexKeys
    };

    saveConfig();
    updateMeetingIntegrationButtonState(meeting);
    closeMeetingIntegrationModal();

    if (typeof showNotification === 'function') {
        showNotification('已保存接入设置', 1600, 'success');
    }
}

/**
 * 3. 执行 AI 请求并流式输出
 */
async function handleMeetingAI(type) {
    const inputEl = document.getElementById('meeting-input');
    const draftInput = inputEl.value.trim();
    const contactId = window.iphoneSimState.currentChatContactId;
    const meetingId = window.iphoneSimState.currentMeetingId;
    const container = document.getElementById('meeting-card-container');

    const meetings = window.iphoneSimState.meetings[contactId];
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    if (meeting.isGeneratingAi) return;

    const lastUserStory = [...(meeting.content || [])].reverse().find(item => item && item.role === 'user' && String(item.text || '').trim());
    const effectiveUserInput = draftInput || (lastUserStory ? String(lastUserStory.text || '').trim() : '');
    if (!effectiveUserInput) {
        inputEl.focus();
        return;
    }

    meeting.isGeneratingAi = true;

    // 1. 用户写入剧情片段并上屏
    if (draftInput) {
        meeting.content.push({
            role: 'user',
            text: draftInput
        });
        saveConfig();
        renderMeetingCards(meeting); // 重绘显示用户剧情片段
        inputEl.value = ''; 
        inputEl.style.height = 'auto';
    }

    // 2. UI 准备：添加一个临时的 AI 卡片（与新版详情页一致）
    const aiCard = document.createElement('div');
    aiCard.className = 'meeting-card meeting-editorial-block ai';
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);

    aiCard.innerHTML = `
        <div class="meeting-editorial-role-tag meeting-card-role-ai" style="font-family:-apple-system,sans-serif;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#b0b0b0;display:flex;align-items:center;gap:10px;justify-content:flex-start;">
            <span style="display:block;width:24px;height:1px;background:#ddd;"></span>
            <span>CHARACTER</span>
        </div>
        <div class="meeting-card-content loading-dots" style="font-size:16px;line-height:1.92;letter-spacing:.2px;color:#2c2c2c;text-align:justify;">......</div>
        <div class="meeting-card-actions" style="position:absolute;top:0;right:0;padding-left:12px;display:flex;gap:16px;opacity:0;transition:opacity .25s;background:#fdfdfc;"></div>
    `;
    aiCard.style.display = 'flex';
    aiCard.style.flexDirection = 'column';
    aiCard.style.gap = '14px';
    aiCard.style.position = 'relative';
    container.appendChild(aiCard);
    
    // 滚动到底部
    container.scrollTop = container.scrollHeight;

    // 锁定按钮
    syncMeetingAiControlsState(true);

    try {
        const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
        if (!settings.url || !settings.key) {
            throw new Error("请先在设置中配置 AI API");
        }

        const fullPrompt = constructMeetingPrompt(contactId, effectiveUserInput);
        const presetMessages = buildMeetingPresetMessages(meeting);
        const requestMessages = presetMessages.concat([
            { role: 'user', content: fullPrompt }
        ]);
        
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        logMeetingAiDebug('Request', {
            contactId: contactId,
            meetingId: meetingId,
            apiUrl: fetchUrl,
            model: settings.model,
            effectiveUserInput: effectiveUserInput,
            prompt: fullPrompt,
            presetMessages: presetMessages,
            requestMessages: requestMessages,
            renderRegexRules: getMeetingIntegrationRegexRules(meeting)
        });

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: requestMessages,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) throw new Error(response.statusText);

        const data = await response.json();
        const rawResponse = data.choices[0].message.content.trim();
        logMeetingAiDebug('Response', {
            contactId: contactId,
            meetingId: meetingId,
            rawResponse: rawResponse,
            responseData: data
        });
        const parsedResult = parseMeetingAiResponse(rawResponse, meeting);
        const finalTezt = parsedResult.reply;
        logMeetingAiDebug('Parsed Response', {
            contactId: contactId,
            meetingId: meetingId,
            parsedReplyPreview: String(finalTezt || '').slice(0, 1200),
            parsedSuggestions: parsedResult.suggestions
        });
        logMeetingAiDebug('Render Response', {
            contactId: contactId,
            meetingId: meetingId,
            thinkingRuleTitles: getMeetingRenderRegexRules(meeting, 6).map(function (rule) { return rule.title; }),
            bodyRuleTitles: getMeetingRenderRegexRules(meeting, 2).map(function (rule) { return rule.title; })
        });
        
        const contentEl = aiCard.querySelector('.meeting-card-content');
        
        // 移除 loading 样式并显示内容
        contentEl.classList.remove('loading-dots');
        contentEl.innerHTML = formatMeetingStoryHtml(finalTezt, meeting);
        
        // 保存
        meeting.content.push({
            role: 'ai',
            text: finalTezt,
            promptText: extractMeetingPromptBodyText(finalTezt)
        });
        meeting.suggestedActions = normalizeMeetingSuggestions(parsedResult.suggestions, meeting);
        saveConfig();
        
        // 重新渲染以确保状态一致（添加操作按钮等）
        renderMeetingCards(meeting); 

    } catch (error) {
        console.error(error);
        const contentEl = aiCard.querySelector('.meeting-card-content');
        contentEl.classList.remove('loading-dots');
        contentEl.innerHTML = `<span style="color:red">生成失败: ${error.message}</span>`;
    } finally {
        meeting.isGeneratingAi = false;
        syncMeetingAiControlsState(false);
        inputEl.focus(); 
    }
}

// 初始化监听器
function setupMeetingListeners() {
    const closeMeetingsScreenBtn = document.getElementById('close-meetings-screen');
    const meetingSelectBtn = document.getElementById('meeting-select-btn');
    const meetingStyleBtn = document.getElementById('meeting-style-btn');
    const meetingStyleModal = document.getElementById('meeting-style-modal');
    const closeMeetingStyleBtn = document.getElementById('close-meeting-style');
    const saveMeetingStyleBtn = document.getElementById('save-meeting-style-btn');
    const meetingIntegrationModal = document.getElementById('meeting-integration-modal');
    const closeMeetingIntegrationBtn = document.getElementById('close-meeting-integration');
    const meetingIntegrationCancelBtn = document.getElementById('meeting-integration-cancel');
    const meetingIntegrationSaveBtn = document.getElementById('meeting-integration-save');
    const meetingIntegrationPresetList = document.getElementById('meeting-integration-preset-list');
    const meetingIntegrationRegexList = document.getElementById('meeting-integration-regex-list');

    // 预设相关元素
    const saveMeetingStylePresetBtn = document.getElementById('save-meeting-style-preset');
    const deleteMeetingStylePresetBtn = document.getElementById('delete-meeting-style-preset');
    const meetingStylePresetSelect = document.getElementById('meeting-style-preset-select');

    if (closeMeetingsScreenBtn) closeMeetingsScreenBtn.addEventListener('click', () => {
        document.getElementById('meetings-screen').classList.add('hidden');
    });

    const footerNewMeetingBtn = document.getElementById('meetings-footer-new-btn');
    if (footerNewMeetingBtn) footerNewMeetingBtn.addEventListener('click', createNewMeeting);
    if (meetingSelectBtn) meetingSelectBtn.addEventListener('click', toggleMeetingSelectionMode);

    // 加载文风预设
    function loadMeetingStylePresets() {
        if (!meetingStylePresetSelect) return;
        meetingStylePresetSelect.innerHTML = '<option value="">-- 选择预设 --</option>';
        
        if (!window.iphoneSimState.meetingStylePresets) window.iphoneSimState.meetingStylePresets = [];
        
        window.iphoneSimState.meetingStylePresets.forEach((preset, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = preset.name;
            meetingStylePresetSelect.appendChild(option);
        });
    }

    // 保存文风预设
    if (saveMeetingStylePresetBtn) {
        saveMeetingStylePresetBtn.addEventListener('click', () => {
            const style = document.getElementById('meeting-style-input').value.trim();
            const minWords = document.getElementById('meeting-min-words').value;
            const maxWords = document.getElementById('meeting-max-words').value;
            const linkedWbCategories = getMeetingStyleSelectedWorldbookIds();
            
            if (!style) {
                alert('请先输入描写风格内容');
                return;
            }

            const name = prompt('请输入预设名称：');
            if (name) {
                if (!window.iphoneSimState.meetingStylePresets) window.iphoneSimState.meetingStylePresets = [];
                window.iphoneSimState.meetingStylePresets.push({
                    name: name,
                    style: style,
                    minWords: minWords,
                    maxWords: maxWords,
                    linkedWbCategories: linkedWbCategories
                });
                saveConfig();
                loadMeetingStylePresets();
                alert('预设保存成功');
            }
        });
    }

    // 删除文风预设
    if (deleteMeetingStylePresetBtn) {
        deleteMeetingStylePresetBtn.addEventListener('click', () => {
            const index = meetingStylePresetSelect.value;
            if (index === '') {
                alert('请先选择一个预设');
                return;
            }
            
            if (confirm('确定删除该预设吗？')) {
                window.iphoneSimState.meetingStylePresets.splice(index, 1);
                saveConfig();
                loadMeetingStylePresets();
            }
        });
    }

    // 应用文风预设
    if (meetingStylePresetSelect) {
        meetingStylePresetSelect.addEventListener('change', (e) => {
            const index = e.target.value;
            if (index !== '') {
                const preset = window.iphoneSimState.meetingStylePresets[index];
                if (preset) {
                    document.getElementById('meeting-style-input').value = preset.style || '';
                    document.getElementById('meeting-min-words').value = preset.minWords || '';
                    document.getElementById('meeting-max-words').value = preset.maxWords || '';
                    renderMeetingStyleWorldbookList(preset.linkedWbCategories || []);
                }
            }
        });
    }

    if (meetingStyleBtn) meetingStyleBtn.addEventListener('click', () => {
        const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
        if(contact) {
            document.getElementById('meeting-style-input').value = contact.meetingStyle || '';
            document.getElementById('meeting-min-words').value = contact.meetingMinWords || '';
            document.getElementById('meeting-max-words').value = contact.meetingMaxWords || '';
            renderMeetingStyleWorldbookList(contact.meetingLinkedWbCategories || []);
        } else {
            renderMeetingStyleWorldbookList([]);
        }
        if (meetingStylePresetSelect) meetingStylePresetSelect.value = '';
        loadMeetingStylePresets(); // 加载预设列表
        meetingStyleModal.classList.remove('hidden');
    });

    const meetingThemeBtn = document.getElementById('meeting-theme-btn');
    const meetingThemeModal = document.getElementById('meeting-theme-modal');
    const closeMeetingThemeBtn = document.getElementById('close-meeting-theme');

    if (meetingThemeBtn) meetingThemeBtn.addEventListener('click', () => {
        const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
        if (contact) {
            // 初始化字体大小滑块
            const fontSizeSlider = document.getElementById('meeting-font-size-slider');
            const fontSizeValue = document.getElementById('meeting-font-size-value');
            if (fontSizeSlider && fontSizeValue) {
                const currentSize = contact.meetingFontSize || 16;
                fontSizeSlider.value = currentSize;
                fontSizeValue.textContent = `${currentSize}px`;
                
                fontSizeSlider.oninput = (e) => {
                    const size = e.target.value;
                    fontSizeValue.textContent = `${size}px`;
                    // 实时预览
                    const container = document.getElementById('meeting-card-container');
                    if (container) {
                        container.style.fontSize = `${size}px`;
                    }
                };
                
                fontSizeSlider.onchange = (e) => {
                    contact.meetingFontSize = parseInt(e.target.value);
                    saveConfig();
                };
            }
        }

        // 初始化图标预览
        if (!window.iphoneSimState.meetingIcons) window.iphoneSimState.meetingIcons = {};
        
        const icons = {
            edit: window.iphoneSimState.meetingIcons.edit || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTExIDRINFYyMmgxNFYxMSIvPjxwYXRoIGQ9Ik0xOC41IDIuNWEyLjEyMSAyLjEyMSAwIDAgMSAzIDNMMTIgMTVIOHYtNGw5LjUtOS41eiIvPjwvc3ZnPg==',
            delete: window.iphoneSimState.meetingIcons.delete || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkYzQjMwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlsaW5lIHBvaW50cz0iMyA2IDUgNiAyMSA2Ii8+PHBhdGggZD0iTTE5IDZ2MTRhMiAyIDAgMCAxLTIgMkg3YTIgMiAwIDAgMS0yLTJWNm0zIDBUNGEyIDIgMCAwIDEgMi0yaDRhMiAyIDAgMCAxIDIgMnYyIi8+PGxpbmUgeDE9IjEwIiB5MT0iMTEiIHgyPSIxMCIgeTI9IjE3Ii8+PGxpbmUgeDE9IjE0IiB5MT0iMTEiIHgyPSIxNCIgeTI9IjE3Ii8+PC9zdmc+',
            end: window.iphoneSimState.meetingIcons.end || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkYzQjMwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTkgMjFIMWMtMS4xIDAtMi0uOS0yLTJWMWMwLTEuMS45LTIgMi0yaDhNMjEgMTJsLTUtNW01IDVsLTUgNW01LTVoLTEzIi8+PC9zdmc+',
            continue: window.iphoneSimState.meetingIcons.continue || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE1IDRINFYyMmgxNFYxMSIvPjxwYXRoIGQ9Ik0xNSAxNnYtMiIvPjxwYXRoIGQ9Ik04IDloMiIvPjxwYXRoIGQ9Ik0yMCA5aDIiLz48cGF0aCBkPSJNMTcuOCAxMS44TDE5IDEzIi8+PHBhdGggZD0iTTEwLjYgNi42TDEyIDgiLz48cGF0aCBkPSJNNC44IDExLjhMNiAxMyIvPjxwYXRoIGQ9Ik0xMiA0LjhMMTAuNiA2Ii8+PHBhdGggZD0iTTE5IDQuOEwxNy44IDYiLz48cGF0aCBkPSJNMTIgMTMuMkw0LjggMjAuNGEyLjggMi44IDAgMCAwIDQgNEwxNiAxNy4yIi8+PC9zdmc+'
        };

        const editPreview = document.getElementById('meeting-edit-icon-preview');
        if(editPreview) editPreview.src = icons.edit;
        
        const deletePreview = document.getElementById('meeting-delete-icon-preview');
        if(deletePreview) deletePreview.src = icons.delete;
        
        const endPreview = document.getElementById('meeting-end-icon-preview');
        if(endPreview) endPreview.src = icons.end;
        
        const continuePreview = document.getElementById('meeting-continue-icon-preview');
        if(continuePreview) continuePreview.src = icons.continue;

        meetingThemeModal.classList.remove('hidden');
    });

    if (closeMeetingThemeBtn) closeMeetingThemeBtn.addEventListener('click', () => meetingThemeModal.classList.add('hidden'));

    if (closeMeetingStyleBtn) closeMeetingStyleBtn.addEventListener('click', () => meetingStyleModal.classList.add('hidden'));
    if (saveMeetingStyleBtn) saveMeetingStyleBtn.addEventListener('click', saveMeetingStyle);

    const endMeetingBtn = document.getElementById('end-meeting-btn');
    const meetingSendBtn = document.getElementById('meeting-send-btn');
    const meetingAiContinueBtn = document.getElementById('meeting-ai-continue-btn');
    const meetingDetailStyleBtn = document.getElementById('meeting-detail-style-btn');
    const meetingDetailMagicBtn = document.getElementById('meeting-detail-magic-btn');
    const closeMeetingActionSuggestionMenuBtn = document.getElementById('close-meeting-action-suggestion-menu');

    if (endMeetingBtn) endMeetingBtn.addEventListener('click', endMeeting);
    if (meetingSendBtn) meetingSendBtn.addEventListener('click', handleSendMeetingText);
    if (meetingAiContinueBtn) meetingAiContinueBtn.addEventListener('click', () => handleMeetingAI('continue'));
    if (meetingDetailStyleBtn) meetingDetailStyleBtn.addEventListener('click', openMeetingIntegrationModal);
    if (meetingDetailMagicBtn) meetingDetailMagicBtn.addEventListener('click', () => window.toggleMeetingActionSuggestionMenu());
    if (closeMeetingActionSuggestionMenuBtn) closeMeetingActionSuggestionMenuBtn.addEventListener('click', () => window.toggleMeetingActionSuggestionMenu(false));

    if (meetingIntegrationModal) {
        meetingIntegrationModal.addEventListener('click', event => {
            if (event.target === meetingIntegrationModal) {
                closeMeetingIntegrationModal();
            }
        });
    }

    if (closeMeetingIntegrationBtn) closeMeetingIntegrationBtn.addEventListener('click', closeMeetingIntegrationModal);
    if (meetingIntegrationCancelBtn) meetingIntegrationCancelBtn.addEventListener('click', closeMeetingIntegrationModal);
    if (meetingIntegrationSaveBtn) meetingIntegrationSaveBtn.addEventListener('click', saveMeetingIntegration);

    if (meetingIntegrationPresetList) {
        meetingIntegrationPresetList.addEventListener('change', () => {
            updateMeetingIntegrationPresetTip(getMeetingIntegrationCollections());
        });
    }

    if (meetingIntegrationRegexList) {
        meetingIntegrationRegexList.addEventListener('click', event => {
            const trigger = event.target.closest('.meeting-integration-category-trigger');
            if (!trigger) {
                return;
            }

            const categoryCard = trigger.closest('.meeting-integration-category-card');
            if (!categoryCard) {
                return;
            }

            const willOpen = !categoryCard.classList.contains('open');
            categoryCard.classList.toggle('open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        });

        meetingIntegrationRegexList.addEventListener('change', event => {
            const target = event.target;
            if (!(target instanceof HTMLInputElement)) {
                return;
            }

            if (target.classList.contains('meeting-integration-category-checkbox')) {
                const categoryCard = target.closest('.meeting-integration-category-card');
                if (!categoryCard) {
                    return;
                }

                categoryCard.querySelectorAll('.meeting-integration-entry-checkbox').forEach(checkbox => {
                    checkbox.checked = target.checked;
                    if (checkbox.dataset.regexKey) {
                        syncMeetingIntegrationLinkedEntryCheckboxes(checkbox.dataset.regexKey, target.checked);
                    }
                });
            }

            if (target.classList.contains('meeting-integration-entry-checkbox') && target.dataset.regexKey) {
                syncMeetingIntegrationLinkedEntryCheckboxes(target.dataset.regexKey, target.checked);
            }

            updateMeetingIntegrationCategoryStates();
            updateMeetingIntegrationRegexSummary();
        });
    }

    const meetingInput = document.getElementById('meeting-input');
    if (meetingInput) {
        meetingInput.addEventListener('input', function() {
            this.style.height = '24px';
        });
        
        meetingInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMeetingText();
            }
        });
    }

    // 绑定编辑弹窗事件
    const closeEditMeetingMsgBtn = document.getElementById('close-edit-meeting-msg');
    const saveEditMeetingMsgBtn = document.getElementById('save-edit-meeting-msg-btn');

    if (closeEditMeetingMsgBtn) {
        const newCloseBtn = closeEditMeetingMsgBtn.cloneNode(true);
        closeEditMeetingMsgBtn.parentNode.replaceChild(newCloseBtn, closeEditMeetingMsgBtn);
        
        newCloseBtn.addEventListener('click', () => {
            document.getElementById('edit-meeting-msg-modal').classList.add('hidden');
            currentEditingMeetingMsgIndex = null;
        });
    }

    if (saveEditMeetingMsgBtn) {
        const newSaveBtn = saveEditMeetingMsgBtn.cloneNode(true);
        saveEditMeetingMsgBtn.parentNode.replaceChild(newSaveBtn, saveEditMeetingMsgBtn);

        newSaveBtn.addEventListener('click', () => {
            if (currentEditingMeetingMsgIndex === null || !window.iphoneSimState.currentChatContactId || !window.iphoneSimState.currentMeetingId) return;

            const newText = document.getElementById('edit-meeting-msg-content').value.trim();
            if (!newText) {
                alert('内容不能为空');
                return;
            }

            const meeting = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId].find(m => m.id === window.iphoneSimState.currentMeetingId);
            if (meeting) {
                const currentEntry = meeting.content[currentEditingMeetingMsgIndex];
                currentEntry.text = newText;
                if (currentEntry.role === 'ai') {
                    currentEntry.promptText = extractMeetingPromptBodyText(newText);
                } else if (Object.prototype.hasOwnProperty.call(currentEntry, 'promptText')) {
                    delete currentEntry.promptText;
                }
                saveConfig();
                renderMeetingCards(meeting);
                document.getElementById('edit-meeting-msg-modal').classList.add('hidden');
                currentEditingMeetingMsgIndex = null;
            }
        });
    }

    // 图标上传监听
    // 壁纸上传监听
    const wallpaperInput = document.getElementById('meeting-wallpaper-upload');
    const resetWallpaperBtn = document.getElementById('reset-meeting-wallpaper-btn');

    if (wallpaperInput) {
        wallpaperInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const result = e.target.result;
                const contactId = window.iphoneSimState.currentChatContactId;
                const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
                
                if (contact) {
                    contact.meetingWallpaper = result;
                    saveConfig();
                    
                    // 实时预览 (如果当前在详情页)
                    const detailScreen = document.getElementById('meeting-detail-screen');
                    if (!detailScreen.classList.contains('hidden')) {
                        detailScreen.style.backgroundImage = `url(${result})`;
                        detailScreen.style.backgroundSize = 'cover';
                        detailScreen.style.backgroundPosition = 'center';
                    }
                    alert('壁纸设置成功');
                }
            };
            reader.readAsDataURL(file);
        });
    }

    if (resetWallpaperBtn) {
        resetWallpaperBtn.addEventListener('click', () => {
            if (confirm('确定要重置为默认背景吗？')) {
                const contactId = window.iphoneSimState.currentChatContactId;
                const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
                if (contact) {
                    delete contact.meetingWallpaper;
                    saveConfig();
                    
                    const detailScreen = document.getElementById('meeting-detail-screen');
                    if (!detailScreen.classList.contains('hidden')) {
                        detailScreen.style.backgroundImage = '';
                        detailScreen.style.backgroundSize = '';
                        detailScreen.style.backgroundPosition = '';
                    }
                    alert('壁纸已重置');
                }
            }
        });
    }

    const iconUploads = [
        { id: 'meeting-edit-icon-upload', key: 'edit', previewId: 'meeting-edit-icon-preview' },
        { id: 'meeting-delete-icon-upload', key: 'delete', previewId: 'meeting-delete-icon-preview' },
        { id: 'meeting-end-icon-upload', key: 'end', previewId: 'meeting-end-icon-preview' },
        { id: 'meeting-continue-icon-upload', key: 'continue', previewId: 'meeting-continue-icon-preview' }
    ];

    iconUploads.forEach(item => {
        const input = document.getElementById(item.id);
        if (input) {
            input.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function(e) {
                    const result = e.target.result;
                    
                    // 更新状态
                    if (!window.iphoneSimState.meetingIcons) window.iphoneSimState.meetingIcons = {};
                    window.iphoneSimState.meetingIcons[item.key] = result;
                    saveConfig();

                    // 更新预览
                    const preview = document.getElementById(item.previewId);
                    if (preview) preview.src = result;

                    // 实时更新界面
                    if (item.key === 'end') {
                        const endIcon = document.getElementById('meeting-end-icon');
                        if (endIcon) endIcon.src = result;
                    } else if (item.key === 'continue') {
                        const continueIcon = document.getElementById('meeting-continue-icon');
                        if (continueIcon) continueIcon.src = result;
                    } else {
                        // 编辑和删除图标在卡片列表中，需要重新渲染
                        if (window.iphoneSimState.currentMeetingId && window.iphoneSimState.currentChatContactId) {
                            const meetings = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId];
                            const meeting = meetings.find(m => m.id === window.iphoneSimState.currentMeetingId);
                            if (meeting) renderMeetingCards(meeting);
                        }
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    });
}

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(setupMeetingListeners);
}


