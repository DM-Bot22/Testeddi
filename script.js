// HINWEIS: Der gesamte Code ist in DOMContentLoaded eingeschlossen!

document.addEventListener('DOMContentLoaded', (event) => {
// --- KONFIGURATION ---
const ZIEL_URL = "https://www.google.de"; 
const WIN_SCORE = 10; 
const WIN_SOCK_SRC = 'sock_image.png'; 
const GAME_START_TIME = Date.now();

// Original (Basis-) Dimensionen für die Berechnung des Skalierungsfaktors
const BASE_WIDTH = 800; 
// Das Seitenverhältnis (585 / 1024) beibehalten, um die korrekte Logikhöhe zu bestimmen
const BASE_HEIGHT_RATIO = 585 / 1024; 
const BASE_HEIGHT = BASE_WIDTH * BASE_HEIGHT_RATIO; 
// --------------------

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// === ROBUSTE 'CONTAIN' SKALIERUNG ===
// 1. Hole die tatsächliche Größe, die durch das Fullscreen-CSS festgelegt wurde
const canvasRect = canvas.getBoundingClientRect();

// 2. Definiere die interne Canvas-Auflösung auf die tatsächliche angezeigte Größe
canvas.width = canvasRect.width;
canvas.height = canvasRect.height; 

// 3. Bestimme den besten Skalierungsfaktor ('Contain'-Logik)
// Berechnet, wie oft die Basis-Breite in die Canvas-Breite passt
const scaleX = canvas.width / BASE_WIDTH;
// Berechnet, wie oft die Basis-Höhe in die Canvas-Höhe passt
const scaleY = canvas.height / BASE_HEIGHT;

// Nutze den kleineren Faktor, um Verzerrung zu vermeiden und innerhalb der Grenzen zu bleiben
const SCALING_FACTOR = Math.min(scaleX, scaleY); 

// 4. Definiere die logische Größe des Spielbereichs
// Dies ist der Bereich, der tatsächlich gezeichnet wird (mit korrektem Seitenverhältnis)
const GAME_WIDTH = BASE_WIDTH * SCALING_FACTOR;
const GAME_HEIGHT = BASE_HEIGHT * SCALING_FACTOR; 

// 5. Berechne den Offset, um das Spiel zu zentrieren (horizontal und vertikal)
const X_OFFSET_DRAWING = (canvas.width - GAME_WIDTH) / 2;
const Y_OFFSET_DRAWING = (canvas.height - GAME_HEIGHT) / 2;
// === ENDE LOGIK FÜR ROBUSTE 'CONTAIN' SKALIERUNG ===


// --- POWER-UP KONFIGURATION (ALLE WERTE SKALIERT) ---
const POWERUP_SPAWN_SCORE = 1;      
const POWERUP_SPAWN_INTERVAL = 200;    
const POWERUP_CHANCE = 0.5;            

// ALLE KONSTANTEN SKALIEREN NACH DEM NEU BERECHNETEN SCALING_FACTOR
const MULTIPLIER_WIDTH = 80 * SCALING_FACTOR;    
const MULTIPLIER_HEIGHT = 60 * SCALING_FACTOR;  
const LIFEUP_WIDTH = 60 * SCALING_FACTOR;    
const LIFEUP_HEIGHT = 60 * SCALING_FACTOR;
const MAGNET_WIDTH = 80 * SCALING_FACTOR;    
const MAGNET_HEIGHT = 50 * SCALING_FACTOR;
const FLIGHT_POWERUP_WIDTH = 110 * SCALING_FACTOR;  
const FLIGHT_POWERUP_HEIGHT = 80 * SCALING_FACTOR;

// === FLUG-KONFIGURATION (ALLE WERTE SKALIERT) ===
const FLIGHT_DURATION = 5000;              
const POST_FLIGHT_INVULN_DURATION = 3000;  
const FLIGHT_RISE_SPEED = 2.5 * SCALING_FACTOR;             
const FLIGHT_SINK_SPEED = 2.5 * SCALING_FACTOR;             
const FLIGHT_CENTER_Y = GAME_HEIGHT / 2 - (25 * SCALING_FACTOR); 
const FLIGHT_CENTER_X = GAME_WIDTH / 2 - (37.5 * SCALING_FACTOR);
const FLIGHT_SPEED_MULTIPLIER = 2.5;
const FLIGHT_HORIZONTAL_EASING = 0.1;
const FLIGHT_IMAGE_WIDTH = 100 * SCALING_FACTOR;  
const FLIGHT_IMAGE_HEIGHT = 80 * SCALING_FACTOR;  

// LOGIK DEFINITIONEN
const MAGNET_RANGE = 500 * SCALING_FACTOR;    
const MAGNET_MAX_CHARGES = 3;  

// === MAGNET ANZEIGE KONFIGURATION (ALLE WERTE SKALIERT) ===
const MAGNET_ICON_WIDTH = 100 * SCALING_FACTOR; 
const MAGNET_ICON_HEIGHT = 70 * SCALING_FACTOR; 
const MAGNET_ICON_PADDING = 20 * SCALING_FACTOR;     
const MAGNET_TEXT_OFFSET_X = -10 * SCALING_FACTOR;   
const MAGNET_DISPLAY_Y = 30 * SCALING_FACTOR;         

// --- KOLLISIONS- & POSITIONSEINSTELLUNGEN (ALLE WERTE SKALIERT) ---
const HITBOX_WIDTH_REDUCTION = 0.40;  
const HITBOX_HEIGHT_TOP_OFFSET = 0.20; 
const Y_OFFSET = 10 * SCALING_FACTOR; 
const JUMP_HEIGHT_BOOST = 45 * SCALING_FACTOR; 

// --- ZUSTANDSVARIABLEN ---
let gameRunning = false;
let score = 0;
let gameSpeed = 6 * SCALING_FACTOR; // STARTGESCHWINDIGKEIT SKALIERT NEU
let scoreMultiplier = 1; 
let powerUp = null; 
let activePowerUp = null; 
let lives = 0; 
let magnetCharges = 0; 

let isFlying = false;        
let isSinking = false;       
let isInvulnerable = false;  
let flightStartTime = 0;     
let invulnStartTime = 0;     

let gameWon = false; 
let gameEndScore = 0; 

let nextObstacleFrame = 0; 
const MIN_GAP = 60;        
const MAX_GAP = 120;       

// === SOCKE VARIABLEN ===
let sockSpawned = false; 
let winObject = null;    
// =======================

const player = {
    x: 50 * SCALING_FACTOR, 
    y: GAME_HEIGHT - (50 * SCALING_FACTOR), // Y-Position relativ zu GAME_HEIGHT
    width: 75 * SCALING_FACTOR, 
    height: 50 * SCALING_FACTOR, 
    dy: 0,
    jumpPower: -18 * SCALING_FACTOR, 
    gravity: 0.6 * SCALING_FACTOR, 
    grounded: false
};

const OBSTACLE_WIDTH = 80 * SCALING_FACTOR; 
const OBSTACLE_HEIGHT = 130 * SCALING_FACTOR; 
let obstacles = [];
let frame = 0;
let speedIncreasePoint = 100; 

// Elemente holen
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const introScreen1 = document.getElementById('introScreen1');
const introScreen2 = document.getElementById('introScreen2');
const nextIntro1Btn = document.getElementById('nextIntro1');
const nextIntro2Btn = document.getElementById('nextIntro2');


// ======================================================
// === BILDER LADEN (Unverändert) ===
// ======================================================
const playerStandImg = new Image();
playerStandImg.src = 'player_stand.png'; 
const playerJumpImg = new Image();
playerJumpImg.src = 'player_jump.png';  
const playerFlightImg = new Image(); 
playerFlightImg.src = 'player_flight.png'; 
const obstacleImg = new Image();
obstacleImg.src = 'obstacle.png'; 
const multiplierImg = new Image();
multiplierImg.src = 'multiplier.png'; 
const lifeImg = new Image();
lifeImg.src = 'life.png'; 
const magnetImg = new Image();
magnetImg.src = 'magnet.png'; 
const flightImg = new Image(); 
flightImg.src = 'flight_powerup.png'; 
const winningSockImg = new Image();
winningSockImg.src = WIN_SOCK_SRC; 

const backgroundImg = new Image();
backgroundImg.src = 'background.jpg'; 

const pergamentImg = new Image();
pergamentImg.src = 'pergament.jpg'; 
const eddiImg = new Image();
eddiImg.src = 'eddi_hund.png';
const arrowRightImg = new Image();
arrowRightImg.src = 'arrow_right.png';


function activatePowerUp(type) {
    if (type === 'MULTIPLIER') {
        if (scoreMultiplier === 1) {
            scoreMultiplier = 2;
        } else if (scoreMultiplier === 2) {
            scoreMultiplier = 4;
        } else if (scoreMultiplier === 4) {
            scoreMultiplier = 8;
        } else {
            scoreMultiplier += 2;
        }
    } else if (type === 'LIFE') {
        if (lives < 1) {
            lives = 1; 
        }
    } else if (type === 'MAGNET') {
        activePowerUp = 'MAGNET';
        magnetCharges = MAGNET_MAX_CHARGES; 
    } else if (type === 'FLIGHT') { 
        isFlying = true;
        flightStartTime = performance.now();
        isSinking = false;
        isInvulnerable = false;
    }
}


// WICHTIG: Warte, bis ALLE Bilder geladen sind
Promise.all([
    new Promise(resolve => playerStandImg.onload = resolve),
    new Promise(resolve => playerJumpImg.onload = resolve),
    new Promise(resolve => playerFlightImg.onload = resolve), 
    new Promise(resolve => obstacleImg.onload = resolve),
    new Promise(resolve => multiplierImg.onload = resolve),
    new Promise(resolve => lifeImg.onload = resolve),
    new Promise(resolve => magnetImg.onload = resolve),
    new Promise(resolve => flightImg.onload = resolve),
    new Promise(resolve => winningSockImg.onload = resolve),
    new Promise(resolve => backgroundImg.onload = resolve),
    new Promise(resolve => pergamentImg.onload = resolve), 
    new Promise(resolve => eddiImg.onload = resolve),      
    new Promise(resolve => arrowRightImg.onload = resolve) 
]).then(() => {
    // Die player.y Position wird beim Start auf den korrekten, skalierten Wert gesetzt.
    player.y = GAME_HEIGHT - player.height;
    
    nextObstacleFrame = Math.floor(Math.random() * (MAX_GAP - MIN_GAP)) + MIN_GAP;
    // Beim Laden der Seite nur IntroScreen1 zeigen
    introScreen1.classList.remove('hidden');
    introScreen2.classList.add('hidden');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
});

function handleInput() {
    // HandleInput nur, wenn das Spiel läuft
    if (gameRunning && player.grounded) { 
        player.dy = player.jumpPower;
        player.grounded = false;
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); 
        handleInput();
    }
});

// Touch-Eingabe 
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', handleInput); 

// Event-Listener für die Intro-Buttons
if (nextIntro1Btn) {
    nextIntro1Btn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        introScreen1.classList.add('hidden');
        introScreen2.classList.remove('hidden');
    });
}
if (nextIntro2Btn) {
    nextIntro2Btn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        introScreen2.classList.add('hidden');
        startScreen.classList.remove('hidden'); // Zeigt den Startbildschirm an
    });
}
// Klick auf Startbildschirm, um das Spiel zu starten
if (startScreen) {
    startScreen.addEventListener('click', startGame);
    // Zusätzlicher Event-Listener für Tastatur im Startbildschirm
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !gameRunning && !startScreen.classList.contains('hidden')) {
            startGame();
        }
    });
}


// === END-LOGIK (Unverändert) ===
function endGame(isWin) {
    gameRunning = false;
    gameWon = isWin;
    gameEndScore = score;
    
    const endTitleElement = document.getElementById('gameOverTitle');
    const endMessageElement = document.getElementById('gameOverMessage');
    const sockImageElement = document.getElementById('winSockImage');
    const surpriseBtn = document.getElementById('surpriseBtn'); 
    const restartBtn = document.getElementById('restartBtn');    
    
    if (!endTitleElement || !endMessageElement || !sockImageElement || !surpriseBtn || !restartBtn) {
        console.error("FATALER FEHLER: Endscreen-Elemente fehlen im HTML. Bitte prüfe die IDs!");
        alert("SPIEL ENDE - HTML-Elemente für den Endscreen fehlen oder sind falsch benannt.");
        gameOverScreen.classList.remove('hidden');
        return; 
    }
    
    if (isWin) {
        endTitleElement.textContent = 'DU HAST ES GESCHAFFT!';
        endMessageElement.innerHTML = `
            <span style="font-size: 1.5em; display: block; margin-bottom: 10px;">Eddi der Haushund hat seine Socke bekommen und ist nun frei.</span>
            .
        `;
        sockImageElement.classList.remove('hidden'); 
        
        surpriseBtn.classList.remove('hidden'); 
        restartBtn.classList.add('hidden'); 
        
        surpriseBtn.onclick = () => { window.location.href = ZIEL_URL; };
        
    } 
    else {
        endTitleElement.textContent = 'Game Over';
        endMessageElement.innerHTML = `Leider hast du die Socke für Eddi nicht bekommen.`; 
        sockImageElement.classList.add('hidden'); 
        
        surpriseBtn.classList.add('hidden'); 
        restartBtn.classList.remove('hidden'); 
        
        restartBtn.onclick = startGame;
    }

    gameOverScreen.classList.remove('hidden');
}

function gameOver() {
    endGame(false);
}

function gameWin() {
    endGame(true);
}

// === START LOGIK (Unverändert, nutzt GAME_HEIGHT) ===

function startGame() {
    gameRunning = true;
    score = 0;
    obstacles = [];
    frame = 0;
    scoreMultiplier = 1; 
    lives = 0; 
    
    gameSpeed = 6 * SCALING_FACTOR; 
    speedIncreasePoint = 100; 
    powerUp = null; 
    activePowerUp = null;
    magnetCharges = 0; 
    
    isFlying = false;
    isSinking = false;
    isInvulnerable = false;
    flightStartTime = 0;
    invulnStartTime = 0;
    
    gameWon = false; 
    gameEndScore = 0;
    
    // Socken-Variablen zurücksetzen
    winObject = null;
    sockSpawned = false; 
    
    nextObstacleFrame = Math.floor(Math.random() * (MAX_GAP - MIN_GAP)) + MIN_GAP; 
    
    // Y-Position des Spielers auf den Boden der LOGISCHEN Höhe setzen
    player.y = GAME_HEIGHT - player.height;
    player.x = 50 * SCALING_FACTOR; 
    
    startScreen.classList.add('hidden'); 
    gameOverScreen.classList.add('hidden');
    
    introScreen1.classList.add('hidden');
    introScreen2.classList.add('hidden');

    animate();
}

function animate() {
    if (!gameRunning) return;

    requestAnimationFrame(animate);
    
    // ======================================
    // === HINTERGRUND ZEICHNEN MIT OFFSET ===
    // 1. Hintergrund füllen (für den schwarzen Rand)
    ctx.fillStyle = '#222'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Hintergrundbild in der Mitte, ungestreckt zeichnen
    ctx.drawImage(backgroundImg, 
                  X_OFFSET_DRAWING, Y_OFFSET_DRAWING, 
                  GAME_WIDTH, GAME_HEIGHT); 
    // ======================================
    
    if (score >= speedIncreasePoint) {
        gameSpeed += 0.5 * SCALING_FACTOR;
        speedIncreasePoint += 100; 
    }
    
    const currentSpeed = isFlying ? gameSpeed * FLIGHT_SPEED_MULTIPLIER : gameSpeed;

    if (score === WIN_SCORE - 1 && score < WIN_SCORE) {
        score = WIN_SCORE;
    }
    
    // ... (FLUG- UND PHYSIK-LOGIK - Unverändert, nutzt GAME_HEIGHT) ...
    if (!isFlying && !isSinking) {
        player.dy += player.gravity;
        player.y += player.dy;
    }
    
    if (!isFlying && !isSinking) {
        player.x = 50 * SCALING_FACTOR; 
    }

    if (player.y + player.height > GAME_HEIGHT) {
        player.y = GAME_HEIGHT - player.height;
        player.dy = 0;
        player.grounded = true;
    }

    if (isFlying) {
        const elapsed = performance.now() - flightStartTime;
        
        if (player.y > FLIGHT_CENTER_Y) { 
            player.y -= FLIGHT_RISE_SPEED;
            if (player.y < FLIGHT_CENTER_Y) { 
                player.y = FLIGHT_CENTER_Y;
            }
        } else {
            player.y = FLIGHT_CENTER_Y; 
        }
        
        if (player.x < FLIGHT_CENTER_X) {
            player.x += FLIGHT_RISE_SPEED;
            if (player.x > FLIGHT_CENTER_X) {
                player.x = FLIGHT_CENTER_X;
            }
        } else {
            player.x = FLIGHT_CENTER_X;
        }

        if (elapsed >= FLIGHT_DURATION) {
            isFlying = false;
            isSinking = true; 
        }
        
        player.grounded = false;
        player.dy = 0; 
    } 
    else if (isSinking) {
        player.y += FLIGHT_SINK_SPEED; 
        
        const targetX = 50 * SCALING_FACTOR; 
        const easingFactor = FLIGHT_HORIZONTAL_EASING;
        
        if (player.x !== targetX) {
            const dx = targetX - player.x; 
            player.x += dx * easingFactor; 
            
            if (Math.abs(player.x - targetX) < 0.5 * SCALING_FACTOR) { 
                player.x = targetX;
            }
        }
        
        if (player.y + player.height >= GAME_HEIGHT) { 
            player.y = GAME_HEIGHT - player.height;
            isSinking = false; 
            
            player.x = 50 * SCALING_FACTOR; 
            
            isInvulnerable = true;
            invulnStartTime = performance.now();
        }
    } 
    else if (isInvulnerable) {
        const elapsedInvuln = performance.now() - invulnStartTime;
        if (elapsedInvuln >= POST_FLIGHT_INVULN_DURATION) {
            isInvulnerable = false; 
        }
        if (player.x !== 50 * SCALING_FACTOR) {
            player.x = 50 * SCALING_FACTOR; 
        }
    }
    // ENDE FLUG- UND PHYSIK-LOGIK

    // SPIELER ZEICHNEN LOGIK
    let imageToDraw;
    let drawWidth = player.width;    
    let drawHeight = player.height;  
    let drawY = player.y;            

    if (isFlying || isSinking) { 
        imageToDraw = playerFlightImg;
        drawWidth = FLIGHT_IMAGE_WIDTH; 
        drawHeight = FLIGHT_IMAGE_HEIGHT;
        drawY = player.y - (5 * SCALING_FACTOR); 
    } 
    else if (player.grounded) { 
        imageToDraw = playerStandImg;
    } 
    else { 
        imageToDraw = playerJumpImg; 
        
        drawHeight = player.height + JUMP_HEIGHT_BOOST; 
        drawY = player.y - JUMP_HEIGHT_BOOST; 
    }
    
    // KRITISCH: Wende den X_OFFSET_DRAWING und Y_OFFSET_DRAWING an
    ctx.drawImage(
        imageToDraw, 
        player.x + X_OFFSET_DRAWING, 
        drawY + Y_OFFSET_DRAWING, 
        drawWidth, 
        drawHeight 
    );
    
    ctx.globalAlpha = 1.0; 

    // SPWANING & MAGNET LOGIK
    frame++;

    // ... (Power-Up Spawning Logik unverändert) ...
    
    // Power-Up Bewegung und Zeichnen & Kollision
    if (powerUp) {
        
        const isMagnetActive = activePowerUp === 'MAGNET' && magnetCharges > 0; 
        
        if (isMagnetActive) { 
            
            const dx = (powerUp.x + powerUp.width / 2) - (player.x + player.width / 2);
            const dy = (powerUp.y + powerUp.height / 2) - (player.y + player.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const magnetPullSpeed = currentSpeed * 4; 

            if (distance < MAGNET_RANGE) {
                powerUp.x -= (dx / distance) * magnetPullSpeed; 
                powerUp.y -= (dy / distance) * magnetPullSpeed;
            }
        }
        
        powerUp.x -= currentSpeed;
        
        let imgToDraw;
        if (powerUp.type === 'MULTIPLIER') imgToDraw = multiplierImg;
        else if (powerUp.type === 'MAGNET') imgToDraw = magnetImg;
        else if (powerUp.type === 'LIFE') imgToDraw = lifeImg;
        else if (powerUp.type === 'FLIGHT') imgToDraw = flightImg; 

        // KRITISCH: Wende den X_OFFSET_DRAWING und Y_OFFSET_DRAWING an
        ctx.drawImage(imgToDraw, 
                      powerUp.x + X_OFFSET_DRAWING, 
                      powerUp.y + Y_OFFSET_DRAWING, 
                      powerUp.width, powerUp.height);
        
        if (
            player.x < powerUp.x + powerUp.width &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + powerUp.height &&
            player.y + player.height > powerUp.y
        ) {
            if (isMagnetActive && powerUp.type !== 'MAGNET') {
                magnetCharges--;
                if (magnetCharges <= 0) {
                    activePowerUp = null; 
                }
            }
            
            activatePowerUp(powerUp.type);
            powerUp = null; 
        }
        
        if (powerUp && powerUp.x + powerUp.width < 0) {
            powerUp = null;
        }
    }

    // HINDERNIS-LOGIK (Zeichnen und Kollision)
    const gapScaling = isFlying ? FLIGHT_SPEED_MULTIPLIER : 1; 
    
    const scaledMinGap = Math.floor(MIN_GAP / gapScaling);
    const scaledMaxGap = Math.floor(MAX_GAP / gapScaling);
    
    if (score < WIN_SCORE - 1 && frame >= nextObstacleFrame) { 
        obstacles.push({
            x: GAME_WIDTH, // Muss GAME_WIDTH nutzen
            y: (GAME_HEIGHT - OBSTACLE_HEIGHT) + Y_OFFSET, 
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT
        });
        
        nextObstacleFrame = frame + Math.floor(Math.random() * (scaledMaxGap - scaledMinGap + 1)) + scaledMinGap;
    }
    
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x -= currentSpeed;

        // KRITISCH: Wende den X_OFFSET_DRAWING und Y_OFFSET_DRAWING an
        ctx.drawImage(obstacleImg, 
                      obs.x + X_OFFSET_DRAWING, 
                      obs.y + Y_OFFSET_DRAWING, 
                      obs.width, obs.height);

        // Kollisions-Hitbox Berechnung skaliert
        const hitboxWidth = obs.width * (1 - HITBOX_WIDTH_REDUCTION); 
        const hitboxX = obs.x + (obs.width * (HITBOX_WIDTH_REDUCTION / 2)); 
        const hitboxHeight = obs.height * (1 - HITBOX_HEIGHT_TOP_OFFSET);
        const hitboxY = obs.y + (obs.height * HITBOX_HEIGHT_TOP_OFFSET); 

        if (
            player.x < hitboxX + hitboxWidth && player.x + player.width > hitboxX &&
            player.y < hitboxY + hitboxHeight && player.y + player.height > hitboxY
        ) {
            if (isFlying || isSinking || isInvulnerable) { 
                obstacles.splice(i, 1); 
                i--;
                continue; 
            }
            
            if (lives > 0) {
                lives--; 
                obstacles.splice(i, 1); 
                i--;
                continue; 
            } else {
                gameOver(); 
                return; 
            }
        }
        
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            
            if (score < WIN_SCORE - 1) {
                score += 1 * scoreMultiplier; 
            }
            
            i--;
        }
    }
    
    // SOCKE-GEWINN-LOGIK
    
    // Spawnen der Socke (passiert nur einmal, wenn der Score erreicht ist)
    if (score >= WIN_SCORE && !sockSpawned && winObject === null) {
        sockSpawned = true; 
        const SOCK_WIDTH = 700 * SCALING_FACTOR; 
        const SOCK_HEIGHT = 480 * SCALING_FACTOR; 
        
        winObject = {
            x: GAME_WIDTH, // Muss GAME_WIDTH nutzen
            y: GAME_HEIGHT - SOCK_HEIGHT - (30 * SCALING_FACTOR), 
            width: SOCK_WIDTH,
            height: SOCK_HEIGHT,
        };
    }

    if (winObject) {
        winObject.x -= currentSpeed; 
        
        // KRITISCH: Wende den X_OFFSET_DRAWING und Y_OFFSET_DRAWING an
        ctx.drawImage(winningSockImg, 
                      winObject.x + X_OFFSET_DRAWING, 
                      winObject.y + Y_OFFSET_DRAWING, 
                      winObject.width, winObject.height);
        
        if (
            player.x < winObject.x + winObject.width &&
            player.x + player.width > winObject.x &&
            player.y < winObject.y + winObject.height &&
            player.y + player.height > winObject.y
        ) {
            gameWin(); 
            return; 
        }

        if (winObject.x + winObject.width < 0) {
            winObject = null;
        }
    }
    
    // SCOREBOARD ANZEIGEN (HUD)
    ctx.font = `${Math.round(24 * SCALING_FACTOR)}px Arial, sans-serif`; 
    ctx.shadowColor = 'white'; 
    ctx.shadowBlur = 12 * SCALING_FACTOR;      

    ctx.fillStyle = (scoreMultiplier > 1) ? '#FF3333' : '#33FF33'; 
    
    let scoreText = 'Score: ' + score;
    if (scoreMultiplier > 1) {
        scoreText += ' (x' + scoreMultiplier + ')';
    }
    // KRITISCH: Wende den X_OFFSET_DRAWING und Y_OFFSET_DRAWING an
    ctx.fillText(scoreText, 
                 10 * SCALING_FACTOR + X_OFFSET_DRAWING, 
                 30 * SCALING_FACTOR + Y_OFFSET_DRAWING);
    
    ctx.shadowBlur = 0; 
    if (lives > 0) { 
        const heartSize = 60 * SCALING_FACTOR; 
        // KRITISCH: Wende den X_OFFSET_DRAWING und Y_OFFSET_DRAWING an
        ctx.drawImage(lifeImg, 
                      10 * SCALING_FACTOR + X_OFFSET_DRAWING, 
                      50 * SCALING_FACTOR + Y_OFFSET_DRAWING, 
                      heartSize, heartSize); 
    }
    
    if (activePowerUp === 'MAGNET') {
        
        const ZAHL_Y_KORREKTUR = 15 * SCALING_FACTOR; 
        
        // Berechnet die X-Position basierend auf der neuen Breite
        const iconX = GAME_WIDTH - MAGNET_ICON_WIDTH - MAGNET_ICON_PADDING; 
        const iconY = MAGNET_DISPLAY_Y - (MAGNET_ICON_HEIGHT / 2); 
        
        // KRITISCH: Wende den X_OFFSET_DRAWING und Y_OFFSET_DRAWING an
        ctx.drawImage(magnetImg, 
                      iconX + X_OFFSET_DRAWING, 
                      iconY + Y_OFFSET_DRAWING, 
                      MAGNET_ICON_WIDTH, MAGNET_ICON_HEIGHT); 

        ctx.font = `${Math.round(40 * SCALING_FACTOR)}px Arial, sans-serif`; 
        ctx.shadowBlur = 12 * SCALING_FACTOR; 
        ctx.shadowColor = 'white'; 
        
        const textX = iconX + MAGNET_ICON_WIDTH + MAGNET_TEXT_OFFSET_X;
        ctx.fillStyle = '#FFD700'; 
        ctx.textAlign = 'left'; 
        const textY = MAGNET_DISPLAY_Y + ZAHL_Y_KORREKTUR + Y_OFFSET_DRAWING;
        
        // KRITISCH: Wende den X_OFFSET_DRAWING an
        ctx.fillText(magnetCharges, 
                     textX + X_OFFSET_DRAWING, 
                     textY);
        
        ctx.font = `${Math.round(24 * SCALING_FACTOR)}px Arial, sans-serif`; 
    }
    
    ctx.shadowBlur = 0; 
    ctx.shadowColor = 'transparent';

} 
});

