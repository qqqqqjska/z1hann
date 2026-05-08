(function () {



    const STUDIO_TOOLBAR_COLLAPSED_SIZE = 56;



    const STUDIO_TOOLBAR_EDGE_GAP = 14;



    const STUDIO_TOOLBAR_TOP_GAP = 12;



    const STUDIO_TOOLBAR_FALLBACK_WIDTH = 393;



    const STUDIO_TOOLBAR_FALLBACK_TOP = 96;







    const TOOLBAR_STYLE = ":root {\r\n            /* iOS 简约黑白灰清透配色 */\r\n            --bg-color: #f5f5f7;\r\n            --glass-bg: rgba(255, 255, 255, 0.65);\r\n            --glass-border: rgba(255, 255, 255, 0.4);\r\n            --text-main: #1d1d1f;\r\n            --text-muted: #86868b;\r\n            --accent: #007aff;\r\n            --shadow-sm: 0 4px 15px rgba(0, 0, 0, 0.04);\r\n            --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.08);\r\n            --radius-lg: 24px;\r\n            --radius-md: 16px;\r\n            --radius-sm: 10px;\r\n            --transition-bounce: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);\r\n            --transition-smooth: 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);\r\n        }\r\n\r\n        * {\r\n            box-sizing: border-box;\r\n            margin: 0;\r\n            padding: 0;\r\n            user-select: none;\r\n            font-family: -apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Helvetica Neue\", \"PingFang SC\", sans-serif;\r\n            -webkit-tap-highlight-color: transparent;\r\n        }\r\n\r\n        body {\r\n            background-color: var(--bg-color);\r\n            /* 模拟一个清新的背景，让磨砂玻璃效果更明显 */\r\n            background-image: \r\n                radial-gradient(at 20% 30%, rgba(0, 122, 255, 0.05) 0px, transparent 50%),\r\n                radial-gradient(at 80% 80%, rgba(0, 0, 0, 0.03) 0px, transparent 50%),\r\n                radial-gradient(at 50% 50%, rgba(255, 255, 255, 0.8) 0px, transparent 50%);\r\n            height: 100vh;\r\n            overflow: hidden;\r\n            display: flex;\r\n            justify-content: center;\r\n            align-items: center;\r\n        }\r\n\r\n        /* 背景装饰字 */\r\n        .bg-watermark {\r\n            position: absolute;\r\n            font-size: 12vw;\r\n            font-weight: 800;\r\n            color: rgba(0,0,0,0.02);\r\n            font-family: \"SF Pro Display\", sans-serif;\r\n            letter-spacing: -2px;\r\n            pointer-events: none;\r\n            z-index: 0;\r\n        }\r\n\r\n        /* ---------------- 工具栏主容器 ---------------- */\r\n        .toolbar-container {\r\n            position: absolute;\r\n            width: 340px;\r\n            /* 动态高度 */\r\n            max-height: 85vh;\r\n            background: var(--glass-bg);\r\n            /* 磨砂玻璃效果 */\r\n            backdrop-filter: blur(30px) saturate(150%);\r\n            -webkit-backdrop-filter: blur(30px) saturate(150%);\r\n            border: 1px solid var(--glass-border);\r\n            border-radius: var(--radius-lg);\r\n            box-shadow: var(--shadow-lg);\r\n            display: flex;\r\n            flex-direction: column;\r\n            transition: height var(--transition-bounce), width var(--transition-smooth), border-radius var(--transition-smooth), box-shadow var(--transition-smooth);\r\n            overflow: hidden;\r\n            z-index: 100;\r\n            /* 居中偏右初始位置 */\r\n            top: 50px;\r\n            right: 50px;\r\n        }\r\n\r\n        .toolbar-container.collapsed {\r\n            height: 56px !important;\r\n            width: 56px;\r\n            border-radius: 50%;\r\n            box-shadow: 0 6px 16px rgba(0,0,0,0.12);\r\n            border: 1px solid rgba(255,255,255,0.6);\r\n            /* 悬浮球居中显示内容 */\r\n            justify-content: center;\r\n            align-items: center;\r\n        }\r\n\r\n        /* ---------------- 顶部导航栏 ---------------- */\r\n        .toolbar-nav {\r\n            display: flex;\r\n            gap: 4px;\r\n            padding: 10px 16px 0;\r\n            background: rgba(255, 255, 255, 0.1);\r\n            border-bottom: 1px solid rgba(0,0,0,0.03);\r\n            overflow-x: auto;\r\n            scrollbar-width: none;\r\n            transition: opacity 0.2s ease;\r\n        }\r\n\r\n        .collapsed .toolbar-nav {\r\n            display: none;\r\n        }\r\n        \r\n        .toolbar-nav::-webkit-scrollbar {\r\n            display: none;\r\n        }\r\n\r\n        .nav-item {\r\n            padding: 8px 12px;\r\n            font-size: 12px;\r\n            font-weight: 600;\r\n            color: var(--text-muted);\r\n            cursor: pointer;\r\n            border-radius: 12px 12px 0 0;\r\n            transition: all 0.2s ease;\r\n            white-space: nowrap;\r\n            position: relative;\r\n            font-family: \"SF Pro Text\", \"PingFang SC\", sans-serif;\r\n            display: flex;\r\n            align-items: center;\r\n            gap: 4px;\r\n        }\r\n\r\n        .nav-item i {\r\n            font-size: 14px;\r\n        }\r\n\r\n        .nav-item:hover {\r\n            color: var(--text-main);\r\n            background: rgba(0,0,0,0.03);\r\n        }\r\n\r\n        .nav-item.active {\r\n            color: var(--accent);\r\n            background: rgba(255, 255, 255, 0.6);\r\n            box-shadow: 0 -2px 6px rgba(0,0,0,0.02);\r\n        }\r\n\r\n        .nav-item.active::after {\r\n            content: '';\r\n            position: absolute;\r\n            bottom: -1px;\r\n            left: 50%;\r\n            transform: translateX(-50%);\r\n            width: 20px;\r\n            height: 3px;\r\n            background: var(--accent);\r\n            border-radius: 3px 3px 0 0;\r\n        }\r\n\r\n        /* ---------------- 头部 / 拖拽区 ---------------- */\r\n        .toolbar-header {\r\n            display: flex;\r\n            align-items: center;\r\n            justify-content: space-between;\r\n            padding: 16px 20px;\r\n            cursor: grab;\r\n            background: rgba(255,255,255,0.2);\r\n            border-bottom: 1px solid rgba(0,0,0,0.03);\r\n            position: relative;\r\n            transition: all 0.3s ease;\r\n            width: 100%;\r\n        }\r\n\r\n        .collapsed .toolbar-header {\r\n            padding: 0;\r\n            justify-content: center;\r\n            background: transparent;\r\n            border-bottom: none;\r\n            height: 100%;\r\n        }\r\n\r\n        .toolbar-header:active {\r\n            cursor: grabbing;\r\n        }\r\n        /* 取消整个拖拽区的干扰缩放，只需换cursor */\r\n\r\n        .header-title {\r\n            font-size: 15px;\r\n            font-weight: 600;\r\n            color: var(--text-main);\r\n            display: flex;\r\n            align-items: center;\r\n            gap: 8px;\r\n            font-family: \"SF Pro Display\", \"PingFang SC\", sans-serif;\r\n            letter-spacing: 0.3px;\r\n            transition: opacity 0.2s ease;\r\n        }\r\n\r\n        .collapsed .header-title {\r\n            display: none;\r\n        }\r\n\r\n        .header-title i {\r\n            color: var(--text-main);\r\n            font-size: 18px;\r\n            opacity: 0.8;\r\n        }\r\n\r\n        /* 呼吸小圆点动效 */\r\n        @keyframes pulse {\r\n            0% { box-shadow: 0 0 0 0 rgba(29, 29, 31, 0.2); }\r\n            70% { box-shadow: 0 0 0 6px rgba(29, 29, 31, 0); }\r\n            100% { box-shadow: 0 0 0 0 rgba(29, 29, 31, 0); }\r\n        }\r\n\r\n        .active-dot {\r\n            width: 5px;\r\n            height: 5px;\r\n            background: var(--text-main);\r\n            border-radius: 50%;\r\n            animation: pulse 2s infinite;\r\n            margin-left: 4px;\r\n        }\r\n\r\n        .header-actions {\r\n            display: flex;\r\n            gap: 12px;\r\n        }\r\n        \r\n        .collapsed .header-actions {\r\n            width: 100%;\r\n            height: 100%;\r\n            justify-content: center;\r\n            align-items: center;\r\n        }\r\n\r\n        .action-btn {\r\n            background: rgba(0,0,0,0.05);\r\n            border: none;\r\n            width: 28px;\r\n            height: 28px;\r\n            border-radius: 50%;\r\n            display: flex;\r\n            align-items: center;\r\n            justify-content: center;\r\n            cursor: pointer;\r\n            color: var(--text-muted);\r\n            /* 移除过渡干扰 */\r\n            transition: background 0.2s, color 0.2s;\r\n        }\r\n        \r\n        .collapsed .action-btn {\r\n            width: 100%;\r\n            height: 100%;\r\n            border-radius: 50%;\r\n            background: transparent;\r\n            color: var(--accent);\r\n            cursor: grab;\r\n        }\r\n\r\n        .collapsed .action-btn:active {\r\n            cursor: grabbing;\r\n        }\r\n        \r\n        .collapsed .action-btn i {\r\n            font-size: 24px;\r\n        }\r\n\r\n        .action-btn:hover {\r\n            background: rgba(0,0,0,0.08);\r\n            color: var(--text-main);\r\n        }\r\n        \r\n        .collapsed .action-btn:hover {\r\n            background: rgba(0,0,0,0.04);\r\n            color: var(--accent);\r\n        }\r\n\r\n        /* 去掉缩放，防止拖动时失去焦点 */\r\n        /* ---------------- 内容区 ---------------- */\r\n        .toolbar-content {\r\n            flex: 1;\r\n            overflow-y: auto;\r\n            padding: 20px;\r\n            opacity: 1;\r\n            transition: opacity 0.3s ease;\r\n        }\r\n\r\n        .collapsed .toolbar-content {\r\n            opacity: 0;\r\n            pointer-events: none;\r\n        }\r\n\r\n        /* 自定义滚动条 */\r\n        .toolbar-content::-webkit-scrollbar {\r\n            width: 0px; /* 隐藏滚动条以追求极致简约 */\r\n        }\r\n\r\n        /* ---------------- 模块区块 ---------------- */\r\n        .section {\r\n            display: none; /* 默认隐藏，通过 JS 控制显示 */\r\n            margin-bottom: 24px;\r\n            background: rgba(255, 255, 255, 0.6);\r\n            border-radius: var(--radius-md);\r\n            padding: 16px;\r\n            box-shadow: var(--shadow-sm);\r\n            border: 1px solid rgba(255, 255, 255, 0.8);\r\n            transition: transform 0.2s ease;\r\n            animation: fadeIn 0.3s ease-out;\r\n        }\r\n        \r\n        .section.active {\r\n            display: block;\r\n        }\r\n\r\n        @keyframes fadeIn {\r\n            from { opacity: 0; transform: translateY(6px); }\r\n            to { opacity: 1; transform: translateY(0); }\r\n        }\r\n        \r\n        .section:hover {\r\n            transform: translateY(-2px);\r\n        }\r\n\r\n        .section:last-child {\r\n            margin-bottom: 0;\r\n        }\r\n\r\n        .section-title {\r\n            font-size: 11px;\r\n            font-weight: 700;\r\n            color: var(--text-muted);\r\n            text-transform: uppercase;\r\n            letter-spacing: 1.2px;\r\n            margin-bottom: 16px;\r\n            display: flex;\r\n            align-items: center;\r\n            gap: 6px;\r\n            font-family: \"SF Pro Text\", sans-serif;\r\n        }\r\n\r\n        .section-title i {\r\n            font-size: 14px;\r\n            font-weight: normal;\r\n        }\r\n\r\n        /* ---------------- 控件区域与样式 ---------------- */\r\n        .settings-container {\r\n            display: flex;\r\n            flex-direction: column;\r\n            gap: 14px;\r\n        }\r\n        \r\n        .control-group {\r\n            margin-bottom: 0;\r\n            padding-bottom: 14px;\r\n            border-bottom: 1px solid rgba(0,0,0,0.03);\r\n        }\r\n        .control-group:last-child {\r\n            border-bottom: none;\r\n            padding-bottom: 0;\r\n        }\r\n\r\n        .control-label {\r\n            font-size: 13px;\r\n            color: var(--text-main);\r\n            margin-bottom: 10px;\r\n            display: flex;\r\n            justify-content: space-between;\r\n            font-weight: 500;\r\n            align-items: center;\r\n        }\r\n\r\n        /* 颜色选择器与值显示并排 */\r\n        .color-val-wrap {\r\n            display: flex;\r\n            align-items: center;\r\n            gap: 8px;\r\n        }\r\n\r\n        input[type=\"color\"] {\r\n            -webkit-appearance: none;\r\n            border: none;\r\n            width: 22px;\r\n            height: 22px;\r\n            border-radius: 6px;\r\n            cursor: pointer;\r\n            padding: 0;\r\n            background: transparent;\r\n            box-shadow: 0 1px 3px rgba(0,0,0,0.1);\r\n        }\r\n        \r\n        input[type=\"color\"]::-webkit-color-swatch-wrapper {\r\n            padding: 0;\r\n        }\r\n\r\n        input[type=\"color\"]::-webkit-color-swatch {\r\n            border: 1px solid rgba(0,0,0,0.1);\r\n            border-radius: 6px;\r\n        }\r\n\r\n        .value-display {\r\n            font-size: 12px;\r\n            color: var(--text-muted);\r\n            background: rgba(0,0,0,0.04);\r\n            padding: 2px 8px;\r\n            border-radius: 10px;\r\n            font-family: \"SF Pro Text\", monospace;\r\n        }\r\n\r\n        /* 分段控制器 (Tabs) */\r\n        .segmented-control {\r\n            display: flex;\r\n            background: rgba(118, 118, 128, 0.12);\r\n            border-radius: 9px;\r\n            padding: 2px;\r\n            margin-bottom: 20px;\r\n            position: relative;\r\n        }\r\n\r\n        .segment {\r\n            flex: 1;\r\n            text-align: center;\r\n            padding: 6px 0;\r\n            font-size: 12px;\r\n            font-weight: 500;\r\n            color: var(--text-main);\r\n            cursor: pointer;\r\n            border-radius: 7px;\r\n            transition: all 0.25s ease;\r\n            position: relative;\r\n            z-index: 1;\r\n        }\r\n\r\n        .segment.active {\r\n            background: #ffffff;\r\n            color: var(--text-main);\r\n            box-shadow: 0 3px 8px rgba(0,0,0,0.12), 0 3px 1px rgba(0,0,0,0.04);\r\n            font-weight: 600;\r\n        }\r\n\r\n        /* iOS 滑块 */\r\n        input[type=\"range\"] {\r\n            -webkit-appearance: none;\r\n            width: 100%;\r\n            height: 4px;\r\n            background: rgba(118, 118, 128, 0.2);\r\n            border-radius: 2px;\r\n            outline: none;\r\n        }\r\n\r\n        input[type=\"range\"]::-webkit-slider-thumb {\r\n            -webkit-appearance: none;\r\n            width: 20px;\r\n            height: 20px;\r\n            background: #fff;\r\n            border-radius: 50%;\r\n            box-shadow: 0 2px 6px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);\r\n            cursor: pointer;\r\n            transition: transform 0.1s cubic-bezier(0.25, 0.8, 0.25, 1);\r\n        }\r\n\r\n        input[type=\"range\"]::-webkit-slider-thumb:active {\r\n            transform: scale(1.2);\r\n            box-shadow: 0 4px 10px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);\r\n        }\r\n\r\n        /* URL / 文本输入框 */\r\n        .url-input-wrapper {\r\n            position: relative;\r\n            display: flex;\r\n            align-items: center;\r\n        }\r\n\r\n        .url-input-wrapper i {\r\n            position: absolute;\r\n            left: 12px;\r\n            color: var(--text-muted);\r\n            font-size: 15px;\r\n            transition: color 0.2s;\r\n        }\r\n\r\n        input[type=\"text\"] {\r\n            width: 100%;\r\n            padding: 10px 10px 10px 36px;\r\n            border: 1px solid transparent;\r\n            border-radius: 10px;\r\n            background: rgba(118, 118, 128, 0.08);\r\n            font-size: 13px;\r\n            color: var(--text-main);\r\n            transition: all 0.2s ease;\r\n            outline: none;\r\n        }\r\n\r\n        input[type=\"text\"]::placeholder {\r\n            color: #999;\r\n            font-weight: 400;\r\n        }\r\n\r\n        input[type=\"text\"]:focus {\r\n            background: #fff;\r\n            border-color: rgba(0,0,0,0.1);\r\n            box-shadow: 0 2px 10px rgba(0,0,0,0.05);\r\n        }\r\n\r\n        input[type=\"text\"]:focus + i,\r\n        input[type=\"text\"]:focus ~ i {\r\n            color: var(--text-main);\r\n        }\r\n\r\n        /* 按钮 */\r\n        .btn-primary {\r\n            width: 100%;\r\n            padding: 12px;\r\n            background: var(--text-main);\r\n            color: #fff;\r\n            border: none;\r\n            border-radius: 12px;\r\n            font-size: 14px;\r\n            font-weight: 600;\r\n            cursor: pointer;\r\n            display: flex;\r\n            align-items: center;\r\n            justify-content: center;\r\n            gap: 8px;\r\n            transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);\r\n            margin-top: 10px;\r\n            font-family: \"SF Pro Text\", sans-serif;\r\n        }\r\n\r\n        .btn-primary:active {\r\n            transform: scale(0.96);\r\n            opacity: 0.9;\r\n        }\r\n        \r\n        .btn-primary i {\r\n            font-size: 16px;\r\n        }\r\n\r\n        /* iOS Switch 开关 */\r\n        .switch {\r\n            position: relative;\r\n            display: inline-block;\r\n            width: 42px;\r\n            height: 24px;\r\n        }\r\n        \r\n        .switch input {\r\n            opacity: 0;\r\n            width: 0;\r\n            height: 0;\r\n        }\r\n\r\n        .slider {\r\n            position: absolute;\r\n            cursor: pointer;\r\n            top: 0;\r\n            left: 0;\r\n            right: 0;\r\n            bottom: 0;\r\n            background-color: rgba(118, 118, 128, 0.16);\r\n            transition: .3s;\r\n            border-radius: 24px;\r\n        }\r\n\r\n        .slider:before {\r\n            position: absolute;\r\n            content: \"\";\r\n            height: 20px;\r\n            width: 20px;\r\n            left: 2px;\r\n            bottom: 2px;\r\n            background-color: white;\r\n            transition: .3s cubic-bezier(0.25, 0.8, 0.25, 1);\r\n            border-radius: 50%;\r\n            box-shadow: 0 3px 8px rgba(0,0,0,0.15), 0 3px 1px rgba(0,0,0,0.06);\r\n        }\r\n\r\n        input:checked + .slider {\r\n            background-color: #34c759;\r\n        }\r\n\r\n        input:checked + .slider:before {\r\n            transform: translateX(18px);\r\n        }\r\n\r\n        /* 展开/折叠面板 */\r\n        .collapsible-panel {\r\n            display: none;\r\n            flex-direction: column;\r\n            gap: 14px;\r\n            padding-top: 14px;\r\n            border-top: 1px dashed rgba(0,0,0,0.06);\r\n            margin-top: 14px;\r\n            animation: fadeInPanel 0.3s ease-out;\r\n        }\r\n        .collapsible-panel.open {\r\n            display: flex;\r\n        }\r\n\r\n        @keyframes fadeInPanel {\r\n            from { opacity: 0; transform: translateY(-4px); }\r\n            to { opacity: 1; transform: translateY(0); }\r\n        }";



    const TOOLBAR_MARKUP = "<div class=\"toolbar-container\" id=\"toolbar\">\r\n        <!-- 头部/拖拽区域 -->\r\n        <div class=\"toolbar-header\" id=\"toolbarHeader\">\r\n            <div class=\"header-title\">\r\n                <i class=\"ri-command-line\"></i>\r\n                样式工坊\r\n                <div class=\"active-dot\"></div>\r\n            </div>\r\n            <div class=\"header-actions\">\r\n                <button class=\"action-btn\" id=\"collapseBtn\">\r\n                    <i class=\"ri-arrow-up-s-line\" id=\"collapseIcon\"></i>\r\n                </button>\r\n            </div>\r\n        </div>\r\n\r\n        <!-- 导航分类栏 -->\r\n        <div class=\"toolbar-nav\" id=\"toolbarNav\">\r\n            <div class=\"nav-item active\" data-target=\"sec-ordinary\"><i class=\"ri-chat-1-line\"></i> 普通</div>\r\n            <div class=\"nav-item\" data-target=\"sec-voice\"><i class=\"ri-mic-line\"></i> 语音</div>\r\n            <div class=\"nav-item\" data-target=\"sec-quoted\"><i class=\"ri-double-quotes-l\"></i> 引用</div>\r\n            <div class=\"nav-item\" data-target=\"sec-topbar\"><i class=\"ri-layout-top-line\"></i> 顶栏</div>\r\n            <div class=\"nav-item\" data-target=\"sec-bottombar\"><i class=\"ri-layout-bottom-line\"></i> 底栏</div>\r\n            <div class=\"nav-item\" data-target=\"sec-avatar\"><i class=\"ri-user-3-line\"></i> 头像</div>\r\n        </div>\r\n\r\n        <!-- 内部内容区 -->\r\n        <div class=\"toolbar-content\" id=\"toolbarContent\">\r\n            \r\n            <!-- 普通气泡设置 -->\r\n            <div class=\"section active\" id=\"sec-ordinary\">\r\n                <div class=\"section-title\"><i class=\"ri-chat-1-line\"></i> 普通气泡</div>\r\n                <div class=\"segmented-control\">\r\n                    <div class=\"segment active\">对方气泡</div>\r\n                    <div class=\"segment\">我方气泡</div>\r\n                </div>\r\n                \r\n                <div class=\"settings-container\">\r\n                    <!-- 背景色与字体色 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\">\r\n                            <span>背景色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#ffffff\">\r\n                                <span class=\"value-display\">#FFFFFF</span>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"control-label\" style=\"margin-top: 8px;\">\r\n                            <span>字体颜色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#1d1d1f\">\r\n                                <span class=\"value-display\">#1D1D1F</span>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    \r\n                    <!-- 内边距控制 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\" style=\"margin-bottom: 0;\">\r\n                            <span style=\"font-weight: 600; color: var(--text-main);\"><i class=\"ri-space\"></i> 独立设置各内边距</span>\r\n                            <label class=\"switch\">\r\n                                <input type=\"checkbox\" id=\"togglePadding\">\r\n                                <span class=\"slider\"></span>\r\n                            </label>\r\n                        </div>\r\n                        \r\n                        <!-- 统一内边距面板（默认显示） -->\r\n                        <div class=\"collapsible-panel open\" id=\"panelUnifiedPadding\" style=\"border-top: none; padding-top: 8px; margin-top: 0;\">\r\n                            <div class=\"control-label\"><span>统一内边距大小</span><span class=\"value-display\">12px</span></div>\r\n                            <input type=\"range\" min=\"4\" max=\"32\" value=\"12\">\r\n                        </div>\r\n\r\n                        <!-- 独立四边边距面板（默认隐藏） -->\r\n                        <div class=\"collapsible-panel\" id=\"panelIndependentPadding\" style=\"border-top: none; padding-top: 8px; margin-top: 0;\">\r\n                            <div class=\"control-label\"><span>上边距 (Top)</span><span class=\"value-display\">12px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"12\" style=\"margin-bottom: 8px;\">\r\n                            \r\n                            <div class=\"control-label\"><span>右边距 (Right)</span><span class=\"value-display\">12px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"12\" style=\"margin-bottom: 8px;\">\r\n                            \r\n                            <div class=\"control-label\"><span>下边距 (Bottom)</span><span class=\"value-display\">12px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"12\" style=\"margin-bottom: 8px;\">\r\n                            \r\n                            <div class=\"control-label\"><span>左边距 (Left)</span><span class=\"value-display\">12px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"12\">\r\n                        </div>\r\n                    </div>\r\n                    \r\n                    <!-- 描边开关区 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\" style=\"margin-bottom: 0;\">\r\n                            <span style=\"font-weight: 600; color: var(--text-main);\"><i class=\"ri-shape-line\"></i> 启用描边</span>\r\n                            <label class=\"switch\">\r\n                                <input type=\"checkbox\" id=\"toggleBorder\">\r\n                                <span class=\"slider\"></span>\r\n                            </label>\r\n                        </div>\r\n                        \r\n                        <!-- 折叠详情：描边 -->\r\n                        <div class=\"collapsible-panel\" id=\"panelBorder\">\r\n                            <div class=\"control-label\">\r\n                                <span>描边颜色</span>\r\n                                <div class=\"color-val-wrap\">\r\n                                    <input type=\"color\" value=\"#000000\">\r\n                                    <span class=\"value-display\">#000000</span>\r\n                                </div>\r\n                            </div>\r\n                            <div class=\"control-label\" style=\"margin-top: 8px;\"><span>描边透明度</span><span class=\"value-display\">10%</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"100\" value=\"10\" style=\"margin-bottom: 8px;\">\r\n                            \r\n                            <div class=\"control-label\"><span>描边粗细</span><span class=\"value-display\">1px</span></div>\r\n                            <input type=\"range\" min=\"1\" max=\"10\" value=\"1\">\r\n                        </div>\r\n                    </div>\r\n\r\n                    <!-- 高级连发/圆角控制 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\" style=\"margin-bottom: 8px;\">\r\n                            <span style=\"font-weight: 600; color: var(--text-main);\"><i class=\"ri-rounded-corner\"></i> 气泡连发与圆角模式</span>\r\n                        </div>\r\n                        \r\n                        <!-- 圆角模式切换栏 -->\r\n                        <div class=\"segmented-control\" style=\"margin-bottom: 10px;\" id=\"radiusModeTabsOrd\">\r\n                            <div class=\"segment active\" data-mode=\"unified\">统一</div>\r\n                            <div class=\"segment\" data-mode=\"single\">单条独立</div>\r\n                            <div class=\"segment\" data-mode=\"continuous\">连发控制</div>\r\n                        </div>\r\n                        \r\n                        <!-- 面板 1: 统一圆角（默认） -->\r\n                        <div class=\"collapsible-panel open\" id=\"panelRadiusUnifiedOrd\" style=\"border-top: none; padding-top: 0; margin-top: 0;\">\r\n                            <div class=\"control-label\"><span>统一圆角大小</span><span class=\"value-display\">18px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"18\">\r\n                        </div>\r\n\r\n                        <!-- 面板 2: 单条独立四角 -->\r\n                        <div class=\"collapsible-panel\" id=\"panelRadiusSingleOrd\" style=\"border-top: none; padding-top: 0; margin-top: 0;\">\r\n                            <div class=\"control-label\"><span>左上角</span><span class=\"value-display\">18px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>右上角</span><span class=\"value-display\">18px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>右下角</span><span class=\"value-display\">18px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>左下角</span><span class=\"value-display\">4px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"4\">\r\n                        </div>\r\n                        \r\n                        <!-- 面板 3: 连发控制 (首、中、尾) -->\r\n                        <div class=\"collapsible-panel\" id=\"panelRadiusContinuousOrd\" style=\"border-top: none; padding-top: 0; margin-top: 0; gap: 16px;\">\r\n                            \r\n                            <div style=\"background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px;\">\r\n                                <div class=\"control-label\" style=\"font-weight: 600; color: var(--accent); margin-bottom: 12px;\">【第一条消息】</div>\r\n                                <div class=\"control-label\"><span>左上角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>右上角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>右下角</span><span class=\"value-display\">4px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"4\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>左下角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\">\r\n                            </div>\r\n\r\n                            <div style=\"background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px;\">\r\n                                <div class=\"control-label\" style=\"font-weight: 600; color: var(--accent); margin-bottom: 12px;\">【中间消息】</div>\r\n                                <div class=\"control-label\"><span>左上角</span><span class=\"value-display\">4px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"4\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>右上角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>右下角</span><span class=\"value-display\">4px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"4\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>左下角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\">\r\n                            </div>\r\n                            \r\n                            <div style=\"background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px;\">\r\n                                <div class=\"control-label\" style=\"font-weight: 600; color: var(--accent); margin-bottom: 12px;\">【最后一条消息】</div>\r\n                                <div class=\"control-label\"><span>左上角</span><span class=\"value-display\">4px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"4\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>右上角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>右下角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>左下角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    \r\n                    <!-- 视觉特效与阴影 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>背景模糊</span><span class=\"value-display\">10px</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"50\" value=\"10\" style=\"margin-bottom: 8px;\">\r\n                        \r\n                        <div class=\"control-label\"><span>背景透明度</span><span class=\"value-display\">80%</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"100\" value=\"80\">\r\n                    </div>\r\n\r\n                    <!-- 阴影开关区 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\" style=\"margin-bottom: 0;\">\r\n                            <span style=\"font-weight: 600; color: var(--text-main);\"><i class=\"ri-shadow-line\"></i> 高级阴影</span>\r\n                            <label class=\"switch\">\r\n                                <input type=\"checkbox\" id=\"toggleShadow\" checked>\r\n                                <span class=\"slider\"></span>\r\n                            </label>\r\n                        </div>\r\n\r\n                        <!-- 折叠详情：阴影 -->\r\n                        <div class=\"collapsible-panel open\" id=\"panelShadow\">\r\n                            <div class=\"control-label\">\r\n                                <span>阴影颜色</span>\r\n                                <div class=\"color-val-wrap\">\r\n                                    <input type=\"color\" value=\"#000000\">\r\n                                    <span class=\"value-display\">#000000</span>\r\n                                </div>\r\n                            </div>\r\n                            <div class=\"control-label\" style=\"margin-top: 8px;\"><span>阴影透明度</span><span class=\"value-display\">8%</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"100\" value=\"8\" style=\"margin-bottom: 8px;\">\r\n                            \r\n                            <div class=\"control-label\"><span>阴影模糊</span><span class=\"value-display\">15px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"50\" value=\"15\" style=\"margin-bottom: 8px;\">\r\n                            \r\n                            <div class=\"control-label\"><span>阴影扩散</span><span class=\"value-display\">0px</span></div>\r\n                            <input type=\"range\" min=\"-20\" max=\"40\" value=\"0\">\r\n                        </div>\r\n                    </div>\r\n\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>字体大小</span><span class=\"value-display\">15px</span></div>\r\n                        <input type=\"range\" min=\"10\" max=\"24\" value=\"15\">\r\n                    </div>\r\n                    \r\n                    <!-- 背景图 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>背景图</span></div>\r\n                        <div class=\"url-input-wrapper\">\r\n                            <i class=\"ri-image-2-line\"></i>\r\n                            <input type=\"text\" placeholder=\"输入图片链接...\">\r\n                        </div>\r\n                    </div>\r\n                    \r\n                    <!-- 气泡挂件 / 贴图 (::before) -->\r\n                    <div class=\"control-group\" style=\"padding-top: 14px; border-top: 1px dashed rgba(0,0,0,0.06);\">\r\n                        <div class=\"control-label\" style=\"margin-bottom: 0;\">\r\n                            <span style=\"font-weight: 600; color: var(--accent);\"><i class=\"ri-star-smile-line\"></i> 贴图挂件一</span>\r\n                            <label class=\"switch\">\r\n                                <input type=\"checkbox\" id=\"toggleDeco1\">\r\n                                <span class=\"slider\"></span>\r\n                            </label>\r\n                        </div>\r\n                        \r\n                        <div class=\"collapsible-panel\" id=\"panelDeco1\">\r\n                            <div class=\"control-label\" style=\"margin-top: 4px;\"><span>贴图素材链接</span></div>\r\n                            <div class=\"url-input-wrapper\" style=\"margin-bottom: 8px;\">\r\n                                <i class=\"ri-bear-smile-line\"></i>\r\n                                <input type=\"text\" placeholder=\"输入贴图一链接...\">\r\n                            </div>\r\n                            \r\n                            <div class=\"control-label\"><span>贴图大小</span><span class=\"value-display\">40px</span></div>\r\n                            <input type=\"range\" min=\"10\" max=\"100\" value=\"40\" style=\"margin-bottom: 8px;\">\r\n                            \r\n                            <div class=\"control-label\"><span>水平偏移</span><span class=\"value-display\">-10px</span></div>\r\n                            <input type=\"range\" min=\"-50\" max=\"50\" value=\"-10\" style=\"margin-bottom: 8px;\">\r\n                            \r\n                            <div class=\"control-label\"><span>垂直偏移</span><span class=\"value-display\">-15px</span></div>\r\n                            <input type=\"range\" min=\"-50\" max=\"50\" value=\"-15\">\r\n                            \r\n                            <div class=\"control-label\" style=\"margin-top: 12px; margin-bottom: 0;\">\r\n                                <span style=\"font-size: 12px; color: var(--text-muted);\">仅最后一条消息显示</span>\r\n                                <label class=\"switch\" style=\"transform: scale(0.85); transform-origin: right center;\">\r\n                                    <input type=\"checkbox\" id=\"toggleDeco1Last\" checked>\r\n                                    <span class=\"slider\"></span>\r\n                                </label>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n\r\n                    <!-- 气泡挂件 / 贴图 (::after) -->\r\n                    <div class=\"control-group\" style=\"padding-top: 14px; border-top: 1px dashed rgba(0,0,0,0.06);\">\r\n                        <div class=\"control-label\" style=\"margin-bottom: 0;\">\r\n                            <span style=\"font-weight: 600; color: var(--accent);\"><i class=\"ri-sparkling-line\"></i> 贴图挂件二</span>\r\n                            <label class=\"switch\">\r\n                                <input type=\"checkbox\" id=\"toggleDeco2\">\r\n                                <span class=\"slider\"></span>\r\n                            </label>\r\n                        </div>\r\n                        \r\n                        <div class=\"collapsible-panel\" id=\"panelDeco2\">\r\n                            <div class=\"control-label\" style=\"margin-top: 4px;\"><span>贴图素材链接</span></div>\r\n                            <div class=\"url-input-wrapper\" style=\"margin-bottom: 8px;\">\r\n                                <i class=\"ri-bear-smile-fill\"></i>\r\n                                <input type=\"text\" placeholder=\"输入贴图二链接...\">\r\n                            </div>\r\n                            \r\n                            <div class=\"control-label\"><span>贴图大小</span><span class=\"value-display\">40px</span></div>\r\n                            <input type=\"range\" min=\"10\" max=\"100\" value=\"40\" style=\"margin-bottom: 8px;\">\r\n                            \r\n                            <div class=\"control-label\"><span>水平偏移</span><span class=\"value-display\">20px</span></div>\r\n                            <input type=\"range\" min=\"-50\" max=\"50\" value=\"20\" style=\"margin-bottom: 8px;\">\r\n                            \r\n                            <div class=\"control-label\"><span>垂直偏移</span><span class=\"value-display\">10px</span></div>\r\n                            <input type=\"range\" min=\"-50\" max=\"50\" value=\"10\">\r\n\r\n                            <div class=\"control-label\" style=\"margin-top: 12px; margin-bottom: 0;\">\r\n                                <span style=\"font-size: 12px; color: var(--text-muted);\">仅最后一条消息显示</span>\r\n                                <label class=\"switch\" style=\"transform: scale(0.85); transform-origin: right center;\">\r\n                                    <input type=\"checkbox\" id=\"toggleDeco2Last\">\r\n                                    <span class=\"slider\"></span>\r\n                                </label>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n\r\n            <!-- 语音气泡设置 -->\r\n            <div class=\"section\" id=\"sec-voice\">\r\n                <div class=\"section-title\"><i class=\"ri-mic-line\"></i> 语音气泡</div>\r\n                <div class=\"segmented-control\">\r\n                    <div class=\"segment active\">对方气泡</div>\r\n                    <div class=\"segment\">我方气泡</div>\r\n                </div>\r\n                \r\n                <div class=\"settings-container\">\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\">\r\n                            <span>背景色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#007aff\">\r\n                                <span class=\"value-display\">#007AFF</span>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"control-label\" style=\"margin-top: 8px;\">\r\n                            <span>波纹颜色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#ffffff\">\r\n                                <span class=\"value-display\">#FFFFFF</span>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"control-label\" style=\"margin-top: 8px;\">\r\n                            <span>字体时间颜色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#ffffff\">\r\n                                <span class=\"value-display\">#FFFFFF</span>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    \r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>长度占比</span><span class=\"value-display\">40%</span></div>\r\n                        <input type=\"range\" min=\"20\" max=\"100\" value=\"40\" style=\"margin-bottom: 8px;\">\r\n                        <div class=\"control-label\"><span>图标尺寸</span><span class=\"value-display\">20px</span></div>\r\n                        <input type=\"range\" min=\"12\" max=\"36\" value=\"20\">\r\n                    </div>\r\n\r\n                    <!-- 内边距控制 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\" style=\"margin-bottom: 0;\">\r\n                            <span style=\"font-weight: 600; color: var(--text-main);\"><i class=\"ri-space\"></i> 独立设置各内边距</span>\r\n                            <label class=\"switch\">\r\n                                <input type=\"checkbox\" id=\"togglePaddingVoice\">\r\n                                <span class=\"slider\"></span>\r\n                            </label>\r\n                        </div>\r\n                        \r\n                        <div class=\"collapsible-panel open\" id=\"panelUnifiedPaddingVoice\" style=\"border-top: none; padding-top: 8px; margin-top: 0;\">\r\n                            <div class=\"control-label\"><span>统一内边距大小</span><span class=\"value-display\">12px</span></div>\r\n                            <input type=\"range\" min=\"4\" max=\"32\" value=\"12\">\r\n                        </div>\r\n\r\n                        <div class=\"collapsible-panel\" id=\"panelIndependentPaddingVoice\" style=\"border-top: none; padding-top: 8px; margin-top: 0;\">\r\n                            <div class=\"control-label\"><span>上边距 (Top)</span><span class=\"value-display\">12px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"12\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>右边距 (Right)</span><span class=\"value-display\">12px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"12\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>下边距 (Bottom)</span><span class=\"value-display\">12px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"12\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>左边距 (Left)</span><span class=\"value-display\">12px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"12\">\r\n                        </div>\r\n                    </div>\r\n                    \r\n                    <!-- 描边开关区 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\" style=\"margin-bottom: 0;\">\r\n                            <span style=\"font-weight: 600; color: var(--text-main);\"><i class=\"ri-shape-line\"></i> 启用描边</span>\r\n                            <label class=\"switch\">\r\n                                <input type=\"checkbox\" id=\"toggleBorderVoice\">\r\n                                <span class=\"slider\"></span>\r\n                            </label>\r\n                        </div>\r\n                        \r\n                        <div class=\"collapsible-panel\" id=\"panelBorderVoice\">\r\n                            <div class=\"control-label\">\r\n                                <span>描边颜色</span>\r\n                                <div class=\"color-val-wrap\">\r\n                                    <input type=\"color\" value=\"#000000\">\r\n                                    <span class=\"value-display\">#000000</span>\r\n                                </div>\r\n                            </div>\r\n                            <div class=\"control-label\" style=\"margin-top: 8px;\"><span>描边透明度</span><span class=\"value-display\">10%</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"100\" value=\"10\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>描边粗细</span><span class=\"value-display\">1px</span></div>\r\n                            <input type=\"range\" min=\"1\" max=\"10\" value=\"1\">\r\n                        </div>\r\n                    </div>\r\n\r\n                    <!-- 高级连发/圆角控制 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\" style=\"margin-bottom: 8px;\">\r\n                            <span style=\"font-weight: 600; color: var(--text-main);\"><i class=\"ri-rounded-corner\"></i> 气泡连发与圆角模式</span>\r\n                        </div>\r\n                        \r\n                        <!-- 圆角模式切换栏 -->\r\n                        <div class=\"segmented-control\" style=\"margin-bottom: 10px;\" id=\"radiusModeTabsVoice\">\r\n                            <div class=\"segment active\" data-mode=\"unified\">统一</div>\r\n                            <div class=\"segment\" data-mode=\"single\">单条独立</div>\r\n                            <div class=\"segment\" data-mode=\"continuous\">连发控制</div>\r\n                        </div>\r\n                        \r\n                        <!-- 面板 1: 统一圆角（默认） -->\r\n                        <div class=\"collapsible-panel open\" id=\"panelRadiusUnifiedVoice\" style=\"border-top: none; padding-top: 0; margin-top: 0;\">\r\n                            <div class=\"control-label\"><span>统一圆角大小</span><span class=\"value-display\">18px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"18\">\r\n                        </div>\r\n\r\n                        <!-- 面板 2: 单条独立四角 -->\r\n                        <div class=\"collapsible-panel\" id=\"panelRadiusSingleVoice\" style=\"border-top: none; padding-top: 0; margin-top: 0;\">\r\n                            <div class=\"control-label\"><span>左上角</span><span class=\"value-display\">18px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>右上角</span><span class=\"value-display\">18px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>右下角</span><span class=\"value-display\">18px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>左下角</span><span class=\"value-display\">4px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"40\" value=\"4\">\r\n                        </div>\r\n                        \r\n                        <!-- 面板 3: 连发控制 (首、中、尾) -->\r\n                        <div class=\"collapsible-panel\" id=\"panelRadiusContinuousVoice\" style=\"border-top: none; padding-top: 0; margin-top: 0; gap: 16px;\">\r\n                            \r\n                            <div style=\"background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px;\">\r\n                                <div class=\"control-label\" style=\"font-weight: 600; color: var(--accent); margin-bottom: 12px;\">【第一条消息】</div>\r\n                                <div class=\"control-label\"><span>左上角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>右上角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>右下角</span><span class=\"value-display\">4px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"4\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>左下角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\">\r\n                            </div>\r\n\r\n                            <div style=\"background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px;\">\r\n                                <div class=\"control-label\" style=\"font-weight: 600; color: var(--accent); margin-bottom: 12px;\">【中间消息】</div>\r\n                                <div class=\"control-label\"><span>左上角</span><span class=\"value-display\">4px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"4\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>右上角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>右下角</span><span class=\"value-display\">4px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"4\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>左下角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\">\r\n                            </div>\r\n                            \r\n                            <div style=\"background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px;\">\r\n                                <div class=\"control-label\" style=\"font-weight: 600; color: var(--accent); margin-bottom: 12px;\">【最后一条消息】</div>\r\n                                <div class=\"control-label\"><span>左上角</span><span class=\"value-display\">4px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"4\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>右上角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>右下角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\" style=\"margin-bottom: 8px;\">\r\n                                <div class=\"control-label\"><span>左下角</span><span class=\"value-display\">18px</span></div>\r\n                                <input type=\"range\" min=\"0\" max=\"40\" value=\"18\">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    \r\n                    <!-- 视觉特效与阴影 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>背景模糊</span><span class=\"value-display\">10px</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"50\" value=\"10\" style=\"margin-bottom: 8px;\">\r\n                        \r\n                        <div class=\"control-label\"><span>背景透明度</span><span class=\"value-display\">100%</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"100\" value=\"100\">\r\n                    </div>\r\n\r\n                    <!-- 阴影开关区 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\" style=\"margin-bottom: 0;\">\r\n                            <span style=\"font-weight: 600; color: var(--text-main);\"><i class=\"ri-shadow-line\"></i> 高级阴影</span>\r\n                            <label class=\"switch\">\r\n                                <input type=\"checkbox\" id=\"toggleShadowVoice\" checked>\r\n                                <span class=\"slider\"></span>\r\n                            </label>\r\n                        </div>\r\n\r\n                        <div class=\"collapsible-panel open\" id=\"panelShadowVoice\">\r\n                            <div class=\"control-label\">\r\n                                <span>阴影颜色</span>\r\n                                <div class=\"color-val-wrap\">\r\n                                    <input type=\"color\" value=\"#000000\">\r\n                                    <span class=\"value-display\">#000000</span>\r\n                                </div>\r\n                            </div>\r\n                            <div class=\"control-label\" style=\"margin-top: 8px;\"><span>阴影透明度</span><span class=\"value-display\">8%</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"100\" value=\"8\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>阴影模糊</span><span class=\"value-display\">15px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"50\" value=\"15\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>阴影扩散</span><span class=\"value-display\">0px</span></div>\r\n                            <input type=\"range\" min=\"-20\" max=\"40\" value=\"0\">\r\n                        </div>\r\n                    </div>\r\n\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>字体大小</span><span class=\"value-display\">15px</span></div>\r\n                        <input type=\"range\" min=\"10\" max=\"24\" value=\"15\">\r\n                    </div>\r\n                    \r\n                    <!-- 背景图 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>背景图</span></div>\r\n                        <div class=\"url-input-wrapper\">\r\n                            <i class=\"ri-image-2-line\"></i>\r\n                            <input type=\"text\" placeholder=\"输入图片链接...\">\r\n                        </div>\r\n                    </div>\r\n                    \r\n                    <!-- 气泡挂件 / 贴图 (::before) -->\r\n                    <div class=\"control-group\" style=\"padding-top: 14px; border-top: 1px dashed rgba(0,0,0,0.06);\">\r\n                        <div class=\"control-label\" style=\"margin-bottom: 0;\">\r\n                            <span style=\"font-weight: 600; color: var(--accent);\"><i class=\"ri-star-smile-line\"></i> 贴图挂件一</span>\r\n                            <label class=\"switch\">\r\n                                <input type=\"checkbox\" id=\"toggleDeco1Voice\">\r\n                                <span class=\"slider\"></span>\r\n                            </label>\r\n                        </div>\r\n                        \r\n                        <div class=\"collapsible-panel\" id=\"panelDeco1Voice\">\r\n                            <div class=\"control-label\" style=\"margin-top: 4px;\"><span>贴图素材链接</span></div>\r\n                            <div class=\"url-input-wrapper\" style=\"margin-bottom: 8px;\">\r\n                                <i class=\"ri-bear-smile-line\"></i>\r\n                                <input type=\"text\" placeholder=\"输入贴图一链接...\">\r\n                            </div>\r\n                            \r\n                            <div class=\"control-label\"><span>贴图大小</span><span class=\"value-display\">40px</span></div>\r\n                            <input type=\"range\" min=\"10\" max=\"100\" value=\"40\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>水平偏移</span><span class=\"value-display\">-10px</span></div>\r\n                            <input type=\"range\" min=\"-50\" max=\"50\" value=\"-10\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>垂直偏移</span><span class=\"value-display\">-15px</span></div>\r\n                            <input type=\"range\" min=\"-50\" max=\"50\" value=\"-15\">\r\n                            \r\n                            <div class=\"control-label\" style=\"margin-top: 12px; margin-bottom: 0;\">\r\n                                <span style=\"font-size: 12px; color: var(--text-muted);\">仅最后一条消息显示</span>\r\n                                <label class=\"switch\" style=\"transform: scale(0.85); transform-origin: right center;\">\r\n                                    <input type=\"checkbox\" id=\"toggleDeco1LastVoice\" checked>\r\n                                    <span class=\"slider\"></span>\r\n                                </label>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n\r\n                    <!-- 气泡挂件 / 贴图 (::after) -->\r\n                    <div class=\"control-group\" style=\"padding-top: 14px; border-top: 1px dashed rgba(0,0,0,0.06);\">\r\n                        <div class=\"control-label\" style=\"margin-bottom: 0;\">\r\n                            <span style=\"font-weight: 600; color: var(--accent);\"><i class=\"ri-sparkling-line\"></i> 贴图挂件二</span>\r\n                            <label class=\"switch\">\r\n                                <input type=\"checkbox\" id=\"toggleDeco2Voice\">\r\n                                <span class=\"slider\"></span>\r\n                            </label>\r\n                        </div>\r\n                        \r\n                        <div class=\"collapsible-panel\" id=\"panelDeco2Voice\">\r\n                            <div class=\"control-label\" style=\"margin-top: 4px;\"><span>贴图素材链接</span></div>\r\n                            <div class=\"url-input-wrapper\" style=\"margin-bottom: 8px;\">\r\n                                <i class=\"ri-bear-smile-fill\"></i>\r\n                                <input type=\"text\" placeholder=\"输入贴图二链接...\">\r\n                            </div>\r\n                            \r\n                            <div class=\"control-label\"><span>贴图大小</span><span class=\"value-display\">40px</span></div>\r\n                            <input type=\"range\" min=\"10\" max=\"100\" value=\"40\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>水平偏移</span><span class=\"value-display\">20px</span></div>\r\n                            <input type=\"range\" min=\"-50\" max=\"50\" value=\"20\" style=\"margin-bottom: 8px;\">\r\n                            <div class=\"control-label\"><span>垂直偏移</span><span class=\"value-display\">10px</span></div>\r\n                            <input type=\"range\" min=\"-50\" max=\"50\" value=\"10\">\r\n\r\n                            <div class=\"control-label\" style=\"margin-top: 12px; margin-bottom: 0;\">\r\n                                <span style=\"font-size: 12px; color: var(--text-muted);\">仅最后一条消息显示</span>\r\n                                <label class=\"switch\" style=\"transform: scale(0.85); transform-origin: right center;\">\r\n                                    <input type=\"checkbox\" id=\"toggleDeco2LastVoice\">\r\n                                    <span class=\"slider\"></span>\r\n                                </label>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n\r\n            <!-- 引用消息设置 -->\r\n            <div class=\"section\" id=\"sec-quoted\">\r\n                <div class=\"section-title\"><i class=\"ri-double-quotes-l\"></i> 引用消息</div>\r\n                <div class=\"segmented-control\">\r\n                    <div class=\"segment active\">对方消息</div>\r\n                    <div class=\"segment\">我方消息</div>\r\n                </div>\r\n                \r\n                <div class=\"settings-container\">\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\">\r\n                            <span>侧边线颜色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#cccccc\">\r\n                                <span class=\"value-display\">#CCCCCC</span>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"control-label\" style=\"margin-top: 8px;\">\r\n                            <span>引用字色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#8e8e93\">\r\n                                <span class=\"value-display\">#8E8E93</span>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>线宽</span><span class=\"value-display\">0px</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"10\" value=\"0\">\r\n                    </div>\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>背景透明度</span><span class=\"value-display\">60%</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"100\" value=\"60\">\r\n                    </div>\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>圆角大小</span><span class=\"value-display\">8px</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"24\" value=\"8\">\r\n                    </div>\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>字体大小</span><span class=\"value-display\">12px</span></div>\r\n                        <input type=\"range\" min=\"10\" max=\"18\" value=\"12\">\r\n                    </div>\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>顶部间距</span><span class=\"value-display\">6px</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"20\" value=\"6\">\r\n                    </div>\r\n                </div>\r\n            </div>\r\n\r\n            <!-- 顶栏设置 -->\r\n            <div class=\"section\" id=\"sec-topbar\">\r\n                <div class=\"section-title\"><i class=\"ri-layout-top-line\"></i> 顶栏设置</div>\r\n                \r\n                <div class=\"settings-container\">\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\">\r\n                            <span>背景色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#f5f5f7\">\r\n                                <span class=\"value-display\">#F5F5F7</span>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"control-label\" style=\"margin-top: 8px;\">\r\n                            <span>文字颜色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#1d1d1f\">\r\n                                <span class=\"value-display\">#1D1D1F</span>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"control-label\" style=\"margin-top: 8px;\">\r\n                            <span>图标颜色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#007aff\">\r\n                                <span class=\"value-display\">#007AFF</span>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    \r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>背景透明度</span><span class=\"value-display\">85%</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"100\" value=\"85\">\r\n                    </div>\r\n                    \r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>背景模糊 (磨砂)</span><span class=\"value-display\">20px</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"50\" value=\"20\">\r\n                    </div>\r\n                    \r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>高度设置</span><span class=\"value-display\">60px</span></div>\r\n                        <input type=\"range\" min=\"40\" max=\"120\" value=\"60\">\r\n                    </div>\r\n\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\">\r\n                            <span>底部分隔线颜色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#d1d1d6\">\r\n                                <span class=\"value-display\">#D1D1D6</span>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"control-label\" style=\"margin-top: 8px;\"><span>分隔线透明度</span><span class=\"value-display\">50%</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"100\" value=\"50\" style=\"margin-bottom: 8px;\">\r\n                        <div class=\"control-label\"><span>分隔线粗细</span><span class=\"value-display\">1px</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"5\" value=\"1\">\r\n                    </div>\r\n                    \r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>背景图 URL</span></div>\r\n                        <div class=\"url-input-wrapper\">\r\n                            <i class=\"ri-image-2-line\"></i>\r\n                            <input type=\"text\" placeholder=\"输入背景图链接...\">\r\n                        </div>\r\n                    </div>\r\n\r\n                    <!-- 顶栏按钮自定义 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\" style=\"color: var(--text-main); font-weight: 600;\">\r\n                            <span><i class=\"ri-remixicon-line\"></i> 按钮图标贴图</span>\r\n                        </div>\r\n                        \r\n                        <div class=\"control-label\" style=\"margin-top: 8px;\"><span>返回按钮链接</span></div>\r\n                        <div class=\"url-input-wrapper\" style=\"margin-bottom: 8px;\">\r\n                            <i class=\"ri-arrow-left-s-line\"></i>\r\n                            <input type=\"text\" placeholder=\"输入返回图标链接...\">\r\n                        </div>\r\n\r\n                        <div class=\"control-label\"><span>小火人入口链接</span></div>\r\n                        <div class=\"url-input-wrapper\" style=\"margin-bottom: 8px;\">\r\n                            <i class=\"ri-fire-line\"></i>\r\n                            <input type=\"text\" placeholder=\"输入小火人图标链接...\">\r\n                        </div>\r\n\r\n                        <div class=\"control-label\"><span>设置按钮链接</span></div>\r\n                        <div class=\"url-input-wrapper\">\r\n                            <i class=\"ri-settings-3-line\"></i>\r\n                            <input type=\"text\" placeholder=\"输入设置图标链接...\">\r\n                        </div>\r\n                    </div>\r\n\r\n                    <!-- 阴影开关区 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\" style=\"margin-bottom: 0;\">\r\n                            <span style=\"font-weight: 600; color: var(--text-main);\"><i class=\"ri-shadow-line\"></i> 启用阴影</span>\r\n                            <label class=\"switch\">\r\n                                <input type=\"checkbox\" id=\"toggleTopbarShadow\">\r\n                                <span class=\"slider\"></span>\r\n                            </label>\r\n                        </div>\r\n\r\n                        <!-- 折叠详情：阴影 -->\r\n                        <div class=\"collapsible-panel\" id=\"panelTopbarShadow\">\r\n                            <div class=\"control-label\">\r\n                                <span>阴影颜色</span>\r\n                                <div class=\"color-val-wrap\">\r\n                                    <input type=\"color\" value=\"#000000\">\r\n                                    <span class=\"value-display\">#000000</span>\r\n                                </div>\r\n                            </div>\r\n                            <div class=\"control-label\" style=\"margin-top: 8px;\"><span>阴影透明度</span><span class=\"value-display\">10%</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"100\" value=\"10\" style=\"margin-bottom: 8px;\">\r\n                            \r\n                            <div class=\"control-label\"><span>阴影模糊</span><span class=\"value-display\">10px</span></div>\r\n                            <input type=\"range\" min=\"0\" max=\"50\" value=\"10\">\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n\r\n            <!-- 底栏设置 -->\r\n            <div class=\"section\" id=\"sec-bottombar\">\r\n                <div class=\"section-title\"><i class=\"ri-layout-bottom-line\"></i> 底栏 (输入框) 设置</div>\r\n                \r\n                <div class=\"settings-container\">\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\">\r\n                            <span>栏背景色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#f5f5f7\">\r\n                                <span class=\"value-display\">#F5F5F7</span>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"control-label\" style=\"margin-top: 8px;\">\r\n                            <span>输入框背景色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#ffffff\">\r\n                                <span class=\"value-display\">#FFFFFF</span>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"control-label\" style=\"margin-top: 8px;\">\r\n                            <span>图标颜色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#8e8e93\">\r\n                                <span class=\"value-display\">#8E8E93</span>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    \r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>栏背景透明度</span><span class=\"value-display\">90%</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"100\" value=\"90\">\r\n                    </div>\r\n                    \r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>栏背景模糊 (磨砂)</span><span class=\"value-display\">25px</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"50\" value=\"25\">\r\n                    </div>\r\n\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\" style=\"color: var(--text-main); font-weight: 600;\">\r\n                            <span><i class=\"ri-keyboard-line\"></i> 输入框样式</span>\r\n                        </div>\r\n                        <div class=\"control-label\" style=\"margin-top: 8px;\"><span>输入框圆角</span><span class=\"value-display\">20px</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"40\" value=\"20\" style=\"margin-bottom: 8px;\">\r\n                        \r\n                        <div class=\"control-label\"><span>输入框高度</span><span class=\"value-display\">40px</span></div>\r\n                        <input type=\"range\" min=\"30\" max=\"80\" value=\"40\" style=\"margin-bottom: 8px;\">\r\n\r\n                        <div class=\"control-label\">\r\n                            <span>输入框边框颜色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#e5e5ea\">\r\n                                <span class=\"value-display\">#E5E5EA</span>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"control-label\" style=\"margin-top: 8px;\"><span>边框粗细</span><span class=\"value-display\">1px</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"5\" value=\"1\">\r\n                    </div>\r\n                    \r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\">\r\n                            <span>顶部分隔线颜色</span>\r\n                            <div class=\"color-val-wrap\">\r\n                                <input type=\"color\" value=\"#d1d1d6\">\r\n                                <span class=\"value-display\">#D1D1D6</span>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"control-label\" style=\"margin-top: 8px;\"><span>分隔线透明度</span><span class=\"value-display\">50%</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"100\" value=\"50\" style=\"margin-bottom: 8px;\">\r\n                        <div class=\"control-label\"><span>分隔线粗细</span><span class=\"value-display\">1px</span></div>\r\n                        <input type=\"range\" min=\"0\" max=\"5\" value=\"1\">\r\n                    </div>\r\n\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\"><span>背景图 URL</span></div>\r\n                        <div class=\"url-input-wrapper\">\r\n                            <i class=\"ri-image-2-line\"></i>\r\n                            <input type=\"text\" placeholder=\"输入背景图链接...\">\r\n                        </div>\r\n                    </div>\r\n\r\n                    <!-- 底栏按钮自定义 -->\r\n                    <div class=\"control-group\">\r\n                        <div class=\"control-label\" style=\"color: var(--text-main); font-weight: 600;\">\r\n                            <span><i class=\"ri-remixicon-line\"></i> 按钮图标贴图</span>\r\n                        </div>\r\n                        \r\n                        <div class=\"control-label\" style=\"margin-top: 8px;\"><span>菜单按钮链接</span></div>\r\n                        <div class=\"url-input-wrapper\" style=\"margin-bottom: 8px;\">\r\n                            <i class=\"ri-menu-line\"></i>\r\n                            <input type=\"text\" placeholder=\"输入菜单图标链接...\">\r\n                        </div>\r\n\r\n                        <div class=\"control-label\"><span>表情包按钮链接</span></div>\r\n                        <div class=\"url-input-wrapper\" style=\"margin-bottom: 8px;\">\r\n                            <i class=\"ri-emotion-line\"></i>\r\n                            <input type=\"text\" placeholder=\"输入表情图标链接...\">\r\n                        </div>\r\n\r\n                        <div class=\"control-label\"><span>回复按钮链接</span></div>\r\n                        <div class=\"url-input-wrapper\">\r\n                            <i class=\"ri-send-plane-2-line\"></i>\r\n                            <input type=\"text\" placeholder=\"输入发送/回复图标链接...\">\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n\r\n            <!-- 消息头像设置 -->\r\n            <div class=\"section\" id=\"sec-avatar\">\r\n                <div class=\"section-title\"><i class=\"ri-user-3-line\"></i> 消息头像</div>\r\n                <div class=\"settings-container\"></div>\r\n            </div>\r\n\r\n        </div>\r\n    </div>";







    function runStudioToolbar(root) {



        // ================= 全局状态 =================



                const toolbar = root.getElementById('toolbar');



                const collapseBtn = root.getElementById('collapseBtn');



                const collapseIcon = root.getElementById('collapseIcon');



                const content = root.getElementById('toolbarContent');



                const header = root.getElementById('toolbarHeader');



                const headerActions = header ? header.querySelector('.header-actions') : null;







                function flashHeaderActionButton(button, accentColor) {



                    if (!button) return;



                    const previousColor = button.style.color;



                    const previousBackground = button.style.background;



                    button.style.color = accentColor || 'var(--accent)';



                    button.style.background = 'rgba(0, 122, 255, 0.14)';



                    clearTimeout(button._studioFlashTimer);



                    button._studioFlashTimer = setTimeout(() => {



                        button.style.color = previousColor;



                        button.style.background = previousBackground;



                    }, 1200);



                }







                let exportPanelResolver = null;







                function getExportLockGroups() {



                    if (Array.isArray(window.STUDIO_APPEARANCE_LOCK_GROUPS) && window.STUDIO_APPEARANCE_LOCK_GROUPS.length) {



                        return window.STUDIO_APPEARANCE_LOCK_GROUPS.slice();



                    }



                    return [



                        { key: 'ordinaryBase', sectionKey: 'ordinary', label: '基础样式' },



                        { key: 'voiceBase', sectionKey: 'voice', label: '基础样式' },



                        { key: 'quotedBase', sectionKey: 'quoted', label: '引用样式' },



                        { key: 'topbarBase', sectionKey: 'topbar', label: '背景与分隔线' },



                        { key: 'bottombarBase', sectionKey: 'bottombar', label: '底栏与输入框' }



                    ];



                }







                function ensureExportPresetPanel() {



                    const existing = root.getElementById('studioExportPresetPanel');



                    if (existing) return existing;



                    const stage = root.querySelector('.studio-toolbar-stage') || root;



                    const style = document.createElement('style');



                    style.id = 'studioExportPresetPanelStyle';



                    style.textContent = `



                        .studio-export-panel { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; padding: 18px; z-index: 180; pointer-events: auto; }



                        .studio-export-panel.open { display: flex; }



                        .studio-export-panel-backdrop { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.18); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }



                        .studio-export-panel-sheet { position: relative; width: min(360px, calc(100vw - 36px)); max-height: min(78vh, 700px); display: flex; flex-direction: column; overflow: hidden; border-radius: 24px; background: rgba(255,255,255,0.94); border: 1px solid rgba(255,255,255,0.7); box-shadow: 0 22px 60px rgba(15,23,42,0.18); }



                        .studio-export-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px 12px; border-bottom: 1px solid rgba(0,0,0,0.06); }



                        .studio-export-panel-title { font-size: 17px; font-weight: 700; color: var(--text-main); }



                        .studio-export-panel-close { width: 32px; height: 32px; border: none; border-radius: 10px; background: rgba(0,0,0,0.05); color: var(--text-main); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }



                        .studio-export-panel-body { padding: 16px 18px 8px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }



                        .studio-export-panel-label { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }



                        .studio-export-panel-input { width: 100%; padding: 11px 13px; border-radius: 14px; border: 1px solid rgba(0,0,0,0.08); background: rgba(118,118,128,0.08); color: var(--text-main); font-size: 14px; outline: none; }



                        .studio-export-panel-quick { display: flex; gap: 8px; }



                        .studio-export-panel-chip { border: none; border-radius: 999px; background: rgba(0,0,0,0.06); color: var(--text-main); font-size: 12px; font-weight: 600; padding: 8px 12px; cursor: pointer; }



                        .studio-export-group { display: flex; flex-direction: column; gap: 10px; padding: 14px; border-radius: 18px; background: rgba(118,118,128,0.08); }



                        .studio-export-group-title { font-size: 13px; font-weight: 700; color: var(--text-main); }



                        .studio-export-option { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; }



                        .studio-export-option input { margin-top: 2px; width: 16px; height: 16px; accent-color: #007aff; }



                        .studio-export-option-text { display: flex; flex-direction: column; gap: 0; }



                        .studio-export-option-name { font-size: 13px; font-weight: 600; color: var(--text-main); }



                        .studio-export-panel-footer { display: flex; gap: 10px; padding: 14px 18px 18px; border-top: 1px solid rgba(0,0,0,0.06); }



                        .studio-export-panel-footer button { flex: 1; border: none; border-radius: 14px; padding: 12px 14px; font-size: 14px; font-weight: 700; cursor: pointer; }



                        .studio-export-panel-cancel { background: rgba(0,0,0,0.06); color: var(--text-main); }



                        .studio-export-panel-confirm { background: #111827; color: #fff; }



                    `;



                    root.appendChild(style);







                    const panel = document.createElement('div');



                    panel.id = 'studioExportPresetPanel';



                    panel.className = 'studio-export-panel';



                    panel.innerHTML = `



                        <div class="studio-export-panel-backdrop" data-export-action="cancel"></div>



                        <div class="studio-export-panel-sheet">



                            <div class="studio-export-panel-header">



                                <div class="studio-export-panel-title">导出外观</div>



                                <button type="button" class="studio-export-panel-close" data-export-action="cancel" aria-label="关闭"><i class="ri-close-line"></i></button>



                            </div>



                            <div class="studio-export-panel-body">



                                <div>



                                    <div class="studio-export-panel-label">文件名</div>



                                    <input id="studioExportFileNameInput" class="studio-export-panel-input" type="text" maxlength="80" placeholder="输入导出文件名">



                                </div>



                                <div class="studio-export-panel-quick">



                                    <button type="button" class="studio-export-panel-chip" id="studioExportAllEditable">全部可编辑</button>



                                    <button type="button" class="studio-export-panel-chip" id="studioExportAllLocked">全部锁定</button>



                                </div>



                                <div id="studioExportGroupList"></div>



                            </div>



                            <div class="studio-export-panel-footer">



                                <button type="button" class="studio-export-panel-cancel" data-export-action="cancel">取消</button>



                                <button type="button" class="studio-export-panel-confirm" data-export-action="confirm">导出 JSON</button>



                            </div>



                        </div>



                    `;



                    stage.appendChild(panel);







                    const cancel = () => {



                        panel.classList.remove('open');



                        const resolver = exportPanelResolver;



                        exportPanelResolver = null;



                        if (resolver) resolver(null);



                    };



                    const confirm = () => {



                        const nameInput = root.getElementById('studioExportFileNameInput');



                        const exportName = (nameInput && nameInput.value ? nameInput.value.trim() : '') || 'studio-appearance';



                        const editableScopes = {};



                        panel.querySelectorAll('[data-lock-key]').forEach((input) => {



                            editableScopes[input.getAttribute('data-lock-key')] = !!input.checked;



                        });



                        panel.classList.remove('open');



                        const resolver = exportPanelResolver;



                        exportPanelResolver = null;



                        if (resolver) resolver({ name: exportName, editableScopes });



                    };







                    panel.addEventListener('click', (event) => {



                        const actionNode = event.target && event.target.closest ? event.target.closest('[data-export-action]') : null;



                        if (!actionNode) return;



                        if (actionNode.getAttribute('data-export-action') === 'confirm') confirm();



                        else cancel();



                    });



                    panel.querySelector('#studioExportAllEditable').addEventListener('click', () => {



                        panel.querySelectorAll('[data-lock-key]').forEach((input) => { input.checked = true; });



                    });



                    panel.querySelector('#studioExportAllLocked').addEventListener('click', () => {



                        panel.querySelectorAll('[data-lock-key]').forEach((input) => { input.checked = false; });



                    });



                    return panel;



                }







                function openExportPresetPanel(defaultName) {



                    const panel = ensureExportPresetPanel();



                    const defs = getExportLockGroups();



                    const snapshot = typeof window.getCurrentStudioAppearanceSnapshot === 'function' ? window.getCurrentStudioAppearanceSnapshot() : null;



                    const state = snapshot && snapshot.editableScopes ? snapshot.editableScopes : {};



                    const nameInput = root.getElementById('studioExportFileNameInput');



                    const groupList = root.getElementById('studioExportGroupList');



                    const sectionTitles = { ordinary: '普通气泡', voice: '语音气泡', quoted: '引用消息', avatar: '消息头像', topbar: '顶栏', bottombar: '底栏' };



                    const groupsBySection = defs.reduce((result, item) => {



                        const key = item.sectionKey || 'other';



                        if (!result[key]) result[key] = [];



                        result[key].push(item);



                        return result;



                    }, {});



                    const sectionOrder = ['ordinary', 'voice', 'quoted', 'avatar', 'topbar', 'bottombar'];



                    groupList.innerHTML = sectionOrder.filter((sectionKey) => groupsBySection[sectionKey] && groupsBySection[sectionKey].length).map((sectionKey) => {



                        const items = groupsBySection[sectionKey].map((item) => `



                            <label class="studio-export-option">



                                <input type="checkbox" data-lock-key="${item.key}" ${state[item.key] !== false ? 'checked' : ''}>



                                <span class="studio-export-option-text">



                                    <span class="studio-export-option-name">${item.label || item.exportLabel || item.key}</span>



                                </span>



                            </label>



                        `).join('');



                        return `<div class="studio-export-group"><div class="studio-export-group-title">${sectionTitles[sectionKey] || sectionKey}</div>${items}</div>`;



                    }).join('');



                    if (nameInput) {



                        nameInput.value = defaultName || 'studio-appearance';



                        requestAnimationFrame(() => {



                            nameInput.focus();



                            nameInput.select();



                        });



                    }



                    panel.classList.add('open');



                    return new Promise((resolve) => {



                        exportPanelResolver = resolve;



                    });



                }







                function syncHeaderActionButtons() {



                    root.querySelectorAll('[data-studio-hide-when-collapsed="true"]').forEach((button) => {



                        button.style.display = isCollapsed ? 'none' : 'flex';



                    });



                    if (isCollapsed) {



                        const exportPanel = root.getElementById('studioExportPresetPanel');



                        if (exportPanel) exportPanel.classList.remove('open');



                        if (exportPanelResolver) {



                            const resolver = exportPanelResolver;



                            exportPanelResolver = null;



                            resolver(null);



                        }



                    }



                }







                function ensureStudioPresetActionButtons() {



                    if (!headerActions || headerActions.dataset.studioPresetReady === 'true') return;



                    headerActions.dataset.studioPresetReady = 'true';



                    const importInput = document.createElement('input');



                    importInput.type = 'file';



                    importInput.id = 'studioPresetImportInput';



                    importInput.accept = '.json,application/json';



                    importInput.hidden = true;



                    headerActions.appendChild(importInput);







                    const makeHeaderButton = (id, label, icon) => {



                        const button = document.createElement('button');



                        button.className = 'action-btn';



                        button.type = 'button';



                        button.id = id;



                        button.title = label;



                        button.setAttribute('aria-label', label);



                        button.dataset.studioHideWhenCollapsed = 'true';



                        button.innerHTML = `<i class="${icon}"></i>`;



                        headerActions.insertBefore(button, collapseBtn);



                        return button;



                    };







                    const importPresetBtn = makeHeaderButton('importStudioPresetBtn', '\u5bfc\u5165\u5916\u89c2', 'ri-download-2-line');



                    const exportPresetBtn = makeHeaderButton('exportStudioPresetBtn', '\u5bfc\u51fa\u5916\u89c2', 'ri-upload-2-line');



                    const savePresetBtn = makeHeaderButton('saveStudioPresetBtn', '保存到快捷外观', 'ri-save-line');







                    savePresetBtn.addEventListener('click', (e) => {



                        if (!isClick) return;



                        e.preventDefault();



                        e.stopPropagation();



                        const defaultName = (typeof window.getCurrentStudioAppearanceName === 'function' && window.getCurrentStudioAppearanceName()) || '我的快捷外观';



                        const presetName = window.prompt('给这个样式起个名字：', defaultName);



                        if (!presetName) return;



                        if (typeof window.saveCurrentStudioAppearancePreset === 'function') {



                            const result = window.saveCurrentStudioAppearancePreset(presetName);



                            if (result && result.preset) {



                                flashHeaderActionButton(savePresetBtn, '#30d158');



                                window.alert(result.updated ? '快捷外观已更新' : '快捷外观已保存');



                            }



                        }



                    });







                    exportPresetBtn.addEventListener('click', async (e) => {



                        if (!isClick) return;



                        e.preventDefault();



                        e.stopPropagation();



                        const defaultName = (typeof window.getCurrentStudioAppearanceName === 'function' && window.getCurrentStudioAppearanceName()) || 'studio-appearance';



                        const exportOptions = await openExportPresetPanel(defaultName);



                        if (!exportOptions) return;



                        if (typeof window.exportCurrentStudioAppearanceAsFile === 'function') {



                            window.exportCurrentStudioAppearanceAsFile(exportOptions);



                            flashHeaderActionButton(exportPresetBtn);



                        }



                    });







                    importPresetBtn.addEventListener('click', (e) => {



                        if (!isClick) return;



                        e.preventDefault();



                        e.stopPropagation();



                        importInput.value = '';



                        importInput.click();



                    });







                    importInput.addEventListener('change', async () => {



                        const file = importInput.files && importInput.files[0];



                        if (!file) return;



                        try {



                            if (typeof window.importStudioAppearanceFromFile === 'function') {



                                const preset = await window.importStudioAppearanceFromFile(file);



                                flashHeaderActionButton(importPresetBtn, '#30d158');



                                window.alert(`已导入外观：${(preset && preset.name) || file.name}`);



                            }



                        } catch (error) {



                            console.error(error);



                            window.alert('导入失败，请确认文件是有效的 JSON 外观包。');



                        } finally {



                            importInput.value = '';



                        }



                    });



                }







                ensureStudioPresetActionButtons();







                function ensureTouchGuardStyle() {



                    if (root.getElementById('studioToolbarTouchGuardStyle')) return;







                    const style = document.createElement('style');



                    style.id = 'studioToolbarTouchGuardStyle';



                    style.textContent = `



                        .toolbar-content {



                            -webkit-overflow-scrolling: touch;



                            overscroll-behavior: contain;



                            touch-action: pan-y;



                        }







                        .toolbar-content input[type="range"] {



                            touch-action: pan-y;



                        }



                    `;



                    root.appendChild(style);



                }







                function setupRangeTouchScrollGuard() {



                    if (!content || content.dataset.rangeTouchGuardBound === 'true') return;



                    content.dataset.rangeTouchGuardBound = 'true';







                    let activeRange = null;



                    let gestureMode = '';



                    let touchStartX = 0;



                    let touchStartY = 0;



                    let scrollStartTop = 0;



                    let rangeStartValue = '';







                    function restoreRangeValue() {



                        if (!activeRange) return;



                        if (String(activeRange.value) === String(rangeStartValue)) return;







                        const previousMode = gestureMode;



                        gestureMode = 'restore';



                        activeRange.value = rangeStartValue;



                        activeRange.dispatchEvent(new Event('input', { bubbles: true }));



                        gestureMode = previousMode;



                    }







                    function clearActiveRange() {



                        activeRange = null;



                        gestureMode = '';



                        touchStartX = 0;



                        touchStartY = 0;



                        scrollStartTop = 0;



                        rangeStartValue = '';



                    }







                    content.addEventListener('touchstart', function (event) {



                        const range = event.target && event.target.closest ? event.target.closest('input[type="range"]') : null;



                        if (!range) {



                            clearActiveRange();



                            return;



                        }







                        if (!event.touches || !event.touches.length) return;







                        activeRange = range;



                        gestureMode = 'pending';



                        touchStartX = event.touches[0].clientX;



                        touchStartY = event.touches[0].clientY;



                        scrollStartTop = content.scrollTop;



                        rangeStartValue = String(range.value);



                    }, { passive: true });







                    content.addEventListener('touchmove', function (event) {



                        if (!activeRange || !event.touches || !event.touches.length) return;







                        const deltaX = event.touches[0].clientX - touchStartX;



                        const deltaY = event.touches[0].clientY - touchStartY;



                        const absX = Math.abs(deltaX);



                        const absY = Math.abs(deltaY);







                        if (gestureMode === 'pending') {



                            if (absY >= 8 && absY > absX + 2) {



                                gestureMode = 'scroll';



                                restoreRangeValue();



                            } else if (absX >= 8 && absX > absY) {



                                gestureMode = 'slide';



                            } else {



                                return;



                            }



                        }







                        if (gestureMode !== 'scroll') return;







                        event.preventDefault();



                        content.scrollTop = scrollStartTop - deltaY;



                        restoreRangeValue();



                    }, { passive: false });







                    content.addEventListener('input', function (event) {



                        if (gestureMode === 'scroll' && activeRange && event.target === activeRange) {



                            event.stopImmediatePropagation();



                        }



                    }, true);







                    content.addEventListener('change', function (event) {



                        if (gestureMode === 'scroll' && activeRange && event.target === activeRange) {



                            event.stopImmediatePropagation();



                        }



                    }, true);







                    content.addEventListener('touchend', clearActiveRange, { passive: true });



                    content.addEventListener('touchcancel', clearActiveRange, { passive: true });



                }







                function syncPanelBackdrop() {



                    syncStudioToolbarPanelBackdrop(root);



                }



        



                let isCollapsed = !!(root.host && root.host.dataset.studioToolbarState === 'collapsed');



                let expandedHeight = 0;



                const COLLAPSED_HEIGHT = 56;



                const EXPANDED_HEIGHT_RATIO = 0.5;



        



                function syncExpandedHeight() {



                    toolbar.style.height = 'auto';



                    const naturalHeight = toolbar.offsetHeight;



                    expandedHeight = Math.max(COLLAPSED_HEIGHT, Math.round(naturalHeight * EXPANDED_HEIGHT_RATIO));



                    toolbar.style.height = expandedHeight + 'px';



                    syncPanelBackdrop();



                }



        



                syncExpandedHeight();



        



                // 初始化位置，转换为left/top以便拖拽计算



                const rect = toolbar.getBoundingClientRect();



                toolbar.style.right = 'auto';



                toolbar.style.left = rect.left + 'px';



                toolbar.style.top = rect.top + 'px';







                if (isCollapsed) {



                    toolbar.classList.add('collapsed');



                    collapseIcon.className = 'ri-palette-line';



                    content.style.display = 'none';



                    toolbar.style.width = COLLAPSED_HEIGHT + 'px';



                    toolbar.style.height = COLLAPSED_HEIGHT + 'px';



                }







                syncHeaderActionButtons();







                syncPanelBackdrop();







                function togglePanel() {



                    const previousWidth = toolbar.getBoundingClientRect().width || toolbar.offsetWidth || 340;



                    const currentlyCollapsed = toolbar.classList.contains('collapsed');



                    isCollapsed = !currentlyCollapsed;



                   if (isCollapsed) {



                        expandedHeight = toolbar.offsetHeight; // 记住当前高度



                       toolbar.classList.add('collapsed');



                       collapseIcon.className = 'ri-palette-line';



                       content.style.display = 'none';



                       toolbar.style.width = COLLAPSED_HEIGHT + 'px';



                       toolbar.style.height = COLLAPSED_HEIGHT + 'px'; // 手动置为圆球高度



                   } else {



                        toolbar.classList.remove('collapsed');



                       content.style.display = 'block';



                       toolbar.style.width = '';



                       syncExpandedHeight();



                       collapseIcon.className = 'ri-arrow-up-s-line';



                   }







                    syncHeaderActionButtons();







                    if (root.host) {



                        root.host.dataset.studioToolbarState = isCollapsed ? 'collapsed' : 'expanded';



                    }







                    requestAnimationFrame(() => {



                        const stage = toolbar.parentElement;



                        const stageWidth = (stage && stage.clientWidth) || window.innerWidth || STUDIO_TOOLBAR_FALLBACK_WIDTH;



                        const currentLeft = parseFloat(toolbar.style.left) || STUDIO_TOOLBAR_EDGE_GAP;



                        const nextWidth = toolbar.getBoundingClientRect().width || toolbar.offsetWidth || (isCollapsed ? COLLAPSED_HEIGHT : 340);



                        const maxLeft = Math.max(STUDIO_TOOLBAR_EDGE_GAP, stageWidth - nextWidth - STUDIO_TOOLBAR_EDGE_GAP);



                        const nextLeft = Math.max(STUDIO_TOOLBAR_EDGE_GAP, Math.min(currentLeft, maxLeft));



                        toolbar.style.left = nextLeft + 'px';



                        syncPanelBackdrop();



                    });



                }



        







                collapseBtn.addEventListener('click', (e) => {



                    if (!isClick) return;



                    e.preventDefault();



                    e.stopPropagation();



                    togglePanel();



                });







                const navItems = root.querySelectorAll('.nav-item');



                const sections = root.querySelectorAll('.section');



        



                navItems.forEach(item => {



                    item.addEventListener('click', () => {



                        // 移除导航高亮



                        navItems.forEach(n => n.classList.remove('active'));



                        // 移除模块显示



                        sections.forEach(s => s.classList.remove('active'));



        



                        // 添加当前高亮



                        item.classList.add('active');



                        // 显示对应模块



                        const targetId = item.getAttribute('data-target');



                        root.getElementById(targetId).classList.add('active');



        



                        // 更新高度以触发动画



                        setTimeout(() => {



                            if (!isCollapsed && !isDragging) {



                                syncExpandedHeight();



                            }



                        }, 10);



                    });



                });



        



                // ================= 选项卡交互 =================



                root.querySelectorAll('.segmented-control').forEach(control => {



                    const segments = control.querySelectorAll('.segment');



                    segments.forEach(segment => {



                        segment.addEventListener('click', () => {



                            segments.forEach(s => s.classList.remove('active'));



                            segment.classList.add('active');



                        });



                    });



                });



        



                // ================= 滑块数值反馈 =================



                root.querySelectorAll('input[type="range"]').forEach(slider => {



                    slider.addEventListener('input', (e) => {



                        const display = e.target.parentElement.querySelector('.value-display');



                        if (display) {



                            let val = e.target.value;



                            // 判断单位



                            if (display.textContent.includes('px')) val += 'px';



                            else if (display.textContent.includes('%')) val += '%';



                            display.textContent = val;



                        }



                    });



                });



        



                // ================= 颜色选择器十六进制反馈 =================



                root.querySelectorAll('input[type="color"]').forEach(picker => {



                    picker.addEventListener('input', (e) => {



                        const display = e.target.parentElement.querySelector('.value-display');



                        if (display) {



                            display.textContent = e.target.value.toUpperCase();



                        }



                    });



                });



        



                // ================= 开关面板展开折叠 =================



                function setupTogglePanel(checkboxId, panelId) {



                    const checkbox = root.getElementById(checkboxId);



                    const panel = root.getElementById(panelId);



                    if (checkbox && panel) {



                        checkbox.addEventListener('change', () => {



                            if (checkbox.checked) {



                                panel.classList.add('open');



                            } else {



                                panel.classList.remove('open');



                            }



                            



                            // 重新触发高度计算动画



                            if (!isCollapsed && !isDragging) {



                                setTimeout(() => {



                                    syncExpandedHeight();



                                }, 10); // 等待动画帧



                            }



                        });



                    }



                }



        



                setupTogglePanel('toggleBorder', 'panelBorder');



                setupTogglePanel('toggleShadow', 'panelShadow');



                setupTogglePanel('toggleDeco1', 'panelDeco1');



                setupTogglePanel('toggleDeco2', 'panelDeco2');



                setupTogglePanel('toggleTopbarShadow', 'panelTopbarShadow');



                



                setupTogglePanel('toggleBorderVoice', 'panelBorderVoice');



                setupTogglePanel('toggleShadowVoice', 'panelShadowVoice');



                setupTogglePanel('toggleDeco1Voice', 'panelDeco1Voice');



                setupTogglePanel('toggleDeco2Voice', 'panelDeco2Voice');



        



                // 互斥切换逻辑封装函数



                function setupMutexToggle(checkboxId, unifiedPanelId, independentPanelId) {



                    const toggleBox = root.getElementById(checkboxId);



                    const panelUnified = root.getElementById(unifiedPanelId);



                    const panelIndependent = root.getElementById(independentPanelId);



                    



                    if (toggleBox && panelUnified && panelIndependent) {



                        toggleBox.addEventListener('change', () => {



                            if (toggleBox.checked) {



                                panelUnified.classList.remove('open');



                                panelIndependent.classList.add('open');



                            } else {



                                panelIndependent.classList.remove('open');



                                panelUnified.classList.add('open');



                            }



                            



                            if (!isCollapsed && !isDragging) {



                                setTimeout(() => {



                                    syncExpandedHeight();



                                }, 10);



                            }



                        });



                    }



                }



        



                // 圆角三态切换逻辑封装 (统一 / 独立 / 连发)



                function setupTripleModeTabs(tabsContainerId, pUnifiedId, pSingleId, pContinuousId) {



                    const tabsContainer = root.getElementById(tabsContainerId);



                    if (!tabsContainer) return;



                    const segments = tabsContainer.querySelectorAll('.segment');



                    const pUnified = root.getElementById(pUnifiedId);



                    const pSingle = root.getElementById(pSingleId);



                    const pContinuous = root.getElementById(pContinuousId);



        



                    segments.forEach(segment => {



                        segment.addEventListener('click', () => {



                            segments.forEach(s => s.classList.remove('active'));



                            segment.classList.add('active');



                            



                            const mode = segment.getAttribute('data-mode');



                            pUnified.classList.remove('open');



                            pSingle.classList.remove('open');



                            pContinuous.classList.remove('open');



        



                            if (mode === 'unified') pUnified.classList.add('open');



                            else if (mode === 'single') pSingle.classList.add('open');



                            else if (mode === 'continuous') pContinuous.classList.add('open');



        



                            if (!isCollapsed && !isDragging) {



                                setTimeout(() => {



                                    syncExpandedHeight();



                                }, 10);



                            }



                        });



                    });



                }



        



                // 应用特殊的内边距互斥切换逻辑



                setupMutexToggle('togglePadding', 'panelUnifiedPadding', 'panelIndependentPadding');



                setupMutexToggle('togglePaddingVoice', 'panelUnifiedPaddingVoice', 'panelIndependentPaddingVoice');



        



                // 应用圆角模式切换逻辑



                setupTripleModeTabs('radiusModeTabsOrd', 'panelRadiusUnifiedOrd', 'panelRadiusSingleOrd', 'panelRadiusContinuousOrd');



                setupTripleModeTabs('radiusModeTabsVoice', 'panelRadiusUnifiedVoice', 'panelRadiusSingleVoice', 'panelRadiusContinuousVoice');



        



                // 为“仅最后一条显示”单独加一点动画补偿，虽然它只是个开关但也能刷新高度缓冲



                root.querySelectorAll('#toggleDeco1Last, #toggleDeco2Last, #toggleDeco1LastVoice, #toggleDeco2LastVoice').forEach(checkbox => {



                    checkbox.addEventListener('change', () => {



                        if (!isCollapsed && !isDragging) {



                            setTimeout(() => {



                                syncExpandedHeight();



                            }, 10);



                        }



                    });



                });



        



                // ================= 拖拽逻辑 =================



                let isDragging = false;



                let isClick = false;



                let startX, startY, initialX, initialY;



                let clickEventPath = [];



        



                // 获取拖动目标：整个 toolbar 容器在悬浮状态下可以拖，在展开状态下 header 可以拖



                toolbar.addEventListener('mousedown', dragStart);



                document.addEventListener('mousemove', drag);



                document.addEventListener('mouseup', dragEnd);



        



                toolbar.addEventListener('touchstart', dragStart, {passive: false});



                document.addEventListener('touchmove', drag, {passive: false});



                document.addEventListener('touchend', dragEnd);



        



                function dragStart(e) {



                    // 如果是展开状态，只有按在 header 区域才允许拖拽



                    if (!isCollapsed && !e.target.closest('.toolbar-header')) {



                        return;



                    }



        



                    if (e.type === 'touchstart') {



                        startX = e.touches[0].clientX;



                        startY = e.touches[0].clientY;



                    } else {



                        startX = e.clientX;



                        startY = e.clientY;



                    }



        



                    // 记录原始位置



                    const currentLeft = parseFloat(toolbar.style.left) || 0;



                    const currentTop = parseFloat(toolbar.style.top) || 0;



                    initialX = startX - currentLeft;



                    initialY = startY - currentTop;



        



                    isDragging = true;



                    isClick = true; // ?????????????????



                    clickEventPath = typeof e.composedPath === 'function' ? e.composedPath() : (e.target ? [e.target] : []);



                    toolbar.style.transition = 'none'; // 关闭动画，防止拖拽卡顿



                }



        



                function drag(e) {



                    if (!isDragging) return;



        



                    let clientX, clientY;



                    if (e.type === 'touchmove') {



                        clientX = e.touches[0].clientX;



                        clientY = e.touches[0].clientY;



                    } else {



                        clientX = e.clientX;



                        clientY = e.clientY;



                    }



        



                    // 只有位移超过 5px 才判定为拖拽



                    if (Math.abs(clientX - startX) > 5 || Math.abs(clientY - startY) > 5) {



                        isClick = false; // 取消点击判断



                        e.preventDefault(); // 阻止默认行为（比如选中文字）



                        



                        let newLeft = clientX - initialX;



                        let newTop = clientY - initialY;



        



                        // 屏幕边界限制



                        const maxLeft = window.innerWidth - toolbar.offsetWidth;



                        const maxTop = window.innerHeight - toolbar.offsetHeight;



                        



                        newLeft = Math.max(0, Math.min(newLeft, maxLeft));



                        newTop = Math.max(0, Math.min(newTop, maxTop));



        



                        toolbar.style.left = newLeft + 'px';



                        toolbar.style.top = newTop + 'px';



                    }



                }



        



                function dragEnd(e) {



                    if (!isDragging) return;



                    isDragging = false;



                    



                    toolbar.style.transition = 'height var(--transition-bounce), width var(--transition-smooth), border-radius var(--transition-smooth), box-shadow var(--transition-smooth)';



        



                    if (!isClick) {



                        return;



                    }



        



                    const clickTarget = clickEventPath[0] || e.target;



                    const eventPath = clickEventPath.length ? clickEventPath : (typeof e.composedPath === 'function' ? e.composedPath() : []);



                    const clickedActionButton = eventPath.some((node) => node && node.classList && node.classList.contains('action-btn')) || !!(clickTarget && clickTarget.closest && clickTarget.closest('.action-btn'));



                    const clickedToolbar = eventPath.some((node) => node && node.id === 'toolbar') || !!(clickTarget && clickTarget.closest && clickTarget.closest('#toolbar'));



        



                    if (clickedActionButton) {



                        return;



                    }



        



                    if (isCollapsed) {



                        if (clickedToolbar) {



                            togglePanel();



                        }



                        return;



                    }



                }



        



                // 防止容器内的原生点击事件与 drag 逻辑冲突



                toolbar.addEventListener('click', (e) => {



                    // 如果是在展开状态下点击了输入框或滑块，则不要做任何拦截



                    if (!isCollapsed && !e.target.closest('.toolbar-header')) {



                        return;



                    }



                    // 其它情况一律阻挡默认 click，因为我们在 dragEnd 中处理过了



                    if (!isClick) {



                        e.preventDefault();



                    }



                });



        



                // 监听内容高度变化自动调整容器



                const resizeObserver = new ResizeObserver(() => {



                    if (!isCollapsed && !isDragging) {



                        syncExpandedHeight();



                    }



                });



                resizeObserver.observe(content);







                ensureTouchGuardStyle();



                setupRangeTouchScrollGuard();



    }







    function syncStudioToolbarPanelBackdrop(shadow) {



        const toolbar = shadow.getElementById('toolbar');



        const panelBackdrop = shadow.getElementById('studioToolbarPanelBackdrop');



        if (!toolbar || !panelBackdrop) return;







        const isCollapsed = toolbar.classList.contains('collapsed');



        if (isCollapsed) {



            panelBackdrop.classList.remove('active');



            panelBackdrop.style.width = '0px';



            panelBackdrop.style.height = '0px';



            return;



        }







        const stage = panelBackdrop.parentElement;



        if (!stage) return;







        const toolbarRect = toolbar.getBoundingClientRect();



        const stageRect = stage.getBoundingClientRect();



        panelBackdrop.style.left = Math.round(toolbarRect.left - stageRect.left) + 'px';



        panelBackdrop.style.top = Math.round(toolbarRect.top - stageRect.top) + 'px';



        panelBackdrop.style.width = Math.round(toolbarRect.width) + 'px';



        panelBackdrop.style.height = Math.round(toolbarRect.height) + 'px';



        panelBackdrop.style.borderRadius = getComputedStyle(toolbar).borderRadius;



        panelBackdrop.classList.add('active');



    }







    function setStudioToolbarCollapsed(host, shadow) {



        const toolbar = shadow.getElementById('toolbar');



        const content = shadow.getElementById('toolbarContent');



        const collapseIcon = shadow.getElementById('collapseIcon');



        if (!toolbar || !content || !collapseIcon) return;







        toolbar.classList.add('collapsed');



        toolbar.style.width = STUDIO_TOOLBAR_COLLAPSED_SIZE + 'px';



        toolbar.style.height = STUDIO_TOOLBAR_COLLAPSED_SIZE + 'px';



        content.style.display = 'none';



        collapseIcon.className = 'ri-palette-line';



        host.dataset.studioToolbarState = 'collapsed';



        syncStudioToolbarPanelBackdrop(shadow);



    }







    function positionStudioToolbar(host, shadow) {



        const toolbar = shadow.getElementById('toolbar');



        if (!toolbar) return;







        const studioScreen = host.closest('#studio-chat-screen');



        const chatHeader = studioScreen ? studioScreen.querySelector('.chat-header') : null;



        const screenRect = studioScreen ? studioScreen.getBoundingClientRect() : null;



        const toolbarRect = toolbar.getBoundingClientRect();



        const isCollapsed = toolbar.classList.contains('collapsed');



        const hostWidth = Math.round((screenRect && screenRect.width) || host.clientWidth || host.getBoundingClientRect().width || STUDIO_TOOLBAR_FALLBACK_WIDTH);



        const toolbarWidth = Math.round((isCollapsed ? STUDIO_TOOLBAR_COLLAPSED_SIZE : toolbarRect.width) || 340);



        const left = STUDIO_TOOLBAR_EDGE_GAP;



        const headerHeight = Math.round((chatHeader && chatHeader.getBoundingClientRect().height) || 0);



        const top = Math.max(headerHeight + STUDIO_TOOLBAR_TOP_GAP, STUDIO_TOOLBAR_FALLBACK_TOP);







        toolbar.style.right = 'auto';



        toolbar.style.left = left + 'px';



        toolbar.style.top = top + 'px';



        syncStudioToolbarPanelBackdrop(shadow);



    }







    function refreshStudioToolbarLayout(resetToCollapsed) {



        const host = document.getElementById('studio-toolbar-host');



        if (!host || !host.shadowRoot) return;







        const shadow = host.shadowRoot;



        requestAnimationFrame(function () {



            if (resetToCollapsed || !host.dataset.studioToolbarInitialized) {



                setStudioToolbarCollapsed(host, shadow);



                host.dataset.studioToolbarInitialized = 'true';



            }



            positionStudioToolbar(host, shadow);



        });



    }







    function mountStudioToolbar() {



        const host = document.getElementById('studio-toolbar-host');



        if (!host || host.shadowRoot) return;







        host.style.position = 'absolute';



        host.style.inset = '0';



        host.style.display = 'block';



        host.style.zIndex = '40';



        if (!host.dataset.studioToolbarState) {



            host.dataset.studioToolbarState = 'collapsed';



        }







        const shadow = host.attachShadow({ mode: 'open' });



        shadow.innerHTML = `



            <link rel="stylesheet" href="css/remixicon.css">



            <style>



                :host {



                    position: absolute;



                    inset: 0;



                    display: block;



                    z-index: 40;



                    pointer-events: none;



                    --bg-color: #f5f5f7;



                    --glass-bg: rgba(255, 255, 255, 0.65);



                    --glass-border: rgba(255, 255, 255, 0.4);



                    --text-main: #1d1d1f;



                    --text-muted: #86868b;



                    --accent: #007aff;



                    --shadow-sm: 0 4px 15px rgba(0, 0, 0, 0.04);



                    --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.08);



                    --radius-lg: 24px;



                    --radius-md: 16px;



                    --radius-sm: 10px;



                    --transition-bounce: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);



                    --transition-smooth: 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);



                }



                .studio-toolbar-stage { position: relative; width: 100%; height: 100%; overflow: hidden; pointer-events: none; }



                .studio-toolbar-panel-backdrop { position: absolute; left: 0; top: 0; width: 0; height: 0; opacity: 0; pointer-events: none; z-index: 99; border-radius: var(--radius-lg); background-color: var(--bg-color); background-image: radial-gradient(at 20% 30%, rgba(0, 122, 255, 0.05) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(0, 0, 0, 0.03) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(255, 255, 255, 0.8) 0px, transparent 50%); transition: left var(--transition-smooth), top var(--transition-smooth), width var(--transition-smooth), height var(--transition-smooth), border-radius var(--transition-smooth), opacity 0.2s ease; }



                .studio-toolbar-panel-backdrop.active { opacity: 1; }



                .studio-toolbar-stage .toolbar-container { pointer-events: auto; }



                ${TOOLBAR_STYLE}



            </style>



            <div class="studio-toolbar-stage">



                <div class="studio-toolbar-panel-backdrop" id="studioToolbarPanelBackdrop"></div>



                ${TOOLBAR_MARKUP}



            </div>



        `;







        runStudioToolbar(shadow);



        refreshStudioToolbarLayout(true);







        window.addEventListener('resize', function () {



            refreshStudioToolbarLayout(false);



        });



    }







    window.mountStudioToolbar = mountStudioToolbar;



    window.refreshStudioToolbarLayout = refreshStudioToolbarLayout;







    if (document.readyState === 'loading') {



        document.addEventListener('DOMContentLoaded', mountStudioToolbar);



    } else {



        mountStudioToolbar();



    }



})();










