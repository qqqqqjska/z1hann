# JavaScript 文件目录说明

本项目将原有的 `script.js` 拆分为多个模块化文件，以便于维护和扩展。以下是每个文件的功能说明：

## 1. `js/core.js` (核心模块)
**职责**: 负责全局状态管理、应用初始化、通用工具函数和数据持久化。
**主要内容**:
- **State**: 定义全局 `state` 对象 (挂载为 `window.iphoneSimState`)。
- **Init**: `init()` 函数，负责按顺序初始化所有模块。
- **Utils**: `compressImage`, `showChatToast`, `showNotification` 等通用工具。
- **Data**: `saveConfig`, `loadConfig`, `exportJSON`, `importJSON`, `handleClearAllData`。
- **System**: `setupIOSFullScreen`, `handleAppClick`。

## 2. `js/chat.js` (聊天模块)
**职责**: 处理微信聊天核心逻辑、联系人管理、AI 对话生成及语音通话功能。
**主要内容**:
- **Chat**: `openChat`, `sendMessage`, `renderChatHistory`, `generateAiReply`。
- **Contacts**: `renderContactList`, `handleSaveContact`, `openChatSettings`。
- **Voice**: `toggleVoiceRecording`, `handleSendRealVoice` (录音), `openVoiceCallScreen` (通话界面), `startVoiceCallVAD` (语音活动检测)。
- **AI**: `setupAiListeners` (API设置), `generateMinimaxTTS` (语音合成)。
- **Profile**: `openAiProfile`, `renderAiProfile` (资料卡)。

## 3. `js/home.js` (主页/网格模块)
**职责**: 管理手机主屏幕的图标布局、拖拽交互和组件库。
**主要内容**:
- **Grid**: `initGrid`, `renderItems` (渲染主屏图标)。
- **Drag & Drop**: `handleDragStart`, `handleDrop` (图标拖拽逻辑)。
- **Library**: `renderLibrary`, `addToScreen` (小组件库管理)。
- **Edit Mode**: `toggleEditMode` (进入/退出编辑模式)。

## 4. `js/theme.js` (美化模块)
**职责**: 处理系统外观自定义，包括字体、壁纸、图标和 CSS。
**主要内容**:
- **Font**: `applyFont`, `handleFontUpload`, `handleSaveFontPreset`。
- **Wallpaper**: `applyWallpaper`, `handleWallpaperUpload`, `renderWallpaperGallery`。
- **Icons**: `applyIcons`, `renderIconSettings`, `handleIconUpload`。
- **CSS**: `applyCSS`, `initThemeCustomizer` (主题自定义器)。

## 5. `js/meeting.js` (见面模块)
**职责**: 处理线下见面模拟功能，包括剧情生成和记录管理。
**主要内容**:
- **List**: `openMeetingsScreen`, `renderMeetingsList`。
- **Detail**: `openMeetingDetail`, `renderMeetingCards` (渲染剧情卡片)。
- **Action**: `createNewMeeting`, `handleSendMeetingText`, `handleMeetingAI` (AI续写)。
- **Settings**: `saveMeetingStyle`, `initMeetingTheme` (见面模式专属美化)。

## 6. `js/worldbook.js` (世界书模块)
**职责**: 管理世界书设定，用于增强 AI 的角色扮演上下文。
**主要内容**:
- **Category**: `renderWorldbookCategoryList`, `handleSaveCategory`。
- **Entry**: `renderWorldbookEntryList`, `handleSaveWorldbookEntry` (条目增删改)。
- **Logic**: `toggleWorldbookEntry` (启用/禁用条目)。

## 7. `js/apps.js` (应用集合模块)
**职责**: 包含除聊天外的其他独立应用功能。
**主要内容**:
- **Moments**: `renderMoments`, `handlePostMoment`, `addMoment` (朋友圈)。
- **Wallet**: `renderWallet`, `handleRecharge`, `handleTransferClick` (钱包与转账)。
- **Memory**: `openMemoryApp`, `generateSummary` (记忆碎片与自动总结)。
- **Itinerary**: `generateDailyItinerary`, `openLocationApp` (行程生成)。
- **Music**: `initMusicWidget`, `playSong`, `openMusicSettings` (音乐播放器)。
- **Polaroid**: `initPolaroidWidget` (拍立得组件)。
- **Sticker**: `initStickerSystem` (表情包管理)。
- **Persona**: `openPersonaManage` (用户多身份管理)。

## 加载顺序
在 `index.html` 中，文件应按以下顺序加载以确保依赖关系正确：
1. `js/core.js` (必须最先加载，定义 state)
2. `js/theme.js`
3. `js/worldbook.js`
4. `js/meeting.js`
5. `js/apps.js`
6. `js/home.js`
7. `js/chat.js` (依赖较多，建议后加载)
