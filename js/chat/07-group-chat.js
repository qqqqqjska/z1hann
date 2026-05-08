(function () {
    const GROUP_CHAT_CONTACT_GROUP = '群聊';
    const GROUP_MEMORY_MODE_LABELS = {
        group_only: '群聊独立',
        bidirectional: '双向同步'
    };
    const GROUP_ROLE_LABELS = {
        owner: '群主',
        admin: '管理员',
        member: '成员'
    };

    const createState = {
        selectedMemberIds: [],
        avatarDataUrl: ''
    };
    let currentSettingsGroupId = null;
    let currentRelationGroupId = null;
    let currentMemberDirectoryGroupId = null;
    let currentMemberDirectoryTargetId = null;
    const relationGraphRuntime = {
        selectedNodeId: null,
        dragNodeId: null,
        isDragging: false,
        startX: 0,
        startY: 0,
        dragOffsetX: 0,
        dragOffsetY: 0,
        nodes: []
    };

    function showGroupToast(text) {
        if (typeof window.showChatToast === 'function') {
            window.showChatToast(text, 2200);
            return;
        }
        alert(text);
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeParticipantId(value) {
        if (value === 'me') return 'me';
        const raw = String(value === undefined || value === null ? '' : value).trim();
        if (!raw) return '';
        const asNumber = Number(raw);
        return Number.isFinite(asNumber) && /^-?\d+(?:\.0+)?$/.test(raw) ? asNumber : raw;
    }

    function getParticipantIdKey(value) {
        const normalized = normalizeParticipantId(value);
        if (normalized === '' || normalized === null || normalized === undefined) return '';
        return String(normalized);
    }

    function normalizeDirectMemberId(value) {
        const normalized = normalizeParticipantId(value);
        if (normalized === '' || normalized === null || normalized === undefined || normalized === 'me') return '';
        const contact = getContactById(normalized);
        if (!contact || contact.chatType === 'group') return '';
        return normalizeParticipantId(contact.id);
    }

    function normalizeDirectMemberIds(values) {
        const source = Array.isArray(values) ? values : [];
        const seen = new Set();
        const result = [];
        source.forEach((value) => {
            const normalized = normalizeDirectMemberId(value);
            if (normalized === '' || normalized === null || normalized === undefined) return;
            const key = String(normalized);
            if (seen.has(key)) return;
            seen.add(key);
            result.push(normalized);
        });
        return result;
    }

    function getContactById(contactId) {
        const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts
            : [];
        const rawKey = String(contactId === undefined || contactId === null ? '' : contactId).trim();
        const normalizedKey = getParticipantIdKey(contactId);
        return contacts.find((contact) => {
            if (!contact) return false;
            const contactRawKey = String(contact.id === undefined || contact.id === null ? '' : contact.id).trim();
            if (rawKey && contactRawKey === rawKey) return true;
            return normalizedKey && getParticipantIdKey(contact.id) === normalizedKey;
        }) || null;
    }

    function getGroupContact(contactOrId) {
        const contact = typeof contactOrId === 'object' && contactOrId
            ? contactOrId
            : getContactById(contactOrId);
        if (!contact || contact.chatType !== 'group') return null;
        if (typeof window.ensureContactChatTypeFields === 'function') {
            window.ensureContactChatTypeFields(contact);
        }
        return contact;
    }

    function isGroupActive(contactOrId) {
        const contact = getGroupContact(contactOrId);
        return !!(contact && contact.groupMeta && contact.groupMeta.status === 'active');
    }

    function getUserBaseName(contact) {
        if (contact && contact.userPersonaId && Array.isArray(window.iphoneSimState && window.iphoneSimState.userPersonas)) {
            const persona = window.iphoneSimState.userPersonas.find(item => String(item && item.id) === String(contact.userPersonaId));
            if (persona && persona.name) return String(persona.name).trim();
        }
        const profile = window.iphoneSimState && window.iphoneSimState.userProfile;
        return String(profile && profile.name ? profile.name : '我').trim() || '我';
    }

    function getGroupMemberNickname(groupContact, participantId) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta || !group.groupMeta.memberNicknames) return '';
        const safeId = normalizeParticipantId(participantId);
        return String(group.groupMeta.memberNicknames[String(safeId)] || '').trim();
    }

    function getParticipantBaseName(groupContact, participantId, fallback = '') {
        const group = getGroupContact(groupContact);
        const safeId = normalizeParticipantId(participantId);
        if (safeId === 'me') return getUserBaseName(group);
        const contact = getContactById(safeId);
        if (contact) {
            return String(contact.remark || contact.nickname || contact.name || fallback || '群成员').trim() || '群成员';
        }
        return String(fallback || '群成员').trim() || '群成员';
    }

    function getUserDisplayName(contact) {
        const nickname = getGroupMemberNickname(contact, 'me');
        return nickname || getUserBaseName(contact);
    }

    function getUserAvatar(contact) {
        if (contact && contact.myAvatar) return contact.myAvatar;
        const profile = window.iphoneSimState && window.iphoneSimState.userProfile;
        return profile && profile.avatar ? profile.avatar : '';
    }

    function getGroupMemberIds(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta || !Array.isArray(group.groupMeta.memberIds)) {
            return [];
        }
        const normalizedIds = normalizeDirectMemberIds(group.groupMeta.memberIds);
        const beforeKeys = group.groupMeta.memberIds.map(id => getParticipantIdKey(id)).filter(Boolean);
        const afterKeys = normalizedIds.map(id => getParticipantIdKey(id)).filter(Boolean);
        if (beforeKeys.length !== afterKeys.length || beforeKeys.some((key, index) => key !== afterKeys[index])) {
            group.groupMeta.memberIds = normalizedIds;
        }
        return [...normalizedIds];
    }

    function getGroupMemberContacts(groupContact) {
        const seen = new Set();
        return getGroupMemberIds(groupContact)
            .map(id => getContactById(id))
            .filter((contact) => {
                if (!contact || contact.chatType === 'group') return false;
                const key = getParticipantIdKey(contact.id);
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
            });
    }

    function getManagedRelationMemberIds(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta) return [];
        return Array.isArray(group.groupMeta.relationshipMemberIds)
            ? group.groupMeta.relationshipMemberIds
                .map(id => normalizeParticipantId(id))
                .filter(id => id && (id === 'me' || getGroupMemberIds(group).some(memberId => String(memberId) === String(id))))
            : [];
    }

    function addManagedRelationMember(groupContact, participantId) {
        const group = getGroupContact(groupContact);
        const safeId = normalizeParticipantId(participantId);
        if (!group || !safeId) return false;
        if (!Array.isArray(group.groupMeta.relationshipMemberIds)) {
            group.groupMeta.relationshipMemberIds = [];
        }
        if (group.groupMeta.relationshipMemberIds.some(id => String(id) === String(safeId))) {
            return false;
        }
        group.groupMeta.relationshipMemberIds.push(safeId);
        if (!group.groupMeta.relationshipNodePositions || typeof group.groupMeta.relationshipNodePositions !== 'object') {
            group.groupMeta.relationshipNodePositions = {};
        }
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        return true;
    }

    function removeManagedRelationMember(groupContact, participantId) {
        const group = getGroupContact(groupContact);
        const safeId = normalizeParticipantId(participantId);
        if (!group || !safeId || !Array.isArray(group.groupMeta.relationshipMemberIds)) return false;
        const beforeLength = group.groupMeta.relationshipMemberIds.length;
        group.groupMeta.relationshipMemberIds = group.groupMeta.relationshipMemberIds.filter(id => String(id) !== String(safeId));
        if (group.groupMeta.relationshipNodePositions && typeof group.groupMeta.relationshipNodePositions === 'object') {
            delete group.groupMeta.relationshipNodePositions[String(safeId)];
        }
        if (Array.isArray(group.groupMeta.relationshipLinks)) {
            group.groupMeta.relationshipLinks = group.groupMeta.relationshipLinks.filter(link => String(link.sourceId) !== String(safeId) && String(link.targetId) !== String(safeId));
        }
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        return group.groupMeta.relationshipMemberIds.length !== beforeLength;
    }

    function getGroupRelationshipLinks(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta) return [];
        return Array.isArray(group.groupMeta.relationshipLinks)
            ? group.groupMeta.relationshipLinks
                .filter(link => link && link.sourceId && link.targetId && link.relation)
                .map(link => ({
                    sourceId: normalizeParticipantId(link.sourceId),
                    targetId: normalizeParticipantId(link.targetId),
                    relation: String(link.relation || '').trim()
                }))
                .filter(link => link.sourceId && link.targetId && link.sourceId !== link.targetId)
            : [];
    }

    function normalizeGroupRelationshipNotes(value) {
        return String(value || '')
            .replace(/\r\n?/g, '\n')
            .split('\n')
            .map(line => line.replace(/\s+/g, ' ').trim())
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
            .slice(0, 500);
    }

    function getGroupRelationshipNotes(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta) return '';
        return normalizeGroupRelationshipNotes(group.groupMeta.relationshipNotes || '');
    }

    function setGroupRelationshipNotes(groupContact, notes) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta) return { ok: false, reason: 'invalid_group' };
        const normalizedNotes = normalizeGroupRelationshipNotes(notes);
        const previousNotes = getGroupRelationshipNotes(group);
        if (normalizedNotes === previousNotes) {
            return { ok: true, changed: false, notes: normalizedNotes };
        }
        group.groupMeta.relationshipNotes = normalizedNotes;
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        if (typeof saveConfig === 'function') saveConfig();
        return { ok: true, changed: true, notes: getGroupRelationshipNotes(group) };
    }

    function setManagedRelationNodePosition(groupContact, participantId, xRatio, yRatio) {
        const group = getGroupContact(groupContact);
        const safeId = normalizeParticipantId(participantId);
        if (!group || !safeId) return false;
        if (!group.groupMeta.relationshipNodePositions || typeof group.groupMeta.relationshipNodePositions !== 'object') {
            group.groupMeta.relationshipNodePositions = {};
        }
        group.groupMeta.relationshipNodePositions[String(safeId)] = {
            xRatio: Math.min(0.92, Math.max(0.08, Number(xRatio) || 0.5)),
            yRatio: Math.min(0.88, Math.max(0.12, Number(yRatio) || 0.5))
        };
        return true;
    }

    function upsertGroupRelationshipLink(groupContact, sourceId, targetId, relation) {
        const group = getGroupContact(groupContact);
        const safeSourceId = normalizeParticipantId(sourceId);
        const safeTargetId = normalizeParticipantId(targetId);
        const normalizedRelation = String(relation || '').replace(/\s+/g, ' ').trim().slice(0, 32);
        if (!group || !safeSourceId || !safeTargetId || safeSourceId === safeTargetId || !normalizedRelation) {
            return { ok: false };
        }
        if (!Array.isArray(group.groupMeta.relationshipLinks)) {
            group.groupMeta.relationshipLinks = [];
        }
        const existingLink = group.groupMeta.relationshipLinks.find(link => String(link.sourceId) === String(safeSourceId) && String(link.targetId) === String(safeTargetId));
        if (existingLink) {
            existingLink.relation = normalizedRelation;
        } else {
            group.groupMeta.relationshipLinks.push({
                sourceId: safeSourceId,
                targetId: safeTargetId,
                relation: normalizedRelation
            });
        }
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        if (typeof saveConfig === 'function') saveConfig();
        return { ok: true, relation: normalizedRelation };
    }

    function getPendingInviteMemberIds(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta || !Array.isArray(group.groupMeta.pendingInviteMemberIds)) {
            return [];
        }
        const memberKeySet = new Set(getGroupMemberIds(group).map(id => getParticipantIdKey(id)));
        const normalized = normalizeDirectMemberIds(group.groupMeta.pendingInviteMemberIds)
            .filter(id => memberKeySet.has(getParticipantIdKey(id)));
        const beforeKeys = group.groupMeta.pendingInviteMemberIds.map(id => getParticipantIdKey(id)).filter(Boolean);
        const afterKeys = normalized.map(id => getParticipantIdKey(id)).filter(Boolean);
        if (beforeKeys.length !== afterKeys.length || beforeKeys.some((key, index) => key !== afterKeys[index])) {
            group.groupMeta.pendingInviteMemberIds = normalized;
            if (normalized.length === 0) {
                group.groupMeta.lastInviteAt = 0;
            }
        }
        return normalized;
    }

    function consumePendingInviteMembers(groupContact, roundMessages) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta || !Array.isArray(group.groupMeta.pendingInviteMemberIds) || group.groupMeta.pendingInviteMemberIds.length === 0) {
            return;
        }
        const spokenIds = new Set((Array.isArray(roundMessages) ? roundMessages : [])
            .map(message => normalizeParticipantId(message && message.speakerContactId))
            .filter(id => id && id !== 'me')
            .map(id => String(id)));
        if (spokenIds.size === 0) return;
        const nextPendingIds = normalizeDirectMemberIds(group.groupMeta.pendingInviteMemberIds)
            .filter(id => !spokenIds.has(String(id)));
        if (nextPendingIds.length === group.groupMeta.pendingInviteMemberIds.length) return;
        group.groupMeta.pendingInviteMemberIds = nextPendingIds;
        if (nextPendingIds.length === 0) {
            group.groupMeta.lastInviteAt = 0;
        }
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        if (typeof saveConfig === 'function') saveConfig();
    }

    function getGroupChatDisplayName(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group) return '';
        return String(group.groupMeta && group.groupMeta.name ? group.groupMeta.name : (group.remark || group.name || '群聊')).trim() || '群聊';
    }

    function getGroupRole(groupContact, participantId = 'me') {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta) return 'member';
        const safeId = normalizeParticipantId(participantId);
        if (String(group.groupMeta.ownerId) === String(safeId)) return 'owner';
        if (Array.isArray(group.groupMeta.adminIds) && group.groupMeta.adminIds.some(id => String(id) === String(safeId))) {
            return 'admin';
        }
        return 'member';
    }

    function canParticipantManageMembers(groupContact, participantId = 'me') {
        const role = getGroupRole(groupContact, participantId);
        return role === 'owner' || role === 'admin';
    }

    function canParticipantManageAdmins(groupContact, participantId = 'me') {
        return getGroupRole(groupContact, participantId) === 'owner';
    }

    function canCurrentUserManageMembers(groupContact) {
        return canParticipantManageMembers(groupContact, 'me');
    }

    function canCurrentUserManageAdmins(groupContact) {
        return canParticipantManageAdmins(groupContact, 'me');
    }

    function getParticipantName(groupContact, participantId, fallback = '') {
        const nickname = getGroupMemberNickname(groupContact, participantId);
        return nickname || getParticipantBaseName(groupContact, participantId, fallback);
    }

    function getParticipantDisambiguationHint(groupContact, participantId) {
        const group = getGroupContact(groupContact);
        const safeId = normalizeParticipantId(participantId);
        if (safeId === 'me') return '';
        const contact = getContactById(safeId);
        if (!group || !contact) return '';

        const persona = String(contact.persona || '').replace(/\s+/g, ' ').trim();
        const personaPatterns = [
            /\d{1,2}岁/,
            /\d{4}年(?:出生)?/,
            /(小学|初中|高中|大学|研究生|博士|实习|上班|工作后|毕业后|成年后|童年|儿时)/
        ];
        for (const pattern of personaPatterns) {
            const matched = persona.match(pattern);
            if (matched && matched[0]) {
                return String(matched[0]).trim();
            }
        }

        const relation = String(contact.relationship || contact.relation || '').replace(/\s+/g, ' ').trim();
        if (relation) return relation.slice(0, 12);

        const baseName = getParticipantName(group, safeId, '群成员');
        const rawRemark = String(contact.remark || '').trim();
        if (rawRemark && rawRemark !== baseName) return rawRemark.slice(0, 12);

        const rawNickname = String(contact.nickname || '').trim();
        if (rawNickname && rawNickname !== baseName) return rawNickname.slice(0, 12);

        const idText = String(safeId);
        return idText ? `ID${idText.slice(-4)}` : '';
    }

    function getParticipantPromptLabel(groupContact, participantId, fallback = '') {
        const group = getGroupContact(groupContact);
        const safeId = normalizeParticipantId(participantId);
        const name = getParticipantName(group, safeId, fallback);
        if (!group || !name) return name;

        const participantIds = ['me', ...getGroupMemberIds(group)];
        const duplicateIds = participantIds.filter(id => String(getParticipantName(group, id, fallback) || '').trim() === String(name).trim());
        if (duplicateIds.length <= 1) return name;

        const hint = getParticipantDisambiguationHint(group, safeId);
        return hint ? `${name}（${hint}）` : `${name}（${String(safeId)})`;
    }

    function getParticipantPromptAliasCandidates(groupContact, participantId, fallback = '') {
        const group = getGroupContact(groupContact);
        const safeId = normalizeParticipantId(participantId);
        if (!group || !safeId) return [];
        const displayName = String(getParticipantName(group, safeId, fallback) || '').trim();
        const promptLabel = String(getParticipantPromptLabel(group, safeId, fallback) || '').trim();
        const hint = String(getParticipantDisambiguationHint(group, safeId) || '').trim();
        const aliases = new Set();
        [displayName, promptLabel, hint].forEach(item => {
            if (item) aliases.add(item);
        });
        if (displayName && hint) {
            aliases.add(`${hint}${displayName}`);
            aliases.add(`${displayName}${hint}`);
            aliases.add(`${displayName}(${hint})`);
            aliases.add(`${displayName}（${hint}）`);
        }
        if (safeId !== 'me') {
            aliases.add(`${displayName}#${String(safeId).slice(-4)}`);
            aliases.add(`${displayName}#${String(safeId)}`);
        }
        return [...aliases].map(item => String(item || '').trim()).filter(Boolean);
    }

    function getGroupMemberTitle(groupContact, participantId) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta || !group.groupMeta.memberTitles) return '';
        const safeId = normalizeParticipantId(participantId);
        return String(group.groupMeta.memberTitles[String(safeId)] || '').trim();
    }

    function applyGroupMemberNickname(groupContact, targetId, nextNickname) {
        const group = getGroupContact(groupContact);
        const safeTargetId = normalizeParticipantId(targetId);
        if (!group || !safeTargetId) {
            return { ok: false, reason: 'invalid_target' };
        }
        if (safeTargetId !== 'me' && !getGroupMemberIds(group).some(id => String(id) === String(safeTargetId))) {
            return { ok: false, reason: 'missing_target' };
        }
        const normalizedNickname = String(nextNickname || '').replace(/\s+/g, ' ').trim().slice(0, 30);
        if (!group.groupMeta.memberNicknames || typeof group.groupMeta.memberNicknames !== 'object') {
            group.groupMeta.memberNicknames = {};
        }
        const previousNickname = getGroupMemberNickname(group, safeTargetId);
        if (normalizedNickname) {
            group.groupMeta.memberNicknames[String(safeTargetId)] = normalizedNickname;
        } else {
            delete group.groupMeta.memberNicknames[String(safeTargetId)];
        }
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        refreshGroupChatVisualState(group);
        if (typeof saveConfig === 'function') saveConfig();
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }
        if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(group.id, true);
        }
        if (String(currentSettingsGroupId || '') === String(group.id)) {
            renderGroupChatSettings(group);
        }
        return { ok: true, changed: previousNickname !== normalizedNickname, nickname: normalizedNickname };
    }

    function canParticipantRenameGroup(groupContact, participantId = 'me') {
        const role = getGroupRole(groupContact, participantId);
        return role === 'owner' || role === 'admin';
    }

    function canParticipantManageTitles(groupContact, participantId = 'me') {
        return getGroupRole(groupContact, participantId) === 'owner';
    }

    function getGroupAnnouncementText(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta) return '';
        return String(group.groupMeta.announcementText || '').replace(/\s+/g, ' ').trim();
    }

    function canParticipantManageAnnouncement(groupContact, participantId = 'me') {
        return canParticipantRenameGroup(groupContact, participantId);
    }

    function buildGroupMessagePreviewText(message, groupContact, options = {}) {
        if (!message) return '[消息]';
        const group = getGroupContact(groupContact);
        const maxLength = Number.isFinite(Number(options.maxLength)) && Number(options.maxLength) > 0
            ? Number(options.maxLength)
            : 64;
        let preview = '';
        const type = String(message.type || '').trim();
        if (type === 'image' || type === 'virtual_image') {
            preview = '[图片]';
        } else if (type === 'sticker') {
            preview = '[表情包]';
        } else if (type === 'voice') {
            let voiceText = '';
            try {
                const payload = typeof message.content === 'string' ? JSON.parse(message.content) : (message.content || {});
                voiceText = String(payload.text || '').trim();
            } catch (error) {
                voiceText = String(message.content || '').trim();
            }
            preview = voiceText ? `[语音] ${voiceText}` : '[语音]';
        } else if (type === 'red_packet') {
            preview = '[红包]';
        } else if (type === 'private_chat_invite') {
            preview = '[私聊邀请]';
        } else if (type === 'group_poll') {
            let title = '';
            try {
                const payload = typeof message.content === 'string' ? JSON.parse(message.content) : (message.content || {});
                title = String(payload.title || '').trim();
            } catch (error) {}
            preview = title ? `[投票] ${title}` : '[投票]';
        } else if (type === 'group_relay') {
            let title = '';
            try {
                const payload = typeof message.content === 'string' ? JSON.parse(message.content) : (message.content || {});
                title = String(payload.title || '').trim();
            } catch (error) {}
            preview = title ? `[接龙] ${title}` : '[接龙]';
        } else {
            preview = String(message.content || '').replace(/\s+/g, ' ').trim() || '[消息]';
        }
        const safePreview = preview.replace(/^\[系统消息\]:\s*/i, '').trim() || '[消息]';
        return safePreview.length > maxLength ? `${safePreview.slice(0, maxLength)}…` : safePreview;
    }

    function getGroupPinnedMessageEntry(groupContact, options = {}) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta) return null;
        const pinnedMsgId = String(group.groupMeta.pinnedMessageId || '').trim();
        if (!pinnedMsgId) return null;
        const history = Array.isArray(window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[group.id])
            ? window.iphoneSimState.chatHistory[group.id]
            : [];
        const message = history.find(item => item && String(item.id || '') === pinnedMsgId) || null;
        const valid = !!(
            message
            && !message.hiddenFromUi
            && !message._hiddenBySanitizer
            && message.type !== 'system_event'
            && message.type !== 'voice_call_text'
        );
        if (valid) {
            return { group, message };
        }
        if (options && options.autoClearInvalid) {
            group.groupMeta.pinnedMessageId = '';
            group.groupMeta.pinnedUpdatedAt = 0;
            group.groupMeta.pinnedUpdatedBy = '';
            if (options.persist && typeof saveConfig === 'function') {
                saveConfig();
            }
        }
        return null;
    }

    function getGroupPinnedMessageDisplayData(groupContact, options = {}) {
        const entry = getGroupPinnedMessageEntry(groupContact, options);
        if (!entry) return null;
        const { group, message } = entry;
        const speakerId = normalizeParticipantId(message.speakerContactId || (message.role === 'user' ? 'me' : ''));
        const speakerName = getParticipantName(group, speakerId, message.role === 'user' ? getUserDisplayName(group) : '群成员');
        return {
            groupId: group.id,
            messageId: String(message.id || ''),
            speakerContactId: speakerId || '',
            speakerName: String(speakerName || message.speakerNameSnapshot || '群成员').trim() || '群成员',
            preview: buildGroupMessagePreviewText(message, group, { maxLength: Number(options.maxLength) || 72 }),
            type: String(message.type || 'text'),
            updatedAt: Number(group.groupMeta.pinnedUpdatedAt || 0) || 0,
            updatedBy: String(group.groupMeta.pinnedUpdatedBy || '')
        };
    }

    function setGroupPinnedMessage(groupContact, actorId = 'me', targetMsgId = '', options = {}) {
        const group = getGroupContact(groupContact);
        const safeActorId = normalizeParticipantId(actorId || 'me');
        if (!group || !safeActorId || !canParticipantRenameGroup(group, safeActorId)) {
            return { ok: false, reason: 'forbidden' };
        }

        const nextMsgId = String(targetMsgId || '').trim();
        const previousMsgId = String(group.groupMeta && group.groupMeta.pinnedMessageId || '').trim();
        let pinnedMessage = null;
        if (nextMsgId) {
            const history = Array.isArray(window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[group.id])
                ? window.iphoneSimState.chatHistory[group.id]
                : [];
            pinnedMessage = history.find(item => item && String(item.id || '') === nextMsgId) || null;
            const valid = !!(
                pinnedMessage
                && !pinnedMessage.hiddenFromUi
                && !pinnedMessage._hiddenBySanitizer
                && pinnedMessage.type !== 'system_event'
                && pinnedMessage.type !== 'voice_call_text'
            );
            if (!valid) {
                return { ok: false, reason: 'invalid_target_message' };
            }
        }

        if (!group.groupMeta || typeof group.groupMeta !== 'object') {
            return { ok: false, reason: 'invalid_group_meta' };
        }
        if (!nextMsgId && !previousMsgId) {
            return { ok: true, changed: false, pinnedMessageId: '' };
        }
        if (nextMsgId && previousMsgId === nextMsgId) {
            return { ok: true, changed: false, pinnedMessageId: nextMsgId };
        }

        group.groupMeta.pinnedMessageId = nextMsgId;
        group.groupMeta.pinnedUpdatedAt = Date.now();
        group.groupMeta.pinnedUpdatedBy = safeActorId;
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        if (typeof saveConfig === 'function') saveConfig();
        if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(group.id, true);
        }
        if (String(currentSettingsGroupId || '') === String(group.id)) {
            renderGroupChatSettings(group);
        }
        if (options.showNotice !== false) {
            const actorName = String(options.actorName || getParticipantName(group, safeActorId, safeActorId === 'me' ? '你' : '群成员')).trim() || '群成员';
            if (nextMsgId && pinnedMessage) {
                const targetSpeakerName = getParticipantName(group, normalizeParticipantId(pinnedMessage.speakerContactId || ''), '群成员');
                pushVisibleGroupSystemNotice(group.id, `${actorName} 置顶了 ${targetSpeakerName} 的一条消息`);
            } else {
                pushVisibleGroupSystemNotice(group.id, `${actorName} 取消了置顶消息`);
            }
        }
        return {
            ok: true,
            changed: true,
            pinnedMessageId: nextMsgId,
            cleared: !nextMsgId
        };
    }

    function toggleGroupPinnedMessage(groupContact, targetMsgId = '', actorId = 'me', options = {}) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta) return { ok: false, reason: 'invalid_group' };
        const normalizedTargetMsgId = String(targetMsgId || '').trim();
        const currentPinnedId = String(group.groupMeta.pinnedMessageId || '').trim();
        if (!normalizedTargetMsgId) {
            return setGroupPinnedMessage(group, actorId, '', options);
        }
        if (currentPinnedId && currentPinnedId === normalizedTargetMsgId) {
            return setGroupPinnedMessage(group, actorId, '', options);
        }
        return setGroupPinnedMessage(group, actorId, normalizedTargetMsgId, options);
    }

    function focusGroupPinnedMessage(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group) return;
        const pinnedData = getGroupPinnedMessageDisplayData(group, { autoClearInvalid: true });
        if (!pinnedData || !pinnedData.messageId) {
            showGroupToast('当前没有可跳转的置顶消息');
            return;
        }
        const doFocus = () => {
            const nodes = Array.from(document.querySelectorAll('.chat-message[data-msg-id]'));
            const targetNode = nodes.find(node => String(node && node.dataset && node.dataset.msgId || '') === String(pinnedData.messageId));
            if (!targetNode) {
                showGroupToast('请上滑加载更多历史消息查看置顶内容');
                return;
            }
            targetNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const oldTransition = targetNode.style.transition;
            const oldBoxShadow = targetNode.style.boxShadow;
            targetNode.style.transition = 'box-shadow 0.22s ease';
            targetNode.style.boxShadow = '0 0 0 2px rgba(250, 181, 80, 0.7), 0 6px 18px rgba(250, 181, 80, 0.25)';
            setTimeout(() => {
                targetNode.style.boxShadow = oldBoxShadow;
                targetNode.style.transition = oldTransition;
            }, 1600);
        };
        if (String(window.iphoneSimState.currentChatContactId || '') !== String(group.id) && typeof window.openChat === 'function') {
            window.openChat(group.id);
            setTimeout(doFocus, 120);
            return;
        }
        doFocus();
    }

    function applyGroupAnnouncement(groupContact, actorId, nextAnnouncement, options = {}) {
        const group = getGroupContact(groupContact);
        const safeActorId = normalizeParticipantId(actorId || 'me');
        if (!group || !safeActorId || !canParticipantManageAnnouncement(group, safeActorId)) {
            return { ok: false, reason: 'forbidden' };
        }
        const normalizedAnnouncement = String(nextAnnouncement || '').replace(/\s+/g, ' ').trim().slice(0, 240);
        const previousAnnouncement = getGroupAnnouncementText(group);
        if (normalizedAnnouncement === previousAnnouncement) {
            return { ok: true, changed: false, announcement: normalizedAnnouncement };
        }
        group.groupMeta.announcementText = normalizedAnnouncement;
        group.groupMeta.announcementUpdatedAt = Date.now();
        group.groupMeta.announcementUpdatedBy = safeActorId;
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        if (typeof saveConfig === 'function') saveConfig();
        if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(group.id, true);
        }
        if (String(currentSettingsGroupId || '') === String(group.id)) {
            renderGroupChatSettings(group);
        }
        if (options.showNotice !== false) {
            const actorName = String(options.actorName || getParticipantName(group, safeActorId, safeActorId === 'me' ? '你' : '群成员')).trim() || '群成员';
            if (normalizedAnnouncement) {
                pushVisibleGroupSystemNotice(group.id, `${actorName} 更新了群公告`);
            } else if (previousAnnouncement) {
                pushVisibleGroupSystemNotice(group.id, `${actorName} 清空了群公告`);
            }
        }
        return { ok: true, changed: true, announcement: normalizedAnnouncement };
    }

    function applyGroupRename(groupContact, actorId, nextName, options = {}) {
        const group = getGroupContact(groupContact);
        if (!group || !canParticipantRenameGroup(group, actorId)) {
            return { ok: false, reason: 'forbidden' };
        }
        const normalizedName = String(nextName || '').replace(/\s+/g, ' ').trim().slice(0, 30);
        if (!normalizedName) {
            return { ok: false, reason: 'empty' };
        }
        const previousName = getGroupChatDisplayName(group);
        if (normalizedName === previousName) {
            return { ok: true, changed: false, name: normalizedName };
        }
        group.groupMeta.name = normalizedName;
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        refreshGroupChatVisualState(group);
        if (typeof saveConfig === 'function') saveConfig();
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }
        if (options.showNotice !== false) {
            const actorName = String(options.actorName || getParticipantName(group, actorId, actorId === 'me' ? '你' : '群成员')).trim() || '群成员';
            pushVisibleGroupSystemNotice(group.id, `${actorName} 修改群名为“${normalizedName}”`);
        }
        if (String(currentSettingsGroupId || '') === String(group.id)) {
            renderGroupChatSettings(group);
        }
        return { ok: true, changed: true, name: normalizedName };
    }

    function applyGroupMemberTitle(groupContact, actorId, targetId, nextTitle, options = {}) {
        const group = getGroupContact(groupContact);
        const safeTargetId = normalizeParticipantId(targetId);
        if (!group || !safeTargetId || !canParticipantManageTitles(group, actorId)) {
            return { ok: false, reason: 'forbidden' };
        }
        if (safeTargetId !== 'me' && !getGroupMemberIds(group).some(id => String(id) === String(safeTargetId))) {
            return { ok: false, reason: 'missing_target' };
        }
        const normalizedTitle = String(nextTitle || '').replace(/\s+/g, ' ').trim().slice(0, 24);
        if (!group.groupMeta.memberTitles || typeof group.groupMeta.memberTitles !== 'object') {
            group.groupMeta.memberTitles = {};
        }
        const previousTitle = getGroupMemberTitle(group, safeTargetId);
        if (normalizedTitle) {
            group.groupMeta.memberTitles[String(safeTargetId)] = normalizedTitle;
        } else {
            delete group.groupMeta.memberTitles[String(safeTargetId)];
        }
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        refreshGroupChatVisualState(group);
        if (typeof saveConfig === 'function') saveConfig();
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }
        if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(group.id, true);
        }
        if (options.showNotice !== false) {
            const actorName = String(options.actorName || getParticipantName(group, actorId, actorId === 'me' ? '你' : '群成员')).trim() || '群成员';
            const targetName = getParticipantName(group, safeTargetId, '群成员');
            if (normalizedTitle) {
                pushVisibleGroupSystemNotice(group.id, `${actorName} 给 ${targetName} 设置了群头衔“${normalizedTitle}”`);
            } else if (previousTitle) {
                pushVisibleGroupSystemNotice(group.id, `${actorName} 取消了 ${targetName} 的群头衔`);
            }
        }
        if (String(currentSettingsGroupId || '') === String(group.id)) {
            renderGroupChatSettings(group);
        }
        return { ok: true, changed: previousTitle !== normalizedTitle, title: normalizedTitle };
    }

    function removeGroupMemberFromMeta(groupContact, targetId) {
        const group = getGroupContact(groupContact);
        const safeTargetId = normalizeDirectMemberId(targetId) || normalizeParticipantId(targetId);
        const targetKey = getParticipantIdKey(safeTargetId);
        if (!group || !targetKey || safeTargetId === 'me') {
            return { ok: false, reason: 'invalid_target' };
        }
        if (targetKey === getParticipantIdKey(group.groupMeta && group.groupMeta.ownerId)) {
            return { ok: false, reason: 'target_is_owner' };
        }

        const currentMemberIds = getGroupMemberIds(group);
        const exists = currentMemberIds.some(id => getParticipantIdKey(id) === targetKey);
        if (!exists) {
            return { ok: false, reason: 'missing_target' };
        }

        const targetName = getParticipantName(group, safeTargetId, '群成员');
        group.groupMeta.memberIds = normalizeDirectMemberIds(
            currentMemberIds.filter(id => getParticipantIdKey(id) !== targetKey)
        );
        group.groupMeta.adminIds = (Array.isArray(group.groupMeta.adminIds) ? group.groupMeta.adminIds : [])
            .filter(id => getParticipantIdKey(id) !== targetKey);

        if (group.groupMeta.memberNicknames && typeof group.groupMeta.memberNicknames === 'object') {
            Object.keys(group.groupMeta.memberNicknames).forEach((key) => {
                if (getParticipantIdKey(key) === targetKey) {
                    delete group.groupMeta.memberNicknames[key];
                }
            });
        }
        if (group.groupMeta.memberTitles && typeof group.groupMeta.memberTitles === 'object') {
            Object.keys(group.groupMeta.memberTitles).forEach((key) => {
                if (getParticipantIdKey(key) === targetKey) {
                    delete group.groupMeta.memberTitles[key];
                }
            });
        }
        if (Array.isArray(group.groupMeta.relationshipMemberIds)) {
            group.groupMeta.relationshipMemberIds = group.groupMeta.relationshipMemberIds
                .filter(id => getParticipantIdKey(id) !== targetKey);
        }
        if (group.groupMeta.relationshipNodePositions && typeof group.groupMeta.relationshipNodePositions === 'object') {
            Object.keys(group.groupMeta.relationshipNodePositions).forEach((key) => {
                if (getParticipantIdKey(key) === targetKey) {
                    delete group.groupMeta.relationshipNodePositions[key];
                }
            });
        }
        if (Array.isArray(group.groupMeta.relationshipLinks)) {
            group.groupMeta.relationshipLinks = group.groupMeta.relationshipLinks.filter(link => (
                getParticipantIdKey(link && link.sourceId) !== targetKey
                && getParticipantIdKey(link && link.targetId) !== targetKey
            ));
        }
        if (Array.isArray(group.groupMeta.pendingInviteMemberIds)) {
            group.groupMeta.pendingInviteMemberIds = normalizeDirectMemberIds(group.groupMeta.pendingInviteMemberIds)
                .filter(id => getParticipantIdKey(id) !== targetKey);
            if (group.groupMeta.pendingInviteMemberIds.length === 0) {
                group.groupMeta.lastInviteAt = 0;
            }
        }

        return {
            ok: true,
            changed: true,
            targetId: safeTargetId,
            targetName
        };
    }

    function applyGroupAdminRole(groupContact, actorId, targetId, setAsAdmin, options = {}) {
        const group = getGroupContact(groupContact);
        const safeActorId = normalizeParticipantId(actorId || 'me');
        const safeTargetId = normalizeParticipantId(targetId);
        if (!group || !safeActorId || !safeTargetId || !canParticipantManageAdmins(group, safeActorId)) {
            return { ok: false, reason: 'forbidden' };
        }
        if (String(safeTargetId) === String(group.groupMeta && group.groupMeta.ownerId)) {
            return { ok: false, reason: 'target_is_owner' };
        }
        if (safeTargetId !== 'me' && !getGroupMemberIds(group).some(id => String(id) === String(safeTargetId))) {
            return { ok: false, reason: 'missing_target' };
        }

        const currentAdmins = Array.isArray(group.groupMeta.adminIds) ? group.groupMeta.adminIds : [];
        const targetKey = getParticipantIdKey(safeTargetId);
        const exists = currentAdmins.some(id => getParticipantIdKey(id) === targetKey);
        const shouldSet = typeof setAsAdmin === 'boolean' ? setAsAdmin : !exists;
        if (shouldSet === exists) {
            return { ok: true, changed: false, isAdmin: exists };
        }

        if (shouldSet) {
            currentAdmins.push(safeTargetId);
            group.groupMeta.adminIds = currentAdmins;
        } else {
            group.groupMeta.adminIds = currentAdmins.filter(id => getParticipantIdKey(id) !== targetKey);
        }

        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        if (typeof saveConfig === 'function') saveConfig();
        if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(group.id, true);
        }
        if (String(currentSettingsGroupId || '') === String(group.id)) {
            renderGroupChatSettings(group);
        }

        if (options.showNotice !== false) {
            const actorName = String(options.actorName || getParticipantName(group, safeActorId, safeActorId === 'me' ? '你' : '群成员')).trim() || '群成员';
            const targetName = getParticipantName(group, safeTargetId, '群成员');
            if (shouldSet) {
                pushVisibleGroupSystemNotice(group.id, `${actorName} 将 ${targetName} 设为了管理员`);
            } else {
                pushVisibleGroupSystemNotice(group.id, `${actorName} 取消了 ${targetName} 的管理员身份`);
            }
        }

        return { ok: true, changed: true, isAdmin: shouldSet };
    }

    function applyGroupOwnerTransfer(groupContact, actorId, targetId, options = {}) {
        const group = getGroupContact(groupContact);
        const safeActorId = normalizeParticipantId(actorId || 'me');
        const safeTargetId = normalizeParticipantId(targetId);
        if (!group || !safeActorId || !safeTargetId || !canParticipantManageAdmins(group, safeActorId)) {
            return { ok: false, reason: 'forbidden' };
        }
        if (safeTargetId !== 'me' && !getGroupMemberIds(group).some(id => String(id) === String(safeTargetId))) {
            return { ok: false, reason: 'missing_target' };
        }

        const previousOwnerId = normalizeParticipantId(group.groupMeta && group.groupMeta.ownerId || 'me') || 'me';
        if (String(previousOwnerId) === String(safeTargetId)) {
            return { ok: true, changed: false, ownerId: safeTargetId };
        }

        group.groupMeta.ownerId = safeTargetId;
        if (!Array.isArray(group.groupMeta.adminIds)) {
            group.groupMeta.adminIds = [];
        }

        const adminKeySet = new Set(group.groupMeta.adminIds.map(id => getParticipantIdKey(id)).filter(Boolean));
        const canBeAdmin = (participantId) => participantId === 'me' || getGroupMemberIds(group).some(id => String(id) === String(participantId));
        if (previousOwnerId && String(previousOwnerId) !== String(safeTargetId) && canBeAdmin(previousOwnerId) && !adminKeySet.has(getParticipantIdKey(previousOwnerId))) {
            group.groupMeta.adminIds.push(previousOwnerId);
            adminKeySet.add(getParticipantIdKey(previousOwnerId));
        }
        if (String(safeActorId) === 'me' && String(safeTargetId) !== 'me' && !adminKeySet.has('me')) {
            group.groupMeta.adminIds.push('me');
            adminKeySet.add('me');
        }

        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        if (typeof saveConfig === 'function') saveConfig();
        if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(group.id, true);
        }
        if (String(currentSettingsGroupId || '') === String(group.id)) {
            renderGroupChatSettings(group);
        }

        if (options.showNotice !== false) {
            const actorName = String(options.actorName || getParticipantName(group, safeActorId, safeActorId === 'me' ? '你' : '群成员')).trim() || '群成员';
            const targetName = getParticipantName(group, safeTargetId, '群成员');
            pushVisibleGroupSystemNotice(group.id, `${actorName} 将群主转让给了 ${targetName}`);
        }

        return { ok: true, changed: true, ownerId: safeTargetId };
    }

    function applyGroupMemberLeave(groupContact, actorId, options = {}) {
        const group = getGroupContact(groupContact);
        const safeActorId = normalizeParticipantId(actorId);
        if (!group || !safeActorId || safeActorId === 'me') {
            return { ok: false, reason: 'invalid_actor' };
        }
        if (getGroupRole(group, safeActorId) === 'owner') {
            return { ok: false, reason: 'owner_cannot_leave' };
        }

        const removed = removeGroupMemberFromMeta(group, safeActorId);
        if (!removed || !removed.ok) {
            return removed || { ok: false, reason: 'remove_failed' };
        }

        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        if (typeof saveConfig === 'function') saveConfig();
        if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(group.id, true);
        }
        if (String(currentSettingsGroupId || '') === String(group.id)) {
            renderGroupChatSettings(group);
        }
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }

        if (options.showNotice !== false) {
            pushVisibleGroupSystemNotice(group.id, `${removed.targetName || '群成员'} 退出了群聊`);
        }

        return {
            ok: true,
            changed: true,
            actorId: safeActorId,
            actorName: removed.targetName || getParticipantName(group, safeActorId, '群成员')
        };
    }

    function normalizeMoneyAmount(value, fallback = 0) {
        const amount = Number(value);
        if (!Number.isFinite(amount) || amount <= 0) return Number(fallback) || 0;
        return Number(amount.toFixed(2));
    }

    function buildRandomAllocationCents(totalCents, count) {
        const result = [];
        let remaining = Math.max(count, Math.floor(Number(totalCents) || 0));
        const safeCount = Math.max(1, Math.floor(Number(count) || 1));
        for (let i = 0; i < safeCount; i++) {
            if (i === safeCount - 1) {
                result.push(remaining);
                break;
            }
            const remainingSlots = safeCount - i - 1;
            const minCents = 1;
            const maxCents = Math.max(minCents, remaining - remainingSlots);
            const avg = Math.max(minCents, Math.floor(remaining / (remainingSlots + 1)));
            const sampledUpper = Math.min(maxCents, Math.max(minCents, Math.floor(avg * 1.8)));
            const sampled = sampledUpper <= minCents
                ? minCents
                : (minCents + Math.floor(Math.random() * (sampledUpper - minCents + 1)));
            result.push(sampled);
            remaining -= sampled;
        }
        return result;
    }

    function buildEqualAllocationCents(totalCents, count) {
        const safeCount = Math.max(1, Math.floor(Number(count) || 1));
        const safeTotal = Math.max(safeCount, Math.floor(Number(totalCents) || 0));
        const base = Math.floor(safeTotal / safeCount);
        const remainder = safeTotal - base * safeCount;
        return Array.from({ length: safeCount }, (_, index) => base + (index < remainder ? 1 : 0));
    }

    function ensureWalletState() {
        if (!window.iphoneSimState.wallet || typeof window.iphoneSimState.wallet !== 'object') {
            window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
        }
        if (!Array.isArray(window.iphoneSimState.wallet.transactions)) {
            window.iphoneSimState.wallet.transactions = [];
        }
        if (!Number.isFinite(Number(window.iphoneSimState.wallet.balance))) {
            window.iphoneSimState.wallet.balance = 0.00;
        }
        return window.iphoneSimState.wallet;
    }

    function applyWalletExpense(amount, title, relatedId) {
        const wallet = ensureWalletState();
        const debit = normalizeMoneyAmount(amount, 0);
        if (debit <= 0) return { ok: false, reason: 'invalid_amount' };
        if (Number(wallet.balance || 0) < debit) {
            return { ok: false, reason: 'insufficient_balance' };
        }
        wallet.balance = Number((Number(wallet.balance || 0) - debit).toFixed(2));
        wallet.transactions.unshift({
            id: Date.now(),
            type: 'expense',
            amount: debit,
            title: title || '支出',
            time: Date.now(),
            relatedId: relatedId || null
        });
        return { ok: true, amount: debit };
    }

    function applyWalletIncome(amount, title, relatedId) {
        const wallet = ensureWalletState();
        const credit = normalizeMoneyAmount(amount, 0);
        if (credit <= 0) return { ok: false, reason: 'invalid_amount' };
        wallet.balance = Number((Number(wallet.balance || 0) + credit).toFixed(2));
        wallet.transactions.unshift({
            id: Date.now(),
            type: 'income',
            amount: credit,
            title: title || '收入',
            time: Date.now(),
            relatedId: relatedId || null
        });
        return { ok: true, amount: credit };
    }

    function parseGroupRedPacketPayload(group, actorId, rawPayload) {
        const memberIds = getGroupMemberIds(group).map(id => normalizeParticipantId(id)).filter(Boolean);
        const safeActorId = normalizeParticipantId(actorId);
        const eligibleMemberIds = memberIds.filter(id => String(id) !== String(safeActorId));
        if (eligibleMemberIds.length === 0) {
            return { ok: false, reason: 'no_eligible_members' };
        }

        let payload = rawPayload && typeof rawPayload === 'object'
            ? rawPayload
            : {};
        if (typeof rawPayload === 'string') {
            const rawText = String(rawPayload || '').trim();
            if (rawText) {
                if ((rawText.startsWith('{') && rawText.endsWith('}')) || (rawText.startsWith('[') && rawText.endsWith(']'))) {
                    try {
                        const parsed = JSON.parse(rawText);
                        if (parsed && typeof parsed === 'object') {
                            payload = parsed;
                        }
                    } catch (error) {}
                } else {
                    const parts = rawText.split('|').map(item => String(item || '').trim());
                    payload = {
                        mode: parts[0] || 'random',
                        amount: parts[1] || '',
                        count: parts[2] || '',
                        remark: parts.slice(3).join('|')
                    };
                }
            }
        }
        let mode = String(payload.mode || payload.packet_mode || payload.type || '').trim().toLowerCase();
        mode = mode === 'targeted' || mode === '指定' || mode === 'direct'
            ? 'targeted'
            : 'random';

        const amount = normalizeMoneyAmount(
            payload.amount
            || payload.total_amount
            || payload.totalAmount
            || payload.money
            || payload.value,
            0
        );
        if (amount <= 0) {
            return { ok: false, reason: 'invalid_amount' };
        }
        const totalCents = Math.round(amount * 100);

        const remark = String(payload.remark || payload.greeting || payload.text || '恭喜发财，大吉大利')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 40) || '恭喜发财，大吉大利';

        if (mode === 'targeted') {
            const rawTargets = Array.isArray(payload.target_member_ids)
                ? payload.target_member_ids
                : Array.isArray(payload.targetMemberIds)
                    ? payload.targetMemberIds
                    : Array.isArray(payload.targets)
                        ? payload.targets
                        : [];
            const targetMemberIds = rawTargets
                .map(id => normalizeParticipantId(id))
                .filter(id => id && eligibleMemberIds.some(memberId => String(memberId) === String(id)));
            const dedupedTargetIds = [];
            targetMemberIds.forEach((id) => {
                if (!dedupedTargetIds.some(existing => String(existing) === String(id))) {
                    dedupedTargetIds.push(id);
                }
            });
            if (dedupedTargetIds.length === 0) {
                return { ok: false, reason: 'empty_target_members' };
            }
            if (totalCents < dedupedTargetIds.length) {
                return { ok: false, reason: 'amount_too_small' };
            }
            const allocationCents = buildEqualAllocationCents(totalCents, dedupedTargetIds.length);
            return {
                ok: true,
                mode: 'targeted',
                amount,
                remark,
                totalCount: dedupedTargetIds.length,
                targetMemberIds: dedupedTargetIds,
                allocations: allocationCents.map(cents => Number((cents / 100).toFixed(2)))
            };
        }

        const requestedCountRaw = Number(
            payload.count
            || payload.packet_count
            || payload.packetCount
            || payload.total_count
            || payload.totalCount
            || payload.num
            || payload.member_count
            || 0
        );
        const fallbackCount = Math.min(3, eligibleMemberIds.length);
        const totalCount = Math.max(
            1,
            Math.min(
                eligibleMemberIds.length,
                Number.isFinite(requestedCountRaw) && requestedCountRaw > 0 ? Math.floor(requestedCountRaw) : fallbackCount
            )
        );
        if (totalCents < totalCount) {
            return { ok: false, reason: 'amount_too_small' };
        }
        const allocationCents = buildRandomAllocationCents(totalCents, totalCount);
        return {
            ok: true,
            mode: 'random',
            amount,
            remark,
            totalCount,
            targetMemberIds: [],
            allocations: allocationCents.map(cents => Number((cents / 100).toFixed(2)))
        };
    }

    function findGroupRedPacketEntry(groupContact, packetIdOrMsgId = null) {
        const group = getGroupContact(groupContact);
        if (!group) return null;
        const targetToken = String(packetIdOrMsgId || '').trim();
        const history = Array.isArray(window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[group.id])
            ? window.iphoneSimState.chatHistory[group.id]
            : [];
        for (let i = history.length - 1; i >= 0; i--) {
            const message = history[i];
            if (!message || message.type !== 'red_packet') continue;
            let payload = null;
            try {
                payload = typeof message.content === 'string' ? JSON.parse(message.content) : message.content;
            } catch (error) {
                payload = null;
            }
            if (!payload || !payload.id) continue;
            const packetId = String(payload.id);
            const msgId = String(message.id || '');
            if (!targetToken || targetToken === packetId || targetToken === msgId) {
                return { group, message, payload, index: i };
            }
        }
        return null;
    }

    function getGroupRedPacketClaimState(groupContact, payload, actorId = 'me') {
        const group = getGroupContact(groupContact);
        const safeActorId = normalizeParticipantId(actorId);
        const senderId = normalizeParticipantId(payload && payload.senderId || '');
        const claims = Array.isArray(payload && payload.claims) ? payload.claims : [];
        const mode = String(payload && payload.mode || 'random') === 'targeted' ? 'targeted' : 'random';
        const targetMemberIds = Array.isArray(payload && payload.targetMemberIds)
            ? payload.targetMemberIds.map(id => normalizeParticipantId(id)).filter(Boolean)
            : [];
        const allocations = Array.isArray(payload && payload.allocations)
            ? payload.allocations.map(item => normalizeMoneyAmount(item, 0)).filter(item => item > 0)
            : [];
        const totalCount = Math.max(1, Number(payload && payload.totalCount) || (mode === 'targeted' ? targetMemberIds.length : allocations.length || 1));
        const claimedCount = claims.length;

        const claimedEntry = claims.find(item => String(normalizeParticipantId(item && item.memberId)) === String(safeActorId));
        if (claimedEntry) {
            return {
                alreadyClaimed: true,
                canClaim: false,
                reason: 'already_claimed',
                claimedAmount: normalizeMoneyAmount(claimedEntry.amount, 0)
            };
        }
        if (!group || !safeActorId || String(senderId) === String(safeActorId)) {
            return { alreadyClaimed: false, canClaim: false, reason: 'self' };
        }
        if (claimedCount >= totalCount || String(payload && payload.status || '') === 'finished') {
            return { alreadyClaimed: false, canClaim: false, reason: 'finished' };
        }
        if (mode === 'targeted') {
            const isTarget = targetMemberIds.some(id => String(id) === String(safeActorId));
            if (!isTarget) {
                return { alreadyClaimed: false, canClaim: false, reason: 'not_target' };
            }
        }
        return { alreadyClaimed: false, canClaim: true, reason: '' };
    }

    function createGroupRedPacket(groupContact, actorId = 'me', rawPayload = {}, options = {}) {
        const group = getGroupContact(groupContact);
        const safeActorId = normalizeParticipantId(actorId || 'me');
        if (!group || !safeActorId) return { ok: false, reason: 'invalid_group_or_actor' };

        const isActorUser = String(safeActorId) === 'me';
        const actorInGroup = isActorUser || getGroupMemberIds(group).some(id => String(id) === String(safeActorId));
        if (!actorInGroup) return { ok: false, reason: 'actor_not_in_group' };

        const parsed = parseGroupRedPacketPayload(group, safeActorId, rawPayload);
        if (!parsed.ok) return parsed;

        const packetId = Date.now() + Math.floor(Math.random() * 10000);
        const packetData = {
            id: packetId,
            amount: Number(parsed.amount.toFixed(2)),
            remark: parsed.remark,
            mode: parsed.mode,
            totalCount: parsed.totalCount,
            targetMemberIds: parsed.targetMemberIds,
            allocations: parsed.allocations,
            claims: [],
            status: 'pending',
            senderId: safeActorId,
            createdAt: Date.now()
        };

        if (isActorUser && options.allowWalletDebit !== false) {
            const debitResult = applyWalletExpense(parsed.amount, '群红包支出', packetId);
            if (!debitResult.ok) return debitResult;
        }

        const message = typeof window.sendMessage === 'function'
            ? window.sendMessage(
                JSON.stringify(packetData),
                isActorUser,
                'red_packet',
                null,
                group.id,
                {
                    bypassWechatBlock: true,
                    ignoreReplyingState: true,
                    showNotification: true,
                    speakerContactId: safeActorId
                }
            )
            : null;

        if (!message) {
            if (isActorUser && options.allowWalletDebit !== false) {
                applyWalletIncome(parsed.amount, '群红包回退', packetId);
            }
            return { ok: false, reason: 'send_failed' };
        }

        if (typeof saveConfig === 'function') saveConfig();
        if (options.showNotice) {
            const actorName = safeActorId === 'me' ? '你' : getParticipantName(group, safeActorId, '群成员');
            const modeText = parsed.mode === 'targeted' ? '专属红包' : '拼手气红包';
            pushVisibleGroupSystemNotice(group.id, `${actorName} 发了一个${modeText}（¥${parsed.amount.toFixed(2)}）`);
        }
        return { ok: true, packetData, message };
    }

    function claimGroupRedPacket(groupContact, actorId = 'me', packetIdOrMsgId = null, options = {}) {
        const entry = findGroupRedPacketEntry(groupContact, packetIdOrMsgId);
        if (!entry) return { ok: false, reason: 'not_found' };
        const { group, message, payload } = entry;
        const safeActorId = normalizeParticipantId(actorId || 'me');
        const senderId = normalizeParticipantId(payload.senderId || '');
        const claims = Array.isArray(payload.claims) ? payload.claims : [];
        const allocations = Array.isArray(payload.allocations)
            ? payload.allocations.map(item => normalizeMoneyAmount(item, 0))
            : [];
        const mode = String(payload.mode || 'random') === 'targeted' ? 'targeted' : 'random';
        const targetMemberIds = Array.isArray(payload.targetMemberIds)
            ? payload.targetMemberIds.map(id => normalizeParticipantId(id)).filter(Boolean)
            : [];
        const totalCount = Math.max(1, Number(payload.totalCount) || (mode === 'targeted' ? targetMemberIds.length : allocations.length || 1));

        const claimState = getGroupRedPacketClaimState(group, payload, safeActorId);
        if (!claimState.canClaim) {
            return { ok: false, reason: claimState.reason, claimedAmount: claimState.claimedAmount || 0 };
        }

        let claimAmount = 0;
        if (mode === 'targeted') {
            const targetIndex = targetMemberIds.findIndex(id => String(id) === String(safeActorId));
            claimAmount = normalizeMoneyAmount(allocations[targetIndex], 0);
        } else {
            claimAmount = normalizeMoneyAmount(allocations[claims.length], 0);
        }
        if (claimAmount <= 0) {
            return { ok: false, reason: 'invalid_claim_amount' };
        }

        claims.push({
            memberId: safeActorId,
            amount: Number(claimAmount.toFixed(2)),
            time: Date.now()
        });
        payload.claims = claims;
        payload.status = claims.length >= totalCount ? 'finished' : 'pending';
        message.content = JSON.stringify(payload);

        if (String(safeActorId) === 'me') {
            applyWalletIncome(claimAmount, '群红包收入', payload.id || null);
        }

        if (typeof saveConfig === 'function') saveConfig();
        if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(group.id, true);
        }
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }

        if (options.showNotice !== false) {
            const actorName = safeActorId === 'me' ? '你' : getParticipantName(group, safeActorId, '群成员');
            pushVisibleGroupSystemNotice(group.id, `${actorName} 抢到了 ¥${claimAmount.toFixed(2)} 红包`);
            if (payload.status === 'finished') {
                pushVisibleGroupSystemNotice(group.id, '红包已被抢完');
            }
        }

        return {
            ok: true,
            amount: Number(claimAmount.toFixed(2)),
            finished: payload.status === 'finished',
            packetId: payload.id || null,
            messageId: message.id || null
        };
    }

    function parseGroupPrivateChatInvitePayload(rawPayload) {
        let payload = rawPayload && typeof rawPayload === 'object'
            ? rawPayload
            : {};
        if (typeof rawPayload === 'string') {
            const rawText = String(rawPayload || '').trim();
            if (rawText) {
                if ((rawText.startsWith('{') && rawText.endsWith('}')) || (rawText.startsWith('[') && rawText.endsWith(']'))) {
                    try {
                        const parsed = JSON.parse(rawText);
                        if (parsed && typeof parsed === 'object') {
                            payload = parsed;
                        } else {
                            payload = {};
                        }
                    } catch (error) {
                        payload = { message: rawText };
                    }
                } else {
                    payload = { message: rawText };
                }
            }
        }
        const message = String(payload.message || payload.content || payload.text || payload.reason || '想和你私聊一下')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 120) || '想和你私聊一下';
        return { ok: true, message };
    }

    function findGroupPrivateChatInviteEntry(groupContact, inviteIdOrMsgId = null) {
        const group = getGroupContact(groupContact);
        if (!group) return null;
        const targetToken = String(inviteIdOrMsgId || '').trim();
        const history = Array.isArray(window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[group.id])
            ? window.iphoneSimState.chatHistory[group.id]
            : [];
        for (let i = history.length - 1; i >= 0; i--) {
            const message = history[i];
            if (!message || message.type !== 'private_chat_invite') continue;
            let payload = null;
            try {
                payload = typeof message.content === 'string' ? JSON.parse(message.content) : message.content;
            } catch (error) {
                payload = null;
            }
            if (!payload || typeof payload !== 'object') continue;
            const inviteId = String(payload.id || '');
            const msgId = String(message.id || '');
            if (!targetToken || targetToken === inviteId || targetToken === msgId) {
                return { group, message, payload, index: i };
            }
        }
        return null;
    }

    function createGroupPrivateChatInvite(groupContact, actorId = 'me', rawPayload = {}, options = {}) {
        const group = getGroupContact(groupContact);
        const safeActorId = normalizeParticipantId(actorId || 'me');
        if (!group || !safeActorId) return { ok: false, reason: 'invalid_group_or_actor' };
        const memoryMode = String(group.groupMeta && group.groupMeta.memoryMode || 'group_only');
        if (memoryMode !== 'bidirectional') return { ok: false, reason: 'memory_mode_restricted' };
        const isActorUser = String(safeActorId) === 'me';
        if (isActorUser) return { ok: false, reason: 'actor_should_be_member' };
        const actorInGroup = getGroupMemberIds(group).some(id => String(id) === String(safeActorId));
        if (!actorInGroup) return { ok: false, reason: 'actor_not_in_group' };

        const parsed = parseGroupPrivateChatInvitePayload(rawPayload);
        if (!parsed.ok) return parsed;

        const inviteData = {
            id: Date.now() + Math.floor(Math.random() * 10000),
            initiatorId: safeActorId,
            targetId: 'me',
            message: parsed.message,
            status: 'pending',
            createdAt: Date.now()
        };

        const message = typeof window.sendMessage === 'function'
            ? window.sendMessage(
                JSON.stringify(inviteData),
                false,
                'private_chat_invite',
                null,
                group.id,
                {
                    bypassWechatBlock: true,
                    ignoreReplyingState: true,
                    showNotification: true,
                    speakerContactId: safeActorId
                }
            )
            : null;
        if (!message) return { ok: false, reason: 'send_failed' };

        if (typeof saveConfig === 'function') saveConfig();
        if (options.showNotice) {
            const actorName = getParticipantName(group, safeActorId, '群成员');
            pushVisibleGroupSystemNotice(group.id, `${actorName} 向你发起了私聊邀请`);
        }

        return { ok: true, inviteData, message };
    }

    function openGroupPrivateChatInvite(inviteIdOrMsgId = null) {
        const group = getGroupContact(window.iphoneSimState.currentChatContactId);
        if (!group) return;
        const entry = findGroupPrivateChatInviteEntry(group, inviteIdOrMsgId);
        if (!entry) {
            showGroupToast('未找到私聊邀请');
            return;
        }
        const { message, payload } = entry;
        const initiatorId = normalizeParticipantId(payload.initiatorId || message.speakerContactId || '');
        if (!initiatorId || String(initiatorId) === 'me') {
            showGroupToast('该私聊邀请无效');
            return;
        }
        const targetContact = getContactById(initiatorId);
        if (!targetContact || targetContact.chatType === 'group') {
            showGroupToast('联系人不存在');
            return;
        }

        const status = String(payload.status || 'pending').toLowerCase();
        if (status !== 'accepted') {
            payload.status = 'accepted';
            payload.acceptedAt = Date.now();
            payload.acceptedBy = 'me';
            message.content = JSON.stringify(payload);
            if (typeof saveConfig === 'function') saveConfig();
            if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
                window.renderChatHistory(group.id, true);
            }
        }

        if (typeof window.openChat === 'function') {
            window.openChat(targetContact.id);
        }
    }

    function openGroupRedPacketDetail(packetIdOrMsgId = null) {
        const group = getGroupContact(window.iphoneSimState.currentChatContactId);
        if (!group) return;
        const entry = findGroupRedPacketEntry(group, packetIdOrMsgId);
        if (!entry) {
            showGroupToast('未找到红包记录');
            return;
        }
        const { payload } = entry;
        const claimState = getGroupRedPacketClaimState(group, payload, 'me');
        const claims = Array.isArray(payload.claims) ? payload.claims : [];
        const totalCount = Math.max(1, Number(payload.totalCount) || 1);
        const modeText = String(payload.mode || '') === 'targeted' ? '专属红包' : '拼手气红包';
        const senderId = normalizeParticipantId(payload.senderId || '');
        const senderName = senderId === 'me' ? '你' : getParticipantName(group, senderId, '群成员');
        const claimLines = claims.map((item) => {
            const memberId = normalizeParticipantId(item && item.memberId);
            const memberName = memberId === 'me' ? '你' : getParticipantName(group, memberId, '群成员');
            const amountText = normalizeMoneyAmount(item && item.amount, 0).toFixed(2);
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f1f3f5;"><span>${escapeHtml(memberName)}</span><span style="font-weight:600;">¥${escapeHtml(amountText)}</span></div>`;
        }).join('');

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.zIndex = '360';
        modal.style.alignItems = 'flex-end';
        modal.innerHTML = `
            <div class="modal-content" style="height:auto;border-radius:16px 16px 0 0;max-height:75vh;overflow:auto;">
                <div class="modal-header">
                    <h3>${modeText}</h3>
                    <button class="close-btn" data-group-rp-close>&times;</button>
                </div>
                <div class="modal-body" style="padding:16px 20px 20px;">
                    <div style="font-size:14px;color:#6b7280;margin-bottom:6px;">发送者：${escapeHtml(senderName)}</div>
                    <div style="font-size:30px;font-weight:700;color:#111827;margin-bottom:6px;">¥${escapeHtml(normalizeMoneyAmount(payload.amount, 0).toFixed(2))}</div>
                    <div style="font-size:14px;color:#9ca3af;margin-bottom:12px;">${escapeHtml(String(payload.remark || '恭喜发财，大吉大利'))}</div>
                    <div style="font-size:13px;color:#6b7280;margin-bottom:12px;">已领取 ${claims.length}/${totalCount}</div>
                    <div style="max-height:220px;overflow:auto;margin-bottom:14px;">${claimLines || '<div style="font-size:13px;color:#9ca3af;">还没有人领取</div>'}</div>
                    <button data-group-rp-claim class="ios-btn-block" ${claimState.canClaim ? '' : 'disabled'} style="${claimState.canClaim ? '' : 'opacity:.5;cursor:not-allowed;'}">${claimState.canClaim ? '抢红包' : (claimState.alreadyClaimed ? `已领取 ¥${Number(claimState.claimedAmount || 0).toFixed(2)}` : '暂不可领取')}</button>
                </div>
            </div>
        `;

        const closeModal = () => {
            if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
        };
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });
        const closeBtn = modal.querySelector('[data-group-rp-close]');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        const claimBtn = modal.querySelector('[data-group-rp-claim]');
        if (claimBtn && claimState.canClaim) {
            claimBtn.addEventListener('click', () => {
                const claimed = claimGroupRedPacket(group, 'me', payload.id || entry.message.id, { showNotice: true });
                if (!claimed.ok) {
                    if (claimed.reason === 'already_claimed') {
                        showGroupToast(`你已经抢过这个红包（¥${Number(claimed.claimedAmount || 0).toFixed(2)}）`);
                    } else if (claimed.reason === 'not_target') {
                        showGroupToast('这是专属红包，你不在领取名单里');
                    } else if (claimed.reason === 'finished') {
                        showGroupToast('红包已经被抢完了');
                    } else {
                        showGroupToast('抢红包失败');
                    }
                    return;
                }
                closeModal();
            });
        }

        document.body.appendChild(modal);
    }

    const groupActionEditorRuntime = {
        resolve: null,
        fields: [],
        validate: null,
        closeTimer: null,
        bound: false
    };

    function getGroupActionEditorElements() {
        return {
            modal: document.getElementById('group-action-editor-modal'),
            backdrop: document.getElementById('group-action-editor-backdrop'),
            card: document.getElementById('group-action-editor-card'),
            kicker: document.getElementById('group-action-editor-kicker'),
            title: document.getElementById('group-action-editor-title'),
            subtitle: document.getElementById('group-action-editor-subtitle'),
            fields: document.getElementById('group-action-editor-fields'),
            closeBtn: document.getElementById('group-action-editor-close'),
            cancelBtn: document.getElementById('group-action-editor-cancel'),
            confirmBtn: document.getElementById('group-action-editor-confirm')
        };
    }

    function clearGroupActionEditorCloseTimer() {
        if (groupActionEditorRuntime.closeTimer) {
            clearTimeout(groupActionEditorRuntime.closeTimer);
            groupActionEditorRuntime.closeTimer = null;
        }
    }

    function collectGroupActionEditorValues() {
        const { fields } = getGroupActionEditorElements();
        if (!fields) return {};
        const values = {};
        const nodes = fields.querySelectorAll('[data-group-action-field]');
        nodes.forEach((node) => {
            const fieldId = String(node.dataset.groupActionField || '').trim();
            if (!fieldId) return;
            if (node.tagName === 'TEXTAREA') {
                values[fieldId] = String(node.value || '');
                return;
            }
            values[fieldId] = String(node.value || '');
        });
        return values;
    }

    function closeGroupActionEditorModal(result = null) {
        const { modal } = getGroupActionEditorElements();
        if (!modal) return;
        const resolver = groupActionEditorRuntime.resolve;
        groupActionEditorRuntime.resolve = null;
        groupActionEditorRuntime.validate = null;
        groupActionEditorRuntime.fields = [];

        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        clearGroupActionEditorCloseTimer();
        groupActionEditorRuntime.closeTimer = setTimeout(() => {
            modal.style.display = 'none';
        }, 260);

        if (typeof resolver === 'function') {
            resolver(result || { confirmed: false, values: {} });
        }
    }

    function submitGroupActionEditorModal() {
        const values = collectGroupActionEditorValues();
        if (typeof groupActionEditorRuntime.validate === 'function') {
            const validateResult = groupActionEditorRuntime.validate(values);
            if (validateResult === false) {
                showGroupToast('请检查输入');
                return;
            }
            if (validateResult && typeof validateResult === 'object' && validateResult.ok === false) {
                showGroupToast(validateResult.message || '请检查输入');
                return;
            }
        }
        closeGroupActionEditorModal({
            confirmed: true,
            values
        });
    }

    function bindGroupActionEditorModal() {
        if (groupActionEditorRuntime.bound) return;
        const { modal, backdrop, closeBtn, cancelBtn, confirmBtn } = getGroupActionEditorElements();
        if (!modal || !backdrop || !closeBtn || !cancelBtn || !confirmBtn) return;
        groupActionEditorRuntime.bound = true;

        backdrop.addEventListener('click', () => closeGroupActionEditorModal({ confirmed: false, values: {} }));
        closeBtn.addEventListener('click', () => closeGroupActionEditorModal({ confirmed: false, values: {} }));
        cancelBtn.addEventListener('click', () => closeGroupActionEditorModal({ confirmed: false, values: {} }));
        confirmBtn.addEventListener('click', () => submitGroupActionEditorModal());
        modal.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeGroupActionEditorModal({ confirmed: false, values: {} });
                return;
            }
            if (event.key === 'Enter' && !event.shiftKey) {
                const target = event.target;
                if (target && target.tagName === 'TEXTAREA') return;
                event.preventDefault();
                submitGroupActionEditorModal();
            }
        });
    }

    function buildGroupActionEditorField(fieldConfig = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'group-action-editor-field';
        const fieldId = String(fieldConfig.id || '').trim();
        if (!fieldId) return null;

        const label = document.createElement('label');
        label.className = 'group-action-editor-field-label';
        label.setAttribute('for', `group-action-editor-field-${fieldId}`);
        label.textContent = String(fieldConfig.label || fieldId).trim();
        wrapper.appendChild(label);

        const type = String(fieldConfig.type || 'text').trim().toLowerCase();
        let fieldNode = null;
        if (type === 'textarea') {
            fieldNode = document.createElement('textarea');
            fieldNode.className = 'group-action-editor-textarea';
            fieldNode.rows = Number(fieldConfig.rows) > 0 ? Number(fieldConfig.rows) : 4;
        } else if (type === 'select') {
            fieldNode = document.createElement('select');
            fieldNode.className = 'group-action-editor-select';
            const options = Array.isArray(fieldConfig.options) ? fieldConfig.options : [];
            options.forEach((option) => {
                const optionNode = document.createElement('option');
                if (option && typeof option === 'object') {
                    optionNode.value = String(option.value || '');
                    optionNode.textContent = String(option.label || option.value || '').trim();
                } else {
                    optionNode.value = String(option || '');
                    optionNode.textContent = String(option || '').trim();
                }
                fieldNode.appendChild(optionNode);
            });
        } else {
            fieldNode = document.createElement('input');
            fieldNode.type = type === 'number' ? 'number' : 'text';
            fieldNode.className = 'group-action-editor-input';
        }
        fieldNode.id = `group-action-editor-field-${fieldId}`;
        fieldNode.dataset.groupActionField = fieldId;
        if (fieldConfig.placeholder !== undefined) {
            fieldNode.placeholder = String(fieldConfig.placeholder || '');
        }
        if (fieldConfig.maxLength !== undefined && Number(fieldConfig.maxLength) > 0 && fieldNode.tagName !== 'SELECT') {
            fieldNode.maxLength = Number(fieldConfig.maxLength);
        }
        if (fieldConfig.min !== undefined && fieldNode.tagName === 'INPUT' && fieldNode.type === 'number') {
            fieldNode.min = String(fieldConfig.min);
        }
        if (fieldConfig.max !== undefined && fieldNode.tagName === 'INPUT' && fieldNode.type === 'number') {
            fieldNode.max = String(fieldConfig.max);
        }
        if (fieldConfig.step !== undefined && fieldNode.tagName === 'INPUT' && fieldNode.type === 'number') {
            fieldNode.step = String(fieldConfig.step);
        }
        if (fieldConfig.value !== undefined && fieldConfig.value !== null) {
            fieldNode.value = String(fieldConfig.value);
        }
        if (fieldConfig.readonly) {
            fieldNode.readOnly = true;
        }
        if (fieldConfig.disabled) {
            fieldNode.disabled = true;
        }
        wrapper.appendChild(fieldNode);
        if (fieldConfig.hidden) {
            wrapper.style.display = 'none';
        }
        return wrapper;
    }

    function openGroupActionEditorModal(config = {}) {
        bindGroupActionEditorModal();
        const { modal, kicker, title, subtitle, fields, confirmBtn, cancelBtn } = getGroupActionEditorElements();
        if (!modal || !title || !subtitle || !fields || !confirmBtn || !cancelBtn) {
            return Promise.resolve({ confirmed: false, values: {} });
        }

        if (typeof groupActionEditorRuntime.resolve === 'function') {
            groupActionEditorRuntime.resolve({ confirmed: false, values: {} });
            groupActionEditorRuntime.resolve = null;
        }
        clearGroupActionEditorCloseTimer();

        const titleText = String(config.title || '编辑群内容').trim() || '编辑群内容';
        const subtitleText = String(config.subtitle || '').trim();
        const kickerText = String(config.kicker || 'GROUP ACTION').trim() || 'GROUP ACTION';
        const confirmText = String(config.confirmText || '确认').trim() || '确认';
        const cancelText = String(config.cancelText || '取消').trim() || '取消';
        const fieldConfigs = Array.isArray(config.fields) ? config.fields : [];
        const focusFieldId = String(config.focusFieldId || (fieldConfigs[0] && fieldConfigs[0].id) || '').trim();

        if (kicker) kicker.textContent = kickerText;
        title.textContent = titleText;
        subtitle.textContent = subtitleText;
        subtitle.style.display = subtitleText ? '' : 'none';
        confirmBtn.textContent = confirmText;
        cancelBtn.textContent = cancelText;
        fields.innerHTML = '';

        const builtNodes = fieldConfigs
            .map(field => buildGroupActionEditorField(field))
            .filter(Boolean);
        builtNodes.forEach(node => fields.appendChild(node));

        groupActionEditorRuntime.fields = fieldConfigs;
        groupActionEditorRuntime.validate = typeof config.validate === 'function' ? config.validate : null;
        if (typeof config.onRendered === 'function') {
            try {
                config.onRendered({
                    modal,
                    fields,
                    kickerNode: kicker,
                    titleNode: title,
                    subtitleNode: subtitle,
                    confirmBtn,
                    cancelBtn
                });
            } catch (renderError) {
                console.warn('群操作弹窗自定义渲染失败', renderError);
            }
        }

        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(() => {
            modal.classList.add('is-open');
        });

        setTimeout(() => {
            const focusNode = focusFieldId
                ? fields.querySelector(`[data-group-action-field="${focusFieldId}"]`)
                : fields.querySelector('[data-group-action-field]');
            if (focusNode && typeof focusNode.focus === 'function') {
                focusNode.focus();
            }
        }, 80);

        return new Promise((resolve) => {
            groupActionEditorRuntime.resolve = resolve;
        });
    }

    function parseStructuredGroupPayload(rawPayload) {
        if (rawPayload && typeof rawPayload === 'object') {
            return { ...(rawPayload || {}) };
        }
        const rawText = String(rawPayload || '').trim();
        if (!rawText) return {};
        if ((rawText.startsWith('{') && rawText.endsWith('}')) || (rawText.startsWith('[') && rawText.endsWith(']'))) {
            try {
                const parsed = JSON.parse(rawText);
                if (parsed && typeof parsed === 'object') {
                    return parsed;
                }
            } catch (error) {}
        }
        return { text: rawText };
    }

    function parseGroupPollPayload(rawPayload = {}) {
        const payload = parseStructuredGroupPayload(rawPayload);
        const title = String(payload.title || payload.topic || payload.subject || payload.name || '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 64);

        let optionSource = [];
        if (Array.isArray(payload.options)) optionSource = payload.options;
        else if (Array.isArray(payload.choices)) optionSource = payload.choices;
        else if (Array.isArray(payload.items)) optionSource = payload.items;
        else if (typeof payload.options === 'string') optionSource = payload.options.split(/\n|[,，|｜]/g);
        else if (typeof payload.text === 'string') optionSource = payload.text.split(/\n|[,，|｜]/g);

        const options = [];
        const seen = new Set();
        optionSource.forEach((item) => {
            const value = String(item && typeof item === 'object' ? (item.text || item.label || item.name || '') : item || '')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 40);
            if (!value) return;
            const key = value.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            options.push(value);
        });

        let normalizedOptions = options.slice();
        let finalTitle = title;
        if (!finalTitle && normalizedOptions.length >= 3) {
            finalTitle = normalizedOptions.shift();
        }
        finalTitle = finalTitle || (normalizedOptions.length > 0 ? `关于“${normalizedOptions[0]}”的投票` : '');
        if (!finalTitle) return { ok: false, reason: 'empty_title' };
        if (normalizedOptions.length < 2) return { ok: false, reason: 'insufficient_options' };
        if (normalizedOptions.length > 8) {
            normalizedOptions = normalizedOptions.slice(0, 8);
        }
        return { ok: true, title: finalTitle, options: normalizedOptions };
    }

    function normalizeGroupPollData(payload = {}) {
        const title = String(payload.title || '').replace(/\s+/g, ' ').trim().slice(0, 64);
        const optionObjects = Array.isArray(payload.options) ? payload.options : [];
        const options = optionObjects.map((option, index) => {
            const optionId = String(option && (option.id || option.optionId) || `opt_${index + 1}`).trim() || `opt_${index + 1}`;
            const text = String(option && (option.text || option.label || option.content || option.name) || '').replace(/\s+/g, ' ').trim().slice(0, 40);
            const voterIds = Array.isArray(option && option.voterIds)
                ? option.voterIds.map(id => normalizeParticipantId(id)).filter(Boolean)
                : [];
            const dedupedVoterIds = [];
            const voterSeen = new Set();
            voterIds.forEach((id) => {
                const key = getParticipantIdKey(id);
                if (!key || voterSeen.has(key)) return;
                voterSeen.add(key);
                dedupedVoterIds.push(id);
            });
            const voteCountRaw = Number(option && option.voteCount);
            const voteCount = Number.isFinite(voteCountRaw) && voteCountRaw >= 0 ? Math.floor(voteCountRaw) : dedupedVoterIds.length;
            return {
                id: optionId,
                text,
                voterIds: dedupedVoterIds,
                voteCount
            };
        }).filter(option => option.text);

        return {
            id: String(payload.id || '').trim(),
            title,
            options,
            creatorId: normalizeParticipantId(payload.creatorId || ''),
            createdAt: Number(payload.createdAt || 0) || 0,
            updatedAt: Number(payload.updatedAt || 0) || 0,
            status: String(payload.status || 'open') === 'closed' ? 'closed' : 'open'
        };
    }

    function findGroupPollEntry(groupContact, pollIdOrMsgId = null) {
        const group = getGroupContact(groupContact);
        if (!group) return null;
        const targetToken = String(pollIdOrMsgId || '').trim();
        const history = Array.isArray(window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[group.id])
            ? window.iphoneSimState.chatHistory[group.id]
            : [];
        for (let i = history.length - 1; i >= 0; i--) {
            const message = history[i];
            if (!message || message.type !== 'group_poll') continue;
            let payload = null;
            try {
                payload = typeof message.content === 'string' ? JSON.parse(message.content) : message.content;
            } catch (error) {
                payload = null;
            }
            if (!payload || typeof payload !== 'object') continue;
            const normalized = normalizeGroupPollData(payload);
            const pollId = String(normalized.id || '').trim();
            const msgId = String(message.id || '');
            if (!targetToken || targetToken === pollId || targetToken === msgId) {
                return { group, message, payload: normalized, index: i };
            }
        }
        return null;
    }

    function resolvePollOptionIndex(pollData, payload) {
        if (!pollData || !Array.isArray(pollData.options) || pollData.options.length === 0) return -1;
        const structured = parseStructuredGroupPayload(payload);
        const parseIndexFromToken = (token) => {
            const text = String(token || '').replace(/\s+/g, ' ').trim();
            if (!text) return -1;

            const pureNumber = Number.parseInt(text, 10);
            if (Number.isFinite(pureNumber) && String(pureNumber) === text && pureNumber >= 1 && pureNumber <= pollData.options.length) {
                return pureNumber - 1;
            }

            const optMatch = text.match(/^opt[_\-]?(\d+)$/i);
            if (optMatch) {
                const idx = Number.parseInt(optMatch[1], 10) - 1;
                if (idx >= 0 && idx < pollData.options.length) return idx;
            }

            const leadingNumberMatch = text.match(/^(\d+)\s*[\.、:：\-]/);
            if (leadingNumberMatch) {
                const idx = Number.parseInt(leadingNumberMatch[1], 10) - 1;
                if (idx >= 0 && idx < pollData.options.length) return idx;
            }

            return -1;
        };
        const normalizeOptionText = (value) => String(value || '')
            .replace(/\s+/g, ' ')
            .replace(/^\d+\s*[\.、:：\-]\s*/g, '')
            .replace(/（\d+票\)/g, '')
            .replace(/\(\d+\s*票\)/g, '')
            .trim()
            .toLowerCase();
        const optionId = String(structured.option_id || structured.optionId || structured.target_option_id || structured.targetOptionId || '').trim();
        if (optionId) {
            const idx = pollData.options.findIndex(option => String(option.id || '') === optionId);
            if (idx >= 0) return idx;
            const idxFromOptionId = parseIndexFromToken(optionId);
            if (idxFromOptionId >= 0) return idxFromOptionId;
        }
        const optionIndexRaw = Number(structured.option_index || structured.optionIndex || structured.index || structured.option_no || structured.optionNo || 0);
        if (Number.isFinite(optionIndexRaw) && optionIndexRaw > 0) {
            const idx = Math.floor(optionIndexRaw) - 1;
            if (idx >= 0 && idx < pollData.options.length) return idx;
        }
        let optionText = String(structured.option_text || structured.optionText || structured.option || structured.choice || structured.text || '')
            .replace(/\s+/g, ' ')
            .trim();
        if (optionText && /[|｜]/.test(optionText)) {
            const parts = optionText.split(/[|｜]/).map(part => String(part || '').trim()).filter(Boolean);
            if (parts.length > 0) {
                optionText = parts[parts.length - 1];
            }
        }
        if (optionText) {
            const idxFromTextToken = parseIndexFromToken(optionText);
            if (idxFromTextToken >= 0) return idxFromTextToken;

            const normalizedTargetText = normalizeOptionText(optionText);
            if (normalizedTargetText) {
                const exactIdx = pollData.options.findIndex(option => normalizeOptionText(option && option.text) === normalizedTargetText);
                if (exactIdx >= 0) return exactIdx;

                const includeIdx = pollData.options.findIndex(option => {
                    const normalizedOption = normalizeOptionText(option && option.text);
                    return !!normalizedOption && (
                        normalizedOption.includes(normalizedTargetText)
                        || normalizedTargetText.includes(normalizedOption)
                    );
                });
                if (includeIdx >= 0) return includeIdx;
            }
        }
        return -1;
    }

    function createGroupPoll(groupContact, actorId = 'me', rawPayload = {}, options = {}) {
        const group = getGroupContact(groupContact);
        const safeActorId = normalizeParticipantId(actorId || 'me');
        if (!group || !safeActorId) return { ok: false, reason: 'invalid_group_or_actor' };

        const actorInGroup = safeActorId === 'me' || getGroupMemberIds(group).some(id => String(id) === String(safeActorId));
        if (!actorInGroup) return { ok: false, reason: 'actor_not_in_group' };

        const parsed = parseGroupPollPayload(rawPayload);
        if (!parsed.ok) return parsed;

        const pollData = {
            id: `poll_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            title: parsed.title,
            options: parsed.options.map((text, index) => ({
                id: `opt_${index + 1}`,
                text,
                voterIds: [],
                voteCount: 0
            })),
            creatorId: safeActorId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: 'open'
        };
        const isActorUser = String(safeActorId) === 'me';
        const message = typeof window.sendMessage === 'function'
            ? window.sendMessage(
                JSON.stringify(pollData),
                isActorUser,
                'group_poll',
                null,
                group.id,
                {
                    bypassWechatBlock: true,
                    ignoreReplyingState: true,
                    showNotification: true,
                    speakerContactId: safeActorId
                }
            )
            : null;
        if (!message) return { ok: false, reason: 'send_failed' };

        if (typeof saveConfig === 'function') saveConfig();
        if (options.showNotice) {
            const actorName = safeActorId === 'me' ? '你' : getParticipantName(group, safeActorId, '群成员');
            pushVisibleGroupSystemNotice(group.id, `${actorName} 发起了投票：${pollData.title}`);
        }
        return { ok: true, message, pollData };
    }

    function voteGroupPoll(groupContact, actorId = 'me', rawPayload = {}, options = {}) {
        const payload = parseStructuredGroupPayload(rawPayload);
        let pollToken = String(payload.poll_id || payload.pollId || payload.message_id || payload.messageId || payload.msg_id || payload.msgId || '').trim();
        if (!pollToken) {
            const rawText = String(payload.text || '').trim();
            if (rawText && /[|｜]/.test(rawText)) {
                const parts = rawText.split(/[|｜]/).map(part => String(part || '').trim()).filter(Boolean);
                if (parts.length >= 2) {
                    const maybeToken = String(parts[0] || '').trim();
                    if (/^(poll_[A-Za-z0-9_-]+)$/i.test(maybeToken) || /^msg_[A-Za-z0-9_-]+$/i.test(maybeToken)) {
                        pollToken = maybeToken;
                    }
                }
            }
        }
        const entry = findGroupPollEntry(groupContact, pollToken);
        if (!entry) return { ok: false, reason: 'not_found' };
        const { group, message } = entry;
        const pollData = normalizeGroupPollData(entry.payload);
        const safeActorId = normalizeParticipantId(actorId || 'me');
        if (!safeActorId) return { ok: false, reason: 'invalid_actor' };
        const actorInGroup = safeActorId === 'me' || getGroupMemberIds(group).some(id => String(id) === String(safeActorId));
        if (!actorInGroup) return { ok: false, reason: 'actor_not_in_group' };
        if (pollData.status !== 'open') return { ok: false, reason: 'poll_closed' };
        if (!Array.isArray(pollData.options) || pollData.options.length < 2) return { ok: false, reason: 'invalid_poll_options' };

        const optionIndex = resolvePollOptionIndex(pollData, payload);
        if (optionIndex < 0 || optionIndex >= pollData.options.length) return { ok: false, reason: 'invalid_option' };
        const targetOption = pollData.options[optionIndex];

        let previousOptionIndex = -1;
        pollData.options.forEach((option, index) => {
            if (Array.isArray(option.voterIds) && option.voterIds.some(id => String(id) === String(safeActorId))) {
                previousOptionIndex = index;
            }
            option.voterIds = (Array.isArray(option.voterIds) ? option.voterIds : [])
                .map(id => normalizeParticipantId(id))
                .filter(Boolean)
                .filter(id => String(id) !== String(safeActorId));
        });
        targetOption.voterIds.push(safeActorId);
        pollData.options.forEach((option) => {
            option.voteCount = Array.isArray(option.voterIds) ? option.voterIds.length : 0;
        });
        pollData.updatedAt = Date.now();
        message.content = JSON.stringify(pollData);

        if (typeof saveConfig === 'function') saveConfig();
        if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(group.id, true);
        }
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }
        if (options.showNotice !== false) {
            const actorName = safeActorId === 'me' ? '你' : getParticipantName(group, safeActorId, '群成员');
            const optionText = targetOption && targetOption.text ? targetOption.text : '某个选项';
            if (previousOptionIndex >= 0 && previousOptionIndex !== optionIndex) {
                pushVisibleGroupSystemNotice(group.id, `${actorName} 将投票改为「${optionText}」`);
            } else {
                pushVisibleGroupSystemNotice(group.id, `${actorName} 投了「${optionText}」`);
            }
        }
        return {
            ok: true,
            pollData,
            optionIndex
        };
    }

    async function handleGroupPollClick(pollIdOrMsgId = null) {
        const group = getGroupContact(window.iphoneSimState.currentChatContactId);
        if (!group) return;
        const entry = findGroupPollEntry(group, pollIdOrMsgId);
        if (!entry) {
            showGroupToast('未找到投票');
            return;
        }
        const pollData = normalizeGroupPollData(entry.payload);
        if (!pollData || !Array.isArray(pollData.options) || pollData.options.length === 0) {
            showGroupToast('投票数据无效');
            return;
        }
        const currentChoice = pollData.options.findIndex(option => Array.isArray(option.voterIds) && option.voterIds.some(id => String(id) === 'me'));
        const optionLines = pollData.options.map((option, index) => {
            const count = Array.isArray(option.voterIds) ? option.voterIds.length : Number(option.voteCount || 0);
            const selectedText = currentChoice === index ? '（你已选）' : '';
            return `${index + 1}. ${option.text}（${count}票）${selectedText}`;
        }).join('\n');
        const defaultValue = currentChoice >= 0 ? String(currentChoice + 1) : '1';
        let selectedIndex = NaN;
        if (typeof openGroupActionEditorModal === 'function') {
            const options = pollData.options.map((option, index) => {
                const count = Array.isArray(option.voterIds) ? option.voterIds.length : Number(option.voteCount || 0);
                return {
                    value: String(index + 1),
                    label: `${index + 1}. ${option.text}${count > 0 ? `（${count}票）` : ''}${currentChoice === index ? '（你已选）' : ''}`
                };
            });
            const result = await openGroupActionEditorModal({
                kicker: 'GROUP POLL',
                title: pollData.title || '参与投票',
                subtitle: `请选择一个选项。\n${optionLines}`,
                confirmText: '提交投票',
                cancelText: '取消',
                fields: [
                    {
                        id: 'option_index',
                        type: 'select',
                        label: '投票选项',
                        options,
                        value: defaultValue
                    }
                ],
                validate: (values) => {
                    const idx = Number.parseInt(String(values.option_index || '').trim(), 10);
                    if (!Number.isFinite(idx) || idx < 1 || idx > pollData.options.length) {
                        return { ok: false, message: '请选择有效选项' };
                    }
                    return { ok: true };
                }
            });
            if (!result || !result.confirmed) return;
            selectedIndex = Number.parseInt(String(result.values.option_index || '').trim(), 10);
        } else {
            showGroupToast('投票弹窗未就绪，请刷新后重试');
            return;
        }
        if (!Number.isFinite(selectedIndex) || selectedIndex < 1 || selectedIndex > pollData.options.length) {
            showGroupToast('请输入有效的选项序号');
            return;
        }
        const voted = voteGroupPoll(group, 'me', {
            poll_id: pollData.id || entry.message.id,
            option_index: selectedIndex
        }, {
            showNotice: true
        });
        if (!voted || !voted.ok) {
            showGroupToast('投票失败');
        }
    }

    function parseGroupRelayPayload(rawPayload = {}) {
        const payload = parseStructuredGroupPayload(rawPayload);
        const title = String(payload.title || payload.topic || payload.subject || payload.name || payload.text || '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 64);
        const entryText = String(payload.entry || payload.content || payload.text || payload.first_entry || payload.firstEntry || '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 90);
        const oncePerMember = !!(payload.once_per_member || payload.oncePerMember || payload.single_entry || payload.singleEntry);
        if (!title) return { ok: false, reason: 'empty_title' };
        return {
            ok: true,
            title,
            entryText,
            oncePerMember
        };
    }

    function normalizeGroupRelayData(payload = {}) {
        const entries = Array.isArray(payload.entries)
            ? payload.entries
                .map((entry, index) => ({
                    id: String(entry && entry.id || `entry_${index + 1}`),
                    memberId: normalizeParticipantId(entry && (entry.memberId || entry.member_id) || ''),
                    content: String(entry && (entry.content || entry.text || entry.entry) || '').replace(/\s+/g, ' ').trim().slice(0, 90),
                    time: Number(entry && entry.time || 0) || 0
                }))
                .filter(entry => entry.memberId && entry.content)
            : [];
        return {
            id: String(payload.id || '').trim(),
            title: String(payload.title || '').replace(/\s+/g, ' ').trim().slice(0, 64),
            creatorId: normalizeParticipantId(payload.creatorId || ''),
            createdAt: Number(payload.createdAt || 0) || 0,
            updatedAt: Number(payload.updatedAt || 0) || 0,
            oncePerMember: !!(payload.oncePerMember || payload.once_per_member),
            status: String(payload.status || 'open') === 'closed' ? 'closed' : 'open',
            entries
        };
    }

    function findGroupRelayEntry(groupContact, relayIdOrMsgId = null) {
        const group = getGroupContact(groupContact);
        if (!group) return null;
        const targetToken = String(relayIdOrMsgId || '').trim();
        const history = Array.isArray(window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[group.id])
            ? window.iphoneSimState.chatHistory[group.id]
            : [];
        for (let i = history.length - 1; i >= 0; i--) {
            const message = history[i];
            if (!message || message.type !== 'group_relay') continue;
            let payload = null;
            try {
                payload = typeof message.content === 'string' ? JSON.parse(message.content) : message.content;
            } catch (error) {
                payload = null;
            }
            if (!payload || typeof payload !== 'object') continue;
            const normalized = normalizeGroupRelayData(payload);
            const relayId = String(normalized.id || '').trim();
            const msgId = String(message.id || '');
            if (!targetToken || targetToken === relayId || targetToken === msgId) {
                return { group, message, payload: normalized, index: i };
            }
        }
        return null;
    }

    function createGroupRelay(groupContact, actorId = 'me', rawPayload = {}, options = {}) {
        const group = getGroupContact(groupContact);
        const safeActorId = normalizeParticipantId(actorId || 'me');
        if (!group || !safeActorId) return { ok: false, reason: 'invalid_group_or_actor' };

        const actorInGroup = safeActorId === 'me' || getGroupMemberIds(group).some(id => String(id) === String(safeActorId));
        if (!actorInGroup) return { ok: false, reason: 'actor_not_in_group' };

        const parsed = parseGroupRelayPayload(rawPayload);
        if (!parsed.ok) return parsed;

        const relayData = {
            id: `relay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            title: parsed.title,
            creatorId: safeActorId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            oncePerMember: parsed.oncePerMember,
            status: 'open',
            entries: []
        };
        if (parsed.entryText) {
            relayData.entries.push({
                id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                memberId: safeActorId,
                content: parsed.entryText,
                time: Date.now()
            });
        }

        const isActorUser = String(safeActorId) === 'me';
        const message = typeof window.sendMessage === 'function'
            ? window.sendMessage(
                JSON.stringify(relayData),
                isActorUser,
                'group_relay',
                null,
                group.id,
                {
                    bypassWechatBlock: true,
                    ignoreReplyingState: true,
                    showNotification: true,
                    speakerContactId: safeActorId
                }
            )
            : null;
        if (!message) return { ok: false, reason: 'send_failed' };

        if (typeof saveConfig === 'function') saveConfig();
        if (options.showNotice) {
            const actorName = safeActorId === 'me' ? '你' : getParticipantName(group, safeActorId, '群成员');
            pushVisibleGroupSystemNotice(group.id, `${actorName} 发起了接龙：${relayData.title}`);
        }
        return { ok: true, message, relayData };
    }

    function joinGroupRelay(groupContact, actorId = 'me', rawPayload = {}, options = {}) {
        const payload = parseStructuredGroupPayload(rawPayload);
        const relayToken = String(payload.relay_id || payload.relayId || payload.message_id || payload.messageId || payload.msg_id || payload.msgId || '').trim();
        const entry = findGroupRelayEntry(groupContact, relayToken);
        if (!entry) return { ok: false, reason: 'not_found' };
        const { group, message } = entry;
        const relayData = normalizeGroupRelayData(entry.payload);
        const safeActorId = normalizeParticipantId(actorId || 'me');
        if (!safeActorId) return { ok: false, reason: 'invalid_actor' };

        const actorInGroup = safeActorId === 'me' || getGroupMemberIds(group).some(id => String(id) === String(safeActorId));
        if (!actorInGroup) return { ok: false, reason: 'actor_not_in_group' };
        if (relayData.status !== 'open') return { ok: false, reason: 'relay_closed' };

        const content = String(payload.entry || payload.content || payload.text || '').replace(/\s+/g, ' ').trim().slice(0, 90);
        if (!content) return { ok: false, reason: 'empty_entry' };
        if (relayData.oncePerMember && relayData.entries.some(item => String(item.memberId) === String(safeActorId))) {
            return { ok: false, reason: 'already_joined' };
        }

        relayData.entries.push({
            id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            memberId: safeActorId,
            content,
            time: Date.now()
        });
        relayData.updatedAt = Date.now();
        message.content = JSON.stringify(relayData);

        if (typeof saveConfig === 'function') saveConfig();
        if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(group.id, true);
        }
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }
        if (options.showNotice !== false) {
            const actorName = safeActorId === 'me' ? '你' : getParticipantName(group, safeActorId, '群成员');
            pushVisibleGroupSystemNotice(group.id, `${actorName} 参与了接龙「${relayData.title}」`);
        }
        return { ok: true, relayData };
    }

    async function handleGroupRelayClick(relayIdOrMsgId = null) {
        const group = getGroupContact(window.iphoneSimState.currentChatContactId);
        if (!group) return;
        const entry = findGroupRelayEntry(group, relayIdOrMsgId);
        if (!entry) {
            showGroupToast('未找到接龙');
            return;
        }
        const relayData = normalizeGroupRelayData(entry.payload);
        const entryLines = relayData.entries
            .slice(-12)
            .map((item, index) => {
                const memberName = getParticipantName(group, item.memberId, '群成员');
                return `${index + 1}. ${memberName}：${item.content}`;
            })
            .join('\n');
        let input = '';
        if (typeof openGroupActionEditorModal === 'function') {
            const result = await openGroupActionEditorModal({
                kicker: 'GROUP RELAY',
                title: relayData.title || '参与接龙',
                subtitle: entryLines ? `最近接龙：\n${entryLines}` : '还没有接龙内容，来写第一条吧',
                confirmText: '加入接龙',
                cancelText: '取消',
                fields: [
                    {
                        id: 'relay_entry',
                        type: 'textarea',
                        label: '接龙内容',
                        placeholder: '输入你的接龙内容',
                        rows: 4,
                        maxLength: 90
                    }
                ],
                validate: (values) => {
                    const content = String(values.relay_entry || '').replace(/\s+/g, ' ').trim();
                    if (!content) {
                        return { ok: false, message: '请输入接龙内容' };
                    }
                    return { ok: true };
                }
            });
            if (!result || !result.confirmed) return;
            input = String(result.values.relay_entry || '');
        } else {
            showGroupToast('接龙弹窗未就绪，请刷新后重试');
            return;
        }
        const joined = joinGroupRelay(group, 'me', {
            relay_id: relayData.id || entry.message.id,
            entry: input
        }, {
            showNotice: true
        });
        if (!joined || !joined.ok) {
            if (joined && joined.reason === 'already_joined') {
                showGroupToast('该接龙每人仅可参与一次');
            } else if (joined && joined.reason === 'empty_entry') {
                showGroupToast('请输入接龙内容');
            } else {
                showGroupToast('接龙失败');
            }
        }
    }

    function getParticipantAvatar(groupContact, participantId, fallback = '') {
        const group = getGroupContact(groupContact);
        const safeId = normalizeParticipantId(participantId);
        if (safeId === 'me') return getUserAvatar(group) || fallback || '';
        const contact = getContactById(safeId);
        return (contact && contact.avatar) || fallback || '';
    }

    function buildDefaultGroupName(memberContacts) {
        const names = (Array.isArray(memberContacts) ? memberContacts : [])
            .map(contact => String(contact && (contact.remark || contact.nickname || contact.name) || '').trim())
            .filter(Boolean);
        if (names.length <= 3) return names.join('、') || '新群聊';
        return `${names.slice(0, 3).join('、')}等${names.length}人`;
    }

    function buildGroupAvatarSvg(memberContacts) {
        const contacts = (Array.isArray(memberContacts) ? memberContacts : []).slice(0, 4);
        const urls = contacts.map(contact => String(contact && contact.avatar || '').trim()).filter(Boolean);
        if (urls.length === 0) return '';

        const size = 120;
        const slotsByCount = {
            1: [{ x: 0, y: 0, width: 120, height: 120 }],
            2: [
                { x: 0, y: 0, width: 60, height: 120 },
                { x: 60, y: 0, width: 60, height: 120 }
            ],
            3: [
                { x: 0, y: 0, width: 60, height: 60 },
                { x: 60, y: 0, width: 60, height: 60 },
                { x: 30, y: 60, width: 60, height: 60 }
            ],
            4: [
                { x: 0, y: 0, width: 60, height: 60 },
                { x: 60, y: 0, width: 60, height: 60 },
                { x: 0, y: 60, width: 60, height: 60 },
                { x: 60, y: 60, width: 60, height: 60 }
            ]
        };

        const slots = slotsByCount[urls.length] || slotsByCount[4];
        const images = urls.map((url, index) => {
            const slot = slots[index];
            return `<image href="${escapeHtml(url)}" x="${slot.x}" y="${slot.y}" width="${slot.width}" height="${slot.height}" preserveAspectRatio="xMidYMid slice" />`;
        }).join('');

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                <rect width="${size}" height="${size}" rx="28" fill="#f3f4f7" />
                <clipPath id="group-avatar-clip">
                    <rect width="${size}" height="${size}" rx="28" />
                </clipPath>
                <g clip-path="url(#group-avatar-clip)">
                    ${images}
                </g>
                <path d="M60 0V120M0 60H120" stroke="rgba(255,255,255,0.9)" stroke-width="4" />
            </svg>
        `;

        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s{2,}/g, ' ').trim())}`;
    }

    function ensureGroupTabRegistered() {
        if (!Array.isArray(window.iphoneSimState.contactGroups)) {
            window.iphoneSimState.contactGroups = [];
        }
        if (!window.iphoneSimState.contactGroups.includes(GROUP_CHAT_CONTACT_GROUP)) {
            window.iphoneSimState.contactGroups.push(GROUP_CHAT_CONTACT_GROUP);
        }
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(reader.error || new Error('文件读取失败'));
            reader.readAsDataURL(file);
        });
    }

    function generateGroupChatId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    function getEligibleDirectContacts(excludeIds = []) {
        const blacklist = new Set(normalizeDirectMemberIds(excludeIds).map(id => String(id)));
        return (Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts) ? window.iphoneSimState.contacts : [])
            .filter((contact) => {
                if (!contact || contact.chatType === 'group') return false;
                return !blacklist.has(getParticipantIdKey(contact.id));
            });
    }

    function renderSelectedMembersPreview() {
        const container = document.getElementById('group-chat-selected-members');
        if (!container) return;

        const contacts = createState.selectedMemberIds
            .map(id => getContactById(id))
            .filter(Boolean);

        if (contacts.length === 0) {
            container.innerHTML = '<div class="list-item center-content" style="color:#8e8e93;">至少选择 2 位联系人</div>';
            return;
        }

        container.innerHTML = contacts.map(contact => `
            <div class="list-item" style="display:flex;align-items:center;gap:12px;">
                <img src="${escapeHtml(contact.avatar || '')}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;">
                <div style="flex:1;min-width:0;">
                    <div style="font-size:15px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(contact.remark || contact.nickname || contact.name || '联系人')}</div>
                    <div style="font-size:12px;color:#8e8e93;">${escapeHtml(contact.name || '')}</div>
                </div>
            </div>
        `).join('');
    }

    function closeGroupCreateModal() {
        const modal = document.getElementById('group-chat-create-modal');
        if (modal) modal.classList.add('hidden');
    }

    function openGroupCreateModal() {
        if (typeof window.closeAddContactModeChooser === 'function') {
            window.closeAddContactModeChooser();
        }

        createState.selectedMemberIds = [];
        createState.avatarDataUrl = '';

        const nameInput = document.getElementById('group-chat-name');
        const avatarPreview = document.getElementById('group-chat-avatar-preview');
        const avatarInput = document.getElementById('group-chat-avatar-upload');
        const modal = document.getElementById('group-chat-create-modal');
        if (nameInput) nameInput.value = '';
        if (avatarPreview) {
            avatarPreview.style.backgroundImage = '';
            avatarPreview.innerHTML = '<i class="fas fa-users"></i>';
        }
        if (avatarInput) avatarInput.value = '';
        renderSelectedMembersPreview();
        if (modal) modal.classList.remove('hidden');
    }

    function bindModalMaskClose(modalId, closeFn) {
        const modal = document.getElementById(modalId);
        if (!modal || modal.dataset.maskBound === '1') return;
        modal.dataset.maskBound = '1';
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeFn();
        });
    }

    function openContactMultiPicker(options = {}) {
        const modal = document.getElementById('contact-picker-modal');
        const list = document.getElementById('contact-picker-list');
        const sendBtn = document.getElementById('contact-picker-send-btn');
        const closeBtn = document.getElementById('close-contact-picker');
        if (!modal || !list || !sendBtn || !closeBtn) return;

        const title = String(options.title || '选择联系人').trim() || '选择联系人';
        const confirmText = String(options.confirmText || '确认').trim() || '确认';
        const initialSelectedIds = new Set((Array.isArray(options.initialSelectedIds) ? options.initialSelectedIds : []).map(id => String(id)));
        const contacts = Array.isArray(options.contacts) ? options.contacts : getEligibleDirectContacts(options.excludeIds || []);
        const header = modal.querySelector('.modal-header h3');
        if (header) header.textContent = title;

        if (contacts.length === 0) {
            list.innerHTML = '<div class="list-item center-content" style="color:#8e8e93;">暂无可选联系人</div>';
        } else {
            list.innerHTML = contacts.map(contact => `
                <div class="list-item" data-contact-id="${escapeHtml(contact.id)}" style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
                    <div class="list-content" style="display:flex;align-items:center;min-width:0;">
                        <img src="${escapeHtml(contact.avatar || '')}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:12px;flex-shrink:0;">
                        <div style="min-width:0;">
                            <div style="font-size:15px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(contact.remark || contact.nickname || contact.name || '联系人')}</div>
                            <div style="font-size:12px;color:#8e8e93;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(contact.name || '')}</div>
                        </div>
                    </div>
                    <input type="checkbox" name="group-chat-contact-picker" value="${escapeHtml(contact.id)}" style="width:20px;height:20px;" ${initialSelectedIds.has(String(contact.id)) ? 'checked' : ''}>
                </div>
            `).join('');
        }

        list.querySelectorAll('.list-item').forEach(item => {
            const input = item.querySelector('input[name="group-chat-contact-picker"]');
            if (!input) return;
            item.addEventListener('click', (event) => {
                if (event.target !== input) {
                    input.checked = !input.checked;
                }
            });
        });

        const nextSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(nextSendBtn, sendBtn);
        nextSendBtn.textContent = confirmText;
        nextSendBtn.onclick = () => {
            const checkedIds = Array.from(list.querySelectorAll('input[name="group-chat-contact-picker"]:checked'))
                .map(input => normalizeParticipantId(input.value))
                .filter(Boolean);
            if (typeof options.onConfirm === 'function') {
                options.onConfirm(checkedIds);
            }
        };

        const nextCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(nextCloseBtn, closeBtn);
        nextCloseBtn.onclick = () => modal.classList.add('hidden');
        bindModalMaskClose('contact-picker-modal', () => modal.classList.add('hidden'));
        modal.classList.remove('hidden');
    }

    function openGroupCreateMemberPicker() {
        openContactMultiPicker({
            title: '选择群成员',
            confirmText: '确认成员',
            initialSelectedIds: createState.selectedMemberIds,
            onConfirm: (memberIds) => {
                createState.selectedMemberIds = memberIds;
                const modal = document.getElementById('contact-picker-modal');
                if (modal) modal.classList.add('hidden');
                renderSelectedMembersPreview();
                const nameInput = document.getElementById('group-chat-name');
                if (nameInput && !nameInput.value.trim()) {
                    const contacts = memberIds.map(id => getContactById(id)).filter(Boolean);
                    nameInput.value = buildDefaultGroupName(contacts);
                }
            }
        });
    }
    async function handleCreateGroupChat() {
        const memberIds = [...createState.selectedMemberIds];
        if (memberIds.length < 2) {
            showGroupToast('至少选择 2 位联系人');
            return;
        }

        const memberContacts = memberIds.map(id => getContactById(id)).filter(Boolean);
        const nameInput = document.getElementById('group-chat-name');
        const rawName = nameInput ? nameInput.value.trim() : '';
        const groupName = rawName || buildDefaultGroupName(memberContacts);
        const avatar = createState.avatarDataUrl || buildGroupAvatarSvg(memberContacts);
        const groupId = generateGroupChatId();
        const contact = {
            id: groupId,
            name: groupName,
            remark: groupName,
            nickname: groupName,
            avatar: avatar || '',
            persona: '',
            style: '正常',
            activeReplyEnabled: false,
            activeReplyInterval: 60,
            restWindowEnabled: false,
            restWindowStart: '',
            restWindowEnd: '',
            restWindowAwakenedAt: null,
            restWindowUpcomingNoticeForStartMs: null,
            restWindowWakeReplyForStartMs: null,
            autoItineraryEnabled: false,
            userPerception: [],
            thoughtDisplayMode: 'title',
            thoughtPetImage: '',
            thoughtPetSize: 88,
            thoughtPetPosition: { xRatio: 0.86, yRatio: 0.72 },
            group: GROUP_CHAT_CONTACT_GROUP,
            source: 'group_chat',
            chatType: 'group',
            groupMeta: {
                name: groupName,
                avatar: avatar || '',
                memberIds,
                ownerId: 'me',
                adminIds: ['me'],
                memberNicknames: {},
                memberTitles: {},
                relationshipMemberIds: [],
                relationshipNodePositions: {},
                relationshipLinks: [],
                relationshipNotes: '',
                announcementText: '',
                announcementUpdatedAt: 0,
                announcementUpdatedBy: '',
                pinnedMessageId: '',
                pinnedUpdatedAt: 0,
                pinnedUpdatedBy: '',
                memoryMode: 'group_only',
                status: 'active'
            }
        };

        if (typeof window.ensureContactChatTypeFields === 'function') {
            window.ensureContactChatTypeFields(contact);
        }

        if (!Array.isArray(window.iphoneSimState.contacts)) {
            window.iphoneSimState.contacts = [];
        }
        window.iphoneSimState.contacts.push(contact);
        if (!window.iphoneSimState.chatHistory) {
            window.iphoneSimState.chatHistory = {};
        }
        if (!Array.isArray(window.iphoneSimState.chatHistory[groupId])) {
            window.iphoneSimState.chatHistory[groupId] = [];
        }
        ensureGroupTabRegistered();
        if (typeof saveConfig === 'function') {
            saveConfig();
        }
        if (typeof window.sendMessage === 'function') {
            window.sendMessage(`[系统消息]: 你创建了群聊“${groupName}”，成员：${memberContacts.map(item => item.remark || item.nickname || item.name).join('、')}`, false, 'text', null, groupId, {
                ignoreReplyingState: true,
                bypassWechatBlock: true,
                showNotification: false
            });
        }
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }
        closeGroupCreateModal();
        if (typeof window.openChat === 'function') {
            window.openChat(groupId);
        }
    }

    function resolveGroupSpeakerContactId(rawSpeaker, groupContact) {
        const group = getGroupContact(groupContact);
        if (!group) return '';
        const safeSpeaker = normalizeParticipantId(rawSpeaker);
        if (safeSpeaker === 'me') return 'me';
        const safeSpeakerKey = getParticipantIdKey(safeSpeaker);
        const matchedMemberId = getGroupMemberIds(group).find(id => getParticipantIdKey(id) === safeSpeakerKey);
        if (matchedMemberId !== undefined) {
            return matchedMemberId;
        }

        const speakerText = String(rawSpeaker || '').trim();
        if (!speakerText) return '';
        const lower = speakerText.toLowerCase();
        const matchedContact = getGroupMemberContacts(group).find(contact => {
            const candidates = [
                ...getParticipantPromptAliasCandidates(group, contact.id, '成员'),
                getGroupMemberNickname(group, contact.id),
                contact.remark,
                contact.nickname,
                contact.name
            ].map(item => String(item || '').trim()).filter(Boolean);
            return candidates.some(name => name.toLowerCase() === lower);
        });
        return matchedContact ? matchedContact.id : '';
    }

    function decorateGroupChatMessageMeta(msg, groupContact, isUser, meta = {}) {
        const group = getGroupContact(groupContact);
        if (!group) return {};
        if (isUser) {
            return {
                speakerContactId: 'me',
                speakerNameSnapshot: getUserDisplayName(group),
                speakerAvatarSnapshot: getUserAvatar(group)
            };
        }

        const rawSpeaker = meta.speakerContactId || meta.speaker_contact_id || msg.speakerContactId || '';
        const speakerContactId = resolveGroupSpeakerContactId(rawSpeaker, group);
        return {
            speakerContactId: speakerContactId || '',
            speakerNameSnapshot: String(meta.speakerNameSnapshot || getParticipantName(group, speakerContactId, '群成员')).trim() || '群成员',
            speakerAvatarSnapshot: String(meta.speakerAvatarSnapshot || getParticipantAvatar(group, speakerContactId, '')).trim()
        };
    }

    function getGroupMessageSpeakerMeta(groupId, msgId) {
        const group = getGroupContact(groupId);
        if (!group || !msgId) return null;
        const history = Array.isArray(window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[group.id])
            ? window.iphoneSimState.chatHistory[group.id]
            : [];
        const message = history.find(item => item && String(item.id) === String(msgId));
        if (!message) return null;
        const rawSpeaker = message.speakerContactId || message.speakerNameSnapshot || '';
        const speakerContactId = resolveGroupSpeakerContactId(rawSpeaker, group) || normalizeParticipantId(message.speakerContactId || '');
        const currentName = getParticipantName(group, speakerContactId, message.role === 'user' ? getUserDisplayName(group) : '群成员');
        const name = String(currentName || message.speakerNameSnapshot || '').trim();
        const avatar = String(message.speakerAvatarSnapshot || getParticipantAvatar(group, speakerContactId, '')).trim();
        const title = String(getGroupMemberTitle(group, speakerContactId) || '').trim();
        return {
            speakerContactId: speakerContactId || '',
            name: name || (message.role === 'user' ? getUserDisplayName(group) : '群成员'),
            title: title || '',
            avatar: avatar || '',
            role: message.role || 'assistant',
            groupRole: getGroupRole(group, speakerContactId || (message.role === 'user' ? 'me' : ''))
        };
    }

    function buildMirrorMessageContent(groupContact, message) {
        const group = getGroupContact(groupContact);
        if (!group || !message) return '';

        const groupName = getGroupChatDisplayName(group);
        const speakerName = String(getParticipantName(group, message.speakerContactId, message.role === 'user' ? getUserDisplayName(group) : '群成员') || message.speakerNameSnapshot || '').trim() || '群成员';
        let body = '';
        if (message.type === 'image' || message.type === 'virtual_image') {
            body = '[图片]';
        } else if (message.type === 'sticker') {
            body = '[表情包]';
        } else if (message.type === 'voice') {
            body = '[语音]';
        } else if (message.type === 'red_packet') {
            body = '[红包]';
        } else if (message.type === 'private_chat_invite') {
            body = '[私聊邀请]';
        } else if (message.type === 'group_poll') {
            let pollTitle = '';
            try {
                const payload = typeof message.content === 'string' ? JSON.parse(message.content) : (message.content || {});
                pollTitle = String(payload.title || '').trim();
            } catch (error) {}
            body = pollTitle ? `[投票] ${pollTitle}` : '[投票]';
        } else if (message.type === 'group_relay') {
            let relayTitle = '';
            try {
                const payload = typeof message.content === 'string' ? JSON.parse(message.content) : (message.content || {});
                relayTitle = String(payload.title || '').trim();
            } catch (error) {}
            body = relayTitle ? `[接龙] ${relayTitle}` : '[接龙]';
        } else if (typeof message.content === 'string' && message.content.trim()) {
            body = message.content.trim();
        } else {
            body = '[消息]';
        }

        const replyPrefix = message.replyTo && typeof message.replyTo === 'object'
            ? `（回复 ${String(message.replyTo.name || '消息').trim() || '消息'}）`
            : '';

        return `[群聊:${groupName}] ${speakerName}${replyPrefix}: ${body}`;
    }

    function appendHiddenGroupMirrorEvent(contactId, groupId, content, time) {
        if (!contactId || !content) return;
        if (!window.iphoneSimState.chatHistory) {
            window.iphoneSimState.chatHistory = {};
        }
        if (!Array.isArray(window.iphoneSimState.chatHistory[contactId])) {
            window.iphoneSimState.chatHistory[contactId] = [];
        }

        window.iphoneSimState.chatHistory[contactId].push({
            id: `${Date.now()}${Math.random().toString(36).slice(2, 9)}`,
            time: Number(time) || Date.now(),
            role: 'system',
            content,
            type: 'system_event',
            includeInAiContext: true,
            hiddenFromUi: true,
            sourceGroupId: groupId,
            channel: 'wechat'
        });
    }

    function syncGroupRoundToDirectThreads(groupContact, roundMessages) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta) return;
        const memoryMode = String(group.groupMeta.memoryMode || 'group_only');
        if (memoryMode === 'group_only') return;
        const messages = (Array.isArray(roundMessages) ? roundMessages : [])
            .filter(message => message && message.type !== 'system_event' && !message.hiddenFromUi);
        if (messages.length === 0) return;

        getGroupMemberIds(group).forEach((memberId) => {
            messages.forEach((message) => {
                appendHiddenGroupMirrorEvent(memberId, group.id, buildMirrorMessageContent(group, message), message.time || Date.now());
            });
        });

        if (typeof saveConfig === 'function') {
            saveConfig();
        }
    }

    function getRecentVisibleDirectMessages(contactId, currentGroupId) {
        const history = Array.isArray(window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[contactId])
            ? window.iphoneSimState.chatHistory[contactId]
            : [];
        const visible = history.filter(message => {
            if (!message || message.hiddenFromUi || message._hiddenBySanitizer) return false;
            if (message.type === 'system_event') return false;
            if (message.sourceGroupId && String(message.sourceGroupId) === String(currentGroupId)) return false;
            if (typeof window.shouldHideChatSyncMsg === 'function' && window.shouldHideChatSyncMsg(message)) return false;
            return message.role === 'user' || message.role === 'assistant';
        });
        return visible.slice(-6);
    }

    function buildBidirectionalGroupContext(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta || group.groupMeta.memoryMode !== 'bidirectional') return '';

        const lines = ['【成员单聊补充背景】'];
        const memberContacts = getGroupMemberContacts(group);
        memberContacts.forEach((member) => {
            const snippets = getRecentVisibleDirectMessages(member.id, group.id)
                .map(message => {
                    let content = String(message.content || '').trim();
                if (message.type === 'image' || message.type === 'virtual_image') content = '[图片]';
                else if (message.type === 'sticker') content = '[表情包]';
                else if (message.type === 'voice') content = '[语音]';
                else if (message.type === 'red_packet') content = '[红包]';
                else if (message.type === 'private_chat_invite') content = '[私聊邀请]';
                else if (message.type === 'group_poll') content = '[投票]';
                else if (message.type === 'group_relay') content = '[接龙]';
                if (!content) content = '[消息]';
                return `- ${message.role === 'user' ? getParticipantName(group, 'me') : getParticipantName(group, member.id, 'TA')}: ${content}`;
            });
            if (snippets.length === 0) return;
            lines.push(`【${getParticipantName(group, member.id, '成员')} 的单聊近况】`);
            lines.push(...snippets);
        });
        return lines.length > 1 ? `${lines.join('\n')}\n` : '';
    }

    function buildGroupUserPersonaContext(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group) return '';

        const userProfile = window.iphoneSimState && window.iphoneSimState.userProfile
            ? window.iphoneSimState.userProfile
            : null;
        const userPersonas = Array.isArray(window.iphoneSimState && window.iphoneSimState.userPersonas)
            ? window.iphoneSimState.userPersonas
            : [];

        const personaId = group.userPersonaId || (window.iphoneSimState && window.iphoneSimState.currentUserPersonaId) || null;
        const persona = personaId !== null && personaId !== undefined
            ? (userPersonas.find(item => String(item && item.id) === String(personaId)) || null)
            : null;

        const displayName = String(getParticipantName(group, 'me', '我') || '').trim() || '我';
        const fallbackPersonaName = String((userProfile && userProfile.name) || displayName || '我').trim() || '我';
        const personaName = String((persona && persona.name) || fallbackPersonaName).trim() || fallbackPersonaName;
        const overridePrompt = String(group.userPersonaPromptOverride || '').trim();
        const personaPrompt = String(overridePrompt || (persona && persona.aiPrompt) || '').trim();

        if (!personaName && !personaPrompt) return '';

        const lines = ['【用户人设（群聊设置 / User）】'];
        lines.push(`- 用户在群内显示名：${displayName}`);
        lines.push(`- 用户人设档案：${personaName}`);
        if (personaPrompt) {
            lines.push(`- 用户人设内容：${personaPrompt}`);
            if (overridePrompt) {
                lines.push('- 以上用户人设内容为当前群聊中的覆盖设定，优先级高于默认人设。');
            }
        }
        lines.push('- 你在群聊互动时必须把用户当作以上人设来理解和回应。');
        return lines.join('\n');
    }

    function buildGroupContextPrefix(message, groupContact) {
        const group = getGroupContact(groupContact);
        if (!group || !message) return '';
        const speakerContactId = normalizeParticipantId(message.speakerContactId || (message.role === 'user' ? 'me' : ''));
        const speakerName = String(getParticipantPromptLabel(group, speakerContactId, message.role === 'user' ? getUserDisplayName(group) : '群成员') || message.speakerNameSnapshot || '').trim();
        const speakerTitle = getGroupMemberTitle(group, speakerContactId);
        return `[group_msg msg_id="${escapeHtml(message.id || '')}" timestamp="${escapeHtml(message.time || '')}" speaker_contact_id="${escapeHtml(speakerContactId || '')}" speaker_name="${escapeHtml(speakerName || '')}" speaker_title="${escapeHtml(speakerTitle || '')}" role="${escapeHtml(message.role || '')}" type="${escapeHtml(message.type || 'text')}"]`;
    }

    function buildGroupReplyPrefix(replyTo) {
        if (!replyTo || typeof replyTo !== 'object') return '';
        return `[reply_to msg_id="${escapeHtml(replyTo.targetMsgId || '')}" timestamp="${escapeHtml(replyTo.targetTimestamp || '')}" name="${escapeHtml(replyTo.name || '')}" content="${escapeHtml(replyTo.content || '')}"]`;
    }

    function isGroupHiddenAvatarContextMessage(message) {
        if (!message || message.type !== 'image') return false;
        if (message.hiddenFromUi !== true || message.includeInAiContext !== true) return false;
        if (String(message.contextKind || '') !== 'group_avatar_update') return false;
        const imageUrl = typeof message.content === 'string' ? message.content.trim() : '';
        if (!imageUrl) return false;
        const isChatMediaRef = typeof window.isChatMediaReference === 'function'
            ? window.isChatMediaReference(imageUrl)
            : false;
        return isChatMediaRef
            || /^data:image\//i.test(imageUrl)
            || /^https?:\/\//i.test(imageUrl)
            || /^blob:/i.test(imageUrl);
    }

    function normalizeGroupContextMessage(message, groupContact) {
        const prefix = buildGroupContextPrefix(message, groupContact);
        const replyPrefix = buildGroupReplyPrefix(message.replyTo);
        const parts = [prefix, replyPrefix].filter(Boolean);
        let body = '';

        if (isGroupHiddenAvatarContextMessage(message)) {
            const imageUrl = String(message.content || '').trim();
            const textPart = [...parts, '[群头像更新图片，仅供理解上下文]'].filter(Boolean).join(' ');
            const content = [];
            if (textPart) {
                content.push({ type: 'text', text: textPart });
            }
            content.push({ type: 'image_url', image_url: { url: imageUrl } });
            return {
                role: message.role === 'assistant' ? 'assistant' : 'user',
                content
            };
        }

        if (message.type === 'image' || message.type === 'virtual_image') {
            body = '[图片]';
        } else if (message.type === 'sticker') {
            body = `[表情包${message.description ? `: ${message.description}` : ''}]`;
        } else if (message.type === 'voice') {
            body = '[语音]';
        } else if (message.type === 'red_packet') {
            let packetInfo = '';
            try {
                const packetData = typeof message.content === 'string' ? JSON.parse(message.content) : message.content;
                if (packetData && packetData.id) {
                    packetInfo = ` id=${packetData.id}`;
                }
            } catch (error) {}
            body = `[红包${packetInfo}]`;
        } else if (message.type === 'private_chat_invite') {
            let inviteInfo = '';
            try {
                const inviteData = typeof message.content === 'string' ? JSON.parse(message.content) : message.content;
                if (inviteData && inviteData.id) {
                    inviteInfo = ` id=${inviteData.id}`;
                }
            } catch (error) {}
            body = `[私聊邀请${inviteInfo}]`;
        } else if (message.type === 'group_poll') {
            let pollId = '';
            let pollTitle = '';
            let optionPreview = '';
            try {
                const payload = typeof message.content === 'string' ? JSON.parse(message.content) : (message.content || {});
                pollId = String(payload.id || '').trim();
                pollTitle = String(payload.title || '').trim();
                const options = Array.isArray(payload.options) ? payload.options : [];
                optionPreview = options
                    .map((option, index) => {
                        const text = String(option && (option.text || option.content || option.label) || '').trim();
                        const voterIds = Array.isArray(option && option.voterIds) ? option.voterIds : [];
                        const voteCount = Number(option && option.voteCount);
                        const count = Number.isFinite(voteCount) && voteCount >= 0 ? voteCount : voterIds.length;
                        if (!text) return '';
                        return `${index + 1}.${text}${count > 0 ? `(${count}票)` : ''}`;
                    })
                    .filter(Boolean)
                    .slice(0, 8)
                    .join(' / ');
            } catch (error) {}
            body = `[投票${pollId ? ` id=${pollId}` : ''}${pollTitle ? ` 标题=${pollTitle}` : ''}${optionPreview ? ` 选项=${optionPreview}` : ''}]`;
        } else if (message.type === 'group_relay') {
            let relayId = '';
            let relayTitle = '';
            let entryCount = 0;
            try {
                const payload = typeof message.content === 'string' ? JSON.parse(message.content) : (message.content || {});
                relayId = String(payload.id || '').trim();
                relayTitle = String(payload.title || '').trim();
                entryCount = Array.isArray(payload.entries) ? payload.entries.length : 0;
            } catch (error) {}
            body = `[接龙${relayId ? ` id=${relayId}` : ''}${relayTitle ? ` 标题=${relayTitle}` : ''}${entryCount > 0 ? ` 已接=${entryCount}` : ''}]`;
        } else if (typeof message.content === 'string' && message.content.trim()) {
            body = message.content.trim();
        } else {
            body = '[消息]';
        }

        const finalText = [...parts, body].filter(Boolean).join(' ');
        if (message.role === 'assistant' && /^\[系统消息\]:/.test(body)) {
            return { role: 'system', content: finalText };
        }
        return {
            role: message.role === 'assistant' ? 'assistant' : 'user',
            content: finalText
        };
    }

    async function buildGroupAiPromptMessages(contactId, instruction = null, options = {}) {
        const group = getGroupContact(contactId);
        if (!group) return [];

        const history = Array.isArray(window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[group.id])
            ? window.iphoneSimState.chatHistory[group.id]
            : [];
        const promptTailMessages = Array.isArray(options && options.promptTailMessages)
            ? options.promptTailMessages.filter(item => item && item.role === 'user' && typeof item.content === 'string' && item.content.trim())
            : [];
        const memoryMode = String(group.groupMeta && group.groupMeta.memoryMode || 'group_only');
        const memberContacts = getGroupMemberContacts(group);
        const pendingInviteMemberIds = getPendingInviteMemberIds(group);
        const pendingInviteContacts = memberContacts.filter(member => pendingInviteMemberIds.some(id => String(id) === String(member.id)));
        const relationshipLinks = getGroupRelationshipLinks(group);
        const relationshipNotes = getGroupRelationshipNotes(group);
        const announcementText = getGroupAnnouncementText(group);
        const pinnedDisplayData = getGroupPinnedMessageDisplayData(group, { autoClearInvalid: true, persist: true });
        const userPersonaContext = buildGroupUserPersonaContext(group);
        const memberLines = [
            `- speaker_contact_id=me｜名字=${getParticipantName(group, 'me')}｜区分标签=${getParticipantPromptLabel(group, 'me')}｜身份=${GROUP_ROLE_LABELS[getGroupRole(group, 'me')] || '成员'}｜群头衔=${getGroupMemberTitle(group, 'me') || '无'}｜这是用户本人`
        ];
        memberLines.push(...memberContacts.map(member => {
            const role = GROUP_ROLE_LABELS[getGroupRole(group, member.id)] || '成员';
            const title = getGroupMemberTitle(group, member.id);
            const relation = String(member.relationship || member.relation || '无').replace(/\s+/g, ' ').trim() || '无';
            const persona = String(member.persona || '无').replace(/\s+/g, ' ').trim();
            const recentJoinFlag = pendingInviteMemberIds.some(id => String(id) === String(member.id)) ? '｜最近入群=是' : '';
            return `- speaker_contact_id=${member.id}｜名字=${getParticipantName(group, member.id, '成员')}｜区分标签=${getParticipantPromptLabel(group, member.id, '成员')}｜身份=${role}｜关系=${relation}｜群头衔=${title || '无'}｜人设=${persona || '无'}${recentJoinFlag}`;
        }));
        const explicitRelationshipDirectionKeys = new Set(
            relationshipLinks.map(link => `${String(link.sourceId)}=>${String(link.targetId)}`)
        );
        const relationshipLinkLines = [];
        relationshipLinks.forEach((link) => {
            const sourceLabel = getParticipantPromptLabel(group, link.sourceId, link.sourceId === 'me' ? getParticipantName(group, 'me') : '成员');
            const targetLabel = getParticipantPromptLabel(group, link.targetId, link.targetId === 'me' ? getParticipantName(group, 'me') : '成员');
            relationshipLinkLines.push(`- ${sourceLabel}（speaker_contact_id=${link.sourceId}） -> ${targetLabel}（speaker_contact_id=${link.targetId}）：${link.relation}`);

            const reverseKey = `${String(link.targetId)}=>${String(link.sourceId)}`;
            if (!explicitRelationshipDirectionKeys.has(reverseKey)) {
                relationshipLinkLines.push(`- ${targetLabel}（speaker_contact_id=${link.targetId}） -> ${sourceLabel}（speaker_contact_id=${link.sourceId}）：${link.relation}（由同一条关系线按双向理解）`);
            }
        });
        const directContext = buildBidirectionalGroupContext(group);
        const stickerPrompt = typeof window.buildWechatStickerPrompt === 'function'
            ? window.buildWechatStickerPrompt(group)
            : '';
        const worldbookPrompt = typeof window.buildWechatWorldbookPrompt === 'function'
            ? window.buildWechatWorldbookPrompt(group, history)
            : '';
        const undercoverGameContext = typeof window.getGroupUndercoverPromptContext === 'function'
            ? window.getGroupUndercoverPromptContext(group)
            : '';
        const turtleSoupGameContext = typeof window.getGroupTurtleSoupPromptContext === 'function'
            ? window.getGroupTurtleSoupPromptContext(group)
            : '';
        const timeContext = group.realTimeVisible && typeof buildRealtimeTimeContext === 'function'
            ? buildRealtimeTimeContext(group.id)
            : '';
        const itineraryContext = group.realTimeVisible && typeof window.getCurrentItineraryInfo === 'function'
            ? (await window.getCurrentItineraryInfo(group.id).catch(() => ''))
            : '';
        const calendarContext = group.calendarAwareEnabled === false
            ? ''
            : (typeof buildCalendarPromptContext === 'function' ? buildCalendarPromptContext() : '');
        const limit = Number.isFinite(Number(group.contextLimit)) && Number(group.contextLimit) > 0 ? Number(group.contextLimit) : 40;
        const contextMessages = history
            .filter(message => {
                if (!message || message._hiddenBySanitizer) return false;
                if (message.hiddenFromUi) return isGroupHiddenAvatarContextMessage(message);
                return true;
            })
            .slice(-limit)
            .map(message => normalizeGroupContextMessage(message, group));

        const systemBaseBlocks = [
            `你现在不是在扮演单个联系人，而是在模拟微信群聊“${getGroupChatDisplayName(group)}”里的多位真实成员。`,
            `用户本人名字：${getParticipantName(group, 'me')}。用户是群里的${GROUP_ROLE_LABELS[getGroupRole(group, 'me')] || '成员'}。`,
            userPersonaContext,
            '【群成员名单】',
            memberLines.length > 0 ? memberLines.join('\n') : '- 当前暂无群成员。',
            '- 如果群里有同名成员，必须参考“区分标签”与人设来区分他们；不要因为名字相同就跳过不回复。',
            '【群内关系图】',
            relationshipLinkLines.length > 0
                ? `${relationshipLinkLines.join('\n')}\n- 上面这些是群成员之间已经设定好的关系连线，发言互动、站队、亲疏感、称呼和语气时都要参考。若某对成员只有单条关系线而没有相反方向的另一条线，也要默认把它理解成双向关系；只有当同一对成员存在两条相反方向且内容不同的关系线时，才按有方向差异来理解。若没有写出的成员组合，则视为没有额外指定关系。`
                : '- 当前没有额外设置成员之间的关系连线。',
            relationshipNotes
                ? `【群成员关系补充说明】\n${relationshipNotes}`
                : '',
            '【群公告】',
            announcementText || '无',
            '【置顶消息】',
            pinnedDisplayData && pinnedDisplayData.messageId
                ? `msg_id=${pinnedDisplayData.messageId}｜speaker_contact_id=${pinnedDisplayData.speakerContactId || ''}｜speaker_name=${pinnedDisplayData.speakerName || '群成员'}｜preview=${pinnedDisplayData.preview || '[消息]'}`
                : '无',
            pendingInviteContacts.length > 0
                ? `【最近新入群成员】\n${pendingInviteContacts.map(member => `- speaker_contact_id=${member.id}｜名字=${getParticipantName(group, member.id, '成员')}｜区分标签=${getParticipantPromptLabel(group, member.id, '成员')}｜人设=${String(member.persona || '无').replace(/\s+/g, ' ').trim() || '无'}`).join('\n')}\n这些成员现在已经在群里，可以自然接话；如果场景允许，优先让至少一位最近入群成员在本轮说 1 句，但不要硬凑所有人都发言。`
                : '',
            timeContext || '',
            calendarContext || '',
            itineraryContext || '',
            stickerPrompt || '',
            undercoverGameContext || '',
            turtleSoupGameContext || '',
            '- 若上下文中出现【群内小游戏：谁是卧底】，必须优先遵守该区块内的硬性规则；尤其在线索阶段，禁止输出与对应词语明显无关的描述。',
            '- 若上下文中出现【群内小游戏：海龟汤】，提问阶段严禁在可见消息里直接泄露标准答案，主持人应优先使用动作记录“问题-回答”。',
            '【输出协议】',
            '- 你必须只输出一个 JSON 数组，不要输出解释、不要输出 Markdown 代码块。',
            '- 允许的可见 type 只有：text_message、quote_reply、sticker_message、voice、image。',
            '- 每一条可见消息都必须带 speaker_contact_id，且必须精确使用上面成员名单里的某个值。',
            '- 如果你暂时记不住某个同名成员的真实 id，可以先参考其区分标签思考，但最终输出时应尽量填写真实 speaker_contact_id；若误填区分标签，解析器会尝试识别。',
            '- quote_reply 格式：{"type":"quote_reply","speaker_contact_id":"成员ID","target_msg_id":"消息ID","target_timestamp":消息时间戳,"reply_content":"回复内容"}。优先使用 target_msg_id。',
            '- text_message 格式：{"type":"text_message","speaker_contact_id":"成员ID","content":"回复内容"}。',
            '- sticker_message 格式：{"type":"sticker_message","speaker_contact_id":"成员ID","sticker":"表情描述"}。',
            '- voice 格式：{"type":"voice","speaker_contact_id":"成员ID","duration":3,"content":"语音内容"}。',
            '- image 格式：{"type":"image","speaker_contact_id":"成员ID","content":"图片描述"}。',
            '- 允许额外输出群动作 action，但仅限下面列出的动作。',
            '- action 里的 speaker_contact_id 必须是某位 AI 成员，严禁写 me（用户本人）。',
            '- 改群名：{"type":"action","speaker_contact_id":"成员ID","command":"RENAME_GROUP","payload":"新群名"}。只有管理员或群主能这样做。',
            '- 设群头衔：{"type":"action","speaker_contact_id":"成员ID","command":"SET_MEMBER_TITLE","payload":{"target_member_id":"成员ID","title":"群头衔"}}。只有群主能这样做；若要取消群头衔，title 传空字符串。',
            '- 撤回消息：{"type":"action","speaker_contact_id":"成员ID","command":"RECALL_GROUP_MESSAGE","payload":{"target_msg_id":"消息ID"}}。只有管理员或群主能这样做；target_msg_id 必须来自上文已有真实消息。',
            '- 转让群主：{"type":"action","speaker_contact_id":"成员ID","command":"TRANSFER_GROUP_OWNER","payload":{"target_member_id":"成员ID"}}。只有当前群主能这样做；target_member_id 可为 me 或某位成员ID。',
            '- 设管理员：{"type":"action","speaker_contact_id":"成员ID","command":"SET_GROUP_ADMIN","payload":{"target_member_id":"成员ID"}}。只有群主能这样做；可把 me 或某位成员设为管理员。',
            '- 取消管理员：{"type":"action","speaker_contact_id":"成员ID","command":"UNSET_GROUP_ADMIN","payload":{"target_member_id":"成员ID"}}。只有群主能这样做。',
            '- 主动退群：{"type":"action","speaker_contact_id":"成员ID","command":"LEAVE_GROUP","payload":{}}。仅普通成员或管理员可退群；群主要先转让群主后再退群。',
            '- 发红包：{"type":"action","speaker_contact_id":"成员ID","command":"SEND_GROUP_RED_PACKET","payload":{"mode":"targeted|random","amount":88.88,"target_member_ids":["成员ID"],"count":3,"remark":"红包祝福"}}。targeted 需要 target_member_ids，random 需要 count。',
            '- 抢红包：{"type":"action","speaker_contact_id":"成员ID","command":"CLAIM_GROUP_RED_PACKET","payload":{"packet_id":"红包ID或红包消息ID"}}。红包ID可从上下文里的 [红包 id=...] 读取。',
            '- 发起私聊：{"type":"action","speaker_contact_id":"成员ID","command":"START_PRIVATE_CHAT","payload":{"message":"想和你私聊..."}}。仅当记忆模式为 bidirectional（双向同步）时才允许，用于向用户发起私聊邀请。',
            '- 发起投票：{"type":"action","speaker_contact_id":"成员ID","command":"CREATE_GROUP_POLL","payload":{"title":"投票主题","options":["选项1","选项2","选项3"]}}。',
            '- 参与投票：{"type":"action","speaker_contact_id":"成员ID","command":"VOTE_GROUP_POLL","payload":{"poll_id":"投票ID或消息ID","option_id":"选项ID"}}。也可用 option_index（从1开始）。',
            '- 发起接龙：{"type":"action","speaker_contact_id":"成员ID","command":"CREATE_GROUP_RELAY","payload":{"title":"接龙主题","entry":"第一条接龙内容"}}。',
            '- 参与接龙：{"type":"action","speaker_contact_id":"成员ID","command":"JOIN_GROUP_RELAY","payload":{"relay_id":"接龙ID或消息ID","entry":"接龙内容"}}。',
            '- 发起谁是卧底：{"type":"action","speaker_contact_id":"成员ID","command":"START_UNDERCOVER_GAME","payload":{}}。',
            '- 切换卧底阶段：{"type":"action","speaker_contact_id":"成员ID","command":"UNDERCOVER_SWITCH_PHASE","payload":{"phase":"vote"}}。phase 可为 clue/vote/finished。',
            '- 卧底投票：{"type":"action","speaker_contact_id":"成员ID","command":"UNDERCOVER_VOTE","payload":{"target_member_id":"成员ID"}}。',
            '- 卧底结算：{"type":"action","speaker_contact_id":"成员ID","command":"UNDERCOVER_SETTLE","payload":{}}。',
            '- 卧底下一局：{"type":"action","speaker_contact_id":"成员ID","command":"UNDERCOVER_NEXT_ROUND","payload":{}}。',
            '- 卧底结束：{"type":"action","speaker_contact_id":"成员ID","command":"UNDERCOVER_END","payload":{}}。',
            '- 发起海龟汤：{"type":"action","speaker_contact_id":"成员ID","command":"START_TURTLE_SOUP_GAME","payload":{}}。',
            '- 海龟汤回应：{"type":"action","speaker_contact_id":"成员ID","command":"TURTLE_SOUP_REPLY","payload":{"asker_member_id":"成员ID","question":"问题","verdict":"是|否|无关|接近","hint":"可选提示"}}。',
            '- 海龟汤揭晓：{"type":"action","speaker_contact_id":"成员ID","command":"TURTLE_SOUP_REVEAL","payload":{}}。',
            '- 海龟汤下一局：{"type":"action","speaker_contact_id":"成员ID","command":"TURTLE_SOUP_NEXT_ROUND","payload":{}}。',
            '- 海龟汤结束：{"type":"action","speaker_contact_id":"成员ID","command":"TURTLE_SOUP_END","payload":{}}。',
            '- 当成员希望把某个话题转去单独沟通时，且当前记忆模式为 bidirectional，可以使用发起私聊动作。',
            '- 若上下文里已出现正在进行的投票或接龙，且成员在聊天里表达立场/观点/接龙意图，必须同时输出对应的 VOTE_GROUP_POLL 或 JOIN_GROUP_RELAY 动作，不能只发文本不落地动作。',
            '- 一次把整轮群成员要说的话按顺序写完整，不能依赖第二次生成补说话。',
            '- 每轮回复总共至少输出 6 条可见消息；action 不计入这 6 条。若群成员较少，可以让同一成员连续说多句，但总可见消息数不能少于 6 条。',
            '- 回复形态必须像真实群聊：不要所有人都只对用户单线回复。每轮至少安排 2 条“成员对成员”的直接互动（接话、追问、调侃、引用任一成员都可以）。',
            '- 成员在互相互动时可自然提及用户，但主语与对话对象不能始终只有用户一个人。',
            '- 除上面列出的群动作外，禁止输出 thought_state、转账、改资料、下单、一起听、屏幕操作等任何副作用指令。',
            '- 谁更可能接话、是否多人连续回复、是否引用消息，都由你一次性自然决定。',
            `【记忆模式】当前模式：${GROUP_MEMORY_MODE_LABELS[memoryMode] || GROUP_MEMORY_MODE_LABELS.group_only}。`
        ].filter(Boolean);

        const systemPromptParts = [];
        const systemBaseText = systemBaseBlocks.join('\n\n');
        if (systemBaseText) {
            systemPromptParts.push({
                group: 'systemBase',
                label: '群聊基础',
                content: systemBaseText
            });
        }
        if (worldbookPrompt) {
            systemPromptParts.push({
                group: 'worldbook',
                label: '世界书',
                content: worldbookPrompt
            });
        }
        if (directContext) {
            systemPromptParts.push({
                group: 'extra',
                label: '双向上下文',
                content: directContext
            });
        }

        const systemPrompt = systemPromptParts
            .map(part => part.content)
            .filter(Boolean)
            .join('\n\n');

        const messages = [
            { role: 'system', content: systemPrompt },
            ...contextMessages
        ];

        if (promptTailMessages.length > 0) {
            messages.push(...promptTailMessages.map(item => ({ role: 'user', content: item.content.trim() })));
        }

        if (instruction) {
            messages.push({ role: 'system', content: `[系统提示]: ${instruction}` });
        }

        messages._systemPromptParts = systemPromptParts.map(part => ({ ...part }));

        return messages;
    }
    function pushVisibleGroupSystemNotice(groupId, text) {
        if (!text || typeof window.sendMessage !== 'function') return null;
        return window.sendMessage(`[系统消息]: ${text}`, false, 'text', null, groupId, {
            ignoreReplyingState: true,
            bypassWechatBlock: true,
            showNotification: false
        });
    }

    function appendHiddenGroupAvatarContextImage(groupContact, avatarUrl, actorId = 'me') {
        const group = getGroupContact(groupContact);
        const normalizedAvatar = String(avatarUrl || '').trim();
        const normalizedActorId = normalizeParticipantId(actorId || 'me') || 'me';
        if (!group || !normalizedAvatar) return null;
        if (!window.iphoneSimState.chatHistory || typeof window.iphoneSimState.chatHistory !== 'object') {
            window.iphoneSimState.chatHistory = {};
        }
        if (!Array.isArray(window.iphoneSimState.chatHistory[group.id])) {
            window.iphoneSimState.chatHistory[group.id] = [];
        }

        const isUser = String(normalizedActorId) === 'me';
        const messageMeta = decorateGroupChatMessageMeta({ speakerContactId: normalizedActorId }, group, isUser, {
            speakerContactId: normalizedActorId
        });
        const message = {
            id: `${Date.now()}${Math.random().toString(36).slice(2, 9)}`,
            time: Date.now(),
            role: isUser ? 'user' : 'assistant',
            content: normalizedAvatar,
            type: 'image',
            channel: 'wechat',
            hiddenFromUi: true,
            includeInAiContext: true,
            contextKind: 'group_avatar_update',
            ...messageMeta
        };
        window.iphoneSimState.chatHistory[group.id].push(message);

        if (typeof window.offloadInlineChatMediaMessage === 'function' && /^data:image\//i.test(normalizedAvatar)) {
            Promise.resolve().then(() => window.offloadInlineChatMediaMessage(group.id, message.id, {
                type: 'image/jpeg',
                name: 'group-avatar'
            })).catch((error) => {
                console.warn('群头像上下文图片转存失败', error);
            });
        }

        return message;
    }

    function pushGroupAvatarUpdateMessage(groupContact, avatarUrl, actorId = 'me') {
        const group = getGroupContact(groupContact);
        const normalizedAvatar = String(avatarUrl || '').trim();
        const normalizedActorId = normalizeParticipantId(actorId || 'me') || 'me';
        if (!group || !normalizedAvatar || typeof window.sendMessage !== 'function') return null;

        appendHiddenGroupAvatarContextImage(group, normalizedAvatar, normalizedActorId);
        const actorName = getParticipantName(group, normalizedActorId, normalizedActorId === 'me' ? '你' : '群成员');
        return pushVisibleGroupSystemNotice(group.id, `${actorName} 更新了群头像`);
    }

    function refreshGroupChatVisualState(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group) return;
        group.name = group.groupMeta.name;
        group.remark = group.groupMeta.name;
        if (group.groupMeta.avatar) {
            group.avatar = group.groupMeta.avatar;
        }
        if (String(window.iphoneSimState.currentChatContactId) === String(group.id)) {
            const title = document.getElementById('chat-title');
            if (title) title.textContent = getGroupChatDisplayName(group);
            if (typeof window.applyChatTopbarAppearance === 'function') {
                window.applyChatTopbarAppearance(group);
            }
        }
    }

    function getGroupMemberRelationsElements() {
        return {
            screen: document.getElementById('group-member-relations-screen'),
            subtitle: document.getElementById('group-member-relations-subtitle'),
            groupName: document.getElementById('group-member-relations-group-name'),
            notesBtn: document.getElementById('group-member-relations-notes-btn'),
            canvas: document.getElementById('group-member-relations-canvas'),
            svg: document.getElementById('group-member-relations-svg'),
            nodesLayer: document.getElementById('group-member-relations-nodes'),
            toast: document.getElementById('group-member-relations-toast'),
            picker: document.getElementById('group-member-relations-picker'),
            pickerList: document.getElementById('group-member-relations-picker-list')
        };
    }

    function showGroupMemberRelationsToast(text, duration = 3000) {
        const { toast } = getGroupMemberRelationsElements();
        if (!toast) return;
        toast.textContent = text;
        toast.classList.add('show');
        clearTimeout(toast.__hideTimer);
        if (duration > 0) {
            toast.__hideTimer = setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
        }
    }

    function hideGroupMemberRelationsToast() {
        const { toast } = getGroupMemberRelationsElements();
        if (!toast) return;
        clearTimeout(toast.__hideTimer);
        toast.classList.remove('show');
    }

    function updateGroupMemberRelationsNotesButton(groupContact = currentRelationGroupId) {
        const group = getGroupContact(groupContact);
        const { notesBtn } = getGroupMemberRelationsElements();
        if (!notesBtn) return;
        const notes = getGroupRelationshipNotes(group);
        const hasNotes = !!notes;
        notesBtn.classList.toggle('has-notes', hasNotes);
        notesBtn.setAttribute('aria-label', hasNotes ? '编辑关系补充说明（已填写）' : '编辑关系补充说明');
    }

    function clearSelectedGroupRelationNode() {
        relationGraphRuntime.selectedNodeId = null;
        relationGraphRuntime.nodes.forEach((node) => {
            if (node && node.el) {
                node.el.classList.remove('selected');
            }
        });
        hideGroupMemberRelationsToast();
    }

    function getGroupMemberRelationNodeById(nodeId) {
        return relationGraphRuntime.nodes.find(node => String(node.id) === String(nodeId)) || null;
    }

    function getGroupRelationCanvasMetrics() {
        const { canvas } = getGroupMemberRelationsElements();
        const rect = canvas ? canvas.getBoundingClientRect() : null;
        return {
            rect,
            width: rect && rect.width ? rect.width : window.innerWidth,
            height: rect && rect.height ? rect.height : window.innerHeight
        };
    }

    function ensureGroupRelationNodePosition(groupContact, participantId, index = 0, total = 1) {
        const group = getGroupContact(groupContact);
        const safeId = normalizeParticipantId(participantId);
        if (!group || !safeId) return { xRatio: 0.5, yRatio: 0.5 };
        if (!group.groupMeta.relationshipNodePositions || typeof group.groupMeta.relationshipNodePositions !== 'object') {
            group.groupMeta.relationshipNodePositions = {};
        }
        const existing = group.groupMeta.relationshipNodePositions[String(safeId)];
        if (existing && Number.isFinite(existing.xRatio) && Number.isFinite(existing.yRatio)) {
            return existing;
        }
        const angle = (Math.PI * 2 * index) / Math.max(total, 1);
        const xRatio = 0.5 + Math.cos(angle) * 0.24;
        const yRatio = 0.5 + Math.sin(angle) * 0.18;
        setManagedRelationNodePosition(group, safeId, xRatio, yRatio);
        if (typeof saveConfig === 'function') saveConfig();
        return group.groupMeta.relationshipNodePositions[String(safeId)] || { xRatio: 0.5, yRatio: 0.5 };
    }

    function buildGroupRelationGraphNodes(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group) return [];
        const { width, height } = getGroupRelationCanvasMetrics();
        const memberIds = getManagedRelationMemberIds(group);
        return memberIds.map((participantId, index) => {
            const contact = participantId === 'me' ? null : getContactById(participantId);
            if (participantId !== 'me' && (!contact || contact.chatType === 'group')) return null;
            const position = ensureGroupRelationNodePosition(group, participantId, index, memberIds.length);
            return {
                id: String(participantId),
                participantId,
                x: (Number(position.xRatio) || 0.5) * width,
                y: (Number(position.yRatio) || 0.5) * height,
                label: getParticipantPromptLabel(group, participantId, '成员'),
                avatar: participantId === 'me' ? getUserAvatar(group) : (contact.avatar || ''),
                el: null
            };
        }).filter(Boolean);
    }

    function promptForGroupRelationLabel(existing = '') {
        const result = prompt('LINK TYPE / 输入关联类型:', existing || 'CONNECT');
        if (result === null) return null;
        return String(result || '').replace(/\s+/g, ' ').trim();
    }

    function handleGroupRelationNodeClick(event, node) {
        event.stopPropagation();
        if (!node || relationGraphRuntime.isDragging) return;

        if (!relationGraphRuntime.selectedNodeId) {
            relationGraphRuntime.selectedNodeId = node.id;
            if (node.el) node.el.classList.add('selected');
            showGroupMemberRelationsToast('选择第二个成员以建立关系', 0);
            return;
        }

        if (String(relationGraphRuntime.selectedNodeId) === String(node.id)) {
            clearSelectedGroupRelationNode();
            return;
        }

        const group = getGroupContact(currentRelationGroupId);
        const sourceNode = getGroupMemberRelationNodeById(relationGraphRuntime.selectedNodeId);
        if (!group || !sourceNode) {
            clearSelectedGroupRelationNode();
            return;
        }

        const existingLink = getGroupRelationshipLinks(group).find(link => String(link.sourceId) === String(sourceNode.participantId) && String(link.targetId) === String(node.participantId));
        const relation = promptForGroupRelationLabel(existingLink ? existingLink.relation : '');
        if (relation) {
            const result = upsertGroupRelationshipLink(group, sourceNode.participantId, node.participantId, relation);
            if (result && result.ok) {
                renderGroupMemberRelationsScreen(group);
            }
        }
        clearSelectedGroupRelationNode();
    }

    function startGroupRelationNodeDrag(event, node) {
        if (!node) return;
        if (event.button !== undefined && event.button !== 0) return;
        event.stopPropagation();
        const { rect } = getGroupRelationCanvasMetrics();
        if (!rect) return;

        relationGraphRuntime.dragNodeId = node.id;
        relationGraphRuntime.isDragging = false;
        relationGraphRuntime.startX = event.clientX;
        relationGraphRuntime.startY = event.clientY;
        const nodeRect = node.el.getBoundingClientRect();
        relationGraphRuntime.dragOffsetX = event.clientX - nodeRect.left - 25;
        relationGraphRuntime.dragOffsetY = event.clientY - nodeRect.top - 25;
    }

    function dragGroupRelationNode(event) {
        if (!relationGraphRuntime.dragNodeId) return;
        const node = getGroupMemberRelationNodeById(relationGraphRuntime.dragNodeId);
        if (!node || !node.el) return;
        const { rect, width, height } = getGroupRelationCanvasMetrics();
        if (!rect) return;

        if (Math.abs(event.clientX - relationGraphRuntime.startX) > 3 || Math.abs(event.clientY - relationGraphRuntime.startY) > 3) {
            relationGraphRuntime.isDragging = true;
            node.el.style.transition = 'none';
        }

        node.x = Math.min(width - 25, Math.max(25, event.clientX - rect.left - relationGraphRuntime.dragOffsetX));
        node.y = Math.min(height - 25, Math.max(25, event.clientY - rect.top - relationGraphRuntime.dragOffsetY));
        node.el.style.left = `${node.x - 25}px`;
        node.el.style.top = `${node.y - 25}px`;
        renderGroupRelationGraphLinks();
    }

    function endGroupRelationNodeDrag() {
        if (!relationGraphRuntime.dragNodeId) return;
        const node = getGroupMemberRelationNodeById(relationGraphRuntime.dragNodeId);
        if (node && node.el) {
            node.el.style.transition = '';
            const { width, height } = getGroupRelationCanvasMetrics();
            setManagedRelationNodePosition(currentRelationGroupId, node.participantId, node.x / Math.max(width, 1), node.y / Math.max(height, 1));
            if (typeof saveConfig === 'function') saveConfig();
        }
        relationGraphRuntime.dragNodeId = null;
        setTimeout(() => {
            relationGraphRuntime.isDragging = false;
        }, 50);
    }

    function renderGroupRelationGraphLinks() {
        const group = getGroupContact(currentRelationGroupId);
        const { svg } = getGroupMemberRelationsElements();
        if (!group || !svg) return;

        svg.innerHTML = '';
        const links = getGroupRelationshipLinks(group)
            .map(link => ({
                source: getGroupMemberRelationNodeById(link.sourceId),
                target: getGroupMemberRelationNodeById(link.targetId),
                relation: link.relation
            }))
            .filter(link => link.source && link.target);

        const linkMap = {};
        links.forEach((link) => {
            const baseId = String(link.source.id) < String(link.target.id)
                ? `${link.source.id}-${link.target.id}`
                : `${link.target.id}-${link.source.id}`;
            if (!linkMap[baseId]) linkMap[baseId] = [];
            linkMap[baseId].push(link);
        });
        const linkCount = {};

        links.forEach((link) => {
            const baseId = String(link.source.id) < String(link.target.id)
                ? `${link.source.id}-${link.target.id}`
                : `${link.target.id}-${link.source.id}`;
            const isBidi = linkMap[baseId].length > 1;
            if (!linkCount[baseId]) linkCount[baseId] = 0;
            const countIndex = linkCount[baseId]++;

            const sx = link.source.x;
            const sy = link.source.y;
            const tx = link.target.x;
            const ty = link.target.y;

            if (isBidi) {
                const dx = tx - sx;
                const dy = ty - sy;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const dr = dist * 1.5;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const sweepFlag = String(link.source.id) < String(link.target.id)
                    ? (countIndex % 2 === 0 ? 1 : 0)
                    : (countIndex % 2 === 0 ? 0 : 1);
                path.setAttribute('d', `M ${sx},${sy} A ${dr},${dr} 0 0,${sweepFlag} ${tx},${ty}`);
                path.setAttribute('class', 'group-member-relations-line');
                svg.appendChild(path);

                const offsetX = (-dy / dist) * 35;
                const offsetY = (dx / dist) * 35;
                const midX = (sx + tx) / 2 + (sweepFlag ? offsetX : -offsetX);
                const midY = (sy + ty) / 2 + (sweepFlag ? offsetY : -offsetY);
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', midX);
                text.setAttribute('y', midY);
                text.setAttribute('class', 'group-member-relations-link-text');
                text.textContent = link.relation;
                svg.appendChild(text);
                return;
            }

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', sx);
            line.setAttribute('y1', sy);
            line.setAttribute('x2', tx);
            line.setAttribute('y2', ty);
            line.setAttribute('class', 'group-member-relations-line');
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', (sx + tx) / 2);
            text.setAttribute('y', (sy + ty) / 2);
            text.setAttribute('class', 'group-member-relations-link-text');
            text.textContent = link.relation;
            svg.appendChild(line);
            svg.appendChild(text);
        });
    }

    function closeGroupMemberRelationsPicker() {
        const { picker } = getGroupMemberRelationsElements();
        if (picker) picker.classList.add('hidden');
    }

    function closeGroupMemberRelationsScreen() {
        closeGroupMemberRelationsPicker();
        const { screen } = getGroupMemberRelationsElements();
        if (screen) screen.classList.add('hidden');
        clearSelectedGroupRelationNode();
        relationGraphRuntime.nodes = [];
        const chatSettingsScreen = document.getElementById('chat-settings-screen');
        if (chatSettingsScreen && !chatSettingsScreen.classList.contains('hidden') && typeof window.setChatSettingsFloatingSaveVisible === 'function') {
            window.setChatSettingsFloatingSaveVisible(true);
        }
        currentRelationGroupId = null;
    }

    function renderGroupMemberRelationsPicker(groupContact) {
        const group = getGroupContact(groupContact);
        const { pickerList } = getGroupMemberRelationsElements();
        if (!group || !pickerList) return;
        const managedIds = new Set(getManagedRelationMemberIds(group).map(id => String(id)));
        const members = [
            {
                id: 'me',
                avatar: getUserAvatar(group),
                displayName: getParticipantName(group, 'me', '我'),
                roleLabel: GROUP_ROLE_LABELS[getGroupRole(group, 'me')] || '成员'
            },
            ...getGroupMemberContacts(group).map(member => ({
                id: member.id,
                avatar: member.avatar || '',
                displayName: getParticipantName(group, member.id, '成员'),
                roleLabel: GROUP_ROLE_LABELS[getGroupRole(group, member.id)] || '成员'
            }))
        ];
        pickerList.innerHTML = '';

        if (members.length === 0) {
            pickerList.innerHTML = '<div class="group-member-relations-picker-item"><div class="group-member-relations-picker-main"><div class="group-member-relations-picker-name">暂无可选群成员</div><div class="group-member-relations-picker-meta">当前群里还没有可加入关系面板的联系人。</div></div></div>';
            return;
        }

        members.forEach((member) => {
            const isManaged = managedIds.has(String(member.id));
            const item = document.createElement('div');
            item.className = 'group-member-relations-picker-item';
            item.innerHTML = `
                <img class="group-member-relations-picker-avatar" src="${escapeHtml(member.avatar || '')}" alt="${escapeHtml(member.displayName || '成员')}">
                <div class="group-member-relations-picker-main">
                    <div class="group-member-relations-picker-name">${escapeHtml(member.displayName || '成员')}</div>
                    <div class="group-member-relations-picker-meta">${escapeHtml(member.roleLabel || '成员')} · 点击加入关系图</div>
                </div>
                <button type="button" class="group-member-relations-picker-add" ${isManaged ? 'disabled' : ''}>${isManaged ? '已添加' : '添加成员'}</button>
            `;
            const addButton = item.querySelector('.group-member-relations-picker-add');
            if (addButton && !isManaged) {
                addButton.addEventListener('click', () => {
                    addManagedRelationMember(group, member.id);
                    if (typeof saveConfig === 'function') saveConfig();
                    renderGroupMemberRelationsPicker(group);
                    renderGroupMemberRelationsScreen(group);
                    closeGroupMemberRelationsPicker();
                });
            }
            pickerList.appendChild(item);
        });
    }

    function renderGroupMemberRelationsScreen(groupContact) {
        const group = getGroupContact(groupContact || currentRelationGroupId);
        const { screen, subtitle, groupName, nodesLayer } = getGroupMemberRelationsElements();
        if (!group || !screen || !nodesLayer) return;
        currentRelationGroupId = group.id;
        if (groupName) groupName.textContent = getGroupChatDisplayName(group);
        if (subtitle) subtitle.textContent = `${getManagedRelationMemberIds(group).length} NODES // RELATION MAP`;
        updateGroupMemberRelationsNotesButton(group);

        clearSelectedGroupRelationNode();
        relationGraphRuntime.nodes = buildGroupRelationGraphNodes(group);
        nodesLayer.innerHTML = '';

        relationGraphRuntime.nodes.forEach((node) => {
            const nodeEl = document.createElement('div');
            nodeEl.className = 'group-member-relations-node';
            nodeEl.style.left = `${node.x - 25}px`;
            nodeEl.style.top = `${node.y - 25}px`;
            nodeEl.innerHTML = `
                <div class="orbit"></div>
                <div class="group-member-relations-node-core">
                    ${node.avatar ? `<img class="group-member-relations-node-avatar" src="${escapeHtml(node.avatar)}" alt="${escapeHtml(node.label)}" draggable="false">` : '<i class="ri-focus-3-line"></i>'}
                </div>
                <div class="group-member-relations-node-label">${escapeHtml(node.label)}</div>
            `;
            nodeEl.addEventListener('dragstart', (event) => event.preventDefault());
            nodeEl.addEventListener('pointerdown', (event) => startGroupRelationNodeDrag(event, node));
            nodeEl.addEventListener('click', (event) => handleGroupRelationNodeClick(event, node));
            node.el = nodeEl;
            nodesLayer.appendChild(nodeEl);
        });

        renderGroupRelationGraphLinks();
        renderGroupMemberRelationsPicker(group);

        if (relationGraphRuntime.nodes.length === 0) {
            showGroupMemberRelationsToast('点击 Add Member 添加成员进入关系图', 2600);
        }
    }

    function openGroupMemberRelationsScreen(groupId = currentSettingsGroupId) {
        const group = getGroupContact(groupId);
        const { screen } = getGroupMemberRelationsElements();
        if (!group || !screen) return;
        currentRelationGroupId = group.id;
        closeGroupMemberRelationsPicker();
        if (typeof window.setChatSettingsFloatingSaveVisible === 'function') {
            window.setChatSettingsFloatingSaveVisible(false);
        }
        screen.classList.remove('hidden');
        requestAnimationFrame(() => {
            renderGroupMemberRelationsScreen(group);
        });
    }

    function getInlineGroupSettingsPanel() {
        return document.getElementById('chat-setting-group-inline-panel');
    }

    function isInlineGroupSettingsActive() {
        const panel = getInlineGroupSettingsPanel();
        return !!(panel && !panel.classList.contains('hidden'));
    }

    function getGroupSettingsNodes(key) {
        const nodes = [];
        const inlinePanel = getInlineGroupSettingsPanel();
        const legacyIdMap = {
            name: 'group-settings-name',
            'memory-mode': 'group-settings-memory-mode',
            'avatar-preview': 'group-settings-avatar-preview',
            'avatar-upload': 'group-settings-avatar-upload',
            'member-list': 'group-chat-member-list',
            announcement: 'group-settings-announcement',
            'pin-summary': 'group-settings-pin-summary'
        };

        if (inlinePanel) {
            nodes.push(...Array.from(inlinePanel.querySelectorAll(`[data-group-settings-id="${key}"]`)));
        }

        const legacyId = legacyIdMap[key];
        if (legacyId) {
            const legacyNode = document.getElementById(legacyId);
            if (legacyNode) nodes.push(legacyNode);
        }

        return Array.from(new Set(nodes.filter(Boolean)));
    }

    function getPrimaryGroupSettingsNode(key) {
        const inlinePanel = getInlineGroupSettingsPanel();
        if (inlinePanel && !inlinePanel.classList.contains('hidden')) {
            const inlineNode = inlinePanel.querySelector(`[data-group-settings-id="${key}"]`);
            if (inlineNode) return inlineNode;
        }
        const nodes = getGroupSettingsNodes(key);
        return nodes.length ? nodes[0] : null;
    }

    function getGroupSettingsActionNodes(action) {
        const nodes = [];
        const inlinePanel = getInlineGroupSettingsPanel();
        const legacyIdMap = {
            save: 'group-settings-save-btn',
            invite: 'group-settings-invite-btn',
            exit: 'group-settings-exit-btn',
            dissolve: 'group-settings-dissolve-btn',
            'save-announcement': 'group-settings-save-announcement-btn',
            'clear-pin': 'group-settings-clear-pin-btn'
        };

        if (inlinePanel) {
            nodes.push(...Array.from(inlinePanel.querySelectorAll(`[data-group-settings-action="${action}"]`)));
        }

        const legacyId = legacyIdMap[action];
        if (legacyId) {
            const legacyNode = document.getElementById(legacyId);
            if (legacyNode) nodes.push(legacyNode);
        }

        return Array.from(new Set(nodes.filter(Boolean)));
    }

    function setGroupSettingsAvatarPreview(previewNode, avatarUrl) {
        if (!previewNode) return;
        if (avatarUrl) {
            previewNode.style.backgroundImage = `url(${avatarUrl})`;
            previewNode.style.backgroundSize = 'cover';
            previewNode.style.backgroundPosition = 'center';
            previewNode.innerHTML = '';
            return;
        }
        previewNode.style.backgroundImage = '';
        previewNode.style.backgroundSize = '';
        previewNode.style.backgroundPosition = '';
        previewNode.innerHTML = '<i class="fas fa-users"></i>';
    }

    function getSortedGroupMemberRows(rows) {
        const rolePriority = { owner: 0, admin: 1, member: 2 };
        return rows.slice().sort((left, right) => {
            const roleDiff = (rolePriority[left.role] ?? 99) - (rolePriority[right.role] ?? 99);
            if (roleDiff !== 0) return roleDiff;
            if (!!left.isSelf !== !!right.isSelf) return left.isSelf ? -1 : 1;
            return String(left.nickname || left.name || '').localeCompare(String(right.nickname || right.name || ''), 'zh-Hans-CN');
        });
    }

    function buildGroupSettingsMemberRows(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group) return [];
        const rows = [
            {
                id: 'me',
                name: getUserBaseName(group),
                baseName: getUserBaseName(group),
                nickname: getGroupMemberNickname(group, 'me'),
                avatar: getUserAvatar(group),
                role: getGroupRole(group, 'me'),
                title: getGroupMemberTitle(group, 'me'),
                isSelf: true
            }
        ];
        getGroupMemberContacts(group).forEach((member) => {
            rows.push({
                id: member.id,
                name: member.remark || member.nickname || member.name || '\u6210\u5458',
                baseName: getParticipantBaseName(group, member.id, '\u6210\u5458'),
                nickname: getGroupMemberNickname(group, member.id),
                avatar: member.avatar || '',
                role: getGroupRole(group, member.id),
                title: getGroupMemberTitle(group, member.id),
                isSelf: false,
                contact: member
            });
        });
        return getSortedGroupMemberRows(rows);
    }

    function getGroupMemberDisplayName(row, options = {}) {
        const includeSelfSuffix = options.includeSelfSuffix !== false;
        const name = String(row && (row.nickname || row.name) || '\u7fa4\u6210\u5458').trim() || '\u7fa4\u6210\u5458';
        return includeSelfSuffix && row && row.isSelf ? `${name}\uFF08\u6211\uFF09` : name;
    }

    function getGroupMemberDirectoryElements() {
        return {
            screen: document.getElementById('group-member-directory-screen'),
            subtitle: document.getElementById('group-member-directory-subtitle'),
            content: document.getElementById('group-member-directory-content'),
            modal: document.getElementById('group-member-directory-modal'),
            modalCard: document.getElementById('group-member-directory-modal-card'),
            modalAvatar: document.getElementById('group-member-directory-modal-avatar'),
            modalName: document.getElementById('group-member-directory-modal-name'),
            modalRole: document.getElementById('group-member-directory-modal-role'),
            modalActions: document.getElementById('group-member-directory-modal-actions')
        };
    }

    function getGroupMemberPreviewItems(groupContact, rows) {
        const group = getGroupContact(groupContact);
        const safeRows = Array.isArray(rows) ? rows : [];
        const canInvite = !!(group && canCurrentUserManageMembers(group));
        const maxVisibleItems = 12;
        const reservedSlots = canInvite ? 1 : 0;
        const visibleRows = safeRows.slice(0, Math.max(maxVisibleItems - reservedSlots, 0));
        const items = visibleRows.map(row => ({
            type: 'member',
            row
        }));
        if (canInvite && items.length < maxVisibleItems) {
            items.push({ type: 'invite' });
        }
        return items.slice(0, maxVisibleItems);
    }

    function getGroupMemberDirectoryDescription(row) {
        const descriptionParts = [];
        if (row.title) {
            descriptionParts.push(`\u7fa4\u5934\u8854\uff1a${row.title}`);
        } else {
            descriptionParts.push(row.isSelf ? '\u7528\u6237\u672c\u4eba' : '\u672a\u8bbe\u7fa4\u5934\u8854');
        }
        if (row.nickname) {
            descriptionParts.push(`\u539f\u540d\uff1a${row.baseName}`);
        } else if (!row.isSelf && row.baseName) {
            descriptionParts.push(row.baseName);
        }
        return descriptionParts.join(' / ');
    }

    function buildGroupMemberModalActions(groupContact, row) {
        const group = getGroupContact(groupContact);
        if (!group || !row) return [];
        const actions = [
            {
                action: 'set-nickname',
                label: row.nickname ? '\u4fee\u6539\u7fa4\u6635\u79f0' : '\u8bbe\u7f6e\u7fa4\u6635\u79f0',
                icon: 'ri-edit-2-line',
                danger: false
            }
        ];

        if (!row.isSelf && canParticipantManageTitles(group, 'me')) {
            actions.push({
                action: 'set-title',
                label: row.title ? '\u4fee\u6539\u7fa4\u5934\u8854' : '\u8bbe\u7f6e\u7fa4\u5934\u8854',
                icon: 'ri-bookmark-3-line',
                danger: false
            });
        }
        if (!row.isSelf && canCurrentUserManageAdmins(group) && row.role !== 'owner') {
            actions.push({
                action: 'toggle-admin',
                label: row.role === 'admin' ? '\u53d6\u6d88\u7ba1\u7406\u5458' : '\u8bbe\u4e3a\u7ba1\u7406\u5458',
                icon: 'ri-shield-star-line',
                danger: false
            });
            actions.push({
                action: 'transfer-owner',
                label: '\u8f6c\u8ba9\u7fa4\u4e3b',
                icon: 'ri-arrow-left-right-line',
                danger: false
            });
        }
        if (!row.isSelf && canCurrentUserManageMembers(group) && row.role !== 'owner') {
            actions.push({
                action: 'remove-member',
                label: '\u79fb\u51fa\u7fa4\u804a',
                icon: 'ri-logout-box-r-line',
                danger: true
            });
        }
        return actions;
    }

    function renderGroupSettingsMemberList(container, groupContact, rows) {
        const group = getGroupContact(groupContact);
        if (!container || !group) return;
        const memberRows = Array.isArray(rows) ? rows : [];
        const previewItems = getGroupMemberPreviewItems(group, memberRows);
        container.innerHTML = `
            <div class="group-member-preview-shell" role="button" tabindex="0" aria-label="\u6253\u5f00\u7fa4\u6210\u5458\u5217\u8868">
                <div class="group-member-preview-head">
                    <div class="group-member-preview-label">\u7fa4\u6210\u5458</div>
                    <div class="group-member-preview-meta">${memberRows.length}\u4eba <i class="ri-arrow-right-s-line"></i></div>
                </div>
                <div class="group-member-preview-grid"></div>
            </div>
        `;

        const shell = container.querySelector('.group-member-preview-shell');
        const grid = container.querySelector('.group-member-preview-grid');
        if (!shell || !grid) return;

        shell.addEventListener('click', () => openGroupMemberDirectoryScreen(group.id));
        shell.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openGroupMemberDirectoryScreen(group.id);
            }
        });

        previewItems.forEach((item) => {
            const tile = document.createElement('button');
            tile.type = 'button';
            tile.className = `group-member-preview-item${item.type === 'invite' ? ' is-invite' : ''}`;
            if (item.type === 'invite') {
                tile.innerHTML = `
                    <span class="group-member-preview-avatar group-member-preview-avatar-invite"><i class="ri-add-line"></i></span>
                    <span class="group-member-preview-name">\u9080\u8bf7</span>
                `;
                tile.addEventListener('click', (event) => {
                    event.stopPropagation();
                    handleInviteGroupMembers(group.id);
                });
                grid.appendChild(tile);
                return;
            }

            const row = item.row;
            tile.innerHTML = `
                <span class="group-member-preview-avatar">${row.avatar ? `<img src="${escapeHtml(row.avatar)}" alt="${escapeHtml(getGroupMemberDisplayName(row))}" draggable="false">` : `<span class="group-member-preview-avatar-fallback">${escapeHtml(getGroupMemberDisplayName(row).slice(0, 1))}</span>`}</span>
                <span class="group-member-preview-name">${escapeHtml(getGroupMemberDisplayName(row))}</span>
            `;
            tile.addEventListener('click', (event) => {
                event.stopPropagation();
                openGroupMemberDirectoryScreen(group.id);
            });
            grid.appendChild(tile);
        });
    }

    function renderGroupMemberDirectoryScreen(groupContact) {
        const group = getGroupContact(groupContact || currentMemberDirectoryGroupId);
        const { screen, subtitle, content } = getGroupMemberDirectoryElements();
        if (!group || !screen || !content) return;
        const rows = buildGroupSettingsMemberRows(group);
        currentMemberDirectoryGroupId = group.id;
        if (subtitle) subtitle.textContent = `${rows.length} Members`;
        content.innerHTML = '';

        const sections = [
            { role: 'owner', title: GROUP_ROLE_LABELS.owner || 'Owner' },
            { role: 'admin', title: GROUP_ROLE_LABELS.admin || 'Admins' },
            { role: 'member', title: GROUP_ROLE_LABELS.member || 'Members' }
        ];

        sections.forEach((section) => {
            const sectionRows = rows.filter(row => String(row.role || 'member') === section.role);
            if (sectionRows.length === 0) return;

            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'group-member-directory-section-title';
            sectionTitle.textContent = section.title;
            content.appendChild(sectionTitle);

            sectionRows.forEach((row) => {
                const card = document.createElement('button');
                card.type = 'button';
                card.className = `group-member-directory-card is-${escapeHtml(row.role || 'member')}`;
                card.innerHTML = `
                    <div class="group-member-directory-avatar-box">
                        ${row.avatar ? `<img src="${escapeHtml(row.avatar)}" alt="${escapeHtml(getGroupMemberDisplayName(row))}" class="group-member-directory-avatar-img" draggable="false">` : `<span>${escapeHtml(getGroupMemberDisplayName(row).slice(0, 1))}</span>`}
                    </div>
                    <div class="group-member-directory-info-box">
                        <div class="group-member-directory-name-row">
                            <span class="group-member-directory-name">${escapeHtml(getGroupMemberDisplayName(row))}</span>
                            <span class="group-member-directory-role-badge is-${escapeHtml(row.role || 'member')}">${escapeHtml(GROUP_ROLE_LABELS[row.role] || '\u6210\u5458')}</span>
                        </div>
                        <div class="group-member-directory-desc-row">
                            <span>${escapeHtml(getGroupMemberDirectoryDescription(row))}</span>
                        </div>
                    </div>
                    <div class="group-member-directory-action-icon"><i class="ri-more-2-line"></i></div>
                `;
                card.addEventListener('click', () => openGroupMemberDirectoryModal(group.id, row.id));
                content.appendChild(card);
            });
        });

        if (currentMemberDirectoryTargetId !== null && currentMemberDirectoryTargetId !== undefined && currentMemberDirectoryTargetId !== '') {
            openGroupMemberDirectoryModal(group.id, currentMemberDirectoryTargetId);
        } else {
            closeGroupMemberDirectoryModal({ preserveTarget: true });
        }
    }

    function closeGroupMemberDirectoryModal(options = {}) {
        const { modal } = getGroupMemberDirectoryElements();
        if (modal) modal.classList.remove('active');
        if (!options.preserveTarget) {
            currentMemberDirectoryTargetId = null;
        }
    }

    function openGroupMemberDirectoryModal(groupContact, targetId) {
        const group = getGroupContact(groupContact || currentMemberDirectoryGroupId);
        const { modal, modalAvatar, modalName, modalRole, modalActions } = getGroupMemberDirectoryElements();
        if (!group || !modal || !modalAvatar || !modalName || !modalRole || !modalActions) return;
        const rows = buildGroupSettingsMemberRows(group);
        const row = rows.find(item => String(item.id) === String(normalizeParticipantId(targetId)));
        if (!row) {
            closeGroupMemberDirectoryModal();
            return;
        }
        currentMemberDirectoryTargetId = normalizeParticipantId(targetId);
        modalAvatar.innerHTML = row.avatar
            ? `<img src="${escapeHtml(row.avatar)}" alt="${escapeHtml(getGroupMemberDisplayName(row))}" class="group-member-directory-modal-avatar-img" draggable="false">`
            : `<span>${escapeHtml(getGroupMemberDisplayName(row).slice(0, 1))}</span>`;
        modalName.textContent = getGroupMemberDisplayName(row);
        modalRole.textContent = `- ${GROUP_ROLE_LABELS[row.role] || 'member'}${row.title ? ` / ${row.title}` : ''} -`;
        modalActions.innerHTML = '';

        buildGroupMemberModalActions(group, row).forEach((actionItem) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `group-member-directory-modal-btn${actionItem.danger ? ' is-danger' : ''}`;
            button.innerHTML = `<i class="${escapeHtml(actionItem.icon)}"></i><span>${escapeHtml(actionItem.label)}</span>`;
            button.addEventListener('click', () => {
                closeGroupMemberDirectoryModal();
                if (actionItem.action === 'set-nickname') {
                    handleSetGroupMemberNickname(group.id, row.id);
                } else if (actionItem.action === 'set-title') {
                    handleSetGroupMemberTitle(group.id, row.id);
                } else if (actionItem.action === 'toggle-admin') {
                    handleToggleGroupAdmin(group.id, row.id);
                } else if (actionItem.action === 'transfer-owner') {
                    handleTransferGroupOwner(group.id, row.id);
                } else if (actionItem.action === 'remove-member') {
                    handleRemoveGroupMember(group.id, row.id);
                }
            });
            modalActions.appendChild(button);
        });

        modal.classList.add('active');
        if (navigator.vibrate) navigator.vibrate(30);
    }

    function openGroupMemberDirectoryScreen(groupId = currentSettingsGroupId) {
        const group = getGroupContact(groupId || currentSettingsGroupId);
        const { screen } = getGroupMemberDirectoryElements();
        if (!group || !screen) return;
        currentMemberDirectoryGroupId = group.id;
        renderGroupMemberDirectoryScreen(group);
        screen.classList.remove('hidden');
        if (typeof window.setChatSettingsFloatingSaveVisible === 'function') {
            window.setChatSettingsFloatingSaveVisible(false);
        }
    }

    function closeGroupMemberDirectoryScreen() {
        const { screen } = getGroupMemberDirectoryElements();
        closeGroupMemberDirectoryModal();
        if (screen) screen.classList.add('hidden');
        const chatSettingsScreen = document.getElementById('chat-settings-screen');
        if (chatSettingsScreen && !chatSettingsScreen.classList.contains('hidden') && typeof window.setChatSettingsFloatingSaveVisible === 'function') {
            window.setChatSettingsFloatingSaveVisible(true);
        }
        currentMemberDirectoryGroupId = null;
    }

    function renderGroupChatSettings(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group) return;
        currentSettingsGroupId = group.id;
        const canRename = canParticipantRenameGroup(group, 'me');
        const canManageAnnouncement = canParticipantManageAnnouncement(group, 'me');
        const canManageTitles = canParticipantManageTitles(group, 'me');
        const nameInputs = getGroupSettingsNodes('name');
        const memorySelects = getGroupSettingsNodes('memory-mode');
        const announcementInputs = getGroupSettingsNodes('announcement');
        const pinSummaryNodes = getGroupSettingsNodes('pin-summary');
        const avatarPreviews = getGroupSettingsNodes('avatar-preview');
        const memberLists = getGroupSettingsNodes('member-list');
        const saveAnnouncementButtons = getGroupSettingsActionNodes('save-announcement');
        const clearPinButtons = getGroupSettingsActionNodes('clear-pin');
        const dissolveButtons = getGroupSettingsActionNodes('dissolve');
        const exitButtons = getGroupSettingsActionNodes('exit');

        nameInputs.forEach((input) => {
            input.value = getGroupChatDisplayName(group);
            input.disabled = !canRename;
            input.placeholder = canRename ? '输入群名称' : '仅管理员或群主可修改群名';
            input.style.opacity = canRename ? '1' : '0.65';
        });
        const normalizedMemoryMode = String(group.groupMeta && group.groupMeta.memoryMode || '') === 'bidirectional'
            ? 'bidirectional'
            : 'group_only';
        if (group.groupMeta && group.groupMeta.memoryMode !== normalizedMemoryMode) {
            group.groupMeta.memoryMode = normalizedMemoryMode;
        }
        memorySelects.forEach((select) => {
            select.value = normalizedMemoryMode;
        });
        announcementInputs.forEach((input) => {
            input.value = getGroupAnnouncementText(group);
            input.disabled = !canManageAnnouncement;
            input.placeholder = canManageAnnouncement
                ? '输入群公告'
                : '仅管理员或群主可编辑';
            input.style.opacity = canManageAnnouncement ? '1' : '0.65';
        });
        const pinnedData = getGroupPinnedMessageDisplayData(group, { autoClearInvalid: true, persist: true, maxLength: 48 });
        pinSummaryNodes.forEach((node) => {
            node.textContent = pinnedData && pinnedData.messageId
                ? `置顶：${pinnedData.speakerName}: ${pinnedData.preview}`
                : '当前无置顶消息';
            node.title = pinnedData && pinnedData.messageId
                ? '点击跳转到置顶消息'
                : '';
            node.style.cursor = pinnedData && pinnedData.messageId ? 'pointer' : 'default';
            node.onclick = pinnedData && pinnedData.messageId
                ? () => focusGroupPinnedMessage(group.id)
                : null;
        });
        saveAnnouncementButtons.forEach((button) => {
            button.disabled = !canManageAnnouncement;
            button.style.opacity = canManageAnnouncement ? '1' : '0.55';
            button.title = canManageAnnouncement ? '' : '仅管理员或群主可操作';
        });
        clearPinButtons.forEach((button) => {
            const enabled = canManageAnnouncement && !!(pinnedData && pinnedData.messageId);
            button.disabled = !enabled;
            button.style.opacity = enabled ? '1' : '0.55';
            button.title = canManageAnnouncement
                ? (enabled ? '' : '当前没有置顶消息')
                : '仅管理员或群主可操作';
        });
        avatarPreviews.forEach((previewNode) => {
            setGroupSettingsAvatarPreview(previewNode, group.groupMeta.avatar || group.avatar || '');
        });
        dissolveButtons.forEach((button) => {
            button.style.display = getGroupRole(group, 'me') === 'owner' ? '' : 'none';
        });
        exitButtons.forEach((button) => {
            button.textContent = getGroupRole(group, 'me') === 'owner' ? '转让群主后才能退出' : '退出群聊';
        });

        const rows = [];
        rows.push({
            id: 'me',
            name: getUserDisplayName(group),
            baseName: getUserBaseName(group),
            nickname: getGroupMemberNickname(group, 'me'),
            avatar: getUserAvatar(group),
            role: getGroupRole(group, 'me'),
            title: getGroupMemberTitle(group, 'me'),
            isSelf: true
        });
        getGroupMemberContacts(group).forEach((member) => {
            rows.push({
                id: member.id,
                name: member.remark || member.nickname || member.name || '成员',
                baseName: getParticipantBaseName(group, member.id, '成员'),
                nickname: getGroupMemberNickname(group, member.id),
                avatar: member.avatar || '',
                role: getGroupRole(group, member.id),
                title: getGroupMemberTitle(group, member.id),
                isSelf: false,
                contact: member
            });
        });

        memberLists.forEach((memberList) => {
            renderGroupSettingsMemberList(memberList, group, rows, canManageTitles);
        });

        if (String(currentRelationGroupId || '') === String(group.id)) {
            renderGroupMemberRelationsScreen(group);
        }
        if (String(currentMemberDirectoryGroupId || '') === String(group.id)) {
            renderGroupMemberDirectoryScreen(group);
        }
    }

    function closeGroupChatSettings() {
        if (currentMemberDirectoryGroupId) {
            closeGroupMemberDirectoryScreen();
        }
        const modal = document.getElementById('group-chat-settings-modal');
        if (modal) modal.classList.add('hidden');
    }

    function openGroupChatSettings(groupId = window.iphoneSimState && window.iphoneSimState.currentChatContactId) {
        const group = getGroupContact(groupId);
        if (!group) return;
        renderGroupChatSettings(group);
        const modal = document.getElementById('group-chat-settings-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function persistGroupSettings(groupId = currentSettingsGroupId, options = {}) {
        const group = getGroupContact(groupId || currentSettingsGroupId);
        if (!group) return null;
        currentSettingsGroupId = group.id;
        const nameInput = getPrimaryGroupSettingsNode('name');
        const memorySelect = getPrimaryGroupSettingsNode('memory-mode');
        const announcementInput = getPrimaryGroupSettingsNode('announcement');
        const contextLimitInput = document.getElementById('chat-setting-context-limit');
        const realTimeVisibleInput = document.getElementById('chat-setting-real-time-visible');
        const calendarAwareInput = document.getElementById('chat-setting-calendar-aware');
        const nextName = String(nameInput && nameInput.value ? nameInput.value : '').trim() || getGroupChatDisplayName(group);
        const nextMemoryMode = String(memorySelect && memorySelect.value ? memorySelect.value : '') === 'bidirectional'
            ? 'bidirectional'
            : 'group_only';
        const nextAnnouncement = String(announcementInput && announcementInput.value ? announcementInput.value : '').trim();
        group.groupMeta.memoryMode = nextMemoryMode;
        if (contextLimitInput) {
            const rawContextLimit = String(contextLimitInput.value || '').trim();
            const parsedContextLimit = rawContextLimit ? parseInt(rawContextLimit, 10) : 0;
            group.contextLimit = Number.isFinite(parsedContextLimit) && parsedContextLimit > 0 ? parsedContextLimit : 0;
        }
        if (realTimeVisibleInput) {
            group.realTimeVisible = !!realTimeVisibleInput.checked;
        }
        if (calendarAwareInput) {
            group.calendarAwareEnabled = !!calendarAwareInput.checked;
        }
        let renamed = false;
        let announcementChanged = false;
        if (canParticipantRenameGroup(group, 'me')) {
            const renameResult = applyGroupRename(group, 'me', nextName, { actorName: '你', showNotice: nextName !== getGroupChatDisplayName(group) });
            renamed = !!(renameResult && renameResult.ok && renameResult.changed);
        }
        if (announcementInput && canParticipantManageAnnouncement(group, 'me')) {
            const announcementResult = applyGroupAnnouncement(group, 'me', nextAnnouncement, {
                actorName: '你',
                showNotice: !options.silent
            });
            announcementChanged = !!(announcementResult && announcementResult.ok && announcementResult.changed);
        }
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        refreshGroupChatVisualState(group);
        if (!options.skipSave && typeof saveConfig === 'function') saveConfig();
        if (!options.skipContactList && typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }
        if (!options.silent) {
            if (renamed || announcementChanged) {
                showGroupToast('群资料已保存');
            } else {
                showGroupToast('群设置已保存');
            }
        }
        if (!options.skipRender) {
            renderGroupChatSettings(group);
        }
        return {
            ok: true,
            group,
            renamed,
            announcementChanged
        };
    }

    function handleSetGroupMemberNickname(groupId, targetId) {
        const group = getGroupContact(groupId);
        if (!group) return;
        const currentNickname = getGroupMemberNickname(group, targetId);
        const targetName = getParticipantBaseName(group, targetId, '群成员');
        const nextNickname = prompt(`给 ${targetName}${targetId === 'me' ? '（你自己）' : ''} 设置群昵称（留空为取消）`, currentNickname || '');
        if (nextNickname === null) return;
        const result = applyGroupMemberNickname(group, targetId, nextNickname);
        if (!result || !result.ok) {
            showGroupToast('设置群昵称失败');
            return;
        }
        showGroupToast(result.nickname ? '群昵称已更新' : '群昵称已取消');
    }

    function handleSetGroupMemberTitle(groupId, targetId) {
        const group = getGroupContact(groupId);
        if (!group || !canParticipantManageTitles(group, 'me')) return;
        const currentTitle = getGroupMemberTitle(group, targetId);
        const targetName = getParticipantName(group, targetId, '群成员');
        const nextTitle = prompt(`给 ${targetName} 设置群头衔（留空为取消）`, currentTitle || '');
        if (nextTitle === null) return;
        const result = applyGroupMemberTitle(group, 'me', targetId, nextTitle, { actorName: '你', showNotice: true });
        if (!result || !result.ok) {
            showGroupToast('设置群头衔失败');
            return;
        }
        showGroupToast(result.title ? '群头衔已更新' : '群头衔已取消');
    }

    function handleInviteGroupMembers(groupId) {
        const group = getGroupContact(groupId);
        if (!group) return;
        const eligibleContacts = getEligibleDirectContacts(getGroupMemberIds(group));
        if (eligibleContacts.length === 0) {
            showGroupToast('没有可邀请的新联系人');
            return;
        }
        openContactMultiPicker({
            title: '邀请联系人进群',
            confirmText: '邀请加入',
            contacts: eligibleContacts,
            onConfirm: (memberIds) => {
                const modal = document.getElementById('contact-picker-modal');
                if (modal) modal.classList.add('hidden');
                const currentIds = getGroupMemberIds(group);
                const currentIdKeys = new Set(currentIds.map(id => getParticipantIdKey(id)));
                const selectedIds = normalizeDirectMemberIds(memberIds);
                const invitedIds = selectedIds.filter(id => !currentIdKeys.has(getParticipantIdKey(id)));
                if (invitedIds.length === 0) {
                    showGroupToast('请选择至少一位新成员');
                    return;
                }
                group.groupMeta.memberIds = normalizeDirectMemberIds([...currentIds, ...invitedIds]);
                const memberKeySet = new Set(group.groupMeta.memberIds.map(id => getParticipantIdKey(id)));
                group.groupMeta.pendingInviteMemberIds = normalizeDirectMemberIds(invitedIds)
                    .filter(id => memberKeySet.has(getParticipantIdKey(id)))
                    .slice(0, 12);
                group.groupMeta.lastInviteAt = Date.now();
                if (typeof window.ensureGroupChatMeta === 'function') {
                    window.ensureGroupChatMeta(group);
                }
                refreshGroupChatVisualState(group);
                const names = invitedIds.map(id => getParticipantName(group, id)).join('、');
                pushVisibleGroupSystemNotice(group.id, `${names} 加入了群聊`);
                if (typeof saveConfig === 'function') saveConfig();
                renderGroupChatSettings(group);
                if (typeof window.renderContactList === 'function') {
                    window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
                }
                if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
                    window.renderChatHistory(group.id, true);
                }
            }
        });
    }

    function handleToggleGroupAdmin(groupId, targetId) {
        const group = getGroupContact(groupId);
        if (!group || !canCurrentUserManageAdmins(group)) return;
        const result = applyGroupAdminRole(group, 'me', targetId, undefined, { actorName: '你', showNotice: true });
        if (!result || !result.ok) {
            showGroupToast('管理员设置失败');
            return;
        }
    }

    function handleTransferGroupOwner(groupId, targetId) {
        const group = getGroupContact(groupId);
        if (!group || getGroupRole(group, 'me') !== 'owner') return;
        if (!targetId || !confirm(`确认把群主转让给 ${getParticipantName(group, targetId)}？`)) return;
        const result = applyGroupOwnerTransfer(group, 'me', targetId, { actorName: '你', showNotice: true });
        if (!result || !result.ok) {
            showGroupToast('转让群主失败');
            return;
        }
    }

    function handleRemoveGroupMember(groupId, targetId) {
        const group = getGroupContact(groupId);
        if (!group || !canCurrentUserManageMembers(group)) return;
        const safeTargetId = normalizeDirectMemberId(targetId) || normalizeParticipantId(targetId);
        const targetKey = getParticipantIdKey(safeTargetId);
        if (!targetKey || targetKey === getParticipantIdKey(group.groupMeta.ownerId)) {
            showGroupToast('不能直接移除群主');
            return;
        }
        const name = getParticipantName(group, safeTargetId);
        if (!confirm(`确认将 ${name} 移出群聊？`)) return;
        const removed = removeGroupMemberFromMeta(group, safeTargetId);
        if (!removed || !removed.ok) {
            showGroupToast('移除失败：未找到该成员');
            return;
        }
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        pushVisibleGroupSystemNotice(group.id, `${name} 被移出了群聊`);
        if (typeof saveConfig === 'function') saveConfig();
        renderGroupChatSettings(group);
        if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(group.id, true);
        }
    }

    function leaveOrCloseGroupChat(groupId, reason = 'left') {
        const group = getGroupContact(groupId);
        if (!group) return;
        group.groupMeta.status = reason === 'dissolved' ? 'dissolved' : 'left';
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        if (typeof saveConfig === 'function') saveConfig();
        closeGroupChatSettings();
        if (String(currentRelationGroupId || '') === String(group.id)) {
            closeGroupMemberRelationsScreen();
        }
        if (String(currentMemberDirectoryGroupId || '') === String(group.id)) {
            closeGroupMemberDirectoryScreen();
        }
        const chatSettingsScreen = document.getElementById('chat-settings-screen');
        if (chatSettingsScreen && !chatSettingsScreen.classList.contains('hidden')) {
            chatSettingsScreen.classList.add('hidden');
            if (typeof window.setChatSettingsFloatingSaveVisible === 'function') {
                window.setChatSettingsFloatingSaveVisible(false);
            }
        }
        if (String(window.iphoneSimState.currentChatContactId) === String(group.id)) {
            const chatScreen = document.getElementById('chat-screen');
            if (chatScreen) chatScreen.classList.add('hidden');
            window.iphoneSimState.currentChatContactId = null;
        }
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }
    }

    function handleExitGroup(groupId) {
        const group = getGroupContact(groupId);
        if (!group) return;
        if (getGroupRole(group, 'me') === 'owner') {
            showGroupToast('请先转让群主或直接解散群聊');
            return;
        }
        pushVisibleGroupSystemNotice(group.id, '你退出了群聊');
        leaveOrCloseGroupChat(group.id, 'left');
    }

    function handleDissolveGroup(groupId) {
        const group = getGroupContact(groupId);
        if (!group || getGroupRole(group, 'me') !== 'owner') return;
        if (!confirm(`确认解散群聊“${getGroupChatDisplayName(group)}”？`)) return;
        pushVisibleGroupSystemNotice(group.id, '群聊已解散');
        leaveOrCloseGroupChat(group.id, 'dissolved');
    }

    function bindGroupChatUi() {
        const openBtn = document.getElementById('choose-create-group-chat');
        const closeCreateBtn = document.getElementById('close-group-chat-create');
        const selectMembersBtn = document.getElementById('group-chat-select-members-btn');
        const createBtn = document.getElementById('group-chat-create-btn');
        const createAvatarPreview = document.getElementById('group-chat-avatar-preview');
        const createAvatarInput = document.getElementById('group-chat-avatar-upload');
        const closeSettingsBtn = document.getElementById('close-group-chat-settings');
        const closeMemberDirectoryBtn = document.getElementById('close-group-member-directory');
        const closeMemberDirectoryModalBtn = document.getElementById('close-group-member-directory-modal');
        const memberDirectoryModal = document.getElementById('group-member-directory-modal');
        const closeMemberRelationsBtn = document.getElementById('close-group-member-relations');
        const editMemberRelationsNotesBtn = document.getElementById('group-member-relations-notes-btn');
        const addMemberRelationsBtn = document.getElementById('group-member-relations-add-btn');
        const closeMemberRelationsPickerBtn = document.getElementById('close-group-member-relations-picker');
        const closeMemberRelationsPickerMask = document.getElementById('close-group-member-relations-picker-mask');
        const relationCanvas = document.getElementById('group-member-relations-canvas');
        if (openBtn) openBtn.addEventListener('click', openGroupCreateModal);
        if (closeCreateBtn) closeCreateBtn.addEventListener('click', closeGroupCreateModal);
        if (selectMembersBtn) selectMembersBtn.addEventListener('click', openGroupCreateMemberPicker);
        if (createBtn) createBtn.addEventListener('click', handleCreateGroupChat);

        if (createAvatarPreview && createAvatarInput) {
            createAvatarPreview.addEventListener('click', () => createAvatarInput.click());
            createAvatarInput.addEventListener('change', async (event) => {
                const file = event.target.files && event.target.files[0];
                if (!file) return;
                try {
                    const dataUrl = await readFileAsDataUrl(file);
                    createState.avatarDataUrl = dataUrl;
                    createAvatarPreview.style.backgroundImage = `url(${dataUrl})`;
                    createAvatarPreview.innerHTML = '';
                } catch (error) {
                    console.error('群头像读取失败', error);
                    showGroupToast('群头像读取失败');
                }
            });
        }

        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeGroupChatSettings);
        getGroupSettingsActionNodes('save').forEach((button) => {
            if (button.dataset.groupSettingsSaveBound === '1') return;
            button.dataset.groupSettingsSaveBound = '1';
            button.addEventListener('click', () => persistGroupSettings());
        });
        getGroupSettingsActionNodes('invite').forEach((button) => {
            if (button.dataset.groupSettingsInviteBound === '1') return;
            button.dataset.groupSettingsInviteBound = '1';
            button.addEventListener('click', () => handleInviteGroupMembers(currentSettingsGroupId));
        });
        getGroupSettingsActionNodes('save-announcement').forEach((button) => {
            if (button.dataset.groupSettingsSaveAnnouncementBound === '1') return;
            button.dataset.groupSettingsSaveAnnouncementBound = '1';
            button.addEventListener('click', () => persistGroupSettings(currentSettingsGroupId, { silent: false }));
        });
        getGroupSettingsActionNodes('clear-pin').forEach((button) => {
            if (button.dataset.groupSettingsClearPinBound === '1') return;
            button.dataset.groupSettingsClearPinBound = '1';
            button.addEventListener('click', () => {
                const group = getGroupContact(currentSettingsGroupId);
                if (!group) return;
                const result = setGroupPinnedMessage(group, 'me', '', { showNotice: true, actorName: '你' });
                if (!result || !result.ok) {
                    showGroupToast('取消置顶失败');
                    return;
                }
                renderGroupChatSettings(group);
                if (!result.changed) {
                    showGroupToast('当前没有置顶消息');
                }
            });
        });
        getGroupSettingsActionNodes('exit').forEach((button) => {
            if (button.dataset.groupSettingsExitBound === '1') return;
            button.dataset.groupSettingsExitBound = '1';
            button.addEventListener('click', () => handleExitGroup(currentSettingsGroupId));
        });
        getGroupSettingsActionNodes('dissolve').forEach((button) => {
            if (button.dataset.groupSettingsDissolveBound === '1') return;
            button.dataset.groupSettingsDissolveBound = '1';
            button.addEventListener('click', () => handleDissolveGroup(currentSettingsGroupId));
        });
        getGroupSettingsActionNodes('manage-relations').forEach((button) => {
            if (button.dataset.groupSettingsManageRelationsBound === '1') return;
            button.dataset.groupSettingsManageRelationsBound = '1';
            button.addEventListener('click', () => openGroupMemberRelationsScreen(currentSettingsGroupId));
        });

        if (closeMemberDirectoryBtn && closeMemberDirectoryBtn.dataset.bound !== '1') {
            closeMemberDirectoryBtn.dataset.bound = '1';
            closeMemberDirectoryBtn.addEventListener('click', closeGroupMemberDirectoryScreen);
        }
        if (closeMemberDirectoryModalBtn && closeMemberDirectoryModalBtn.dataset.bound !== '1') {
            closeMemberDirectoryModalBtn.dataset.bound = '1';
            closeMemberDirectoryModalBtn.addEventListener('click', () => closeGroupMemberDirectoryModal());
        }
        if (memberDirectoryModal && memberDirectoryModal.dataset.bound !== '1') {
            memberDirectoryModal.dataset.bound = '1';
            memberDirectoryModal.addEventListener('click', (event) => {
                if (event.target === memberDirectoryModal) {
                    closeGroupMemberDirectoryModal();
                }
            });
        }

        if (closeMemberRelationsBtn && closeMemberRelationsBtn.dataset.bound !== '1') {
            closeMemberRelationsBtn.dataset.bound = '1';
            closeMemberRelationsBtn.addEventListener('click', closeGroupMemberRelationsScreen);
        }
        if (editMemberRelationsNotesBtn && editMemberRelationsNotesBtn.dataset.bound !== '1') {
            editMemberRelationsNotesBtn.dataset.bound = '1';
            editMemberRelationsNotesBtn.addEventListener('click', async () => {
                const group = getGroupContact(currentRelationGroupId);
                if (!group) return;
                const currentNotes = getGroupRelationshipNotes(group);
                const result = await openGroupActionEditorModal({
                    kicker: 'RELATION NOTES',
                    title: '关系补充说明',
                    subtitle: '会注入群聊 prompt，用于补充成员之间的长期关系背景。',
                    confirmText: '保存',
                    fields: [
                        {
                            id: 'relationship-notes',
                            label: '补充说明',
                            type: 'textarea',
                            rows: 5,
                            maxLength: 500,
                            placeholder: '例如：A 和 B 经常斗嘴，但彼此很信任；C 是组织活动的人。',
                            value: currentNotes
                        }
                    ],
                    validate: (values) => {
                        const notes = normalizeGroupRelationshipNotes(values['relationship-notes'] || '');
                        if (notes.length > 500) {
                            return { ok: false, message: '补充说明最多 500 字' };
                        }
                        return { ok: true };
                    }
                });
                if (!result || !result.confirmed) return;
                const saveResult = setGroupRelationshipNotes(group, result.values['relationship-notes'] || '');
                if (!saveResult.ok) {
                    showGroupToast('保存关系补充说明失败');
                    return;
                }
                updateGroupMemberRelationsNotesButton(group);
                showGroupMemberRelationsToast(saveResult.notes ? '关系补充说明已保存' : '已清空关系补充说明', 1800);
            });
        }
        if (addMemberRelationsBtn && addMemberRelationsBtn.dataset.bound !== '1') {
            addMemberRelationsBtn.dataset.bound = '1';
            addMemberRelationsBtn.addEventListener('click', () => {
                if (!currentRelationGroupId) return;
                renderGroupMemberRelationsPicker(currentRelationGroupId);
                const { picker } = getGroupMemberRelationsElements();
                if (picker) picker.classList.remove('hidden');
            });
        }
        if (closeMemberRelationsPickerBtn && closeMemberRelationsPickerBtn.dataset.bound !== '1') {
            closeMemberRelationsPickerBtn.dataset.bound = '1';
            closeMemberRelationsPickerBtn.addEventListener('click', closeGroupMemberRelationsPicker);
        }
        if (closeMemberRelationsPickerMask && closeMemberRelationsPickerMask.dataset.bound !== '1') {
            closeMemberRelationsPickerMask.dataset.bound = '1';
            closeMemberRelationsPickerMask.addEventListener('click', closeGroupMemberRelationsPicker);
        }
        if (relationCanvas && relationCanvas.dataset.bound !== '1') {
            relationCanvas.dataset.bound = '1';
            relationCanvas.addEventListener('click', (event) => {
                if (event.target === relationCanvas || event.target.id === 'group-member-relations-nodes' || event.target.id === 'group-member-relations-svg') {
                    clearSelectedGroupRelationNode();
                }
            });
        }
        if (!document.body.dataset.groupRelationGraphBound) {
            document.body.dataset.groupRelationGraphBound = '1';
            document.addEventListener('pointermove', dragGroupRelationNode);
            document.addEventListener('pointerup', endGroupRelationNodeDrag);
            window.addEventListener('resize', () => {
                if (currentRelationGroupId) {
                    renderGroupMemberRelationsScreen(currentRelationGroupId);
                }
                if (currentMemberDirectoryGroupId) {
                    renderGroupMemberDirectoryScreen(currentMemberDirectoryGroupId);
                }
            });
        }

        [
            {
                preview: document.getElementById('group-settings-avatar-preview'),
                input: document.getElementById('group-settings-avatar-upload')
            },
            {
                preview: getPrimaryGroupSettingsNode('avatar-preview'),
                input: getPrimaryGroupSettingsNode('avatar-upload')
            }
        ].forEach(({ preview, input }) => {
            if (!preview || !input) return;
            if (preview.dataset.groupAvatarPreviewBound !== '1') {
                preview.dataset.groupAvatarPreviewBound = '1';
                const nativeTriggerLabel = preview.closest('label');
                const shouldUseNativeLabelTrigger = !!(
                    nativeTriggerLabel
                    && nativeTriggerLabel.htmlFor
                    && String(nativeTriggerLabel.htmlFor) === String(input.id)
                );
                if (!shouldUseNativeLabelTrigger) {
                    preview.addEventListener('click', () => input.click());
                }
            }
            if (input.dataset.groupAvatarInputBound === '1') return;
            input.dataset.groupAvatarInputBound = '1';
            input.addEventListener('change', async (event) => {
                const file = event.target.files && event.target.files[0];
                const fallbackGroupId = currentSettingsGroupId
                    || (window.iphoneSimState && window.iphoneSimState.currentChatContactId);
                const group = getGroupContact(fallbackGroupId);
                if (!group || !file) return;
                currentSettingsGroupId = group.id;
                const previousAvatar = String(group.groupMeta.avatar || group.avatar || '').trim();
                try {
                    const dataUrl = await readFileAsDataUrl(file);
                    group.groupMeta.avatar = dataUrl;
                    if (typeof window.ensureGroupChatMeta === 'function') {
                        window.ensureGroupChatMeta(group);
                    }
                    refreshGroupChatVisualState(group);
                    if (typeof saveConfig === 'function') saveConfig();
                    renderGroupChatSettings(group);
                    if (dataUrl && dataUrl !== previousAvatar) {
                        pushGroupAvatarUpdateMessage(group, dataUrl, 'me');
                    }
                } catch (error) {
                    console.error('群头像更新失败', error);
                    showGroupToast('群头像更新失败');
                } finally {
                    event.target.value = '';
                }
            });
        });

        bindModalMaskClose('group-chat-create-modal', closeGroupCreateModal);
        bindModalMaskClose('group-chat-settings-modal', closeGroupChatSettings);
    }

    window.GROUP_CHAT_CONTACT_GROUP = GROUP_CHAT_CONTACT_GROUP;
    window.getGroupChatDisplayName = getGroupChatDisplayName;
    window.getGroupRole = getGroupRole;
    window.getGroupMessageSpeakerMeta = getGroupMessageSpeakerMeta;
    window.getGroupMemberContacts = getGroupMemberContacts;
    window.getPendingInviteMemberIds = getPendingInviteMemberIds;
    window.getGroupMemberNickname = getGroupMemberNickname;
    window.getGroupMemberTitle = getGroupMemberTitle;
    window.getGroupAnnouncementText = getGroupAnnouncementText;
    window.getGroupPinnedMessageDisplayData = getGroupPinnedMessageDisplayData;
    window.canGroupParticipantRenameGroup = canParticipantRenameGroup;
    window.canGroupParticipantManageTitles = canParticipantManageTitles;
    window.canGroupParticipantManageMembers = canParticipantManageMembers;
    window.canGroupParticipantManageAdmins = canParticipantManageAdmins;
    window.canGroupParticipantManageAnnouncement = canParticipantManageAnnouncement;
    window.applyGroupMemberNickname = applyGroupMemberNickname;
    window.applyGroupRename = applyGroupRename;
    window.applyGroupAnnouncement = applyGroupAnnouncement;
    window.applyGroupMemberTitle = applyGroupMemberTitle;
    window.applyGroupAdminRole = applyGroupAdminRole;
    window.applyGroupOwnerTransfer = applyGroupOwnerTransfer;
    window.applyGroupMemberLeave = applyGroupMemberLeave;
    window.setGroupPinnedMessage = setGroupPinnedMessage;
    window.toggleGroupPinnedMessage = toggleGroupPinnedMessage;
    window.focusGroupPinnedMessage = focusGroupPinnedMessage;
    window.resolveGroupSpeakerContactId = resolveGroupSpeakerContactId;
    window.decorateGroupChatMessageMeta = decorateGroupChatMessageMeta;
    window.buildGroupAiPromptMessages = buildGroupAiPromptMessages;
    window.consumePendingInviteMembers = consumePendingInviteMembers;
    window.syncGroupRoundToDirectThreads = syncGroupRoundToDirectThreads;
    window.openGroupContactMultiPicker = openContactMultiPicker;
    window.createGroupRedPacket = createGroupRedPacket;
    window.claimGroupRedPacket = claimGroupRedPacket;
    window.handleGroupRedPacketClick = openGroupRedPacketDetail;
    window.openGroupActionEditorModal = openGroupActionEditorModal;
    window.createGroupPoll = createGroupPoll;
    window.voteGroupPoll = voteGroupPoll;
    window.handleGroupPollClick = handleGroupPollClick;
    window.createGroupRelay = createGroupRelay;
    window.joinGroupRelay = joinGroupRelay;
    window.handleGroupRelayClick = handleGroupRelayClick;
    window.createGroupPrivateChatInvite = createGroupPrivateChatInvite;
    window.handleGroupPrivateChatInviteClick = openGroupPrivateChatInvite;
    window.openGroupChatSettings = openGroupChatSettings;
    window.openGroupMemberRelationsScreen = openGroupMemberRelationsScreen;
    window.openGroupMemberDirectoryScreen = openGroupMemberDirectoryScreen;
    window.renderGroupChatSettings = renderGroupChatSettings;
    window.persistGroupSettings = persistGroupSettings;
    window.isGroupChatActive = isGroupActive;

    bindGroupChatUi();
})();
