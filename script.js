const icons = [
  { label: 'Terminal', icon: '💻', target: 'terminal', x: 34, y: 34 },
  { label: 'Editor', icon: '📝', target: 'editor', x: 34, y: 140 },
  { label: 'Files', icon: '📁', target: 'files', x: 34, y: 246 },
  { label: 'Settings', icon: '⚙️', target: 'settings', x: 34, y: 352 },
  { label: 'Apps', icon: '📦', target: 'launcher', x: 34, y: 458 },
];

const fileSystem = {
  System: ['boot.log', 'config.ini', 'kernel.sys'],
  Documents: ['readme.txt', 'notes.md', 'project.txt'],
  Downloads: ['image.png', 'archive.zip', 'data.csv'],
};

const appWindows = Array.from(document.querySelectorAll('[data-window]'));
const terminalOutput = document.getElementById('terminalOutput');
const terminalInput = document.getElementById('terminalInput');
let zIndex = 100;

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
    appendTerminalOutput('administrator');
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
    appendTerminalOutput('Pisces OS v1.0 | HTML5 Desktop | Administrator | Ambient Mode');
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

window.addEventListener('load', () => {
  renderDesktopIcons();
  renderFileList();
  bindTaskbar();
  bindWindowControls();
  bindWindowDrag();
  bindTerminal();
  updateClock();
  setInterval(updateClock, 1000);

  appWindows.forEach((windowNode) => {
    windowNode.style.zIndex = '10';
  });

  openWindow('launcher');
  appendTerminalOutput('Pisces OS ready. Type "help" for commands.');
});

