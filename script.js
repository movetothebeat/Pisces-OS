const icons = [
  { label: 'Terminal', icon: '💻', target: 'terminal', x: 34, y: 34 },
  { label: 'Editor', icon: '📝', target: 'editor', x: 34, y: 140 },
  { label: 'Files', icon: '📁', target: 'files', x: 34, y: 246 },
  { label: 'Settings', icon: '⚙️', target: 'settings', x: 34, y: 352 },
  { label: 'Apps', icon: '📦', target: 'launcher', x: 34, y: 458 },
  { label: 'Chat', icon: '💬', target: 'chat', x: 34, y: 564 },
  { label: 'Snake', icon: '🐍', target: 'snake', x: 34, y: 670 },
];

const fileSystem = {
  System: ['boot.log', 'config.ini', 'kernel.sys'],
  Documents: ['readme.txt', 'notes.md', 'project.txt'],
  Downloads: ['image.png', 'archive.zip', 'data.csv'],
};

const users = [
  { username: 'Max', password: 'boi', displayName: 'Max' },
  { username: 'monte', password: 'mnttgrsrkn2014!', displayName: 'monte' },
  { username: 'Teddy', password: 'teddy123', displayName: 'Teddy' },
  { username: 'emin', password: 'emin123', displayName: 'emin' },
];

const appWindows = Array.from(document.querySelectorAll('[data-window]'));
const terminalOutput = document.getElementById('terminalOutput');
const terminalInput = document.getElementById('terminalInput');
const loginScreen = document.getElementById('loginScreen');
const desktopShell = document.getElementById('desktopShell');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const signOutButton = document.getElementById('signOutButton');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatTarget = document.getElementById('chatTarget');
const chatSend = document.getElementById('chatSend');
const chatUserList = document.getElementById('chatUserList');
const snakeCanvas = document.getElementById('snakeCanvas');
const snakeScore = document.getElementById('snakeScore');
const snakeRestart = document.getElementById('snakeRestart');
let currentUser = null;
let zIndex = 100;
let chatRecipient = 'everyone';
let snake = null;

const THEME_KEY = 'pisces-theme';
const DEFAULT_THEME = 'dark';
const CHAT_KEY = 'pisces-chat';
const BROADCAST_KEY = 'pisces-chat-sync';
const snakeChannel = new BroadcastChannel(BROADCAST_KEY);

function getTheme() {
  return localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
}

function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  const html = document.documentElement;
  html.classList.remove('theme-dark', 'theme-light', 'theme-neon');
  if (theme !== 'dark') {
    html.classList.add(`theme-${theme}`);
  }
}

function getChatMessages() {
  const stored = localStorage.getItem(CHAT_KEY);
  if (!stored) {
    return [
      {
        id: crypto.randomUUID(),
        from: 'system',
        to: 'everyone',
        text: 'Welcome to Pisces OS chat.',
        timestamp: Date.now(),
      },
    ];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveChatMessages(messages) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  snakeChannel.postMessage({ type: 'chat-update', timestamp: Date.now() });
}

function renderChatUsers() {
  if (!chatUserList) return;
  const options = ['everyone', ...users.map((user) => user.username)];
  const filtered = options.filter((value) => value !== currentUser);
  chatUserList.innerHTML = '';
  chatTarget.innerHTML = '<option value="everyone">Everyone</option>';

  filtered.forEach((name) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'chat-user-item';
    item.textContent = name === 'everyone' ? 'Everyone' : name;
    item.dataset.user = name;
    if (chatRecipient === name) item.classList.add('active');
    item.addEventListener('click', () => {
      chatRecipient = name;
      chatTarget.value = name;
      renderChatUsers();
    });
    chatUserList.appendChild(item);

    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name === 'everyone' ? 'Everyone' : name;
    chatTarget.appendChild(opt);
  });

  if (chatRecipient && [...chatTarget.options].some((opt) => opt.value === chatRecipient)) {
    chatTarget.value = chatRecipient;
  } else {
    chatRecipient = 'everyone';
    chatTarget.value = 'everyone';
  }
}

function renderMessages() {
  if (!chatMessages || !currentUser) return;
  const messages = getChatMessages();
  const visible = messages.filter((message) => {
    const isGroup = message.to === 'everyone';
    const isDirectToMe = message.to === currentUser;
    const isFromMe = message.from === currentUser;
    return isGroup || isDirectToMe || isFromMe;
  });

  chatMessages.innerHTML = '';
  visible.forEach((message) => {
    const div = document.createElement('div');
    const isSelf = message.from === currentUser;
    const label = isSelf ? 'You' : message.from;
    const target = message.to === 'everyone' ? 'everyone' : message.to;
    div.className = `chat-message ${isSelf ? 'self' : 'other'}`;
    div.innerHTML = `<small>${label} → ${target} · ${new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>${message.text}`;
    chatMessages.appendChild(div);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendChatMessage() {
  if (!currentUser) return;
  const text = chatInput.value.trim();
  if (!text) return;

  const messages = getChatMessages();
  messages.push({
    id: crypto.randomUUID(),
    from: currentUser,
    to: chatRecipient,
    text,
    timestamp: Date.now(),
  });

  saveChatMessages(messages);
  chatInput.value = '';
  renderMessages();
}

function syncChatFromBroadcast(event) {
  if (event?.data?.type === 'chat-update') {
    renderMessages();
  }
}

function renderDesktopIcons() {
  const desktopArea = document.getElementById('desktopArea');

  icons.forEach((item) => {
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.style.left = `${item.x}px`;
    icon.style.top = `${item.y}px`;
    icon.setAttribute('tabindex', '0');
    icon.innerHTML = `
      <div class="desktop-icon-box">${item.icon}</div>
      <div class="desktop-icon-label">${item.label}</div>
    `;

    const openTarget = () => openWindow(item.target);
    icon.addEventListener('dblclick', openTarget);
    icon.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openTarget();
      }
    });

    desktopArea.appendChild(icon);
  });
}

function renderFileList() {
  const fileList = document.getElementById('fileList');
  const entries = Object.entries(fileSystem)
    .map(
      ([folder, files]) => `
        <div>
          <strong>${folder}/</strong><br>
          ${files.map((file) => `&nbsp;&nbsp;📄 ${file}<br>`).join('')}
        </div>
      `
    )
    .join('');

  fileList.innerHTML = entries;
}

function closeAllWindows() {
  appWindows.forEach((windowNode) => {
    windowNode.classList.remove('active');
  });
}

function openWindow(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.add('active');
  target.style.zIndex = String(++zIndex);
}

function closeWindow(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.remove('active');
}

function bindTaskbar() {
  document.querySelectorAll('.taskbar-button').forEach((button) => {
    if (button.id === 'signOutButton') return;
    button.addEventListener('click', () => {
      openWindow(button.dataset.target);
    });
  });
}

function bindWindowControls() {
  document.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => closeWindow(button.dataset.close));
  });

  document.querySelectorAll('[data-target]').forEach((element) => {
    if (element.classList.contains('app-card')) {
      element.addEventListener('click', () => openWindow(element.dataset.target));
    }
  });
}

function bindWindowDrag() {
  document.querySelectorAll('[data-draggable]').forEach((header) => {
    const windowNode = header.closest('.window');
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', (event) => {
      dragging = true;
      offsetX = event.clientX - windowNode.offsetLeft;
      offsetY = event.clientY - windowNode.offsetTop;
      windowNode.style.zIndex = String(++zIndex);
    });

    document.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      const left = Math.min(window.innerWidth - 80, Math.max(20, event.clientX - offsetX));
      const top = Math.min(window.innerHeight - 120, Math.max(20, event.clientY - offsetY));
      windowNode.style.left = `${left}px`;
      windowNode.style.top = `${top}px`;
    });

    document.addEventListener('mouseup', () => {
      dragging = false;
    });
  });
}

function updateClock() {
  const clock = document.getElementById('systemClock');
  const now = new Date();
  const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  clock.textContent = timeString;
}

function appendTerminalOutput(text, color = 'var(--green)') {
  const line = document.createElement('div');
  line.className = 'terminal-line';
  line.style.color = color;
  line.textContent = text;
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function handleTerminalCommand(command) {
  const value = command.trim();
  if (!value) return;

  appendTerminalOutput(`$ ${value}`);

  if (value === 'help') {
    appendTerminalOutput('Available commands: help, date, whoami, ls, echo [text], clear, neofetch');
    return;
  }

  if (value === 'date') {
    appendTerminalOutput(new Date().toString());
    return;
  }

  if (value === 'whoami') {
    appendTerminalOutput(currentUser);
    return;
  }

  if (value === 'ls') {
    appendTerminalOutput(Object.keys(fileSystem).join('  '));
    return;
  }

  if (value === 'clear') {
    terminalOutput.innerHTML = '';
    return;
  }

  if (value === 'neofetch') {
    appendTerminalOutput(`Pisces OS v1.0 | HTML5 Desktop | ${currentUser} | Ambient Mode`);
    return;
  }

  if (value.startsWith('echo ')) {
    appendTerminalOutput(value.slice(5));
    return;
  }

  appendTerminalOutput(`Command not found: ${value}`, 'var(--pink)');
}

function bindTerminal() {
  terminalInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      handleTerminalCommand(terminalInput.value);
      terminalInput.value = '';
    }
  });
}

function bindThemeButtons() {
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const theme = e.target.dataset.theme;
      setTheme(theme);
      appendTerminalOutput(`Theme changed to: ${theme}`);
    });
  });
}

function signOut() {
  currentUser = null;
  closeAllWindows();
  desktopShell.classList.remove('logged-in');
  loginScreen.classList.remove('hidden');
  loginError.textContent = '';
  document.getElementById('usernameInput').value = 'Max';
  document.getElementById('passwordInput').value = 'boi';
  if (terminalOutput) terminalOutput.innerHTML = '';
  chatInput.value = '';
}

function enableDesktop(username) {
  currentUser = username;
  loginScreen.classList.add('hidden');
  desktopShell.classList.add('logged-in');
  appWindows.forEach((windowNode) => {
    windowNode.style.zIndex = '10';
  });
  openWindow('launcher');
  renderChatUsers();
  renderMessages();
  appendTerminalOutput(`Pisces OS ready. Logged in as ${username}. Type "help" for commands.`);
}

function bindLogin() {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();

    const user = users.find((u) => u.username === username && u.password === password);

    if (user) {
      loginError.textContent = '';
      enableDesktop(user.displayName);
      return;
    }

    loginError.textContent = 'Invalid credentials. Check the hint below.';
  });
}

function bindSignOut() {
  signOutButton.addEventListener('click', signOut);
}

function bindChat() {
  chatTarget.addEventListener('change', (event) => {
    chatRecipient = event.target.value;
    renderChatUsers();
  });

  chatSend.addEventListener('click', sendChatMessage);

  chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      sendChatMessage();
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key === CHAT_KEY) {
      renderMessages();
    }
  });

  snakeChannel.addEventListener('message', syncChatFromBroadcast);
}

function setupSnakeGame() {
  const ctx = snakeCanvas.getContext('2d');
  const gridSize = 18;
  const tileCount = snakeCanvas.width / gridSize;
  let snake = [];
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let food = { x: 0, y: 0 };
  let score = 0;
  let gameLoop = null;

  function placeFood() {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
    for (const segment of snake) {
      if (segment.x === food.x && segment.y === food.y) {
        placeFood();
        break;
      }
    }
  }

  function startGame() {
    snake = [
      { x: 7, y: 9 },
      { x: 6, y: 9 },
      { x: 5, y: 9 },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    snakeScore.textContent = String(score);
    placeFood();
    draw();
    clearInterval(gameLoop);
    gameLoop = setInterval(() => {
      direction = nextDirection;
      const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
      const hitWall = head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount;
      const hitSelf = snake.some((segment) => segment.x === head.x && segment.y === head.y);

      if (hitWall || hitSelf) {
        clearInterval(gameLoop);
        alert('Game Over');
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        snakeScore.textContent = String(score);
        placeFood();
      } else {
        snake.pop();
      }

      draw();
    }, 120);
  }

  function draw() {
    ctx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    ctx.fillStyle = '#0d1326';
    ctx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

    for (let i = 0; i < tileCount; i += 1) {
      for (let j = 0; j < tileCount; j += 1) {
        ctx.strokeStyle = 'rgba(58, 242, 255, 0.12)';
        ctx.strokeRect(i * gridSize, j * gridSize, gridSize, gridSize);
      }
    }

    ctx.fillStyle = '#39ff14';
    snake.forEach((segment) => {
      ctx.fillRect(segment.x * gridSize + 1, segment.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });

    ctx.fillStyle = '#ff5bc9';
    ctx.fillRect(food.x * gridSize + 2, food.y * gridSize + 2, gridSize - 4, gridSize - 4);
  }

  function changeDirection(event) {
    const map = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };

    const newDirection = map[event.key];
    if (!newDirection) return;

    const isOpposite = newDirection.x === -direction.x && newDirection.y === -direction.y;
    if (!isOpposite) {
      nextDirection = newDirection;
    }
  }

  document.addEventListener('keydown', changeDirection);
  snakeRestart.addEventListener('click', startGame);
  startGame();
}

window.addEventListener('load', () => {
  const savedTheme = getTheme();
  setTheme(savedTheme);

  renderDesktopIcons();
  renderFileList();
  bindTaskbar();
  bindWindowControls();
  bindWindowDrag();
  bindTerminal();
  bindLogin();
  bindSignOut();
  bindThemeButtons();
  bindChat();
  setupSnakeGame();
  renderChatUsers();
  renderMessages();
  updateClock();
  setInterval(updateClock, 1000);
});
