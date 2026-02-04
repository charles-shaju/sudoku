// Game state
let currentPuzzle = [];
let initialPuzzle = [];
let timerInterval = null;
let seconds = 0;
let isGameActive = false;
let isPaused = false;
let hintsRemaining = 3;
let mistakes = 0;

let selectedInput = null;
let cellElements = [];
let inputElements = [];

// DOM elements
const gridElement = document.getElementById('sudoku-grid');
const timerElement = document.getElementById('timer');
const messageElement = document.getElementById('message');
const newGameBtn = document.getElementById('new-game-btn');
const hintBtn = document.getElementById('hint-btn');
const checkBtn = document.getElementById('check-btn');
const resetBtn = document.getElementById('reset-btn');
const pauseBtn = document.getElementById('pause-btn');
const difficultySelect = document.getElementById('difficulty');
const hintsRemainingElement = document.getElementById('hints-remaining');
const mistakesElement = document.getElementById('mistakes');
const numberPadElement = document.getElementById('number-pad');
const pauseOverlay = document.getElementById('pause-overlay');
const toastElement = document.getElementById('toast');

let toastTimeout = null;

// Initialize game on page load
document.addEventListener('DOMContentLoaded', () => {
    startNewGame();
});

// Event listeners
newGameBtn.addEventListener('click', startNewGame);
hintBtn.addEventListener('click', requestHint);
checkBtn.addEventListener('click', checkSolution);
resetBtn.addEventListener('click', resetGame);
pauseBtn.addEventListener('click', togglePause);

numberPadElement.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-num]');
    if (!btn) return;
    const num = parseInt(btn.dataset.num);
    applyNumberPadValue(num);
});

// Global keyboard input (numbers + navigation)
function handleGlobalKeydown(e) {
    if (!isGameActive || isPaused) return;

    // Don't steal keys while user is interacting with controls.
    const active = document.activeElement;
    if (active && (active.tagName === 'SELECT' || active.tagName === 'TEXTAREA')) return;

    // If nothing selected yet, select first editable cell.
    if (!selectedInput) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const candidate = inputElements?.[r]?.[c];
                if (!candidate || candidate.disabled) continue;
                selectCell(candidate);
                r = 9;
                break;
            }
        }
        if (!selectedInput) return;
    }

    // Number keys: place/replace value in selected cell.
    if (/^[1-9]$/.test(e.key)) {
        applyNumberPadValue(parseInt(e.key, 10));
        e.preventDefault();
        return;
    }
    if (e.key === '0') {
        applyNumberPadValue(0);
        e.preventDefault();
        return;
    }

    const row = parseInt(selectedInput.dataset.row);
    const col = parseInt(selectedInput.dataset.col);
    let newRow = row;
    let newCol = col;

    switch (e.key) {
        case 'ArrowUp':
            newRow = Math.max(0, row - 1);
            e.preventDefault();
            break;
        case 'ArrowDown':
            newRow = Math.min(8, row + 1);
            e.preventDefault();
            break;
        case 'ArrowLeft':
            newCol = Math.max(0, col - 1);
            e.preventDefault();
            break;
        case 'ArrowRight':
            newCol = Math.min(8, col + 1);
            e.preventDefault();
            break;
        case 'Backspace':
        case 'Delete':
            applyNumberPadValue(0);
            e.preventDefault();
            return;
        default:
            return;
    }

    const nextInput = inputElements?.[newRow]?.[newCol];
    if (nextInput) selectCell(nextInput);
}

window.addEventListener('keydown', handleGlobalKeydown, true);

// Start a new game
async function startNewGame() {
    const difficulty = difficultySelect.value;
    
    try {
        const response = await fetch(`/new-game/?difficulty=${difficulty}`);
        const data = await response.json();
        
        if (data.success) {
            currentPuzzle = JSON.parse(JSON.stringify(data.puzzle));
            initialPuzzle = JSON.parse(JSON.stringify(data.puzzle));
            hintsRemaining = typeof data.hints_remaining === 'number' ? data.hints_remaining : 3;
            mistakes = 0;
            isPaused = false;
            updateStats();
            renderGrid();
            resetTimer();
            startTimer();
            hideMessage();
            isGameActive = true;
            pauseOverlay.classList.add('hidden');
            pauseBtn.textContent = 'Pause';
        }
    } catch (error) {
        showMessage('Error loading game. Please try again.', 'error');
    }
}

// Render the Sudoku grid
function renderGrid() {
    gridElement.innerHTML = '';

    cellElements = Array.from({ length: 9 }, () => Array(9).fill(null));
    inputElements = Array.from({ length: 9 }, () => Array(9).fill(null));
    selectedInput = null;
    
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 1;
            input.dataset.row = i;
            input.dataset.col = j;

            // Click-only interaction: no caret, no keyboard.
            input.readOnly = true;
            input.inputMode = 'none';
            input.autocomplete = 'off';
            input.spellcheck = false;
            input.tabIndex = -1;
            
            if (currentPuzzle[i][j] !== 0) {
                input.value = currentPuzzle[i][j];
                cell.classList.add('prefilled');
                input.disabled = true;
                input.dataset.locked = 'true';
            } else {
                cell.classList.add('user-input');
                input.addEventListener('input', handleInput);
                // prevent any keyboard changes if the element gets focus somehow
                input.addEventListener('keydown', (e) => e.preventDefault());
            }

            // Select cell on click (cell or its input)
            cell.addEventListener('click', () => selectCell(input));
            
            cell.appendChild(input);
            gridElement.appendChild(cell);

            cellElements[i][j] = cell;
            inputElements[i][j] = input;
        }
    }

    // Default selection: first editable cell
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const input = inputElements[i][j];
            if (input && !input.disabled) {
                selectCell(input);
                i = 9;
                break;
            }
        }
    }

    recomputeInvalids();
}

// Handle user input
function handleInput(e) {
    const input = e.target;
    const value = input.value;
    
    // Only allow numbers 1-9
    if (value && (!/^[1-9]$/.test(value))) {
        input.value = '';
        return;
    }
    
    const row = parseInt(input.dataset.row);
    const col = parseInt(input.dataset.col);
    
    if (value) {
        currentPuzzle[row][col] = parseInt(value);
        const ok = validateCell(input, row, col, parseInt(value));
        if (!ok) addMistake();
    } else {
        currentPuzzle[row][col] = 0;
        input.parentElement.classList.remove('invalid');
    }

    recomputeInvalids();
    updateHighlights();
}

// Handle keyboard navigation

function selectCell(input) {
    if (!input) return;
    selectedInput = input;
    updateHighlights();
}

function updateHighlights() {
    // Clear
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const cell = cellElements[i][j];
            if (!cell) continue;
            cell.classList.remove('selected', 'peer', 'same-value');
        }
    }

    if (!selectedInput) return;
    const row = parseInt(selectedInput.dataset.row);
    const col = parseInt(selectedInput.dataset.col);
    const selectedCell = cellElements[row][col];
    if (selectedCell) selectedCell.classList.add('selected');

    // peers: row, col, box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 9; i++) {
        if (i !== col) cellElements[row][i]?.classList.add('peer');
        if (i !== row) cellElements[i][col]?.classList.add('peer');
    }
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if (r === row && c === col) continue;
            cellElements[r][c]?.classList.add('peer');
        }
    }

    // same number highlight
    const value = selectedInput.value;
    if (value && /^[1-9]$/.test(value)) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const input = inputElements[r][c];
                if (input && input.value === value) {
                    cellElements[r][c]?.classList.add('same-value');
                }
            }
        }
    }
}

// Validate a cell
function validateCell(input, row, col, num) {
    const grid = getCurrentGrid();
    
    // Check row
    for (let j = 0; j < 9; j++) {
        if (j !== col && grid[row][j] === num) {
            input.parentElement.classList.add('invalid');
            return false;
        }
    }
    
    // Check column
    for (let i = 0; i < 9; i++) {
        if (i !== row && grid[i][col] === num) {
            input.parentElement.classList.add('invalid');
            return false;
        }
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let i = boxRow; i < boxRow + 3; i++) {
        for (let j = boxCol; j < boxCol + 3; j++) {
            if (i !== row && j !== col && grid[i][j] === num) {
                input.parentElement.classList.add('invalid');
                return false;
            }
        }
    }
    
    input.parentElement.classList.remove('invalid');
    return true;
}

function recomputeInvalids() {
    // Clear invalid state
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            cellElements[r][c]?.classList.remove('invalid');
        }
    }

    const grid = getCurrentGrid();

    // Row duplicates
    for (let r = 0; r < 9; r++) {
        const positions = new Map();
        for (let c = 0; c < 9; c++) {
            const v = grid[r][c];
            if (!v) continue;
            if (!positions.has(v)) positions.set(v, []);
            positions.get(v).push([r, c]);
        }
        for (const coords of positions.values()) {
            if (coords.length > 1) coords.forEach(([rr, cc]) => cellElements[rr][cc]?.classList.add('invalid'));
        }
    }

    // Column duplicates
    for (let c = 0; c < 9; c++) {
        const positions = new Map();
        for (let r = 0; r < 9; r++) {
            const v = grid[r][c];
            if (!v) continue;
            if (!positions.has(v)) positions.set(v, []);
            positions.get(v).push([r, c]);
        }
        for (const coords of positions.values()) {
            if (coords.length > 1) coords.forEach(([rr, cc]) => cellElements[rr][cc]?.classList.add('invalid'));
        }
    }

    // Box duplicates
    for (let br = 0; br < 9; br += 3) {
        for (let bc = 0; bc < 9; bc += 3) {
            const positions = new Map();
            for (let r = br; r < br + 3; r++) {
                for (let c = bc; c < bc + 3; c++) {
                    const v = grid[r][c];
                    if (!v) continue;
                    if (!positions.has(v)) positions.set(v, []);
                    positions.get(v).push([r, c]);
                }
            }
            for (const coords of positions.values()) {
                if (coords.length > 1) coords.forEach(([rr, cc]) => cellElements[rr][cc]?.classList.add('invalid'));
            }
        }
    }
}

// Get current grid state
function getCurrentGrid() {
    const grid = [];
    for (let i = 0; i < 9; i++) {
        grid[i] = [];
        for (let j = 0; j < 9; j++) {
            const input = document.querySelector(`input[data-row="${i}"][data-col="${j}"]`);
            grid[i][j] = input.value ? parseInt(input.value) : 0;
        }
    }
    return grid;
}

// Check the solution
async function checkSolution() {
    if (!isGameActive) {
        showMessage('Please start a new game first!', 'error');
        return;
    }

    if (isPaused) {
        showMessage('Resume the game to check solution.', 'error');
        return;
    }
    
    const grid = getCurrentGrid();

    if (document.querySelector('.cell.invalid')) {
        showMessage('Fix the highlighted duplicates first!', 'error');
        return;
    }
    
    // Check if grid is complete
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (grid[i][j] === 0) {
                showMessage('Please fill all cells before checking!', 'error');
                return;
            }
        }
    }
    
    try {
        const response = await fetch('/check-solution/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ grid: grid })
        });
        
        const data = await response.json();
        
        if (data.success && data.valid) {
            stopTimer();
            isGameActive = false;
            const time = formatTime(seconds);
            showMessage(`🎉 Congratulations! You solved the puzzle in ${time}!`, 'success');
        } else {
            showMessage('❌ The solution is not correct. Keep trying!', 'error');
        }
    } catch (error) {
        showMessage('Error checking solution. Please try again.', 'error');
    }
}

// Reset the game to initial state
function resetGame() {
    currentPuzzle = JSON.parse(JSON.stringify(initialPuzzle));
    renderGrid();
    resetTimer();
    if (isGameActive) {
        startTimer();
    }
    hideMessage();
}

function updateStats() {
    hintsRemainingElement.textContent = String(hintsRemaining);
    mistakesElement.textContent = String(mistakes);
    hintBtn.disabled = hintsRemaining <= 0;
}

function addMistake() {
    if (!isGameActive || isPaused) return;
    mistakes = Math.min(3, mistakes + 1);
    updateStats();
    if (mistakes >= 3) {
        stopTimer();
        isGameActive = false;
        showMessage('⛔ Mistake limit reached. Start a new game or reset.', 'error');
        // lock inputs
        setInputsEnabled(false);
    }
}

function setInputsEnabled(enabled) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const input = inputElements[r][c];
            if (!input) continue;
            const locked = input.dataset.locked === 'true';
            if (locked) continue;
            input.disabled = !enabled;
        }
    }
}

function togglePause() {
    if (!isGameActive) return;
    isPaused = !isPaused;
    if (isPaused) {
        stopTimer();
        setInputsEnabled(false);
        pauseOverlay.classList.remove('hidden');
        pauseBtn.textContent = 'Resume';
        showMessage('Paused', 'success');
    } else {
        setInputsEnabled(true);
        startTimer();
        pauseOverlay.classList.add('hidden');
        pauseBtn.textContent = 'Pause';
        hideMessage();
    }
}

function applyNumberPadValue(num) {
    if (!selectedInput) {
        showMessage('Select a cell first.', 'error');
        return;
    }
    if (isPaused) return;
    if (selectedInput.disabled) return;

    if (num === 0) {
        selectedInput.value = '';
    } else {
        selectedInput.value = String(num);
    }
    // Apply the same logic as typing (reliable across browsers)
    handleInput({ target: selectedInput });
}

async function requestHint() {
    if (!isGameActive) {
        showMessage('Start a new game first!', 'error');
        return;
    }
    if (isPaused) {
        showMessage('Resume the game to use a hint.', 'error');
        return;
    }
    if (hintsRemaining <= 0) {
        showMessage('No hints left.', 'error');
        return;
    }

    if (!selectedInput) {
        showMessage('Select a cell to get a hint.', 'error');
        return;
    }

    let selectedRow = parseInt(selectedInput.dataset.row);
    let selectedCol = parseInt(selectedInput.dataset.col);

    // If user selected a prefilled (disabled) cell, pick the first editable empty cell.
    if (selectedInput.disabled) {
        let found = false;
        for (let r = 0; r < 9 && !found; r++) {
            for (let c = 0; c < 9; c++) {
                const candidate = inputElements?.[r]?.[c];
                if (!candidate || candidate.disabled) continue;
                if (candidate.value) continue;
                selectCell(candidate);
                selectedRow = r;
                selectedCol = c;
                found = true;
                break;
            }
        }
        if (!found) {
            showMessage('No empty editable cells to hint.', 'error');
            return;
        }
    }

    try {
        const response = await fetch('/hint/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ grid: getCurrentGrid(), row: selectedRow, col: selectedCol })
        });
        const data = await response.json();
        if (!data.success) {
            if (typeof data.remaining === 'number') {
                hintsRemaining = data.remaining;
                updateStats();
            }
            showMessage(data.error || 'Unable to get hint.', 'error');
            return;
        }

        if (data.done) {
            showMessage('You’re already correct everywhere you filled!', 'success');
            return;
        }

        const hintRow = data.row;
        const hintCol = data.col;
        const num = data.num;
        const input = inputElements[hintRow][hintCol];
        if (typeof data.remaining === 'number') {
            hintsRemaining = data.remaining;
            updateStats();
        }

        if (input && !input.disabled) {
            input.value = String(num);
            input.dataset.locked = 'true';
            input.disabled = true;
            cellElements[hintRow][hintCol]?.classList.add('hinted');
            currentPuzzle[hintRow][hintCol] = num;
            recomputeInvalids();
            selectCell(input);
            showMessage('✅ Hint applied!', 'success');
        } else {
            showMessage('Hint received, but that cell is locked. Select another cell.', 'error');
        }
    } catch (e) {
        showMessage('Error getting hint. Please try again.', 'error');
    }
}

// Timer functions
function startTimer() {
    stopTimer();
    seconds = 0;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        seconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    seconds = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    timerElement.textContent = formatTime(seconds);
}

function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Message functions
function showMessage(text, type) {
    // Keep the in-page message hidden and use toast instead.
    messageElement.classList.add('hidden');

    if (!toastElement) return;
    toastElement.textContent = text;
    toastElement.className = `toast ${type}`;
    toastElement.classList.remove('hidden');

    // Trigger animation
    requestAnimationFrame(() => toastElement.classList.add('show'));

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        hideMessage();
    }, type === 'error' ? 4500 : 2800);
}

function hideMessage() {
    messageElement.classList.add('hidden');
    if (!toastElement) return;
    toastElement.classList.remove('show');
    if (toastTimeout) {
        clearTimeout(toastTimeout);
        toastTimeout = null;
    }
    setTimeout(() => {
        toastElement.classList.add('hidden');
    }, 200);
}
