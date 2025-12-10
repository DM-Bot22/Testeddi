// HINWEIS: Der gesamte Code ist in DOMContentLoaded eingeschlossen!

document.addEventListener('DOMContentLoaded', (event) => {
// --- KONFIGURATION ---
const ZIEL_URL = "https://www.google.de"; 
const WIN_SCORE = 10; // Punktzahl, ab der die Socke erscheinen KANN
const WIN_SOCK_SRC = 'sock_image.png'; 
const GAME_START_TIME = Date.now();
// --------------------

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ======================================================
// === HOCHKANT-GRÖßENBASIS (Rentier-Run-Logik) ===
// ======================================================
// NEUE Referenzbreite für Hochkant-Format (z.B. 9:16)
const BASE_WIDTH = 450; 
// Die interne Basis-Höhe ist nun 800px (800 / 450 = ca. 1.777)
const BASE_RATIO = 800 / 450; 

let SCALING_FACTOR;
let GAME_WIDTH;
let GAME_HEIGHT;

// --- POWER-UP KONFIGURATION (ALLE WERTE SKALIERT) - AUF 'let' UMGESTELLT ---
const POWERUP_SPAWN_SCORE = 1;      
const POWERUP_SPAWN_INTERVAL = 200;    
const POWERUP_CHANCE = 0.5;            

// Basis-Werte angepasst an die neue kleinere Breite (450px)
let MULTIPLIER_WIDTH = 80;    
let MULTIPLIER_HEIGHT = 60;  
let LIFEUP_WIDTH = 60;    
let LIFEUP_HEIGHT = 60;
let MAGNET_WIDTH = 80;    
let MAGNET_HEIGHT = 50;
let FLIGHT_POWERUP_WIDTH = 110;  
let FLIGHT_POWERUP_HEIGHT = 80;

// === FLUG-KONFIGURATION (AUF 'let' UMGESTELLT) ===
const FLIGHT_DURATION = 5000;              
const POST_FLIGHT_INVULN_DURATION = 3000;  
let FLIGHT_RISE_SPEED = 2.5;             
let FLIGHT_SINK_SPEED = 2.5;             
let FLIGHT_CENTER_Y;
let FLIGHT_CENTER_X;
const FLIGHT_SPEED_MULTIPLIER = 2.5;
const FLIGHT_HORIZONTAL_EASING = 0.1;
let FLIGHT_IMAGE_WIDTH = 100;  
let FLIGHT_IMAGE_HEIGHT = 80;  

// LOGIK DEFINITIONEN
let MAGNET_RANGE = 500;    
const MAGNET_MAX_CHARGES = 3;  

// === MAGNET ANZEIGE KONFIGURATION (AUF 'let' UMGESTELLT) ===
let MAGNET_ICON_WIDTH = 100; 
let MAGNET_ICON_HEIGHT = 70; 
let MAGNET_ICON_PADDING = 20;     
let MAGNET_TEXT_OFFSET_X = -10;   
let MAGNET_DISPLAY_Y = 30;         

// --- KOLLISIONS- & POSITIONSEINSTELLUNGEN (AUF 'let' UMGESTELLT) ---
const HITBOX_WIDTH_REDUCTION = 0.40;  
const HITBOX_HEIGHT_TOP_OFFSET = 0.20; 
let Y_OFFSET = 10; 
let JUMP_HEIGHT_BOOST = 45; 

let OBSTACLE_WIDTH = 80; 
let OBSTACLE_HEIGHT = 130; 
let gameSpeed = 6; // STARTGESCHWINDIGKEIT SKALIERT

// Sockengrößen
let SOCK_WIDTH = 700;
let SOCK_HEIGHT = 480;
let SOCK_Y_OFFSET = 30;

// === PLAYER OBJEKT (Initialisierung auf 0, Werte werden in resizeGame gesetzt) ===
const player = {
    x: 0, 
    y: 0, 
    width: 0, 
    height: 0, 
    dy: 0,
    jumpPower: 0, 
    gravity: 0, 
    grounded: false
};

// --- ZUSTANDSVARIABLEN ---
let gameRunning = false;
let score = 0;
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
// === HAUPT-SKALIERUNGSFUNKTION (HOCHKANT-KORREKTUR) ===
// ======================================================
function resizeGame() {
    // 1. Hole die tatsächliche Größe, die durch das responsive CSS festgelegt wurde
    const canvasRect = canvas.getBoundingClientRect();

    // 2. Definiere die interne Canvas-Auflösung basierend auf der tatsächlichen Größe
    canvas.width = canvasRect.width;
    
    // NEU: Höhe wird proportional zur NEUEN Hochkant-Basis (800 / 450) gesetzt
    canvas.height = Math.round(canvas.width * BASE_RATIO); 

    // 3. Definiere den Skalierungsfaktor zur Berechnung aller Variablen
    SCALING_FACTOR = canvas.width / BASE_WIDTH;
    GAME_WIDTH = canvas.width;
    GAME_HEIGHT = canvas.height; 

    // 4. BERECHNUNG ALLER ABHÄNGIGEN GRÖSSEN (Basiswerte * SCALING_FACTOR)
    
    // Power-Up Größen (Basiswerte werden hier mit SCALING_FACTOR multipliziert)
    MULTIPLIER_WIDTH *= SCALING_FACTOR;    
    MULTIPLIER_HEIGHT *= SCALING_FACTOR;  
    LIFEUP_WIDTH *= SCALING_FACTOR;    
    LIFEUP_HEIGHT *= SCALING_FACTOR;
    MAGNET_WIDTH *= SCALING_FACTOR;    
    MAGNET_HEIGHT *= SCALING_FACTOR;
    FLIGHT_POWERUP_WIDTH *= SCALING_FACTOR;  
    FLIGHT_POWERUP_HEIGHT *= SCALING_FACTOR;

    // Flug-Konfiguration
    FLIGHT_RISE_SPEED *= SCALING_FACTOR;             
    FLIGHT_SINK_SPEED *= SCALING_FACTOR;             
    FLIGHT_CENTER_Y = GAME_HEIGHT / 2 - (25 * SCALING_FACTOR);
    FLIGHT_CENTER_X = GAME_WIDTH / 2 - (37.5 * SCALING_FACTOR);
    FLIGHT_IMAGE_WIDTH *= SCALING_FACTOR;  
    FLIGHT_IMAGE_HEIGHT *= SCALING_FACTOR;  

    // Logik Definitionen
    MAGNET_RANGE *= SCALING_FACTOR;    

    // Magnet Anzeige
    MAGNET_ICON_WIDTH *= SCALING_FACTOR; 
    MAGNET_ICON_HEIGHT *= SCALING_FACTOR; 
    MAGNET_ICON_PADDING *= SCALING_FACTOR;     
    MAGNET_TEXT_OFFSET_X *= SCALING_FACTOR;   
    MAGNET_DISPLAY_Y *= SCALING_FACTOR;         

    // Kollision & Position
    Y_OFFSET *= SCALING_FACTOR; 
    JUMP_HEIGHT_BOOST *= SCALING_FACTOR; 

    OBSTACLE_WIDTH *= SCALING_FACTOR; 
    OBSTACLE_HEIGHT *= SCALING_FACTOR; 
    gameSpeed = 6 * SCALING_FACTOR; 

    // Socken-Variablen
    SOCK_WIDTH *= SCALING_FACTOR;
    SOCK_HEIGHT *= SCALING_FACTOR;
    SOCK_Y_OFFSET *= SCALING_FACTOR;

    // Player-Werte
    player.x = 50 * SCALING_FACTOR;
    player.width = 75 * SCALING_FACTOR; 
    player.height = 50 * SCALING_FACTOR;
    player.jumpPower = -18 * SCALING_FACTOR; 
    player.gravity = 0.6 * SCALING_FACTOR;
    
    // Setze Spieler bei Rotation auf den Boden zurück (nur wenn das Spiel läuft)
    if (gameRunning) {
        player.y = GAME_HEIGHT - player.height;
    }
}

// Initialer Aufruf zur Größenberechnung
resizeGame();
// Event-Listener für Geräterotation/Größenänderung
window.addEventListener('resize', resizeGame);


// ======================================================
// === BILDER LADEN (Auszug, um das Skript kurz zu halten) ===
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

function handleInput(e) {
    // Verhindert Standard-Browser-Verhalten beim Tippen/Klicken (MOBILE-FIX)
    if(e) e.preventDefault(); 
    
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

// Touch-Eingabe auf Canvas
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', handleInput); 

// ==========================================================
// === KORREKTUR: EVENT BUBBLING STOPPEN FÜR PFEILE ===
// ==========================================================

if (nextIntro1Btn) {
    const goToIntro2 = (e) => {
        e.stopPropagation(); // Wichtig: Verhindert, dass der Klick das Spiel startet
        introScreen1.classList.add('hidden');
        introScreen2.classList.remove('hidden');
    };
    nextIntro1Btn.addEventListener('click', goToIntro2);
    nextIntro1Btn.addEventListener('touchstart', goToIntro2); 
}
if (nextIntro2Btn) {
    const goToStartScreen = (e) => {
        e.stopPropagation(); // Wichtig: Verhindert, dass der Klick das Spiel startet
        introScreen2.classList.add('hidden');
        startScreen.classList.remove('hidden'); // Zeigt den Startbildschirm an
    };
    nextIntro2Btn.addEventListener('click', goToStartScreen);
    nextIntro2Btn.addEventListener('touchstart', goToStartScreen); 
}
// Klick auf Startbildschirm, um das Spiel zu starten
if (startScreen) {
    startScreen.addEventListener('click', startGame);
    startScreen.addEventListener('touchstart', startGame); // Für Touch-Geräte
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !gameRunning && !startScreen.classList.contains('hidden')) {
            startGame();
        }
    });
}


// === END-LOGIK ===
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
        console.error("FATALER FEHLER: Endscreen-Elemente fehlen im HTML. Bitte prüfe die IDs: gameOverTitle, gameOverMessage, winSockImage, surpriseBtn, restartBtn!");
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

// === START LOGIK ===

function startGame() {
    // Sicherstellen, dass die Canvas-Größe bei Start korrekt ist (z.B. nach Rotation)
    resizeGame();
    
    gameRunning = true;
    score = 0;
    obstacles = [];
    frame = 0;
    scoreMultiplier = 1; 
    lives = 0; 
    
    // Die Geschwindigkeit muss neu skaliert werden, wenn resizeGame() die Skalierung ändert
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
    
    // Player-Position auf skalierten Hochkant-Werten zurücksetzen
    player.x = 50 * SCALING_FACTOR;
    player.y = GAME_HEIGHT - player.height;
    
    startScreen.classList.add('hidden'); 
    gameOverScreen.classList.add('hidden');
    introScreen1.classList.add('hidden');
    introScreen2.classList.add('hidden');

    animate();
}

function animate() {
    if (!gameRunning) return;

    requestAnimationFrame(animate);
    
    // === ZEICHNEN DES HINTERGRUNDS ===
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    
    // ======================================
    
    if (score >= speedIncreasePoint) {
        // Geschwindigkeitserhöhung muss skaliert werden
        gameSpeed += 0.5 * SCALING_FACTOR;
        speedIncreasePoint += 100; 
    }
    
    const currentSpeed = isFlying ? gameSpeed * FLIGHT_SPEED_MULTIPLIER : gameSpeed;

    if (score === WIN_SCORE - 1 && score < WIN_SCORE) {
        score = WIN_SCORE;
    }
    
    // FLUG- UND PHYSIK-LOGIK
    if (!isFlying && !isSinking) {
        player.dy += player.gravity;
        player.y += player.dy;
    }
    
    // X-Position für Hochkant auf der linken Seite fixieren
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
    
    ctx.drawImage(
        imageToDraw, 
        player.x, 
        drawY, 
        drawWidth, 
        drawHeight 
    );
    
    ctx.globalAlpha = 1.0; 

    // SPWANING & MAGNET LOGIK
    frame++;

    // === POWER-UP SPAWN LOGIK (Stoppt bei WIN_SCORE - 1) ===
    if (score < WIN_SCORE - 1 && powerUp === null && frame >= POWERUP_SPAWN_SCORE && frame % POWERUP_SPAWN_INTERVAL === 0) {
        if (Math.random() < POWERUP_CHANCE) {
            let type, width, height;
            
            let randomType = Math.floor(Math.random() * 4); 

            if (randomType === 0) {
                type = 'MULTIPLIER';
            } else if (randomType === 1) {
                type = 'MAGNET';
            } else if (randomType === 2) { 
                type = 'LIFE';
            } else { 
                type = 'FLIGHT'; 
            }
            
            // Vermeide doppelte Power-Ups
            if (type === 'MAGNET' && activePowerUp === 'MAGNET') {
                type = 'MULTIPLIER';
            }
            if (type === 'LIFE' && lives === 1) {
                type = 'MULTIPLIER';
            }

            // Basiswerte vor Multiplikation nutzen
            let baseWidth = 0;
            let baseHeight = 0;
            if (type === 'MULTIPLIER') {
                baseWidth = 80; baseHeight = 60;
            } else if (type === 'MAGNET') {
                baseWidth = 80; baseHeight = 50;
            } else if (type === 'LIFE') {
                baseWidth = 60; baseHeight = 60;
            } else { 
                baseWidth = 110; baseHeight = 80; 
            }

            width = baseWidth * SCALING_FACTOR;
            height = baseHeight * SCALING_FACTOR;
            
            // Y-Position des Power-Ups skaliert (Basis-Werte 130 + 20)
            const powerUpY = GAME_HEIGHT - (130 * SCALING_FACTOR) - (Math.random() * 20 * SCALING_FACTOR) - height; 
            powerUp = {
                x: canvas.width,
                y: powerUpY,
                width: width,    
                height: height,
                type: type
            };
        }
    }
    
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

        ctx.drawImage(imgToDraw, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        
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

    // === HINDERNIS-LOGIK (Stoppt bei WIN_SCORE - 1) ===
    
    const gapScaling = isFlying ? FLIGHT_SPEED_MULTIPLIER : 1; 
    
    const scaledMinGap = Math.floor(MIN_GAP / gapScaling);
    const scaledMaxGap = Math.floor(MAX_GAP / gapScaling);
    
    if (score < WIN_SCORE - 1 && frame >= nextObstacleFrame) { 
        obstacles.push({
            x: canvas.width,
            // Y-Position des Hindernisses skaliert (Basis-Wert 130 + 10)
            y: (GAME_HEIGHT - (130 * SCALING_FACTOR)) + (10 * SCALING_FACTOR), 
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT
        });
        
        nextObstacleFrame = frame + Math.floor(Math.random() * (scaledMaxGap - scaledMinGap + 1)) + scaledMinGap;
    }
    
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x -= currentSpeed;

        ctx.drawImage(obstacleImg, obs.x, obs.y, obs.width, obs.height);

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
    
    // === SOCKE-GEWINN-LOGIK (Einsammeln) ===
    if (score >= WIN_SCORE && !sockSpawned && winObject === null) {
        sockSpawned = true; 
        
        winObject = {
            x: canvas.width,
            // Y-Position der Socke skaliert
            y: GAME_HEIGHT - SOCK_HEIGHT - SOCK_Y_OFFSET, 
            width: SOCK_WIDTH,
            height: SOCK_HEIGHT,
        };
    }
    
    // Socke bewegen und zeichnen
    if (winObject) {
        winObject.x -= currentSpeed; 
        
        ctx.drawImage(winningSockImg, winObject.x, winObject.y, winObject.width, winObject.height);
        
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
    
    // SCOREBOARD ANZEIGEN (Schriftgröße skaliert)
    ctx.font = `${Math.round(24 * SCALING_FACTOR)}px Arial, sans-serif`; 
    ctx.shadowColor = 'white'; 
    ctx.shadowBlur = 12 * SCALING_FACTOR;      

    ctx.fillStyle = (scoreMultiplier > 1) ? '#FF3333' : '#33FF33'; 
    
    let scoreText = 'Score: ' + score;
    if (scoreMultiplier > 1) {
        scoreText += ' (x' + scoreMultiplier + ')';
    }
    // X/Y-Position skaliert
    ctx.fillText(scoreText, 10 * SCALING_FACTOR, 30 * SCALING_FACTOR);
    
    ctx.shadowBlur = 0; 
    if (lives > 0) { 
        // Herz-Größe und Position skaliert
        const heartSize = 60 * SCALING_FACTOR; 
        ctx.drawImage(lifeImg, 10 * SCALING_FACTOR, 50 * SCALING_FACTOR, heartSize, heartSize); 
    }
    
    if (activePowerUp === 'MAGNET') {
        
        const ZAHL_Y_KORREKTUR = 15 * SCALING_FACTOR; 
        
        const iconX = canvas.width - MAGNET_ICON_WIDTH - MAGNET_ICON_PADDING; 
        const iconY = MAGNET_DISPLAY_Y - (MAGNET_ICON_HEIGHT / 2); 
        
        ctx.drawImage(magnetImg, iconX, iconY, MAGNET_ICON_WIDTH, MAGNET_ICON_HEIGHT); 

        // Textgröße skaliert
        ctx.font = `${Math.round(40 * SCALING_FACTOR)}px Arial, sans-serif`; 
        ctx.shadowBlur = 12 * SCALING_FACTOR; 
        ctx.shadowColor = 'white'; 
        
        const textX = iconX + MAGNET_ICON_WIDTH + MAGNET_TEXT_OFFSET_X;
        ctx.fillStyle = '#FFD700'; 
        ctx.textAlign = 'left'; 
        const textY = MAGNET_DISPLAY_Y + ZAHL_Y_KORREKTUR;
        
        ctx.fillText(magnetCharges, textX, textY);
        
        // Schriftgröße für den Rest zurücksetzen (skaliert)
        ctx.font = `${Math.round(24 * SCALING_FACTOR)}px Arial, sans-serif`; 
    }
    
    ctx.shadowBlur = 0; 
    ctx.shadowColor = 'transparent';

} 
});
