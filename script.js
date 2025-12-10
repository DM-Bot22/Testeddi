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
// === HOCHKANT-GRÖßENBASIS (Dynamische Skalierung) ===
// ======================================================
// NEUE Referenzbreite für ein etwas breiteres Hochkant-Format
const BASE_WIDTH = 500; 
// Basis-Höhe (für das Verhältnis 5:8, also 500:800)
const BASE_HEIGHT = 800; 
const BASE_RATIO = BASE_HEIGHT / BASE_WIDTH; 

// ALLE dynamischen Werte müssen jetzt 'let' sein, damit sie in resizeGame() neu berechnet werden können
let SCALING_FACTOR;
let GAME_WIDTH;
let GAME_HEIGHT;

// --- POWER-UP KONFIGURATION (JETZT ALLE 'let' FÜR RESIZE) ---
const POWERUP_SPAWN_SCORE = 1;      
const POWERUP_SPAWN_INTERVAL = 200;    
const POWERUP_CHANCE = 0.5;            

let MULTIPLIER_WIDTH_BASE = 80;    
let MULTIPLIER_HEIGHT_BASE = 60;  
let LIFEUP_WIDTH_BASE = 60;    
let LIFEUP_HEIGHT_BASE = 60;
let MAGNET_WIDTH_BASE = 80;    
let MAGNET_HEIGHT_BASE = 50;
let FLIGHT_POWERUP_WIDTH_BASE = 110;  
let FLIGHT_POWERUP_HEIGHT_BASE = 80;

// === FLUG-KONFIGURATION (JETZT ALLE 'let' FÜR RESIZE) ===
const FLIGHT_DURATION = 5000;              
const POST_FLIGHT_INVULN_DURATION = 3000;  
let FLIGHT_RISE_SPEED_BASE = 2.5;             
let FLIGHT_SINK_SPEED_BASE = 2.5;             
let FLIGHT_CENTER_Y;
let FLIGHT_CENTER_X;
const FLIGHT_SPEED_MULTIPLIER = 2.5;
const FLIGHT_HORIZONTAL_EASING = 0.1;
let FLIGHT_IMAGE_WIDTH_BASE = 100;  
let FLIGHT_IMAGE_HEIGHT_BASE = 80;  

// LOGIK DEFINITIONEN
let MAGNET_RANGE_BASE = 500;    
const MAGNET_MAX_CHARGES = 3;  

// === MAGNET ANZEIGE KONFIGURATION (JETZT ALLE 'let' FÜR RESIZE) ===
let MAGNET_ICON_WIDTH_BASE = 100; 
let MAGNET_ICON_HEIGHT_BASE = 70; 
let MAGNET_ICON_PADDING_BASE = 20;     
let MAGNET_TEXT_OFFSET_X_BASE = -10;   
let MAGNET_DISPLAY_Y_BASE = 30;         

// --- KOLLISIONS- & POSITIONSEINSTELLUNGEN (JETZT ALLE 'let' FÜR RESIZE) ---
const HITBOX_WIDTH_REDUCTION = 0.40;  
const HITBOX_HEIGHT_TOP_OFFSET = 0.20; 
let Y_OFFSET_BASE = 10; 
let JUMP_HEIGHT_BOOST_BASE = 45; 

let OBSTACLE_WIDTH_BASE = 80; 
let OBSTACLE_HEIGHT_BASE = 130; 
let gameSpeed = 6; // Startgeschwindigkeit (wird in resizeGame() skaliert)

// Socken-Basisgrößen
let SOCK_WIDTH_BASE = 700;
let SOCK_HEIGHT_BASE = 480;
let SOCK_Y_OFFSET_BASE = 30;

// === PLAYER OBJEKT (Werte werden in resizeGame gesetzt) ===
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

let sockSpawned = false; 
let winObject = null;    

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
// === HAUPT-SKALIERUNGSFUNKTION (VOLL-RESPONSIV) ===
// ======================================================
function resizeGame() {
    // 1. Setze Canvas auf die volle Größe des Browser-Fensters (Rentier-Run Logik)
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    GAME_WIDTH = canvas.width;
    GAME_HEIGHT = canvas.height; 

    // 2. Bestimme den Skalierungsfaktor. 
    // Wir nutzen die Breite, damit die Elemente proportional zum Hochkant-Spiel bleiben.
    // Wenn die Höhe viel größer ist, füllen wir nicht die gesamte Höhe mit Spielinhalten aus.
    // Wir zentrieren das Spiel dann vertikal, wenn das Verhältnis zu "hoch" ist.
    SCALING_FACTOR = GAME_WIDTH / BASE_WIDTH;
    
    // Fallback: Wenn das Verhältnis zu breit ist (Querformat), verwenden wir die Höhe zur Skalierung
    // Dies stellt sicher, dass das Spiel immer sichtbar bleibt
    if (GAME_HEIGHT / GAME_WIDTH < BASE_RATIO) {
        SCALING_FACTOR = GAME_HEIGHT / BASE_HEIGHT;
    }

    // 3. BERECHNUNG ALLER ABHÄNGIGEN GRÖSSEN (Basiswerte * SCALING_FACTOR)
    
    // Power-Up Größen
    let MULTIPLIER_WIDTH = MULTIPLIER_WIDTH_BASE * SCALING_FACTOR;    
    let MULTIPLIER_HEIGHT = MULTIPLIER_HEIGHT_BASE * SCALINGING_FACTOR;  
    let LIFEUP_WIDTH = LIFEUP_WIDTH_BASE * SCALING_FACTOR;    
    let LIFEUP_HEIGHT = LIFEUP_HEIGHT_BASE * SCALING_FACTOR;
    let MAGNET_WIDTH = MAGNET_WIDTH_BASE * SCALING_FACTOR;    
    let MAGNET_HEIGHT = MAGNET_HEIGHT_BASE * SCALING_FACTOR;
    let FLIGHT_POWERUP_WIDTH = FLIGHT_POWERUP_WIDTH_BASE * SCALING_FACTOR;  
    let FLIGHT_POWERUP_HEIGHT = FLIGHT_POWERUP_HEIGHT_BASE * SCALING_FACTOR;

    // Flug-Konfiguration
    let FLIGHT_RISE_SPEED = FLIGHT_RISE_SPEED_BASE * SCALING_FACTOR;             
    let FLIGHT_SINK_SPEED = FLIGHT_SINK_SPEED_BASE * SCALING_FACTOR;             
    FLIGHT_CENTER_Y = GAME_HEIGHT / 2 - (25 * SCALING_FACTOR);
    FLIGHT_CENTER_X = GAME_WIDTH / 2 - (37.5 * SCALING_FACTOR);
    let FLIGHT_IMAGE_WIDTH = FLIGHT_IMAGE_WIDTH_BASE * SCALING_FACTOR;  
    let FLIGHT_IMAGE_HEIGHT = FLIGHT_IMAGE_HEIGHT_BASE * SCALING_FACTOR;  

    // Logik Definitionen
    let MAGNET_RANGE = MAGNET_RANGE_BASE * SCALING_FACTOR;    

    // Magnet Anzeige
    let MAGNET_ICON_WIDTH = MAGNET_ICON_WIDTH_BASE * SCALING_FACTOR; 
    let MAGNET_ICON_HEIGHT = MAGNET_ICON_HEIGHT_BASE * SCALING_FACTOR; 
    let MAGNET_ICON_PADDING = MAGNET_ICON_PADDING_BASE * SCALING_FACTOR;     
    let MAGNET_TEXT_OFFSET_X = MAGNET_TEXT_OFFSET_X_BASE * SCALING_FACTOR;   
    let MAGNET_DISPLAY_Y = MAGNET_DISPLAY_Y_BASE * SCALING_FACTOR;         

    // Kollision & Position
    let Y_OFFSET = Y_OFFSET_BASE * SCALING_FACTOR; 
    let JUMP_HEIGHT_BOOST = JUMP_HEIGHT_BOOST_BASE * SCALING_FACTOR; 

    let OBSTACLE_WIDTH = OBSTACLE_WIDTH_BASE * SCALING_FACTOR; 
    let OBSTACLE_HEIGHT = OBSTACLE_HEIGHT_BASE * SCALING_FACTOR; 
    gameSpeed = 6 * SCALING_FACTOR; 

    // Socken-Variablen
    let SOCK_WIDTH = SOCK_WIDTH_BASE * SCALING_FACTOR;
    let SOCK_HEIGHT = SOCK_HEIGHT_BASE * SCALING_FACTOR;
    let SOCK_Y_OFFSET = SOCK_Y_OFFSET_BASE * SCALING_FACTOR;

    // Player-Werte
    player.x = 50 * SCALING_FACTOR;
    player.width = 75 * SCALING_FACTOR; 
    player.height = 50 * SCALING_FACTOR;
    player.jumpPower = -18 * SCALING_FACTOR; 
    player.gravity = 0.6 * SCALING_FACTOR;
    
    // Setze Spieler bei Rotation auf den Boden zurück (nur wenn das Spiel läuft)
    if (gameRunning) {
        // Spieler und Boden werden relativ zur gesamten GAME_HEIGHT positioniert
        player.y = GAME_HEIGHT - player.height;
    }
}

// Initialer Aufruf zur Größenberechnung
resizeGame();
// Event-Listener für Geräterotation/Größenänderung
window.addEventListener('resize', resizeGame);


// ======================================================
// === BILDER LADEN (Auszug) ===
// ... (Dieser Teil bleibt gleich) ...
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
    resizeGame(); // Erneuter Resize, um sicherzustellen, dass SCALING_FACTOR gesetzt ist
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

// KORREKTUR: EVENT BUBBLING STOPPEN FÜR PFEILE
if (nextIntro1Btn) {
    const goToIntro2 = (e) => {
        e.stopPropagation(); 
        introScreen1.classList.add('hidden');
        introScreen2.classList.remove('hidden');
    };
    nextIntro1Btn.addEventListener('click', goToIntro2);
    nextIntro1Btn.addEventListener('touchstart', goToIntro2); 
}
if (nextIntro2Btn) {
    const goToStartScreen = (e) => {
        e.stopPropagation(); 
        introScreen2.classList.add('hidden');
        startScreen.classList.remove('hidden'); 
    };
    nextIntro2Btn.addEventListener('click', goToStartScreen);
    nextIntro2Btn.addEventListener('touchstart', goToStartScreen); 
}
// Klick auf Startbildschirm, um das Spiel zu starten
if (startScreen) {
    startScreen.addEventListener('click', startGame);
    startScreen.addEventListener('touchstart', startGame); 
    
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
    
    // Geschwindigkeit und Positionen müssen neu auf SKALIERTEN Werten basieren
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
    
    winObject = null;
    sockSpawned = false; 
    
    nextObstacleFrame = Math.floor(Math.random() * (MAX_GAP - MIN_GAP)) + MIN_GAP; 
    
    // Player-Position auf skalierten Werten zurücksetzen
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
        gameSpeed += 0.5 * SCALING_FACTOR;
        speedIncreasePoint += 100; 
    }
    
    const currentSpeed = isFlying ? gameSpeed * FLIGHT_SPEED_MULTIPLIER : gameSpeed;

    if (score === WIN_SCORE - 1 && score < WIN_SCORE) {
        score = WIN_SCORE;
    }
    
    // FLUG- UND PHYSIK-LOGIK (Unverändert, verwendet SCALING_FACTOR)
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
            player.y -= FLIGHT_RISE_SPEED_BASE * SCALING_FACTOR; // Verwende BASE-Werte und skaliere
            if (player.y < FLIGHT_CENTER_Y) { 
                player.y = FLIGHT_CENTER_Y;
            }
        } else {
            player.y = FLIGHT_CENTER_Y; 
        }
        
        if (player.x < FLIGHT_CENTER_X) {
            player.x += FLIGHT_RISE_SPEED_BASE * SCALING_FACTOR; // Verwende BASE-Werte und skaliere
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
        player.y += FLIGHT_SINK_SPEED_BASE * SCALING_FACTOR; // Verwende BASE-Werte und skaliere
        
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
    // Hier verwenden wir direkt die skalierten Werte, die in resizeGame() 
    // in die player-Objekte geschrieben wurden (player.width/height)
    let drawWidth = player.width;    
    let drawHeight = player.height;  
    let drawY = player.y;            

    if (isFlying || isSinking) { 
        imageToDraw = playerFlightImg;
        drawWidth = FLIGHT_IMAGE_WIDTH_BASE * SCALING_FACTOR; // Hier wieder Basiswerte nutzen
        drawHeight = FLIGHT_IMAGE_HEIGHT_BASE * SCALING_FACTOR;
        drawY = player.y - (5 * SCALING_FACTOR); 
    } 
    else if (player.grounded) { 
        imageToDraw = playerStandImg;
    } 
    else { 
        imageToDraw = playerJumpImg; 
        
        drawHeight = player.height + JUMP_HEIGHT_BOOST_BASE * SCALING_FACTOR; 
        drawY = player.y - JUMP_HEIGHT_BOOST_BASE * SCALING_FACTOR; 
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

    // === POWER-UP SPAWN LOGIK ===
    if (score < WIN_SCORE - 1 && powerUp === null && frame >= POWERUP_SPAWN_SCORE && frame % POWERUP_SPAWN_INTERVAL === 0) {
        if (Math.random() < POWERUP_CHANCE) {
            let type;
            let width_base, height_base;
            
            let randomType = Math.floor(Math.random() * 4); 

            if (randomType === 0) {
                type = 'MULTIPLIER'; width_base = MULTIPLIER_WIDTH_BASE; height_base = MULTIPLIER_HEIGHT_BASE;
            } else if (randomType === 1) {
                type = 'MAGNET'; width_base = MAGNET_WIDTH_BASE; height_base = MAGNET_HEIGHT_BASE;
            } else if (randomType === 2) { 
                type = 'LIFE'; width_base = LIFEUP_WIDTH_BASE; height_base = LIFEUP_HEIGHT_BASE;
            } else { 
                type = 'FLIGHT'; width_base = FLIGHT_POWERUP_WIDTH_BASE; height_base = FLIGHT_POWERUP_HEIGHT_BASE;
            }
            
            if ((type === 'MAGNET' && activePowerUp === 'MAGNET') || (type === 'LIFE' && lives === 1)) {
                type = 'MULTIPLIER'; width_base = MULTIPLIER_WIDTH_BASE; height_base = MULTIPLIER_HEIGHT_BASE;
            }

            // Power-Up Y-Position: Hängt von der Größe des Hindernisses ab
            const powerUpY_BASE = BASE_HEIGHT - OBSTACLE_HEIGHT_BASE - 50; // Etwas oberhalb des Hindernis-Boden-Bereichs
            
            powerUp = {
                x: canvas.width,
                // Y-Position des Power-Ups skaliert
                y: powerUpY_BASE * SCALING_FACTOR - (height_base * SCALING_FACTOR),
                width: width_base * SCALING_FACTOR,    
                height: height_base * SCALING_FACTOR,
                type: type
            };
        }
    }
    
    // Power-Up Bewegung und Zeichnen & Kollision
    if (powerUp) {
        // ... (Logik bleibt gleich) ...
        const isMagnetActive = activePowerUp === 'MAGNET' && magnetCharges > 0; 
        
        if (isMagnetActive) { 
            const dx = (powerUp.x + powerUp.width / 2) - (player.x + player.width / 2);
            const dy = (powerUp.y + powerUp.height / 2) - (player.y + player.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const magnetPullSpeed = currentSpeed * 4; 

            if (distance < MAGNET_RANGE_BASE * SCALING_FACTOR) {
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

    // === HINDERNIS-LOGIK (Baum-Position Korrektur!) ===
    
    const gapScaling = isFlying ? FLIGHT_SPEED_MULTIPLIER : 1; 
    
    const scaledMinGap = Math.floor(MIN_GAP / gapScaling);
    const scaledMaxGap = Math.floor(MAX_GAP / gapScaling);
    
    if (score < WIN_SCORE - 1 && frame >= nextObstacleFrame) { 
        
        const currentObstacleWidth = OBSTACLE_WIDTH_BASE * SCALING_FACTOR;
        const currentObstacleHeight = OBSTACLE_HEIGHT_BASE * SCALING_FACTOR;

        obstacles.push({
            x: canvas.width,
            // NEU: Y-Position des Hindernisses ist der Boden (GAME_HEIGHT) minus der Höhe des Bildes.
            // Das verhindert das "Schweben" der Bäume.
            y: GAME_HEIGHT - currentObstacleHeight, 
            width: currentObstacleWidth,
            height: currentObstacleHeight
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
        
        const currentSockWidth = SOCK_WIDTH_BASE * SCALING_FACTOR;
        const currentSockHeight = SOCK_HEIGHT_BASE * SCALING_FACTOR;

        winObject = {
            x: canvas.width,
            // NEU: Y-Position der Socke ist der Boden (GAME_HEIGHT) minus der Höhe des Bildes.
            y: GAME_HEIGHT - currentSockHeight - SOCK_Y_OFFSET_BASE * SCALING_FACTOR, 
            width: currentSockWidth,
            height: currentSockHeight,
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
    ctx.fillText(scoreText, 10 * SCALING_FACTOR, 30 * SCALING_FACTOR);
    
    ctx.shadowBlur = 0; 
    if (lives > 0) { 
        const heartSize = 60 * SCALING_FACTOR; 
        ctx.drawImage(lifeImg, 10 * SCALING_FACTOR, 50 * SCALING_FACTOR, heartSize, heartSize); 
    }
    
    if (activePowerUp === 'MAGNET') {
        
        const ZAHL_Y_KORREKTUR = 15 * SCALING_FACTOR; 
        
        const currentIconWidth = MAGNET_ICON_WIDTH_BASE * SCALING_FACTOR;
        const currentIconHeight = MAGNET_ICON_HEIGHT_BASE * SCALING_FACTOR;
        const currentIconPadding = MAGNET_ICON_PADDING_BASE * SCALING_FACTOR;
        const currentTextOffsetX = MAGNET_TEXT_OFFSET_X_BASE * SCALING_FACTOR;
        const currentDisplayY = MAGNET_DISPLAY_Y_BASE * SCALING_FACTOR;
        
        const iconX = canvas.width - currentIconWidth - currentIconPadding; 
        const iconY = currentDisplayY - (currentIconHeight / 2); 
        
        ctx.drawImage(magnetImg, iconX, iconY, currentIconWidth, currentIconHeight); 

        ctx.font = `${Math.round(40 * SCALING_FACTOR)}px Arial, sans-serif`; 
        ctx.shadowBlur = 12 * SCALING_FACTOR; 
        ctx.shadowColor = 'white'; 
        
        const textX = iconX + currentIconWidth + currentTextOffsetX;
        ctx.fillStyle = '#FFD700'; 
        ctx.textAlign = 'left'; 
        const textY = currentDisplayY + ZAHL_Y_KORREKTUR;
        
        ctx.fillText(magnetCharges, textX, textY);
        
        ctx.font = `${Math.round(24 * SCALING_FACTOR)}px Arial, sans-serif`; 
    }
    
    ctx.shadowBlur = 0; 
    ctx.shadowColor = 'transparent';

} 
});
