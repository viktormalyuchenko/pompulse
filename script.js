const timeDisplay = document.getElementById('time');
const toggleBtn = document.getElementById('toggle-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const skipBtn = document.getElementById('skip-btn');
const pomodoroCountDisplay = document.getElementById('pomodoro-count');
const alarmPomodoro = document.getElementById('alarm-pomodoro');
const alarmBreak = document.getElementById('alarm-break');
const settingsBtn = document.getElementById('settings-btn');
const infoBtn = document.getElementById('info-btn');
const settingsModal = document.getElementById('settings-modal');
const infoModal = document.getElementById('info-modal');
const saveSettingsBtn = document.getElementById('save-settings');
const closeSettingsBtn = document.getElementById('close-settings');
const closeInfoBtn = document.getElementById('close-info');
const adjustButtons = document.querySelectorAll('.adjust-btn');
const circle = document.querySelector('.progress-ring__circle');
const favicon = document.getElementById('favicon');

const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;

let timeLeft, timer, mode = 'pomodoro', isPaused = true, pomodoroCount = 0;
let durations = loadSettings() || { pomodoro: 25 * 60, 'short-break': 5 * 60, 'long-break': 15 * 60 };
let pomodorosPerRound = loadSettings()?.pomodorosPerRound || 4;
let dailyPomodoros = loadSettings()?.dailyPomodoros || 10;
let notificationsEnabled = loadSettings()?.notificationsEnabled || true;
let currentRound = 0;

const quotes = [
    "Ты сделал ещё один шаг к цели!",
    "Отличная работа, продолжай в том же духе!",
    "Каждый помидор — это маленькая победа!",
    "Ты мастер фокуса, так держать!"
];

circle.style.strokeDasharray = circumference;
circle.style.strokeDashoffset = 0;

function setTime(seconds) {
    timeLeft = seconds;
    updateDisplay();
    updateProgress();
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    updateTitle();
}

function updateProgress() {
    const progress = (durations[mode] - timeLeft) / durations[mode];
    circle.style.strokeDashoffset = circumference * (1 - progress);
}

function updateState() {
    const state = mode === 'pomodoro' ? 'pomodoro' : 'break';
    document.documentElement.setAttribute('data-state', state);
    updateTitle();
    updateFavicon(state);
}

function updateTitle() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    document.title = `${timeString} - PomoPulse - Таймер Pomodoro для продуктивности`;
}

function updateFavicon(state) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, 2 * Math.PI);
    ctx.fillStyle = state === 'pomodoro' ? '#ff6347' : '#2ecc71';
    ctx.fill();
    favicon.href = canvas.toDataURL('image/png');
}

function startTimer() {
    if (timeLeft === 0) return;
    isPaused = false;
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
            updateProgress();
        } else {
            clearInterval(timer);
            if (mode === 'pomodoro') {
                alarmPomodoro.play();
                pomodoroCount++;
                currentRound++;
                savePomodoroCount();
                pomodoroCountDisplay.textContent = pomodoroCount;
                if (notificationsEnabled && Notification.permission === 'granted') {
                    new Notification('PomoPulse', { body: quotes[Math.floor(Math.random() * quotes.length)] });
                }
                mode = (currentRound % pomodorosPerRound === 0) ? 'long-break' : 'short-break';
            } else {
                alarmBreak.play();
                mode = 'pomodoro';
            }
            setTime(durations[mode]);
            updateState();
            startTimer();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timer);
    isPaused = true;
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
}

function toggleTimer() {
    if (isPaused) startTimer();
    else pauseTimer();
}

function skipTimer() {
    clearInterval(timer);
    if (mode === 'pomodoro') {
        pomodoroCount++;
        currentRound++;
        savePomodoroCount();
        pomodoroCountDisplay.textContent = pomodoroCount;
        mode = (currentRound % pomodorosPerRound === 0) ? 'long-break' : 'short-break';
    } else {
        mode = 'pomodoro';
    }
    setTime(durations[mode]);
    updateState();
    startTimer();
}

function getCurrentDate() {
    const date = new Date();
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function loadPomodoroCount() {
    const savedData = JSON.parse(localStorage.getItem('pomodoroData') || '{}');
    const today = getCurrentDate();
    if (savedData.date === today) {
        pomodoroCount = savedData.count || 0;
    } else {
        pomodoroCount = 0;
    }
    pomodoroCountDisplay.textContent = pomodoroCount;
}

function savePomodoroCount() {
    const today = getCurrentDate();
    localStorage.setItem('pomodoroData', JSON.stringify({ date: today, count: pomodoroCount }));
}

function loadSettings() {
    const savedSettings = localStorage.getItem('pomoSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return {
            pomodoro: settings.pomodoro * 60,
            'short-break': settings['short-break'] * 60,
            'long-break': settings['long-break'] * 60,
            pomodorosPerRound: settings.pomodorosPerRound,
            dailyPomodoros: settings.dailyPomodoros,
            notificationsEnabled: settings.notificationsEnabled
        };
    }
    return null;
}

function saveSettings() {
    const settings = {
        pomodoro: Math.floor(durations.pomodoro / 60),
        'short-break': Math.floor(durations['short-break'] / 60),
        'long-break': Math.floor(durations['long-break'] / 60),
        pomodorosPerRound,
        dailyPomodoros,
        notificationsEnabled
    };
    localStorage.setItem('pomoSettings', JSON.stringify(settings));
}

toggleBtn.addEventListener('click', toggleTimer);
skipBtn.addEventListener('click', skipTimer);
settingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
infoBtn.addEventListener('click', () => infoModal.style.display = 'flex');
saveSettingsBtn.addEventListener('click', () => {
    durations.pomodoro = document.getElementById('pomodoro-time').value * 60;
    durations['short-break'] = document.getElementById('short-break-time').value * 60;
    durations['long-break'] = document.getElementById('long-break-time').value * 60;
    pomodorosPerRound = parseInt(document.getElementById('pomodoros-per-round').value);
    dailyPomodoros = parseInt(document.getElementById('daily-pomodoros').value);
    notificationsEnabled = document.getElementById('notifications').checked;
    setTime(durations[mode]);
    updateState();
    saveSettings(); // Сохраняем настройки
    settingsModal.style.display = 'none';
});
closeSettingsBtn.addEventListener('click', () => settingsModal.style.display = 'none');
closeInfoBtn.addEventListener('click', () => infoModal.style.display = 'none');

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.style.display = 'none';
});
infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.style.display = 'none';
});

adjustButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        let value = parseInt(target.value);
        if (btn.dataset.action === 'increase') value++;
        else if (btn.dataset.action === 'decrease' && value > 1) value--;
        target.value = value;
    });
});

if (Notification.permission !== 'granted') {
    Notification.requestPermission();
}

loadPomodoroCount();
setTime(durations[mode]);
updateState();