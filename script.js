let hauteur = 9;
let longueur = 9;
let mines = 10;
let cellSize = 50; // Taille des cellules (en pixels)
let flagsRemaining = mines + 2;
const flagImage = new Image(cellSize, cellSize);
flagImage.src = "./assets/flag.webp";
let firstClick = true;
let difficultySelected = "easy";

const difficultySettings = {
    easy: { hauteur: 9, longueur: 9, mines: 10, cellSize: 50 },
    medium: { hauteur: 16, longueur: 16, mines: 40, cellSize: 40 },
    hard: { hauteur: 16, longueur: 31, mines: 99, cellSize: 30 },
};

let undiscoveredLightColor = "#aad751";
let undiscoveredDarkColor = "#7CA138";
let discoveredLightColor = "#e5c29f";
let discoveredDarkColor = "#BA9D80";

const difficultySelector = document.getElementById("difficulty");
const resetButton = document.getElementById("reset");

difficultySelector.addEventListener("change", () => {
    changeDifficulty();
    resetGame();
});
resetButton.addEventListener("click", resetGame);

function changeDifficulty() {
    const selectedDifficulty = difficultySelector.value;
    const {
        hauteur: h,
        longueur: l,
        mines: m,
        cellSize: c,
    } = difficultySettings[selectedDifficulty];
    difficultySelected = selectedDifficulty;
    hauteur = h;
    longueur = l;
    mines = m;
    flagsRemaining = mines + 2;
    cellSize = c;
}

function resetGame() { 
    firstClick = true;
    flagsRemaining = mines + 2;
    board = [];
    console.log(difficultySelected, longueur, hauteur, mines, cellSize);
    canvas.width = longueur * cellSize;
    canvas.height = hauteur * cellSize;
    changeDifficulty(difficultySelected);
    initializeCanvas();
    startGame();
    updateFlagCount();
}

let canvas = document.createElement("canvas");
canvas.width = longueur * cellSize;
canvas.height = hauteur * cellSize;
document.querySelector("#board").appendChild(canvas);
let ctx = canvas.getContext("2d");
let hoveredCell = { x: -1, y: -1 };

let board = [];
for (let x = 0; x < longueur; x++) {
    board[x] = [];
    for (let y = 0; y < hauteur; y++) {
        board[x][y] = {
            value: 0,
            discovered: false,
            isPair: (x + y) % 2 === 0,
            isFlagged: false,
        };
    }
}

function startGame() {
    while (mines > 0) {
        let x = Math.floor(Math.random() * longueur);
        let y = Math.floor(Math.random() * hauteur);
        if (board[x][y].value !== -1) {
            board[x][y].value = -1;
            mines--;
        }
    }

    for (let x = 0; x < longueur; x++) {
        for (let y = 0; y < hauteur; y++) {
            if (board[x][y].value !== -1) {
                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (
                            x + i >= 0 &&
                            x + i < longueur &&
                            y + j >= 0 &&
                            y + j < hauteur &&
                            board[x + i][y + j].value === -1
                        ) {
                            count++;
                        }
                    }
                }
                board[x][y].value = count;
            }
        }
    }

    updateFlagCount();
}

function chooseTextColor(count) {
    switch (count) {
        case 1:
            return "blue";
        case 2:
            return "green";
        case 3:
            return "red";
        case 4:
            return "purple";
        case 5:
            return "maroon";
        case 6:
            return "turquoise";
        case 7:
            return "black";
        case 8:
            return "gray";
        default:
            return "black";
    }
}

function updateFlagCount() {
    document.getElementById(
        "numberOfFlagsRemaining"
    ).innerText = `Flags: ${flagsRemaining}`;
}

function drawCell(x, y, discovered, isPair, isClicked = false) {
    if (!board[x] || !board[x][y]) return;
    // cell is a bomb
    if (board[x][y].value === -1 && discovered && !board[x][y].isFlagged) {
        ctx.fillStyle = "red";
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        return;
    }

    // cell has a flag
    if (board[x][y].isFlagged) {
        ctx.drawImage(
            flagImage,
            x * cellSize,
            y * cellSize,
            cellSize,
            cellSize
        );
        return;
    }

    ctx.fillStyle = discovered
        ? isPair
            ? discoveredDarkColor
            : discoveredLightColor
        : isPair
        ? undiscoveredDarkColor
        : undiscoveredLightColor;
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    ctx.strokeStyle = "black";
    ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

    if (discovered && board[x][y].value !== 0) {
        ctx.fillStyle = chooseTextColor(board[x][y].value);
        ctx.font = `${difficultySelected === "easy" ? 40 : 25 }px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            board[x][y].value,
            x * cellSize + cellSize / 2,
            y * cellSize + cellSize / 2
        );
    }
}

function initializeCanvas() {
    for (let x = 0; x < longueur; x++) {
        board[x] = [];
        for (let y = 0; y < hauteur; y++) {
            board[x][y] = {
                value: 0,
                discovered: false,
                isPair: (x + y) % 2 === 0,
                isFlagged: false,
            };
        }
    }
    for (let x = 0; x < canvas.width / cellSize; x++) {
        for (let y = 0; y < canvas.height / cellSize; y++) {
            const isPair = (x + y) % 2 === 0;
            drawCell(x, y, false, isPair);
        }
    }
}

function discoverNextEmptySlot(x, y) {
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            let newX = x + i;
            let newY = y + j;
            if (
                newX >= 0 &&
                newX < longueur &&
                newY >= 0 &&
                newY < hauteur &&
                !board[newX][newY].discovered
            ) {
                if(board[newX][newY].value === -1) {
                    continue;
                }
                board[newX][newY].discovered = true;
                const isPair = (newX + newY) % 2 === 0;
                drawCell(newX, newY, true, isPair);
                if (board[newX][newY].value === 0) {
                    discoverNextEmptySlot(newX, newY);
                }
            }
        }
    }
}

function checkWin() {

    let win = true;
    for (let x = 0; x < longueur; x++) {
        for (let y = 0; y < hauteur; y++) {
            console.log(board[x][y].discovered, board[x][y].value);
            if (!board[x][y].discovered && board[x][y].value !== -1) {
                win = false;
            }
            if (board[x][y].value === -1 && board[x][y].discovered) {
                win = false;
            }
        }
    }

    if (win) {
        setTimeout(() => {
            if (confirm("Vous avez Gagné ! Voulez-vous rejouer ?")) {
                resetGame();
            } else {
                // call a method to discover all the cells
                for (let x = 0; x < longueur; x++) {
                    for (let y = 0; y < hauteur; y++) {
                        board[x][y].discovered = true;
                        const isPair = (x + y) % 2 === 0;
                        drawCell(x, y, true, isPair);
                    }
                }
            }
        }, 400);
    }
}

function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const hoverX = Math.floor(mouseX / cellSize);
    const hoverY = Math.floor(mouseY / cellSize);

    // Vérifiez que hoverX et hoverY sont dans les limites
    if (hoverX >= 0 && hoverX < longueur && hoverY >= 0 && hoverY < hauteur) {
        // Si la souris change de cellule, redessiner les deux cellules concernées
        if (hoverX !== hoveredCell.x || hoverY !== hoveredCell.y) {
            if (hoveredCell.x !== -1 && hoveredCell.y !== -1) {
                const isPairOld = (hoveredCell.x + hoveredCell.y) % 2 === 0;
                drawCell(
                    hoveredCell.x,
                    hoveredCell.y,
                    board[hoveredCell.x][hoveredCell.y].discovered,
                    isPairOld
                );
            }

            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.fillRect(
                hoverX * cellSize,
                hoverY * cellSize,
                cellSize,
                cellSize
            );
            ctx.strokeStyle = "black";
            ctx.strokeRect(
                hoverX * cellSize,
                hoverY * cellSize,
                cellSize,
                cellSize
            );

            hoveredCell = { x: hoverX, y: hoverY };
        }
    }
}

function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const x = Math.floor(mouseX / cellSize);
    const y = Math.floor(mouseY / cellSize);

    if (board[x][y].discovered) {
        return;
    }
    if (firstClick) {
        if (board[x][y].value === -1 && !board[x][y].isFlagged) {
            board[x][y].value = 0;
            moveFirstMine(x, y);
        }
        firstClick = false;
    }

    board[x][y].discovered = true;
    const isPair = (x + y) % 2 === 0;
    drawCell(x, y, true, isPair, true);

    if (board[x][y].value === 0) {
        discoverNextEmptySlot(x, y);
    }

    if (board[x][y].value === -1 && !board[x][y].isFlagged) {
        setTimeout(() => {
            if (confirm("Perdu ! Voulez-vous rejouer ?")) {
                resetGame();
            } else {
                // call a method to discover all the cells
                for (let x = 0; x < longueur; x++) {
                    for (let y = 0; y < hauteur; y++) {
                        board[x][y].discovered = true;
                        const isPair = (x + y) % 2 === 0;
                        drawCell(x, y, true, isPair);
                    }
                }
            }
        }, 400);
    }
    checkWin();
}

function handleRightClick(event) {
    event.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const x = Math.floor(mouseX / cellSize);
    const y = Math.floor(mouseY / cellSize);

    if (board[x][y].discovered && !board[x][y].isFlagged) {
        return;
    }

    if (board[x][y].isFlagged) {
        board[x][y].isFlagged = false;
        flagsRemaining++;
        drawCell(x, y, false, board[x][y].isPair);
        updateFlagCount();
        return;
    }

    if (flagsRemaining != 0) {
        board[x][y].isFlagged = true;
        flagsRemaining--;
        drawCell(x, y, false, board[x][y].isPair);
        updateFlagCount();
        return;
    }
}

function moveFirstMine(x, y) {
    let moved = false;
    while (!moved) {
        let newX = Math.floor(Math.random() * longueur);
        let newY = Math.floor(Math.random() * hauteur);
        if (board[newX][newY].value !== -1 && (newX !== x || newY !== y) && !board[newX][newY].isFlagged && !board[newX][newY].discovered) {
            board[newX][newY].value = -1;
            moved = true;

            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    // Update the values of the surrounding cells of the new mine
                    let adjX = newX + i;
                    let adjY = newY + j;
                    if (adjX >= 0 && adjX < longueur &&
                        adjY >= 0 && adjY < hauteur &&
                        board[adjX][adjY].value !== -1
                    ) {
                        board[adjX][adjY].value++;
                    }
                    // Update the values of the surrounding cells of the old mine
                    let prevAdjX = newX + i;
                    let prevAdjY = newY + j;
                    if (prevAdjX >= 0 && prevAdjX < longueur &&
                        prevAdjY >= 0 && prevAdjY < hauteur &&
                        board[prevAdjX][prevAdjY].value !== -1
                    ) {
                        board[prevAdjX][prevAdjY].value > 0 ? board[prevAdjX][prevAdjY].value -= 1 : board[prevAdjX][prevAdjY].value;
                    }
                }
            }

        }
    }
}

// Ajouter les événements sur le canvas
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("click", handleClick);
canvas.addEventListener("contextmenu", handleRightClick);

// Initialiser le canvas avec les cellules
initializeCanvas();

// Commencer le jeu
startGame();
