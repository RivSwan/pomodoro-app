// ===== 常量 =====
const CIRCUMFERENCE = 2 * Math.PI * 120; // ≈ 754

// ===== 状态 =====
const state = {
  mode: 'work',
  isRunning: false,
  timeLeft: 25 * 60,
  pomodoroCount: 0,
  todayDate: new Date().toDateString(),
  settings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15
  }
};

let timerInterval = null;

// ===== DOM 引用 =====
const $timeDisplay = document.getElementById('timeDisplay');
const $modeLabel = document.getElementById('modeLabel');
const $ringProgress = document.getElementById('ringProgress');
const $btnStart = document.getElementById('btnStart');
const $btnPause = document.getElementById('btnPause');
const $btnReset = document.getElementById('btnReset');
const $countDots = document.getElementById('countDots');
const $countNumber = document.getElementById('countNumber');
const $modeTabs = document.getElementById('modeTabs');
const $settingsModal = document.getElementById('settingsModal');
const $inputWork = document.getElementById('inputWork');
const $inputShortBreak = document.getElementById('inputShortBreak');
const $inputLongBreak = document.getElementById('inputLongBreak');

// ===== 初始化 =====
function init() {
  loadSettings();
  // 新的一天重置计数
  if (localStorage.getItem('pomodoroDate') !== state.todayDate) {
    state.pomodoroCount = 0;
    localStorage.setItem('pomodoroDate', state.todayDate);
  } else {
    state.pomodoroCount = parseInt(localStorage.getItem('pomodoroCount') || '0', 10);
  }
  resetTimer();
  renderPomodoroDots();
  bindEvents();
  setSettingsInputs();
}

// ===== 设置 =====
function loadSettings() {
  const saved = localStorage.getItem('pomodoroSettings');
  if (saved) {
    try { Object.assign(state.settings, JSON.parse(saved)); } catch {}
  }
}

function saveSettings() {
  localStorage.setItem('pomodoroSettings', JSON.stringify(state.settings));
}

function setSettingsInputs() {
  $inputWork.value = state.settings.workDuration;
  $inputShortBreak.value = state.settings.shortBreakDuration;
  $inputLongBreak.value = state.settings.longBreakDuration;
}

function applySettings() {
  state.settings.workDuration = Math.max(1, Math.min(99, parseInt($inputWork.value) || 25));
  state.settings.shortBreakDuration = Math.max(1, Math.min(99, parseInt($inputShortBreak.value) || 5));
  state.settings.longBreakDuration = Math.max(1, Math.min(99, parseInt($inputLongBreak.value) || 15));
  setSettingsInputs();
  saveSettings();
  if (state.mode === 'work') {
    state.timeLeft = state.settings.workDuration * 60;
  } else if (state.mode === 'shortBreak') {
    state.timeLeft = state.settings.shortBreakDuration * 60;
  } else {
    state.timeLeft = state.settings.longBreakDuration * 60;
  }
  updateDisplay();
  updateProgressRing();
  updateWindowTitle();
}

// ===== 计时逻辑 =====
function startTimer() {
  if (state.isRunning) return;
  state.isRunning = true;
  updateButtonStates();
  updateModeLabel();

  timerInterval = setInterval(() => {
    state.timeLeft--;
    updateDisplay();
    updateProgressRing();
    updateWindowTitle();

    if (state.timeLeft <= 0) {
      completeTimer();
    }
  }, 1000);
}

function pauseTimer() {
  if (!state.isRunning) return;
  clearInterval(timerInterval);
  timerInterval = null;
  state.isRunning = false;
  updateButtonStates();
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  state.isRunning = false;
  state.timeLeft = getDurationForMode(state.mode);
  updateButtonStates();
  updateDisplay();
  updateProgressRing();
  updateModeLabel();
  updateWindowTitle();
}

function getDurationForMode(mode) {
  if (mode === 'work') return state.settings.workDuration * 60;
  if (mode === 'shortBreak') return state.settings.shortBreakDuration * 60;
  return state.settings.longBreakDuration * 60;
}

function getTotalForMode(mode) {
  return getDurationForMode(mode);
}

function completeTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  state.isRunning = false;

  playChime();
  showNotification();

  if (state.mode === 'work') {
    state.pomodoroCount++;
    localStorage.setItem('pomodoroCount', state.pomodoroCount.toString());
    localStorage.setItem('pomodoroDate', state.todayDate);
    renderPomodoroDots();

    if (state.pomodoroCount % 4 === 0) {
      switchMode('longBreak');
    } else {
      switchMode('shortBreak');
    }
  } else {
    switchMode('work');
  }

  updateButtonStates();
}

// ===== 模式切换 =====
function switchMode(mode) {
  state.mode = mode;
  state.timeLeft = getDurationForMode(mode);
  updateDisplay();
  updateProgressRing();
  updateModeLabel();
  updateModeTabs();
  updateWindowTitle();
}

function updateModeLabel() {
  if (state.isRunning) {
    if (state.mode === 'work') $modeLabel.textContent = '专注中...';
    else if (state.mode === 'shortBreak') $modeLabel.textContent = '休息一下 ☕';
    else $modeLabel.textContent = '好好休息 🌿';
  } else {
    if (state.mode === 'work') $modeLabel.textContent = '准备工作';
    else if (state.mode === 'shortBreak') $modeLabel.textContent = '准备休息';
    else $modeLabel.textContent = '准备长休息';
  }
}

function updateModeTabs() {
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === state.mode);
  });
}

// ===== UI 更新 =====
function updateDisplay() {
  const mins = Math.floor(state.timeLeft / 60);
  const secs = state.timeLeft % 60;
  $timeDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateProgressRing() {
  const total = getTotalForMode(state.mode);
  const progress = state.timeLeft / total;
  const offset = CIRCUMFERENCE * (1 - progress);
  $ringProgress.style.strokeDashoffset = offset;

  $ringProgress.classList.remove('break', 'long-break');
  if (state.mode === 'shortBreak') $ringProgress.classList.add('break');
  if (state.mode === 'longBreak') $ringProgress.classList.add('long-break');
}

function updateWindowTitle() {
  const mins = Math.floor(state.timeLeft / 60);
  const secs = state.timeLeft % 60;
  const time = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const labels = { work: '🍅 工作', shortBreak: '☕ 休息', longBreak: '🌿 长休息' };
  const running = state.isRunning ? '▶ ' : '';
  document.title = `${running}${time} - ${labels[state.mode]}`;
}

function updateButtonStates() {
  $btnStart.disabled = state.isRunning;
  $btnPause.disabled = !state.isRunning;
}

function renderPomodoroDots() {
  const count = state.pomodoroCount;
  $countNumber.textContent = count;
  if (count === 0) {
    $countDots.textContent = '—';
  } else {
    const filled = '🍅'.repeat(Math.min(count % 4 === 0 ? 4 : count % 4, 8));
    $countDots.textContent = filled || '🍅';
  }
  const remaining = 4 - (count % 4);
  if (remaining < 4) {
    const dots = [];
    for (let i = 0; i < Math.min(count % 4 || 4, 4); i++) dots.push('🍅');
    for (let i = 0; i < remaining; i++) dots.push('○');
    $countDots.textContent = dots.join('');
  }
}

// ===== 声音 =====
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch {}
}

// ===== 通知 =====
function showNotification() {
  const msgs = {
    work: { title: '🍅 工作时间结束！', body: '太棒了！休息一下吧~' },
    shortBreak: { title: '☕ 休息结束！', body: '准备好了吗？开始新的番茄吧！' },
    longBreak: { title: '🌿 长休息结束！', body: '充满电了，开始工作吧！' }
  };

  const msg = msgs[state.mode] || msgs.work;

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(msg.title, { body: msg.body });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') new Notification(msg.title, { body: msg.body });
    });
  }
}

// ===== 事件绑定 =====
function bindEvents() {
  $btnStart.addEventListener('click', startTimer);
  $btnPause.addEventListener('click', pauseTimer);
  $btnReset.addEventListener('click', resetTimer);

  $modeTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.mode-tab');
    if (!tab) return;
    pauseTimer();
    switchMode(tab.dataset.mode);
  });

  // 设置弹窗
  document.getElementById('btnSettings').addEventListener('click', () => {
    setSettingsInputs();
    $settingsModal.classList.add('visible');
  });

  document.getElementById('btnCloseSettings').addEventListener('click', () => {
    $settingsModal.classList.remove('visible');
  });

  $settingsModal.addEventListener('click', (e) => {
    if (e.target === $settingsModal) $settingsModal.classList.remove('visible');
  });

  document.getElementById('btnSaveSettings').addEventListener('click', () => {
    applySettings();
    $settingsModal.classList.remove('visible');
  });

  // Stepper 按钮
  document.querySelectorAll('.stepper-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      const dir = parseInt(btn.dataset.dir, 10);
      const inputMap = {
        workDuration: $inputWork,
        shortBreakDuration: $inputShortBreak,
        longBreakDuration: $inputLongBreak
      };
      const input = inputMap[target];
      if (input) {
        input.value = Math.max(1, Math.min(99, parseInt(input.value) + dir));
      }
    });
  });

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      state.isRunning ? pauseTimer() : startTimer();
    } else if (e.code === 'KeyR') {
      resetTimer();
    }
  });
}

// ===== 启动 =====
init();
