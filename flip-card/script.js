// 1. Data Definitions
const leftCardsData = [
    { id: 'L1', text: 'Việc gì cũng muốn làm nhưng chẳng biết bắt đầu từ đâu', content: 'Việc gì cũng muốn làm nhưng chẳng biết bắt đầu từ đâu' },
    { id: 'L2', text: 'Cảm thấy mệt mỏi, uể oải dù không làm gì nhiều', content: 'Cảm thấy mệt mỏi, uể oải dù không làm gì nhiều' },
    { id: 'L3', text: 'Tim đập nhanh, lo lắng âm ỉ trước giờ thi', content: 'Tim đập nhanh, lo lắng âm ỉ trước giờ thi' },
    { id: 'L4', text: 'Định lướt TikTok 5 phút, nhìn lại mất 2 tiếng vô thức', content: 'Định lướt TikTok 5 phút, nhìn lại mất 2 tiếng vô thức' }
];

const rightCardsData = [
    { id: 'R1', text: 'Lập danh sách ưu tiên & Làm từng việc một', content: 'Lập danh sách ưu tiên & Làm từng việc một' },
    { id: 'R2', text: 'Giải tỏa cảm xúc, đi dạo thư giãn', content: 'Giải tỏa cảm xúc, đi dạo thư giãn' },
    { id: 'R3', text: '"Gọi tên cảm xúc", hít thở sâu giữ bình tĩnh', content: '"Gọi tên cảm xúc", hít thở sâu giữ bình tĩnh' },
    { id: 'R4', text: 'Tránh tác nhân xao nhãng (Để điện thoại xa)', content: 'Tránh tác nhân xao nhãng (Để điện thoại xa)' }
];

// Mappings of correct answers (ID Left to ID Right)
const correctAnswers = [
    { leftId: 'L1', rightId: 'R1' },
    { leftId: 'L2', rightId: 'R2' },
    { leftId: 'L3', rightId: 'R3' },
    { leftId: 'L4', rightId: 'R4' }
];

// 2. Game State
let gameStarted = false;
let previewMode = false;
let countdown = 60;
let timerId = null;
let selectedLeft = null;
let selectedRight = null;
let userMatches = [];

// 3. Select DOM Elements
const startBtn = document.getElementById('start-btn');
const confirmBtn = document.getElementById('confirm-btn');
const finishBtn = document.getElementById('finish-btn');
const timerDisplay = document.getElementById('timer-display');
const countdownEl = document.getElementById('countdown');
const leftGrid = document.getElementById('left-grid');
const rightGrid = document.getElementById('right-grid');
const resultsList = document.getElementById('results-list');
const leftSelectLabel = document.getElementById('left-selected-label');
const rightSelectLabel = document.getElementById('right-selected-label');
const modal = document.getElementById('result-modal');
const closeModal = document.querySelector('.close-modal');
const comparisonBody = document.getElementById('comparison-body');
const restartBtn = document.getElementById('restart-btn');

// 4. Initialization
function initGame() {
    renderCards(leftCardsData, leftGrid, 'left');
    renderCards(rightCardsData, rightGrid, 'right');
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function renderCards(data, container, side) {
    container.innerHTML = '';
    // Use Fisher-Yates for robust shuffling
    const dataToShuffle = [...data];
    const shuffled = shuffle(dataToShuffle);

    shuffled.forEach((cardData, index) => {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';

        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = cardData.id;
        card.dataset.side = side;
        card.dataset.text = cardData.text;

        // Generate label: 1, 2, 3... for left, A, B, C... for right
        const backLabel = side === 'left' ? (index + 1) : String.fromCharCode(65 + index);
        card.dataset.label = backLabel;

        card.innerHTML = `
            <div class="card-face card-front">${cardData.content}</div>
            <div class="card-face card-back">${backLabel}</div>
        `;

        card.addEventListener('click', () => handleCardClick(card));
        cardContainer.appendChild(card);
        container.appendChild(cardContainer);
    });
}

// 5. Game Logic
function handleCardClick(card) {
    if (!gameStarted || previewMode || card.classList.contains('card-correct')) return;

    const side = card.dataset.side;
    const label = card.dataset.label;

    if (side === 'left') {
        if (selectedLeft) selectedLeft.classList.remove('selected', 'flipped');

        if (selectedLeft === card) {
            selectedLeft = null;
            leftSelectLabel.innerText = 'Tình Huống: ?';
        } else {
            selectedLeft = card;
            card.classList.add('selected', 'flipped');
            leftSelectLabel.innerText = `Tình Huống: ${label}`;
        }
    } else {
        if (selectedRight) selectedRight.classList.remove('selected', 'flipped');

        if (selectedRight === card) {
            selectedRight = null;
            rightSelectLabel.innerText = 'Chiến Lược: ?';
        } else {
            selectedRight = card;
            card.classList.add('selected', 'flipped');
            rightSelectLabel.innerText = `Chiến Lược: ${label}`;
        }
    }

    // Clear previous feedback colors
    leftSelectLabel.classList.remove('indicator-correct', 'indicator-wrong');
    rightSelectLabel.classList.remove('indicator-correct', 'indicator-wrong');

    checkSelectionStatus();
}

function checkSelectionStatus() {
    if (selectedLeft && selectedRight) {
        // Automatically validate when both sides are selected
        validateCurrentMatch();
    }
}

function validateCurrentMatch() {
    const leftId = selectedLeft.dataset.id;
    const rightId = selectedRight.dataset.id;

    const isCorrect = correctAnswers.some(ans =>
        ans.leftId === leftId && ans.rightId === rightId
    );

    if (isCorrect) {
        leftSelectLabel.classList.add('indicator-correct');
        rightSelectLabel.classList.add('indicator-correct');
        selectedLeft.classList.add('card-correct');
        selectedRight.classList.add('card-correct');
    } else {
        leftSelectLabel.classList.add('indicator-wrong');
        rightSelectLabel.classList.add('indicator-wrong');
    }

    // Save to history
    const match = {
        left: { id: selectedLeft.dataset.id, text: selectedLeft.dataset.text, label: selectedLeft.dataset.label },
        right: { id: selectedRight.dataset.id, text: selectedRight.dataset.text, label: selectedRight.dataset.label }
    };
    userMatches.push(match);
    updateMatchHistory(isCorrect);

    if (isCorrect) {
        const pLeft = selectedLeft;
        const pRight = selectedRight;
        selectedLeft = null;
        selectedRight = null;
        setTimeout(() => {
            pLeft.classList.remove('selected');
            pRight.classList.remove('selected');
            leftSelectLabel.classList.remove('indicator-correct');
            rightSelectLabel.classList.remove('indicator-correct');
            leftSelectLabel.innerText = 'Tình Huống: ?';
            rightSelectLabel.innerText = 'Chiến Lược: ?';
        }, 1500);
    } else {
        setTimeout(() => {
            resetSelection();
            leftSelectLabel.classList.remove('indicator-wrong');
            rightSelectLabel.classList.remove('indicator-wrong');
        }, 1500);
    }
}

function startPreview() {
    // Re-shuffle and re-render cards for each new game
    initGame();

    gameStarted = true;
    previewMode = true;
    startBtn.classList.add('hidden');
    timerDisplay.classList.remove('hidden');

    // Flip all cards to show fronts after they are rendered
    setTimeout(() => {
        document.querySelectorAll('.card').forEach(card => card.classList.add('flipped'));
    }, 50); // Small delay to ensure DOM is ready

    countdown = 30;
    countdownEl.innerText = countdown;

    timerId = setInterval(() => {
        countdown--;
        countdownEl.innerText = countdown;

        if (countdown <= 0) {
            endPreview();
        }
    }, 1000);
}

function endPreview() {
    clearInterval(timerId);
    previewMode = false;
    timerDisplay.classList.add('hidden');

    // Flip all cards back to hide fronts
    document.querySelectorAll('.card').forEach(card => card.classList.remove('flipped'));
    alert('Thời gian xem đáp án kết thúc! Bắt đầu chơi thôi.');
}

function saveMatch() {
    if (!selectedLeft || !selectedRight) return;

    const match = {
        left: { id: selectedLeft.dataset.id, text: selectedLeft.dataset.text, label: selectedLeft.dataset.label },
        right: { id: selectedRight.dataset.id, text: selectedRight.dataset.text, label: selectedRight.dataset.label }
    };

    userMatches.push(match);
    updateMatchHistory();
    resetSelection();
}

function updateMatchHistory(isCorrect) {
    if (userMatches.length === 1) {
        resultsList.innerHTML = '';
    }

    const lastMatch = userMatches[userMatches.length - 1];
    const matchItem = document.createElement('div');
    matchItem.className = 'match-item detailed-match';
    matchItem.innerHTML = `
        <div class="match-info">
            <div class="match-pairing">
                <span class="tag">#${lastMatch.left.label}</span> 
                <span class="arrow">↔</span> 
                <span class="tag">#${lastMatch.right.label}</span>
            </div>
            <div class="match-texts">
                <p><strong>Tình huống:</strong> ${lastMatch.left.text}</p>
                <div class="line-divider"></div>
                <p><strong>Chiến lược:</strong> ${lastMatch.right.text}</p>
            </div>
        </div>
        <div class="match-status ${isCorrect ? 'status-correct' : 'status-wrong'}">
            ${isCorrect ? 'Đúng' : 'Sai'}
        </div>
    `;
    resultsList.appendChild(matchItem);
    resultsList.scrollTop = resultsList.scrollHeight;
}

function resetSelection() {
    if (selectedLeft) selectedLeft.classList.remove('selected', 'flipped');
    if (selectedRight) selectedRight.classList.remove('selected', 'flipped');

    selectedLeft = null;
    selectedRight = null;

    leftSelectLabel.innerText = 'Tình Huống: ?';
    rightSelectLabel.innerText = 'Chiến Lược: ?';
    confirmBtn.classList.add('hidden');
}

function resetGameState() {
    gameStarted = false;
    previewMode = false;
    clearInterval(timerId);
    selectedLeft = null;
    selectedRight = null;
    userMatches = [];

    // UI Reset
    startBtn.classList.remove('hidden');
    timerDisplay.classList.add('hidden');
    resultsList.innerHTML = '<p class="empty-msg">Chưa có kết quả nào được lưu.</p>';
    leftSelectLabel.innerText = 'Tình Huống: ?';
    rightSelectLabel.innerText = 'Chiến Lược: ?';
    modal.classList.add('hidden');
    
    // Initial Render
    initGame();
}

// 6. Event Listeners
startBtn.addEventListener('click', startPreview);
confirmBtn.addEventListener('click', saveMatch);
closeModal.addEventListener('click', () => modal.classList.add('hidden'));
restartBtn.addEventListener('click', resetGameState);

// Init
initGame();
