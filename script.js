class Minesweeper {
    constructor() {
        this.colors = {
            cell: {
                undiscovered: {
                    light: '#1a1a2e',
                    dark: '#16162b'
                },
                discovered: {
                    light: '#2a2a40',
                    dark: '#24243c'
                }
            },
            hover: 'rgba(0, 255, 255, 0.2)',
            mine: {
                color: '#ff0055',
                shadow: '#ff0055'
            },
            numbers: {
                1: { color: '#00ffff' }, // Cyan
                2: { color: '#00ff00' }, // Vert néon
                3: { color: '#ff00ff' }, // Magenta
                4: { color: '#ff00cc' }, // Rose néon
                5: { color: '#00ccff' }, // Bleu clair
                6: { color: '#cc00ff' }, // Violet néon
                7: { color: '#ffcc00' }, // Orange néon
                8: { color: '#ff3300' }  // Rouge orangé
            }
        };

        this.difficultySettings = {
            easy: { hauteur: 9, longueur: 9, mines: 10, cellSize: 50, scoreMultiplier: 1 },
            medium: { hauteur: 16, longueur: 16, mines: 40, cellSize: 40, scoreMultiplier: 1.2 },
            hard: { hauteur: 16, longueur: 31, mines: 99, cellSize: 30, scoreMultiplier: 1.4 }
        };

        this.playerScore= 0;
        this.playerMoves = 0;
        this.flagImage = new Image();
        this.flagImage.src = "./assets/flag.webp";
        
        this.gameStarted = false;
        this.board = [];
        this.difficulty = "easy";
        
        // Bind des méthodes pour les event listeners
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleRightClick = this.handleRightClick.bind(this);
        this.handleDifficultyChange = this.handleDifficultyChange.bind(this);
        this.handleReset = this.handleReset.bind(this);
        this.handleStartStop = this.handleStartStop.bind(this);
        this.handleSaveScore = this.handleSaveScore.bind(this);
        this.handleTabClick = this.handleTabClick.bind(this);

        this.timer = {minutes: 0, seconds: 0};
        
        this.initializeGame();
    }

    initializeGame() {
        const settings = this.difficultySettings[this.difficulty];
        this.hauteur = settings.hauteur;
        this.longueur = settings.longueur;
        this.mines = settings.mines;
        this.cellSize = settings.cellSize;
        this.flagsRemaining = this.mines + 2;
        this.firstClick = true;
        this.gameOver = false;
        this.startTime = null;
        this.timerInterval = null;
        this.currentHover = { x: -1, y: -1 };

        this.setupCanvas();
        this.createBoard();
        this.setupEventListeners();
        this.updateFlagCount();
        this.resetTimer();
    }

    setupCanvas() {
        const boardElement = document.querySelector("#board");
        boardElement.innerHTML = '';
        
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.longueur * this.cellSize;
        this.canvas.height = this.hauteur * this.cellSize;
        this.ctx = this.canvas.getContext("2d");
        
        boardElement.appendChild(this.canvas);
    }

    setupEventListeners() {
        // Supprime les anciens event listeners du canvas
        if (this.canvas) {
            this.canvas.removeEventListener("mousemove", this.handleMouseMove);
            this.canvas.removeEventListener("click", this.handleClick);
            this.canvas.removeEventListener("contextmenu", this.handleRightClick);
        }

        // Ajoute les nouveaux event listeners au canvas
        this.canvas.addEventListener("mousemove", this.handleMouseMove);
        this.canvas.addEventListener("click", this.handleClick);
        this.canvas.addEventListener("contextmenu", this.handleRightClick);
        
        // Configuration des boutons
        const difficultySelect = document.getElementById("difficulty");
        const resetButton = document.getElementById("reset");
        const startStopButton = document.getElementById("start-stop");
        const saveScoreButton = document.getElementById("save-score");

        // Supprime les anciens event listeners des boutons
        difficultySelect.removeEventListener("change", this.handleDifficultyChange);
        resetButton.removeEventListener("click", this.handleReset);
        startStopButton.removeEventListener("click", this.handleStartStop);
        saveScoreButton.removeEventListener("click", this.handleSaveScore);

        // Ajoute les nouveaux event listeners aux boutons
        difficultySelect.addEventListener("change", this.handleDifficultyChange);
        resetButton.addEventListener("click", this.handleReset);
        startStopButton.addEventListener("click", this.handleStartStop);
        saveScoreButton.addEventListener("click", this.handleSaveScore);

        // Gestion des onglets du leaderboard
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.removeEventListener('click', this.handleTabClick);
            btn.addEventListener('click', this.handleTabClick);
        });
    }

    createBoard() {
        this.board = [];
        for (let y = 0; y < this.hauteur; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.longueur; x++) {
                this.board[y][x] = {
                    mine: false,
                    discovered: false,
                    flag: false,
                    count: 0
                };
            }
        }

        let minesToPlace = this.mines;
        while (minesToPlace > 0) {
            const x = Math.floor(Math.random() * this.longueur);
            const y = Math.floor(Math.random() * this.hauteur);
            if (!this.board[y][x].mine) {
                this.board[y][x].mine = true;
                minesToPlace--;
            }
        }

        this.calculateNumbers();
        this.draw();
    }

    calculateNumbers() {
        for (let y = 0; y < this.hauteur; y++) {
            for (let x = 0; x < this.longueur; x++) {
                if (!this.board[y][x].mine) {
                    this.board[y][x].count = this.countAdjacentMines(x, y);
                }
            }
        }
    }

    countAdjacentMines(x, y) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const newY = y + dy;
                const newX = x + dx;
                if (newY >= 0 && newY < this.hauteur && newX >= 0 && newX < this.longueur) {
                    if (this.board[newY][newX].mine) count++;
                }
            }
        }
        return count;
    }

    toggleGame() {
        const startStopBtn = document.getElementById("start-stop");
        if (!this.gameStarted) {
            this.gameStarted = true;
            startStopBtn.textContent = "Stop Game";
            this.createBoard();
            this.startTimer();
        } else {
            this.stopGame();
            startStopBtn.textContent = "Start Game";
        }
    }

    changeDifficulty() {
        this.difficulty = document.getElementById("difficulty").value;
        this.resetGame();
    }

    handleMouseMove(event) {
        if (!this.gameStarted || this.gameOver) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / this.cellSize);
        const y = Math.floor((event.clientY - rect.top) / this.cellSize);

        if (x >= 0 && x < this.longueur && y >= 0 && y < this.hauteur) {
            this.currentHover = { x, y };
        } else {
            this.currentHover = { x: -1, y: -1 };
        }
        this.draw();
    }

    handleClick(event) {
        if (!this.gameStarted || this.gameOver) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / this.cellSize);
        const y = Math.floor((event.clientY - rect.top) / this.cellSize);

        if (x >= 0 && x < this.longueur && y >= 0 && y < this.hauteur) {
            if (this.firstClick) {
                this.moveFirstMine(x, y);
                this.firstClick = false;
            }
            
            if (!this.board[y][x].flag) {
                this.playerMoves++;
                this.discoverCell(x, y);
                this.draw();
                this.checkWin();
            }
        }
    }

    handleRightClick(event) {
        event.preventDefault();
        if (!this.gameStarted || this.gameOver) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / this.cellSize);
        const y = Math.floor((event.clientY - rect.top) / this.cellSize);

        if (x >= 0 && x < this.longueur && y >= 0 && y < this.hauteur) {
            const cell = this.board[y][x];

            if (!cell.discovered) {
                this.playerMoves++;
                if (!cell.flag && this.flagsRemaining > 0) {
                    cell.flag = true;
                    this.flagsRemaining--;
                } else if (cell.flag) {
                    cell.flag = false;
                    this.flagsRemaining++;
                }
                this.updateFlagCount();
                this.draw();
            }
        }
    }

    moveFirstMine(clickX, clickY) {
        if (this.board[clickY][clickX].mine) {
            let moved = false;
            for (let y = 0; y < this.hauteur && !moved; y++) {
                for (let x = 0; x < this.longueur && !moved; x++) {
                    if (!this.board[y][x].mine && (Math.abs(x - clickX) > 1 || Math.abs(y - clickY) > 1)) {
                        this.board[y][x].mine = true;
                        this.board[clickY][clickX].mine = false;
                        moved = true;
                    }
                }
            }
            this.calculateNumbers();
        }
    }

    discoverCell(x, y) {
        const cell = this.board[y][x];
        if (cell.discovered || cell.flag) return;

        cell.discovered = true;

        if (cell.mine) {
            this.gameOver = true;
            this.revealAllMines();
            this.stopGame();
            this.showLoseModal();
            return;
        }

        if (cell.count === 0) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const newY = y + dy;
                    const newX = x + dx;
                    if (newY >= 0 && newY < this.hauteur && newX >= 0 && newX < this.longueur) {
                        this.discoverCell(newX, newY);
                    }
                }
            }
        }
    }

    revealAllMines() {
        for (let y = 0; y < this.hauteur; y++) {
            for (let x = 0; x < this.longueur; x++) {
                if (this.board[y][x].mine) {
                    this.board[y][x].discovered = true;
                }
            }
        }
        this.draw();
    }

    checkWin() {
        let undiscoveredCount = 0;
        for (let y = 0; y < this.hauteur; y++) {
            for (let x = 0; x < this.longueur; x++) {
                if (!this.board[y][x].discovered && !this.board[y][x].mine) {
                    undiscoveredCount++;
                }
            }
        }
        if (undiscoveredCount === 0) {
            this.gameOver = true;
            this.stopGame();
            this.showWinModal();
        }
    }

    showWinModal() {
        const modal = document.getElementById("win-modal");
        const finalTime = document.getElementById("timer").textContent;
        document.querySelector("#win-modal #final-time").textContent = finalTime;
        modal.classList.add("active");
    }

    showLoseModal() {
        const modal = document.getElementById("lose-modal");
        modal.classList.add("active");
        const finalTime = document.getElementById("timer").textContent;
        document.querySelector("#lose-modal #final-time").textContent = finalTime;
        const closeBtn = document.getElementById("close-modal");
        closeBtn.addEventListener("click", () => {
            modal.classList.remove("active");
        });
    }

    saveScore() {
        const playerName = document.getElementById("player-name").value.trim();
        if (!playerName) return;

        const time = document.getElementById("timer").textContent;
        const score = {
            name: playerName,
            time: time,
            date: new Date().toISOString(),
            score: this.scoreCalculator()
        };

        let scores = JSON.parse(localStorage.getItem(`minesweeper_scores_${this.difficulty}`) || '[]');
        scores.push(score);
        scores.sort((a, b) => {
            // if score is different, sort by score
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            // if score is the same, sort by time
            const timeA = this.timeToSeconds(a.time);
            const timeB = this.timeToSeconds(b.time);
            return timeA - timeB;
        });
        scores = scores.slice(0, 10); // Garde uniquement les 10 meilleurs scores

        localStorage.setItem(`minesweeper_scores_${this.difficulty}`, JSON.stringify(scores));
        document.getElementById("win-modal").classList.remove("active");
        this.updateLeaderboard(this.difficulty);
    }

    timeToSeconds(timeString) {
        const [minutes, seconds] = timeString.split(':').map(Number);
        return minutes * 60 + seconds;
    }

    updateLeaderboard(difficulty) {
        const scores = JSON.parse(localStorage.getItem(`minesweeper_scores_${difficulty}`) || '[]');
        const scoresList = document.getElementById("scores-list");
        scoresList.innerHTML = '';

        scores.forEach((score, index) => {
            const scoreItem = document.createElement("div");
            scoreItem.className = "score-item";
            scoreItem.innerHTML = `
                <span>${index + 1}. ${score.name}</span>
                <div class="data-score-container">
                    <span>${score.score} pts</span>
                    <span>${score.time} min</span>
                </div>
            `;
            scoresList.appendChild(scoreItem);
        });
    }

    switchLeaderboardTab(difficulty) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });
        this.updateLeaderboard(difficulty);
    }

    startTimer() {
        this.gameStarted = true;
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    updateTimer() {
        if (!this.gameStarted) return;
        
        const currentTime = Date.now();
        const elapsedTime = Math.floor((currentTime - this.startTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        const time = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.timer = {minutes, seconds};
        document.getElementById("timer").textContent = time;
    }

    resetTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.startTime = null;
        this.timer = {minutes: 0, seconds: 0};
        document.getElementById("timer").textContent = "00:00";
    }

    updateFlagCount() {
        document.getElementById("numberOfFlagsRemaining").textContent = `${this.flagsRemaining}`;
    }

    resetGame() {
        this.gameStarted = false;
        document.getElementById("start-stop").textContent = "Start Game";
        this.initializeGame();
    }

    stopGame() {
        this.gameStarted = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    scoreCalculator() {
        // Base score dépendant de la difficulté
        const baseScore = this.mines * this.difficultySettings[this.difficulty].scoreMultiplier;
        
        // Facteur temps : plus le temps est court, plus le multiplicateur est élevé
        // Convertir le temps en minutes
        const timeInMinutes = this.timer.minutes + (this.timer.seconds / 60);
        const timeMultiplier = Math.max(1, 10 - (timeInMinutes / 2)); // 10 au début, diminue avec le temps
        
        // Facteur efficacité : ratio entre les mines et le nombre de mouvements
        // Plus le ratio est proche de 1, meilleur est le score
        const efficiencyRatio = this.mines / this.playerMoves;
        const efficiencyMultiplier = Math.min(4, efficiencyRatio * 2); // Maximum 4x multiplicateur
        
        // Score final = score de base × multiplicateur de temps × multiplicateur d'efficacité
        const finalScore = baseScore * timeMultiplier * efficiencyMultiplier;
        
        return Math.round(finalScore);
    }

    draw() {
        if (!this.board || !this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.hauteur; y++) {
            for (let x = 0; x < this.longueur; x++) {
                const cell = this.board[y][x];
                const isHovered = this.currentHover.x === x && this.currentHover.y === y;
                const isPair = (x + y) % 2 === 0;
                
                // Couleur de base de la cellule
                if (cell.discovered) {
                    this.ctx.fillStyle = isPair ? this.colors.cell.discovered.light : this.colors.cell.discovered.dark;
                } else {
                    this.ctx.fillStyle = isPair ? this.colors.cell.undiscovered.light : this.colors.cell.undiscovered.dark;
                }
                this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);

                // Effet de bordure luminescente
                this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);

                // Effet de survol
                if (isHovered && !cell.discovered && this.gameStarted && !this.gameOver) {
                    this.ctx.fillStyle = this.colors.hover;
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }

                if (cell.discovered) {
                    if (cell.mine) {
                        // Dessine une mine avec effet de lueur
                        this.ctx.fillStyle = this.colors.mine.color;
                        this.ctx.shadowColor = this.colors.mine.shadow;
                        this.ctx.shadowBlur = 10;
                        this.ctx.beginPath();
                        this.ctx.arc(
                            x * this.cellSize + this.cellSize / 2,
                            y * this.cellSize + this.cellSize / 2,
                            this.cellSize / 4,
                            0,
                            Math.PI * 2
                        );
                        this.ctx.fill();
                        this.ctx.shadowBlur = 0;
                    } else if (cell.count > 0) {
                        // Dessine le nombre avec effet de lueur
                        const numberStyle = this.colors.numbers[cell.count];
                        this.ctx.font = `bold ${this.cellSize / 2}px Orbitron`;
                        this.ctx.fillStyle = numberStyle.color;
                        this.ctx.shadowColor = numberStyle.color;
                        this.ctx.shadowBlur = 5;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(
                            cell.count.toString(),
                            x * this.cellSize + this.cellSize / 2,
                            y * this.cellSize + this.cellSize / 2
                        );
                        this.ctx.shadowBlur = 0;
                    }
                } else if (cell.flag) {
                    // Dessine un drapeau
                    this.ctx.drawImage(
                        this.flagImage,
                        x * this.cellSize,
                        y * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }
    }

    handleDifficultyChange() {
        this.changeDifficulty();
    }

    handleReset() {
        this.resetGame();
    }

    handleStartStop() {
        this.toggleGame();
    }

    handleSaveScore() {
        this.saveScore();
    }

    handleTabClick(event) {
        this.switchLeaderboardTab(event.target.dataset.difficulty);
    }
}

// Démarrage du jeu
document.addEventListener("DOMContentLoaded", () => {
    new Minesweeper();
});
