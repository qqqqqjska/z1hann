// 小游戏功能模块

window.currentMiniGame = null;
let minesweeperState = {
    grid: [],
    rows: 9,
    cols: 9,
    mines: 10,
    flags: 0,
    gameOver: false,
    startTime: null,
    timerInterval: null,
    level: 'easy'
};

// --- 初始化与事件监听 ---

function initGames() {
    const gamesBtn = document.getElementById('chat-more-games-btn');
    if (gamesBtn) {
        gamesBtn.addEventListener('click', () => {
            document.getElementById('chat-more-panel').classList.add('hidden');
            openGameSelection();
        });
    }

    const closeSelectionBtn = document.getElementById('close-game-selection');
    if (closeSelectionBtn) {
        closeSelectionBtn.addEventListener('click', () => {
            document.getElementById('game-selection-modal').classList.add('hidden');
        });
    }

    const closeMinesweeperBtn = document.getElementById('close-minesweeper');
    if (closeMinesweeperBtn) {
        closeMinesweeperBtn.addEventListener('click', closeMinesweeper);
    }

    const minimizeMinesweeperBtn = document.getElementById('minimize-minesweeper');
    if (minimizeMinesweeperBtn) {
        minimizeMinesweeperBtn.addEventListener('click', minimizeMinesweeper);
    }

    const minesweeperMinimized = document.getElementById('minesweeper-minimized');
    if (minesweeperMinimized) {
        minesweeperMinimized.addEventListener('click', (e) => {
            // Check if it was a drag or a click
            if (minesweeperMinimized.dataset.isDragging === 'true') {
                return;
            }
            restoreMinesweeper();
        });
        makeDraggable(minesweeperMinimized, minesweeperMinimized);
    }

    const msFaceBtn = document.getElementById('ms-face-btn');
    if (msFaceBtn) {
        msFaceBtn.addEventListener('click', () => startMinesweeper(minesweeperState.level));
    }

    const levelBtns = document.querySelectorAll('.ms-level-btn');
    levelBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            levelBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            startMinesweeper(e.target.dataset.level);
        });
    });

    const msWindow = document.getElementById('minesweeper-window');
    const msHeader = document.getElementById('minesweeper-header');
    if (msWindow && msHeader) {
        makeDraggable(msWindow, msHeader);
    }

    // Minesweeper Mode Selection Listeners
    const msModeSoloBtn = document.getElementById('ms-mode-solo');
    if (msModeSoloBtn) {
        msModeSoloBtn.addEventListener('click', () => {
            document.getElementById('minesweeper-mode-modal').classList.add('hidden');
            startMinesweeper();
        });
    }

    const msModeCoopBtn = document.getElementById('ms-mode-coop');
    if (msModeCoopBtn) {
        msModeCoopBtn.addEventListener('click', () => {
            document.getElementById('minesweeper-mode-modal').classList.add('hidden');
            handleMinesweeperCoop();
        });
    }
    
    const closeModeBtn = document.getElementById('close-minesweeper-mode');
    if (closeModeBtn) {
        closeModeBtn.addEventListener('click', () => {
            document.getElementById('minesweeper-mode-modal').classList.add('hidden');
        });
    }

    const closePickerBtn = document.getElementById('close-contact-picker');
    if (closePickerBtn) {
        closePickerBtn.addEventListener('click', () => {
            document.getElementById('contact-picker-modal').classList.add('hidden');
        });
    }

    const msAiHelpBtn = document.getElementById('ms-ai-help-btn');
    if (msAiHelpBtn) {
        msAiHelpBtn.addEventListener('click', () => {
            if (window.sendMessage) window.sendMessage("帮我玩一下", true, "text");
            setTimeout(() => {
                if (window.generateAiReply) window.generateAiReply();
            }, 500);
        });
    }

    // Mini Game Generic Modal
    const closeMiniGameBtn = document.getElementById('close-mini-game');
    if (closeMiniGameBtn) {
        closeMiniGameBtn.addEventListener('click', () => {
            document.getElementById('mini-game-modal').classList.add('hidden');
        });
    }

    const minimizeMiniGameBtn = document.getElementById('minimize-mini-game');
    if (minimizeMiniGameBtn) {
        minimizeMiniGameBtn.addEventListener('click', minimizeMiniGame);
    }

    const miniGameMinimized = document.getElementById('mini-game-minimized');
    if (miniGameMinimized) {
        miniGameMinimized.addEventListener('click', (e) => {
            if (miniGameMinimized.dataset.isDragging === 'true') {
                return;
            }
            restoreMiniGame();
        });
        makeDraggable(miniGameMinimized, miniGameMinimized);
    }

    const miniGameWindow = document.getElementById('mini-game-window');
    const miniGameHeader = document.getElementById('mini-game-header');
    if (miniGameWindow && miniGameHeader) {
        makeDraggable(miniGameWindow, miniGameHeader);
    }
}

function minimizeMiniGame() {
    const windowEl = document.getElementById('mini-game-window');
    const minimizedIcon = document.getElementById('mini-game-minimized');
    
    // Hide window, show icon
    windowEl.classList.add('ms-window-hidden'); // Reuse same class as minesweeper for transition
    minimizedIcon.classList.remove('ms-icon-hidden');
    
    // Also hide the modal container background (since it's transparent now, but good practice)
    document.getElementById('mini-game-modal').classList.add('hidden'); 
    // Wait, if I hide modal, the icon needs to be outside modal? 
    // In index.html, icon is outside modal. Correct.
}

function restoreMiniGame() {
    const windowEl = document.getElementById('mini-game-window');
    const minimizedIcon = document.getElementById('mini-game-minimized');
    
    document.getElementById('mini-game-modal').classList.remove('hidden');
    windowEl.classList.remove('ms-window-hidden');
    minimizedIcon.classList.add('ms-icon-hidden');
}

function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    handle.addEventListener('mousedown', dragMouseDown);
    handle.addEventListener('touchstart', dragMouseDown, { passive: false });

    function dragMouseDown(e) {
        element.dataset.isDragging = 'false'; // Reset drag state
        e = e || window.event;
        
        if (e.type === 'touchstart') {
            // e.preventDefault(); // Allow tap
            pos3 = e.touches[0].clientX;
            pos4 = e.touches[0].clientY;
            
            document.addEventListener('touchend', closeDragElement, { passive: false });
            document.addEventListener('touchmove', elementDrag, { passive: false });
        } else {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
    }

    function elementDrag(e) {
        element.dataset.isDragging = 'true'; // Mark as dragging
        e = e || window.event;
        
        if (e.cancelable) {
            e.preventDefault(); // Prevent default (scrolling) during drag
        }
        
        // calculate the new cursor position:
        let clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;
        // set the element's new position:
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
        
        document.removeEventListener('touchend', closeDragElement);
        document.removeEventListener('touchmove', elementDrag);
    }
}

function minimizeMinesweeper() {
    // Animate minimize
    const windowEl = document.getElementById('minesweeper-window');
    const minimizedIcon = document.getElementById('minesweeper-minimized');
    
    windowEl.classList.add('ms-window-hidden');
    minimizedIcon.classList.remove('ms-icon-hidden');
}

function restoreMinesweeper() {
    const windowEl = document.getElementById('minesweeper-window');
    const minimizedIcon = document.getElementById('minesweeper-minimized');
    
    windowEl.classList.remove('ms-window-hidden');
    minimizedIcon.classList.add('ms-icon-hidden');
}

function openGameSelection() {
    document.getElementById('game-selection-modal').classList.remove('hidden');
}

window.openMinesweeperModeSelection = function() {
    document.getElementById('game-selection-modal').classList.add('hidden');
    document.getElementById('minesweeper-mode-modal').classList.remove('hidden');
};

function handleMinesweeperCoop() {
    if (window.iphoneSimState.currentChatContactId) {
        startMinesweeperWithContact(window.iphoneSimState.currentChatContactId);
    } else {
        openContactPickerForGame();
    }
}

function openContactPickerForGame() {
    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    
    if (!list) return;
    list.innerHTML = '';
    
    if (!window.iphoneSimState.contacts || window.iphoneSimState.contacts.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无联系人</div>';
    } else {
        window.iphoneSimState.contacts.forEach(contact => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="list-content" style="align-items: center;">
                    <img src="${contact.avatar}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; object-fit: cover;">
                    <span>${contact.remark || contact.name}</span>
                </div>
            `;
            item.onclick = () => {
                modal.classList.add('hidden');
                // Open chat and start game
                document.getElementById('wechat-app').classList.remove('hidden');
                if (window.openChat) {
                    window.openChat(contact.id);
                }
                setTimeout(() => {
                    startMinesweeperWithContact(contact.id);
                }, 500);
            };
            list.appendChild(item);
        });
    }
    
    if (sendBtn) sendBtn.style.display = 'none'; // Hide default send button
    
    modal.classList.remove('hidden');
}

function startMinesweeperWithContact(contactId) {
    if (window.sendMessage) {
        window.sendMessage('[邀请你玩扫雷]', true, 'minesweeper_invite');
    }
    
    startMinesweeper();
    
    setTimeout(() => {
        if (window.generateAiReply) window.generateAiReply("用户邀请你玩扫雷。你可以通过回复 ACTION: MINESWEEPER_CLICK: row,col 来进行操作。");
    }, 1000);
}

window.getMinesweeperGameState = function() {
    if (!minesweeperState.grid || minesweeperState.grid.length === 0) return "Game not started.";
    
    let board = `Minesweeper Board (${minesweeperState.rows}x${minesweeperState.cols}), Mines: ${minesweeperState.mines - minesweeperState.flags}\n`;
    board += "   ";
    for (let c = 0; c < minesweeperState.cols; c++) board += (c % 10) + " "; 
    board += "\n";
    
    for (let r = 0; r < minesweeperState.rows; r++) {
        board += (r % 10) + "  "; 
        for (let c = 0; c < minesweeperState.cols; c++) {
            const cell = minesweeperState.grid[r][c];
            if (cell.isRevealed) {
                if (cell.isMine) board += "* ";
                else board += cell.neighborMines + " ";
            } else if (cell.isFlagged) {
                board += "F ";
            } else {
                board += "? ";
            }
        }
        board += "\n";
    }
    return board;
};

window.handleAiMinesweeperMove = function(command, r, c) {
    r = parseInt(r);
    c = parseInt(c);
    
    if (isNaN(r) || isNaN(c)) return;
    if (r < 0 || r >= minesweeperState.rows || c < 0 || c >= minesweeperState.cols) return;
    
    // 检查有效性
    const cellData = minesweeperState.grid[r][c];
    if ((command === 'CLICK' || command === 'REVEAL')) {
        // 如果已经揭开，忽略
        if (cellData.isRevealed) return;
        // 如果已插旗，忽略点击（必须先取消插旗）
        if (cellData.isFlagged) return;
    } else if (command === 'FLAG') {
        // 如果已经揭开，不能插旗
        if (cellData.isRevealed) return;
    }

    // Highlight cell
    const cellEl = document.querySelector(`.ms-cell[data-row="${r}"][data-col="${c}"]`);
    if (cellEl) {
        const originalBorder = cellEl.style.border;
        const originalTransform = cellEl.style.transform;
        
        cellEl.style.border = '2px solid #007AFF';
        cellEl.style.zIndex = '10';
        cellEl.style.transform = 'scale(1.1)';
        cellEl.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            cellEl.style.border = originalBorder;
            cellEl.style.zIndex = '';
            cellEl.style.transform = originalTransform;
            
            if (command === 'CLICK' || command === 'REVEAL') {
                revealCell(r, c);
            } else if (command === 'FLAG') {
                toggleFlag(r, c);
            }
        }, 800);
    }
};

// --- 扫雷游戏逻辑 ---

window.startMinesweeper = function(level = 'easy') {
    document.getElementById('game-selection-modal').classList.add('hidden');
    const modal = document.getElementById('minesweeper-modal');
    modal.classList.remove('hidden');
    
    // Reset minimize state
    const windowEl = document.getElementById('minesweeper-window');
    const minimizedIcon = document.getElementById('minesweeper-minimized');
    
    windowEl.classList.remove('ms-window-hidden');
    minimizedIcon.classList.add('ms-icon-hidden');
    
    // 设置难度
    minesweeperState.level = level;
    if (level === 'easy') {
        minesweeperState.rows = 9;
        minesweeperState.cols = 9;
        minesweeperState.mines = 10;
    } else if (level === 'medium') {
        minesweeperState.rows = 16;
        minesweeperState.cols = 16;
        minesweeperState.mines = 40;
    } else if (level === 'hard') {
        minesweeperState.rows = 20;
        minesweeperState.cols = 15;
        minesweeperState.mines = 50;
    }

    resetMinesweeper();
    renderMinesweeperGrid();
};

function closeMinesweeper() {
    document.getElementById('minesweeper-modal').classList.add('hidden');
    if (minesweeperState.timerInterval) clearInterval(minesweeperState.timerInterval);
}

function resetMinesweeper() {
    if (minesweeperState.timerInterval) clearInterval(minesweeperState.timerInterval);
    minesweeperState.timerInterval = null;
    minesweeperState.startTime = null;
    minesweeperState.gameOver = false;
    minesweeperState.flags = 0;
    minesweeperState.grid = [];

    // 更新 UI
    document.getElementById('ms-mines-count').textContent = formatNumber(minesweeperState.mines);
    document.getElementById('ms-timer').textContent = '000';
    document.getElementById('ms-face-btn').textContent = '🙂';

    // 初始化网格数据
    for (let r = 0; r < minesweeperState.rows; r++) {
        const row = [];
        for (let c = 0; c < minesweeperState.cols; c++) {
            row.push({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            });
        }
        minesweeperState.grid.push(row);
    }

    // 布雷
    let minesPlaced = 0;
    while (minesPlaced < minesweeperState.mines) {
        const r = Math.floor(Math.random() * minesweeperState.rows);
        const c = Math.floor(Math.random() * minesweeperState.cols);
        if (!minesweeperState.grid[r][c].isMine) {
            minesweeperState.grid[r][c].isMine = true;
            minesPlaced++;
        }
    }

    // 计算邻居雷数
    for (let r = 0; r < minesweeperState.rows; r++) {
        for (let c = 0; c < minesweeperState.cols; c++) {
            if (!minesweeperState.grid[r][c].isMine) {
                minesweeperState.grid[r][c].neighborMines = countNeighborMines(r, c);
            }
        }
    }
}

function countNeighborMines(r, c) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const nr = r + i;
            const nc = c + j;
            if (nr >= 0 && nr < minesweeperState.rows && nc >= 0 && nc < minesweeperState.cols) {
                if (minesweeperState.grid[nr][nc].isMine) count++;
            }
        }
    }
    return count;
}

function renderMinesweeperGrid() {
    const gridEl = document.getElementById('ms-grid');
    gridEl.innerHTML = '';
    
    // 固定格子大小，确保点击体验
    const cellSize = 30; 
    const gap = 4;
    
    // 设置 CSS Grid
    gridEl.style.display = 'grid';
    gridEl.style.gridTemplateColumns = `repeat(${minesweeperState.cols}, ${cellSize}px)`;
    gridEl.style.gap = `${gap}px`;
    
    // 启用滚动容器
    gridEl.style.width = '100%';
    gridEl.style.maxWidth = '100%';
    gridEl.style.overflowX = 'auto'; // 横向滚动
    gridEl.style.padding = '5px 0';  // 避免阴影被切
    
    // 根据宽度决定对齐方式
    const estimatedWidth = minesweeperState.cols * (cellSize + gap);
    // 容器内宽约 280px (320 - padding)
    if (estimatedWidth > 280) {
        gridEl.style.justifyContent = 'start';
    } else {
        gridEl.style.justifyContent = 'center';
    }
    
    for (let r = 0; r < minesweeperState.rows; r++) {
        for (let c = 0; c < minesweeperState.cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'ms-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            cell.style.flexShrink = '0'; // 防止压缩
            cell.style.borderRadius = '4px';
            cell.style.backgroundColor = '#E5E5EA'; 
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.fontSize = '14px';
            cell.style.fontWeight = '600';
            cell.style.cursor = 'pointer';
            cell.style.transition = 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
            cell.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            
            let touchTimer = null;
            cell.addEventListener('touchstart', (e) => {
                if (minesweeperState.gameOver || minesweeperState.grid[r][c].isRevealed) return;
                touchTimer = setTimeout(() => {
                    e.preventDefault();
                    toggleFlag(r, c);
                    if (navigator.vibrate) navigator.vibrate(50);
                }, 400);
            });
            
            cell.addEventListener('touchend', () => {
                if (touchTimer) clearTimeout(touchTimer);
            });

            cell.addEventListener('click', () => {
                if (minesweeperState.gameOver) return;
                if (minesweeperState.grid[r][c].isFlagged) return;
                revealCell(r, c);
            });

            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (minesweeperState.gameOver || minesweeperState.grid[r][c].isRevealed) return;
                toggleFlag(r, c);
            });

            gridEl.appendChild(cell);
        }
    }
}

function revealCell(r, c) {
    const cellData = minesweeperState.grid[r][c];
    if (cellData.isRevealed || cellData.isFlagged) return;

    if (!minesweeperState.startTime) {
        minesweeperState.startTime = Date.now();
        minesweeperState.timerInterval = setInterval(updateTimer, 1000);
    }

    cellData.isRevealed = true;
    updateCellUI(r, c);

    if (cellData.isMine) {
        gameOver(false);
    } else {
        if (cellData.neighborMines === 0) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const nr = r + i;
                    const nc = c + j;
                    if (nr >= 0 && nr < minesweeperState.rows && nc >= 0 && nc < minesweeperState.cols) {
                        revealCell(nr, nc);
                    }
                }
            }
        }
        checkWin();
    }
}

function toggleFlag(r, c) {
    const cellData = minesweeperState.grid[r][c];
    if (cellData.isRevealed) return;

    if (cellData.isFlagged) {
        cellData.isFlagged = false;
        minesweeperState.flags--;
    } else {
        if (minesweeperState.flags < minesweeperState.mines) {
            cellData.isFlagged = true;
            minesweeperState.flags++;
        } else {
            return; 
        }
    }
    
    updateCellUI(r, c);
    document.getElementById('ms-mines-count').textContent = minesweeperState.mines - minesweeperState.flags;
}

function updateCellUI(r, c) {
    const cell = document.querySelector(`.ms-cell[data-row="${r}"][data-col="${c}"]`);
    const data = minesweeperState.grid[r][c];

    cell.style.boxShadow = 'none';
    cell.style.transform = 'scale(1)';

    if (data.isRevealed) {
        cell.style.backgroundColor = '#fff';
        cell.style.border = '1px solid #f0f0f0';
        
        if (data.isMine) {
            cell.style.backgroundColor = '#FF3B30';
            cell.style.border = 'none';
            cell.textContent = '💣';
            cell.style.color = '#fff';
        } else {
            if (data.neighborMines > 0) {
                cell.textContent = data.neighborMines;
                cell.style.color = getNumberColor(data.neighborMines);
            } else {
                cell.textContent = '';
            }
        }
    } else if (data.isFlagged) {
        cell.style.backgroundColor = '#FF9500';
        cell.textContent = '🚩';
        cell.style.color = '#fff';
        cell.style.border = 'none';
    } else {
        cell.textContent = '';
        cell.style.backgroundColor = '#E5E5EA';
        cell.style.border = 'none';
        cell.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
    }
}

function getNumberColor(n) {
    const colors = ['blue', 'green', 'red', 'darkblue', 'brown', 'cyan', 'black', 'gray'];
    return colors[n - 1] || 'black';
}

function gameOver(win) {
    minesweeperState.gameOver = true;
    if (minesweeperState.timerInterval) clearInterval(minesweeperState.timerInterval);

    document.getElementById('ms-face-btn').textContent = win ? '😎' : '😵';

    if (!win) {
        for (let r = 0; r < minesweeperState.rows; r++) {
            for (let c = 0; c < minesweeperState.cols; c++) {
                if (minesweeperState.grid[r][c].isMine) {
                    minesweeperState.grid[r][c].isRevealed = true;
                    updateCellUI(r, c);
                }
            }
        }
    } else {
        showVictoryAnimation();
    }

    if (window.iphoneSimState && window.iphoneSimState.currentChatContactId && window.generateAiReply) {
        setTimeout(() => {
            const resultText = win ? "游戏胜利！所有地雷都已找出。" : "游戏失败！不小心踩到了地雷。";
            window.generateAiReply(`[系统通知]: 扫雷${resultText} 请根据当前游戏结果发表一句简短的评论。`);
        }, 1500);
    }
}

function showVictoryAnimation() {
    const windowEl = document.getElementById('minesweeper-window');
    
    const overlay = document.createElement('div');
    overlay.className = 'victory-overlay';
    
    const content = `
        <div class="victory-emoji">🏆</div>
        <div class="victory-title">Victory!</div>
        <div style="font-size: 16px; color: #666; font-weight: 500;">
            Time: ${document.getElementById('ms-timer').textContent}s
        </div>
        <button id="ms-restart-btn" style="margin-top: 20px; padding: 10px 30px; background: #007AFF; color: white; border: none; border-radius: 20px; font-weight: 600; font-size: 16px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,122,255,0.3);">
            Play Again
        </button>
    `;
    overlay.innerHTML = content;
    
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'ms-confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = ['#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55'][Math.floor(Math.random() * 8)];
        confetti.style.animationDuration = (Math.random() * 2 + 1) + 's';
        confetti.style.animationDelay = (Math.random() * 0.5) + 's';
        overlay.appendChild(confetti);
    }
    
    windowEl.appendChild(overlay);
    
    document.getElementById('ms-restart-btn').addEventListener('click', () => {
        overlay.remove();
        startMinesweeper(minesweeperState.level);
    });
}

function checkWin() {
    let revealedCount = 0;
    for (let r = 0; r < minesweeperState.rows; r++) {
        for (let c = 0; c < minesweeperState.cols; c++) {
            if (minesweeperState.grid[r][c].isRevealed) revealedCount++;
        }
    }
    
    if (revealedCount === (minesweeperState.rows * minesweeperState.cols - minesweeperState.mines)) {
        gameOver(true);
    }
}

function updateTimer() {
    const now = Date.now();
    const diff = Math.floor((now - minesweeperState.startTime) / 1000);
    const display = diff > 999 ? 999 : diff;
    document.getElementById('ms-timer').textContent = formatNumber(display);
}

function formatNumber(num) {
    return num.toString().padStart(3, '0');
}

// --- New Mini Games Logic ---

window.startMiniGame = function(gameType) {
    document.getElementById('game-selection-modal').classList.add('hidden');
    
    const modal = document.getElementById('mini-game-modal');
    modal.classList.remove('hidden');
    
    // Ensure window is visible and icon hidden
    const windowEl = document.getElementById('mini-game-window');
    const minimizedIcon = document.getElementById('mini-game-minimized');
    windowEl.classList.remove('ms-window-hidden');
    minimizedIcon.classList.add('ms-icon-hidden');

    const title = document.getElementById('mini-game-title');
    const content = document.getElementById('mini-game-content');
    const resultDiv = document.getElementById('mini-game-result');
    
    resultDiv.innerHTML = '';
    content.innerHTML = '';
    
    // Reset max-width if changed by specific games
    windowEl.style.maxWidth = '320px';

    // Clear any previous AI help buttons in header
    const oldAiBtn = document.getElementById('mini-game-ai-btn');
    if(oldAiBtn) oldAiBtn.remove();

    // Clear any previous Import buttons
    const oldImportBtn = document.getElementById('mini-game-import-btn');
    if (oldImportBtn) oldImportBtn.remove();
    const oldImportInput = document.getElementById('tod-import-input');
    if (oldImportInput) oldImportInput.remove();

    if (gameType === 'truth_dare') {
        const headerControls = document.querySelector('#mini-game-header > div:last-child');
        const minimizeBtn = document.getElementById('minimize-mini-game');
        
        if (headerControls && minimizeBtn) {
            // Remove old buttons if exists (cleanup)
            const oldPresetBtn = document.getElementById('mini-game-preset-btn');
            if(oldPresetBtn) oldPresetBtn.remove();

            // 1. Preset Button
            const presetBtn = document.createElement('button');
            presetBtn.id = 'mini-game-preset-btn';
            presetBtn.innerHTML = '<i class="fas fa-list"></i>';
            presetBtn.style.cssText = 'background: transparent; border: none; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #8e8e93; cursor: pointer; transition: all 0.2s; margin-right: 5px;';
            presetBtn.title = "题库预设";
            
            presetBtn.onmouseenter = () => presetBtn.style.backgroundColor = '#f2f2f7';
            presetBtn.onmouseleave = () => presetBtn.style.backgroundColor = 'transparent';
            presetBtn.onclick = showTodPresets;

            // 2. Import Button
            const importBtn = document.createElement('button');
            importBtn.id = 'mini-game-import-btn';
            importBtn.innerHTML = '<i class="fas fa-file-import"></i>';
            importBtn.style.cssText = 'background: transparent; border: none; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #8e8e93; cursor: pointer; transition: all 0.2s;';
            importBtn.title = "导入题目";
            
            importBtn.onmouseenter = () => importBtn.style.backgroundColor = '#f2f2f7';
            importBtn.onmouseleave = () => importBtn.style.backgroundColor = 'transparent';

            const input = document.createElement('input');
            input.type = 'file';
            input.id = 'tod-import-input';
            input.accept = '.json';
            input.style.display = 'none';
            document.body.appendChild(input);

            importBtn.onclick = () => input.click();

            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const data = JSON.parse(ev.target.result);
                        if (data.truth && Array.isArray(data.truth) && data.dare && Array.isArray(data.dare)) {
                            tdState.pools.truth = data.truth;
                            tdState.pools.dare = data.dare;
                            saveTodData();
                            alert('真心话大冒险题库导入成功！');
                        } else {
                            alert('导入格式错误：JSON文件必须包含 truth 和 dare 两个数组字段');
                        }
                    } catch (err) {
                        console.error(err);
                        alert('JSON 解析失败，请检查文件格式');
                    }
                };
                reader.readAsText(file);
                input.value = '';
            };

            // Insert in order: Preset -> Import -> Minimize
            headerControls.insertBefore(presetBtn, minimizeBtn);
            headerControls.insertBefore(importBtn, minimizeBtn);
        }
    }

    if (gameType === 'rps') {
        title.textContent = '猜拳';
        content.innerHTML = `
            <div style="display: flex; gap: 20px;">
                <button class="rps-btn" data-choice="rock" style="font-size: 40px; width: 80px; height: 80px; border-radius: 50%; border: none; background: #eee; cursor: pointer; transition: transform 0.2s;">✊</button>
                <button class="rps-btn" data-choice="scissors" style="font-size: 40px; width: 80px; height: 80px; border-radius: 50%; border: none; background: #eee; cursor: pointer; transition: transform 0.2s;">✌️</button>
                <button class="rps-btn" data-choice="paper" style="font-size: 40px; width: 80px; height: 80px; border-radius: 50%; border: none; background: #eee; cursor: pointer; transition: transform 0.2s;">✋</button>
            </div>
            <div id="rps-opponent" style="margin-top: 20px; font-size: 60px; min-height: 80px;">❓</div>
        `;
        
        const btns = content.querySelectorAll('.rps-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => playRPS(btn.dataset.choice));
        });
        
    } else if (gameType === 'dice') {
        title.textContent = '投骰子';
        content.innerHTML = `
            <div style="display: flex; gap: 30px; align-items: center;">
                <div style="text-align: center;">
                    <div style="margin-bottom: 10px; color: #666;">你</div>
                    <div id="dice-user" style="font-size: 60px; width: 80px; height: 80px; background: #f9f9f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);">🎲</div>
                </div>
                <div style="font-size: 24px; color: #ccc;">VS</div>
                <div style="text-align: center;">
                    <div style="margin-bottom: 10px; color: #666;">TA</div>
                    <div id="dice-opponent" style="font-size: 60px; width: 80px; height: 80px; background: #f9f9f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);">❓</div>
                </div>
            </div>
            <button id="roll-dice-btn" style="margin-top: 30px; padding: 12px 40px; background: #34C759; color: white; border: none; border-radius: 25px; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(52, 199, 89, 0.3);">
                投掷
            </button>
        `;
        
        document.getElementById('roll-dice-btn').addEventListener('click', playDice);
        
    } else if (gameType === 'witch') {
        title.textContent = '女巫的毒药';
        // Widening the modal for this game
        document.getElementById('mini-game-window').style.maxWidth = '360px';
        
        content.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <div style="display: flex; gap: 15px; align-items: flex-start; justify-content: center; width: 100%;">
                    <div style="text-align: center;">
                        <div style="margin-bottom: 5px; font-size: 12px; color: #666;">TA <span id="witch-score-opp" style="color: #FF3B30; font-weight: bold;"></span></div>
                        <div id="witch-grid-opponent" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; width: 130px; height: 130px; background: #f0f0f0; padding: 3px; border-radius: 4px;">
                            <!-- Generated by JS -->
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <div style="margin-bottom: 5px; font-size: 12px; color: #666;">你 <span id="witch-score-user" style="color: #FF3B30; font-weight: bold;"></span></div>
                        <div id="witch-grid-user" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; width: 130px; height: 130px; background: #f0f0f0; padding: 3px; border-radius: 4px;">
                            <!-- Generated by JS -->
                        </div>
                    </div>
                </div>
                <button id="witch-action-btn" style="padding: 8px 20px; background: #007AFF; color: white; border: none; border-radius: 15px; font-size: 14px; cursor: pointer; display: none;">确认布阵</button>
            </div>
            <div id="witch-status" style="margin-top: 10px; font-size: 13px; color: #666; text-align: center;">正在初始化...</div>
        `;
        
        startWitchGame();
    } else if (gameType === 'truth_dare') {
        title.textContent = '真心话大冒险';
        startTruthDareGame();
    }
};

// Initialize from LocalStorage
const savedTodPools = localStorage.getItem('tod_current_pools');
const savedTodPresets = localStorage.getItem('tod_presets');

let tdState = {
    isSpinning: false,
    currentRotation: 0,
    currentType: null, // 'truth' or 'dare'
    currentOptions: [], // Array of strings (questions)
    pools: savedTodPools ? JSON.parse(savedTodPools) : {
        'truth': [
            "最大的恐惧？",
            "最丢脸的事？",
            "暗恋过谁？",
            "最后一次哭？",
            "隐身想做啥？",
            "撒过最大的谎？",
            "想回到何时？",
            "讨厌的缺点？",
            "最喜欢的异性？",
            "初吻还在吗？"
        ],
        'dare': [
            "发鬼脸自拍",
            "发语音学猫叫",
            "给第三人发爱你",
            "改昵称我是猪",
            "左手打字十句",
            "发环境照片",
            "夸赞AI三句",
            "发尴尬表情包",
            "深情朗读一段话",
            "唱一首歌"
        ]
    },
    presets: savedTodPresets ? JSON.parse(savedTodPresets) : []
};

function startTruthDareGame() {
    const content = document.getElementById('mini-game-content');
    content.innerHTML = `
        <div class="tod-selection" style="display: flex; gap: 20px; width: 100%; justify-content: center; padding: 20px 0;">
            <button id="btn-select-truth" style="
                width: 100px; 
                height: 120px; 
                border: none; 
                border-radius: 16px; 
                background: linear-gradient(135deg, #5AC8FA, #007AFF); 
                color: white; 
                font-size: 20px; 
                font-weight: bold; 
                cursor: pointer; 
                box-shadow: 0 8px 20px rgba(90, 200, 250, 0.4);
                transition: transform 0.2s;
                display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
            ">
                <i class="fas fa-heart" style="font-size: 32px;"></i>
                真心话
            </button>
            <button id="btn-select-dare" style="
                width: 100px; 
                height: 120px; 
                border: none; 
                border-radius: 16px; 
                background: linear-gradient(135deg, #FF2D55, #FF9500); 
                color: white; 
                font-size: 20px; 
                font-weight: bold; 
                cursor: pointer; 
                box-shadow: 0 8px 20px rgba(255, 45, 85, 0.4);
                transition: transform 0.2s;
                display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
            ">
                <i class="fas fa-fire" style="font-size: 32px;"></i>
                大冒险
            </button>
        </div>
        <div style="margin-top: 10px; font-size: 14px; color: #666; text-align: center;">请选择游戏模式</div>
    `;
    
    document.getElementById('btn-select-truth').addEventListener('click', () => initTodWheel('truth'));
    document.getElementById('btn-select-dare').addEventListener('click', () => initTodWheel('dare'));
    
    // Reset state
    tdState.currentRotation = 0;
    document.getElementById('mini-game-result').textContent = '';
}

function initTodWheel(type) {
    tdState.currentType = type;
    // Randomly select 6 distinct options
    const pool = [...tdState.pools[type]];
    const selected = [];
    while(selected.length < 6 && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        selected.push(pool[idx]);
        pool.splice(idx, 1);
    }
    tdState.currentOptions = selected;
    
    // Render Wheel View
    const content = document.getElementById('mini-game-content');
    content.innerHTML = `
        <div id="wheel-container">
            <div id="wheel-pointer"></div>
            <canvas id="wheel-canvas" width="250" height="250"></canvas>
            <div id="wheel-center" style="cursor: pointer;">GO</div>
        </div>
        <button id="tod-back-btn" style="
            background: none; border: none; color: #888; font-size: 14px; cursor: pointer; text-decoration: underline; margin-top: 10px;
        ">返回选择</button>
    `;
    
    drawWheel();
    
    document.getElementById('wheel-center').addEventListener('click', spinTodWheel);
    document.getElementById('tod-back-btn').addEventListener('click', startTruthDareGame);
}

function drawWheel() {
    const canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const logicalSize = 250;
    
    // High DPI scaling
    canvas.width = logicalSize * dpr;
    canvas.height = logicalSize * dpr;
    canvas.style.width = logicalSize + 'px';
    canvas.style.height = logicalSize + 'px';
    
    ctx.scale(dpr, dpr);
    
    const centerX = logicalSize / 2;
    const centerY = logicalSize / 2;
    const radius = logicalSize / 2;
    const arc = Math.PI * 2 / 6;
    
    const colors = tdState.currentType === 'truth' 
        ? ['#5AC8FA', '#4CD964', '#FF9500', '#FF2D55', '#5856D6', '#FFCC00']
        : ['#FF2D55', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#5856D6'];
    
    const altColors = tdState.currentType === 'truth'
        ? ['#5AC8FA', '#007AFF']
        : ['#FF2D55', '#FF9500'];

    tdState.currentOptions.forEach((text, i) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, i * arc, (i + 1) * arc);
        ctx.arc(centerX, centerY, 0, (i + 1) * arc, i * arc, true);
        ctx.fillStyle = altColors[i % 2];
        ctx.fill();
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(i * arc + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, sans-serif"; // Slightly larger font
        // Truncate text if too long
        let displayText = text;
        if (text.length > 6) displayText = text.substring(0, 5) + '..';
        ctx.fillText(displayText, radius - 10, 5); // Move text outwards
        ctx.restore();
    });
}

function spinTodWheel() {
    if (tdState.isSpinning) return;
    tdState.isSpinning = true;
    document.getElementById('mini-game-result').textContent = '';
    
    let extraSpins = 5 + Math.floor(Math.random() * 5); 
    let randomDeg = Math.floor(Math.random() * 360);
    let targetRotation = tdState.currentRotation + (extraSpins * 360) + randomDeg;
    
    // Normalize to 0-360
    let finalDeg = targetRotation % 360; 
    
    // Calculate index
    // Pointer at 270 (-90). Wheel rotates clockwise.
    let pointerAngle = 270;
    let effectiveAngle = (pointerAngle - finalDeg + 7200) % 360; 
    let index = Math.floor(effectiveAngle / 60);
    let resultText = tdState.currentOptions[index];
    
    const wheel = document.getElementById('wheel-canvas');
    wheel.style.transform = `rotate(${targetRotation}deg)`;
    tdState.currentRotation = targetRotation;
    
    setTimeout(() => {
        tdState.isSpinning = false;
        handleTodFinalResult(resultText);
    }, 4000);
}

function handleTodFinalResult(text) {
    const prefix = tdState.currentType === 'truth' ? '真心话' : '大冒险';
    document.getElementById('mini-game-result').textContent = `${prefix}: ${text}`;
    
    // Auto send system message
    if (window.sendMessage) {
        window.sendMessage(`[系统消息]: 选择了【${prefix}】\n内容：${text}`, true, 'text');
    }
}

window.handleAiTruthDare = function(intent = null) {
    // Check if we are in selection mode
    const selectionDiv = document.querySelector('.tod-selection');
    if (selectionDiv) {
        // Determine type based on intent or random
        let type;
        if (intent === 'truth') type = 'truth';
        else if (intent === 'dare') type = 'dare';
        else type = Math.random() > 0.5 ? 'truth' : 'dare';
        
        // Visual feedback simulation
        const btnId = type === 'truth' ? 'btn-select-truth' : 'btn-select-dare';
        const btn = document.getElementById(btnId);
        
        if (btn) {
            // Highlight effect
            const originalBoxShadow = btn.style.boxShadow;
            btn.style.boxShadow = `0 0 15px 5px ${type === 'truth' ? '#5AC8FA' : '#FF2D55'}`;
            btn.style.transform = 'scale(1.05)';
            
            // Only generate reply if intent is null (AI deciding)
            // If intent exists (user asked), chat.js handles the reply generation via generateAiReply
            if (!intent && window.generateAiReply) {
                const text = type === 'truth' ? "我选真心话！" : "来个大冒险吧！";
                window.generateAiReply(text);
            }

            setTimeout(() => {
                btn.style.boxShadow = originalBoxShadow;
                btn.style.transform = 'scale(1)';
                initTodWheel(type);
                
                // Auto spin if it was a selection action
                setTimeout(() => {
                    if (!tdState.isSpinning) {
                        spinTodWheel();
                    }
                }, 1500);
            }, 800);
        }
    } else {
        // We are in wheel mode
        const wheelCenter = document.getElementById('wheel-center');
        if (wheelCenter && !tdState.isSpinning) {
            if (!intent && window.generateAiReply) {
                window.generateAiReply("转转转！命运的齿轮开始转动~");
            }
            spinTodWheel();
        }
    }
};

let witchState = {
    phase: 'setup', // 'setup', 'playing', 'finished'
    turn: 'user', // 'user', 'ai'
    userGrid: [], // { isPoison, isRevealed }
    aiGrid: [],
    userPoisons: 0,
    userPoisonedCount: 0, // AI hit user's poison (User lose point)
    aiPoisonedCount: 0,   // User hit AI's poison (AI lose point)
    gameOver: false
};

function startWitchGame() {
    witchState = {
        phase: 'setup',
        turn: 'user',
        userGrid: Array(25).fill(null).map(() => ({ isPoison: false, isRevealed: false })),
        aiGrid: Array(25).fill(null).map(() => ({ isPoison: false, isRevealed: false })),
        userPoisons: 0,
        userPoisonedCount: 0,
        aiPoisonedCount: 0,
        gameOver: false
    };

    // AI Setup (Randomly place 3 poisons)
    let aiPoisonsPlaced = 0;
    while (aiPoisonsPlaced < 3) {
        const idx = Math.floor(Math.random() * 25);
        if (!witchState.aiGrid[idx].isPoison) {
            witchState.aiGrid[idx].isPoison = true;
            aiPoisonsPlaced++;
        }
    }

    renderWitchBoard();
    updateWitchStatus("请在右侧（你的区域）点击格子，藏入3瓶毒药 🧪");
    
    // Auto send invite
    if (window.sendMessage) {
        const contactName = getContactName();
        window.sendMessage(`[系统消息]: 游戏“女巫的毒药”开始\n规则：双方各藏3瓶毒药，轮流猜测对方格子。\n请先进行布阵。`, true, 'text');
    }
}

function renderWitchBoard() {
    const oppGridEl = document.getElementById('witch-grid-opponent');
    const userGridEl = document.getElementById('witch-grid-user');
    const actionBtn = document.getElementById('witch-action-btn');
    
    if (!oppGridEl || !userGridEl) return;

    // Render AI Grid (Opponent - Left)
    oppGridEl.innerHTML = '';
    witchState.aiGrid.forEach((cell, idx) => {
        const div = document.createElement('div');
        div.style.backgroundColor = '#fff';
        div.style.borderRadius = '2px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.fontSize = '14px';
        div.style.aspectRatio = '1/1'; // Force square
        div.style.overflow = 'hidden';
        div.style.cursor = (witchState.phase === 'playing' && witchState.turn === 'user' && !cell.isRevealed) ? 'pointer' : 'default';
        
        if (cell.isRevealed) {
            if (cell.isPoison) {
                div.textContent = '☠️';
                div.style.backgroundColor = '#ffcccc';
            } else {
                div.textContent = '⭕';
                div.style.color = '#ccc';
            }
        }

        if (witchState.phase === 'playing' && witchState.turn === 'user' && !cell.isRevealed) {
            div.onclick = () => handleWitchMove('opponent', idx);
        }
        
        oppGridEl.appendChild(div);
    });

    // Render User Grid (Right)
    userGridEl.innerHTML = '';
    witchState.userGrid.forEach((cell, idx) => {
        const div = document.createElement('div');
        div.style.backgroundColor = '#fff';
        div.style.borderRadius = '2px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.fontSize = '14px';
        div.style.aspectRatio = '1/1'; // Force square
        div.style.overflow = 'hidden';
        div.style.cursor = (witchState.phase === 'setup' && !cell.isRevealed) ? 'pointer' : 'default';

        if (witchState.phase === 'setup') {
            if (cell.isPoison) {
                div.textContent = '🧪';
                div.style.backgroundColor = '#e6e6fa';
            }
            div.onclick = () => handleWitchSetup(idx);
        } else {
            if (cell.isRevealed) {
                if (cell.isPoison) {
                    div.textContent = '☠️'; // Hit by AI
                    div.style.backgroundColor = '#ffcccc';
                } else {
                    div.textContent = '⭕';
                    div.style.color = '#ccc';
                }
            } else {
                if (cell.isPoison) {
                    div.textContent = '🧪'; // My poison (hidden from AI, visible to me)
                    div.style.color = '#9b59b6';
                }
            }
        }
        
        userGridEl.appendChild(div);
    });

    // Update Action Button
    if (witchState.phase === 'setup') {
        if (witchState.userPoisons === 3) {
            actionBtn.style.display = 'block';
            actionBtn.textContent = '确认布阵';
            actionBtn.onclick = finishWitchSetup;
        } else {
            actionBtn.style.display = 'none';
        }
    } else {
        actionBtn.style.display = 'none';
    }

    // Update Score
    const oppScoreEl = document.getElementById('witch-score-opp');
    const userScoreEl = document.getElementById('witch-score-user');
    if (oppScoreEl) oppScoreEl.textContent = witchState.aiPoisonedCount > 0 ? `中毒${witchState.aiPoisonedCount}` : '';
    if (userScoreEl) userScoreEl.textContent = witchState.userPoisonedCount > 0 ? `中毒${witchState.userPoisonedCount}` : '';
}

function handleWitchSetup(idx) {
    if (witchState.phase !== 'setup') return;
    
    const cell = witchState.userGrid[idx];
    if (cell.isPoison) {
        cell.isPoison = false;
        witchState.userPoisons--;
    } else {
        if (witchState.userPoisons < 3) {
            cell.isPoison = true;
            witchState.userPoisons++;
        }
    }
    renderWitchBoard();
}

function finishWitchSetup() {
    if (witchState.userPoisons !== 3) return;
    witchState.phase = 'playing';
    renderWitchBoard();
    updateWitchStatus("布阵完成！请点击左侧（TA的区域）选择一个格子。");
    
    if (window.sendMessage) {
        window.sendMessage(`[系统消息]: 我已完成布阵，游戏开始！\n轮到我方行动。`, true, 'text');
    }
}

function handleWitchMove(target, idx) {
    if (witchState.gameOver) return;
    if (witchState.phase !== 'playing') return;
    if (witchState.turn !== 'user') return; // AI turn
    if (target !== 'opponent') return; // User clicks opponent grid

    const cell = witchState.aiGrid[idx];
    if (cell.isRevealed) return;

    // User reveals AI cell
    cell.isRevealed = true;
    let msg = '';
    
    if (cell.isPoison) {
        witchState.aiPoisonedCount++; // AI got hit
        msg = `用户选择了 (行${Math.floor(idx/5)+1}, 列${idx%5+1})，那是【毒药】☠️！\n对方中毒次数：${witchState.aiPoisonedCount}`;
        // Animation/Sound effect?
    } else {
        msg = `用户选择了 (行${Math.floor(idx/5)+1}, 列${idx%5+1})，是安全的。`;
    }

    if (window.sendMessage) {
        window.sendMessage(`[系统消息]: ${msg}`, true, 'text');
    }

    checkWitchGameOver();

    if (!witchState.gameOver) {
        witchState.turn = 'ai';
        updateWitchStatus("等待对方行动...");
    }
    renderWitchBoard();
}

window.handleAiWitchGuess = function(r, c) {
    if (witchState.gameOver) return;
    if (witchState.turn !== 'ai') return;

    r = parseInt(r);
    c = parseInt(c);
    const idx = (r - 1) * 5 + (c - 1);
    
    if (idx < 0 || idx >= 25) return;

    const cell = witchState.userGrid[idx];
    if (cell.isRevealed) return; // Already revealed

    cell.isRevealed = true;
    let msg = '';
    const contactName = getContactName();

    if (cell.isPoison) {
        witchState.userPoisonedCount++;
        msg = `${contactName} 选择了 (行${r}, 列${c})，那是【毒药】☠️！\n我方中毒次数：${witchState.userPoisonedCount}`;
    } else {
        msg = `${contactName} 选择了 (行${r}, 列${c})，是安全的。`;
    }

    if (window.sendMessage) {
        window.sendMessage(`[系统消息]: ${msg}`, true, 'text'); 
    }

    checkWitchGameOver();

    if (!witchState.gameOver) {
        witchState.turn = 'user';
        updateWitchStatus("轮到你了，请选择左侧格子。");
    }
    renderWitchBoard();
};

window.getWitchGameState = function() {
    if (!witchState || witchState.phase === 'setup') return null;
    
    let board = `【女巫的毒药局势】\n`;
    board += `对方中毒: ${witchState.aiPoisonedCount}/3\n我方中毒: ${witchState.userPoisonedCount}/3\n`;
    board += `轮到谁: ${witchState.turn === 'user' ? '用户' : '你(AI)'}\n`;
    
    board += `\n【你的视角（右侧格子）】\n`;
    for(let r=0; r<5; r++) {
        for(let c=0; c<5; c++) {
            const idx = r*5 + c;
            const cell = witchState.userGrid[idx];
            if (cell.isRevealed) {
                board += cell.isPoison ? '☠️ ' : '⭕ ';
            } else {
                board += '❓ '; // Unknown to AI
            }
        }
        board += '\n';
    }
    
    // Also hint about opponent grid (left) progress
    board += `\n【对方的区域（左侧格子）】\n`;
    for(let r=0; r<5; r++) {
        for(let c=0; c<5; c++) {
            const idx = r*5 + c;
            const cell = witchState.aiGrid[idx];
            if (cell.isRevealed) {
                board += cell.isPoison ? '☠️ ' : '⭕ ';
            } else {
                board += '⬜ '; // Unrevealed
            }
        }
        board += '\n';
    }
    
    return board;
};

function checkWitchGameOver() {
    const contactName = getContactName();
    if (witchState.aiPoisonedCount >= 3) {
        witchState.gameOver = true;
        updateWitchStatus("游戏结束！你点到了3瓶毒药，你输了！😵");
        if (window.sendMessage) {
            window.sendMessage(`[系统消息]: 游戏结束\n用户不幸点到了3瓶毒药。\n🏆 ${contactName} 胜利！`, true, 'text');
        }
    } else if (witchState.userPoisonedCount >= 3) {
        witchState.gameOver = true;
        updateWitchStatus("游戏结束！对方点到了3瓶毒药，你赢了！🎉");
        if (window.sendMessage) {
            window.sendMessage(`[系统消息]: 游戏结束\n${contactName} 不幸点到了3瓶毒药。\n🏆 用户胜利！`, true, 'text');
        }
    }
}

function updateWitchStatus(text) {
    const el = document.getElementById('witch-status');
    if (el) el.textContent = text;
}

function playRPS(userChoice) {
    const choices = ['rock', 'scissors', 'paper'];
    const emojis = { 'rock': '✊', 'scissors': '✌️', 'paper': '✋' };
    
    // Disable buttons
    document.querySelectorAll('.rps-btn').forEach(btn => btn.disabled = true);
    
    // Highlight user choice
    const userBtn = document.querySelector(`.rps-btn[data-choice="${userChoice}"]`);
    userBtn.style.transform = 'scale(1.2)';
    userBtn.style.background = '#007AFF';
    userBtn.style.color = '#fff';
    
    // Simulate opponent thinking
    const opponentDiv = document.getElementById('rps-opponent');
    let count = 0;
    const interval = setInterval(() => {
        opponentDiv.textContent = emojis[choices[count % 3]];
        count++;
    }, 100);
    
    setTimeout(() => {
        clearInterval(interval);
        const opponentChoice = choices[Math.floor(Math.random() * 3)];
        opponentDiv.textContent = emojis[opponentChoice];
        
        let result = '';
        if (userChoice === opponentChoice) {
            result = '平局！';
        } else if (
            (userChoice === 'rock' && opponentChoice === 'scissors') ||
            (userChoice === 'scissors' && opponentChoice === 'paper') ||
            (userChoice === 'paper' && opponentChoice === 'rock')
        ) {
            result = '你赢了！🎉';
        } else {
            result = '你输了！😵';
        }
        
        document.getElementById('mini-game-result').textContent = result;
        
        // Notify Chat
        if (window.sendMessage) {
            const contactName = getContactName();
            let winnerText = '';
            if (result.includes('你赢了')) winnerText = '用户胜';
            else if (result.includes('你输了')) winnerText = `${contactName}胜`;
            else winnerText = '平局';

            window.sendMessage(`[系统消息]: 猜拳对决\n用户出了 ${emojis[userChoice]}\n${contactName}出了 ${emojis[opponentChoice]}\n结果：${winnerText}`, true, 'text');
        }
        
        // Re-enable after delay
        setTimeout(() => {
            document.querySelectorAll('.rps-btn').forEach(btn => {
                btn.disabled = false;
                btn.style.transform = 'scale(1)';
                btn.style.background = '#eee';
                btn.style.color = '#000';
            });
            document.getElementById('rps-opponent').textContent = '❓';
            document.getElementById('mini-game-result').textContent = '';
        }, 3000);
        
    }, 1000);
}

function playDice() {
    const btn = document.getElementById('roll-dice-btn');
    btn.disabled = true;
    btn.style.opacity = '0.5';
    
    const userDice = document.getElementById('dice-user');
    const oppDice = document.getElementById('dice-opponent');
    
    let count = 0;
    const interval = setInterval(() => {
        userDice.textContent = Math.floor(Math.random() * 6) + 1;
        oppDice.textContent = Math.floor(Math.random() * 6) + 1;
        count++;
    }, 50);
    
    setTimeout(() => {
        clearInterval(interval);
        const userVal = Math.floor(Math.random() * 6) + 1;
        const oppVal = Math.floor(Math.random() * 6) + 1;
        
        userDice.textContent = userVal;
        oppDice.textContent = oppVal;
        
        let result = '';
        if (userVal > oppVal) result = '你赢了！🎉';
        else if (userVal < oppVal) result = '你输了！😵';
        else result = '平局！';
        
        document.getElementById('mini-game-result').textContent = result;
        
        // Notify Chat
        if (window.sendMessage) {
            const contactName = getContactName();
            let winnerText = '';
            if (result.includes('你赢了')) winnerText = '用户胜';
            else if (result.includes('你输了')) winnerText = `${contactName}胜`;
            else winnerText = '平局';

            window.sendMessage(`[系统消息]: 投骰子比大小\n用户：${userVal}点\n${contactName}：${oppVal}点\n结果：${winnerText}`, true, 'text');
        }
        
        setTimeout(() => {
            btn.disabled = false;
            btn.style.opacity = '1';
        }, 2000);
        
    }, 1000);
}


function getContactName() {
    if (window.iphoneSimState && window.iphoneSimState.currentChatContactId) {
        const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
        return contact ? (contact.remark || contact.name) : '对方';
    }
    return '对方';
}

// --- Truth or Dare Presets Logic ---

function showTodPresets() {
    const content = document.getElementById('mini-game-content');
    content.innerHTML = `
        <div style="padding: 10px; height: 100%; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; font-size: 16px;">题库预设</h3>
                <button id="tod-preset-back" style="border: none; background: none; color: #007AFF; cursor: pointer; font-size: 14px;">返回</button>
            </div>
            
            <div id="tod-preset-list" style="flex: 1; overflow-y: auto; margin-bottom: 15px;">
                <!-- List items will go here -->
            </div>
            
            <button id="tod-save-preset-btn" style="width: 100%; padding: 12px; background: #007AFF; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 14px;">
                保存当前题库为预设
            </button>
        </div>
    `;

    renderTodPresetsList();
    
    document.getElementById('tod-preset-back').addEventListener('click', startTruthDareGame);
    document.getElementById('tod-save-preset-btn').addEventListener('click', saveCurrentTodAsPreset);
}

function renderTodPresetsList() {
    const list = document.getElementById('tod-preset-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (!tdState.presets || tdState.presets.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #999; margin-top: 40px;">暂无预设</div>';
        return;
    }
    
    tdState.presets.forEach((preset, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'background: #fff; padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);';
        
        item.innerHTML = `
            <div style="flex: 1; overflow: hidden; margin-right: 10px;">
                <div style="font-weight: 600; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 15px;">${preset.name}</div>
                <div style="font-size: 12px; color: #8e8e93;">真心话: ${preset.truth.length} / 大冒险: ${preset.dare.length}</div>
            </div>
            <div style="display: flex; gap: 8px; flex-shrink: 0;">
                <button class="tod-load-btn" data-index="${index}" style="padding: 6px 12px; background: #34C759; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">使用</button>
                <button class="tod-del-btn" data-index="${index}" style="padding: 6px 12px; background: #FF3B30; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">删除</button>
            </div>
        `;
        list.appendChild(item);
    });
    
    document.querySelectorAll('.tod-load-btn').forEach(btn => {
        btn.addEventListener('click', (e) => loadTodPreset(parseInt(e.target.dataset.index)));
    });
    
    document.querySelectorAll('.tod-del-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteTodPreset(parseInt(e.target.dataset.index)));
    });
}

function saveCurrentTodAsPreset() {
    const defaultName = "我的题库 " + (tdState.presets.length + 1);
    // Use window.prompt or implement a custom modal if preferred, prompt is simple for now
    // Since we are in an app simulation, prompt might break immersion but it's effective.
    // Let's use prompt for simplicity as requested "simplest solution".
    const name = prompt("请输入预设名称：", defaultName);
    
    if (name) {
        if (!tdState.presets) tdState.presets = [];
        tdState.presets.push({
            name: name,
            truth: [...tdState.pools.truth],
            dare: [...tdState.pools.dare]
        });
        saveTodData();
        renderTodPresetsList();
        // Feedback
        const saveBtn = document.getElementById('tod-save-preset-btn');
        if (saveBtn) {
            const originalText = saveBtn.textContent;
            saveBtn.textContent = "已保存！";
            saveBtn.style.backgroundColor = "#34C759";
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.backgroundColor = "#007AFF";
            }, 1000);
        }
    }
}

function loadTodPreset(index) {
    const preset = tdState.presets[index];
    if (preset) {
        tdState.pools.truth = [...preset.truth];
        tdState.pools.dare = [...preset.dare];
        saveTodData();
        // alert(`已加载预设：${preset.name}`);
        // Instead of alert, show feedback and switch back
        const list = document.getElementById('tod-preset-list');
        list.innerHTML = `<div style="height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #34C759;">
            <i class="fas fa-check-circle" style="font-size: 40px; margin-bottom: 10px;"></i>
            <div>已加载：${preset.name}</div>
        </div>`;
        setTimeout(() => {
            startTruthDareGame();
        }, 800);
    }
}

function deleteTodPreset(index) {
    if (confirm("确定要删除这个预设吗？")) {
        tdState.presets.splice(index, 1);
        saveTodData();
        renderTodPresetsList();
    }
}

function saveTodData() {
    localStorage.setItem('tod_presets', JSON.stringify(tdState.presets));
    localStorage.setItem('tod_current_pools', JSON.stringify(tdState.pools));
}

// 注册初始化
if (window.appInitFunctions) {
    window.appInitFunctions.push(initGames);
} else {
    window.appInitFunctions = [initGames];
}
