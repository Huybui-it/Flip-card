// 1. Data Definitions
const leftCardsData = [
    { id: 'L1', text: '1 + 1', content: '1 + 1' },
    { id: 'L2', text: '5 - 2', content: '5 - 2' },
    { id: 'L3', text: '4 x 3', content: '4 x 3' },
    { id: 'L4', text: '10 / 2', content: '10 / 2' }
];

const rightCardsData = [
    { id: 'R1', text: '2', content: '2' },
    { id: 'R2', text: '3', content: '3' },
    { id: 'R3', text: '12', content: '12' },
    { id: 'R4', text: '5', content: '5' }
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
    return array.sort(() => Math.random() - 0.5);
}

function renderCards(data, container, side) {
    container.innerHTML = '';
    // Optional: Shuffle cards if you want variety each time
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    
    shuffled.forEach(cardData => {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';
        
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = cardData.id;
        card.dataset.side = side;
        card.dataset.text = cardData.text;

        card.innerHTML = `
            <div class="card-face card-front">${cardData.content}</div>
            <div class="card-face card-back">?</div>
        `;

        card.addEventListener('click', () => handleCardClick(card));
        cardContainer.appendChild(card);
        container.appendChild(cardContainer);
    });
}

// 5. Game Logic
function handleCardClick(card) {
    if (!gameStarted || previewMode) return;
    
    const side = card.dataset.side;
    const id = card.dataset.id;
    
    if (side === 'left') {
        // Deselect previous left card
        if (selectedLeft) selectedLeft.classList.remove('selected', 'flipped');
        
        if (selectedLeft === card) {
            selectedLeft = null;
            leftSelectLabel.innerText = 'Trái: ?';
        } else {
            selectedLeft = card;
            card.classList.add('selected', 'flipped');
            leftSelectLabel.innerText = 'Trái: Đã chọn';
        }
    } else {
        // Deselect previous right card
        if (selectedRight) selectedRight.classList.remove('selected', 'flipped');
        
        if (selectedRight === card) {
            selectedRight = null;
            rightSelectLabel.innerText = 'Phải: ?';
        } else {
            selectedRight = card;
            card.classList.add('selected', 'flipped');
            rightSelectLabel.innerText = 'Phải: Đã chọn';
        }
    }
    
    checkSelectionStatus();
}

function checkSelectionStatus() {
    if (selectedLeft && selectedRight) {
        confirmBtn.classList.remove('hidden');
    } else {
        confirmBtn.classList.add('hidden');
    }
}

function startPreview() {
    gameStarted = true;
    previewMode = true;
    startBtn.classList.add('hidden');
    timerDisplay.classList.remove('hidden');
    
    // Flip all cards to show fronts
    document.querySelectorAll('.card').forEach(card => card.classList.add('flipped'));
    
    countdown = 60;
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
        left: { id: selectedLeft.dataset.id, text: selectedLeft.dataset.text },
        right: { id: selectedRight.dataset.id, text: selectedRight.dataset.text }
    };
    
    userMatches.push(match);
    updateMatchHistory();
    resetSelection();
}

function updateMatchHistory() {
    if (userMatches.length === 1) {
        resultsList.innerHTML = '';
    }
    
    const lastMatch = userMatches[userMatches.length - 1];
    const matchItem = document.createElement('div');
    matchItem.className = 'match-item';
    matchItem.innerHTML = `
        <span>${lastMatch.left.text}</span>
        <span class="arrow">↔</span>
        <span>${lastMatch.right.text}</span>
    `;
    resultsList.appendChild(matchItem);
    resultsList.scrollTop = resultsList.scrollHeight;
}

function resetSelection() {
    // Flip selected cards back
    if (selectedLeft) selectedLeft.classList.remove('selected', 'flipped');
    if (selectedRight) selectedRight.classList.remove('selected', 'flipped');
    
    selectedLeft = null;
    selectedRight = null;
    
    leftSelectLabel.innerText = 'Trái: ?';
    rightSelectLabel.innerText = 'Phải: ?';
    confirmBtn.classList.add('hidden');
}

function compareResults() {
    if (userMatches.length === 0) {
        alert('Bạn chưa lưu cặp thẻ nào!');
        return;
    }
    
    comparisonBody.innerHTML = '';
    
    userMatches.forEach((match, index) => {
        const row = document.createElement('div');
        row.className = 'comparison-row';
        
        // Find if this match is correct
        const isCorrect = correctAnswers.some(ans => 
            ans.leftId === match.left.id && ans.rightId === match.right.id
        );
        
        row.innerHTML = `
            <div class="comp-col"><strong>Trái:</strong> ${match.left.text}</div>
            <div class="row-divider"></div>
            <div class="comp-col"><strong>Phải:</strong> ${match.right.text}</div>
            <span class="status-badge ${isCorrect ? 'status-correct' : 'status-wrong'}">
                ${isCorrect ? 'Đúng' : 'Sai'}
            </span>
        `;
        comparisonBody.appendChild(row);
    });
    
    modal.classList.remove('hidden');
}

// 6. Event Listeners
startBtn.addEventListener('click', startPreview);
confirmBtn.addEventListener('click', saveMatch);
finishBtn.addEventListener('click', compareResults);
closeModal.addEventListener('click', () => modal.classList.add('hidden'));
restartBtn.addEventListener('click', () => {
    location.reload();
});

// Init
initGame();
