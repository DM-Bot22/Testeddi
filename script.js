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

// === NEUE DYNAMISCHE GRÖßENBERECHNUNG (MOBIL-OPTIMIERUNG) ===
// 1. Hole die tatsächliche Größe, die durch das responsive CSS festgelegt wurde
// Wichtig: Wir müssen warten, bis das DOM gerendert ist, damit getBoundingClientRect() die korrekte Größe liefert.
const canvasRect = canvas.getBoundingClientRect();

// 2. Definiere die interne Canvas-Auflösung basierend auf der tatsächlichen Größe
canvas.width = canvasRect.width;

// Die Höhe wird proportional zur Breite (1024x585 Referenz) gesetzt:
canvas.height = Math.round(canvas.width * (585 / 1024)); 

// 3. Definiere den Skalierungsfaktor zur Berechnung aller Variablen
// Referenzbreite (PC-Basis): 800px
const BASE_WIDTH = 800; 
const SCALING_FACTOR = canvas.width / BASE_WIDTH;

// Spielgröße (werden intern im Skript verwendet)
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height; 

// --- POWER-UP KONFIGURATION (ALLE WERTE SKALIERT) ---
const POWERUP_SPAWN_SCORE = 1;      
const POWERUP_SPAWN_INTERVAL = 200;    
const POWERUP_CHANCE = 0.5;            

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
let gameSpeed = 6 * SCALING_FACTOR; // STARTGESCHWINDIGKEIT SKALIERT
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
    x: 50 * SCALING_FACTOR, // Start-X-Position skaliert
    y: GAME_HEIGHT - (50 * SCALING_FACTOR), // Y-Position skaliert
    width: 75 * SCALING_FACTOR, // Breite skaliert
    height: 50 * SCALING_FACTOR, // Höhe skaliert
    dy: 0,
    jumpPower: -18 * SCALING_FACTOR, // Sprungkraft skaliert
    gravity: 0.6 * SCALING_FACTOR, // Schwerkraft skaliert
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
// NEU: Intro-Bildschirme
const introScreen1 = document.getElementById('introScreen1');
const introScreen2 = document.getElementById('introScreen2');
const nextIntro1Btn = document.getElementById('nextIntro1');
const nextIntro2Btn = document.getElementById('nextIntro2');


// ======================================================
// === BILDER LADEN ===
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

// NEU: Bilder für Intro-Screens laden
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
    // NEU: Beim Laden der Seite nur IntroScreen1 zeigen
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

// NEU: Touch-Eingabe
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', handleInput); 

// NEU: Event-Listener für die Intro-Buttons (Korrektur: StopPropagation)
if (nextIntro1Btn) {
    nextIntro1Btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Verhindert, dass der Klick auf das Canvas durchgeht
        introScreen1.classList.add('hidden');
        introScreen2.classList.remove('hidden');
    });
}
if (nextIntro2Btn) {
    nextIntro2Btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Verhindert, dass der Klick auf das Canvas durchgeht
        introScreen2.classList.add('hidden');
        startScreen.classList.remove('hidden'); // Zeigt den Startbildschirm an
    });
}
// Klick auf Startbildschirm, um das Spiel zu starten
if (startScreen) {
    startScreen.addEventListener('click', startGame);
    // NEU: Zusätzlicher Event-Listener für Touch/Klick im Startbildschirm
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !gameRunning && !startScreen.classList.contains('hidden')) {
            startGame();
        }
    });
}


// === END-LOGIK ===
// Logik angepasst, um Buttons je nach Win/Loss anzuzeigen und neuen Text zu nutzen

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
        // Text mit kleinerer Schriftgröße für den zweiten Satz
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
        // HIER: Der angepasste Verlierer-Text, den du zuletzt wollten
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
    gameRunning = true;
    score = 0;
    obstacles = [];
    frame = 0;
    scoreMultiplier = 1; 
    lives = 0; 
    // ACHTUNG: gameSpeed, player.y, player.x müssen hier erneut auf skalierte Werte gesetzt werden, 
    // falls sie sich im Spiel verändert haben.
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
    player.y = GAME_HEIGHT - player.height;
    player.x = 50 * SCALING_FACTOR; 
    startScreen.classList.add('hidden'); // Stellt sicher, dass der Startbildschirm ausgeblendet wird
    gameOverScreen.classList.add('hidden');
    
    // Blendet Intro-Bildschirme aus, falls noch sichtbar
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
        // Die Geschwindigkeitserhöhung muss ebenfalls skaliert werden
        gameSpeed += 0.5 * SCALING_FACTOR;
        speedIncreasePoint += 100; 
    }
    
    const currentSpeed = isFlying ? gameSpeed * FLIGHT_SPEED_MULTIPLIER : gameSpeed;

    // FEHLERBEHEBUNG: Garantiere den letzten Punkt, wenn das Spawning stoppt
    if (score === WIN_SCORE - 1 && score < WIN_SCORE) {
        score = WIN_SCORE;
    }
    
    // FLUG- UND PHYSIK-LOGIK
    if (!isFlying && !isSinking) {
        player.dy += player.gravity;
        player.y += player.dy;
    }
    
    if (!isFlying && !isSinking) {
        player.x = 50 * SCALING_FACTOR; // Zurücksetzen auf skalierten Wert
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
        
        const targetX = 50 * SCALING_FACTOR; // Ziel-X skaliert
        const easingFactor = FLIGHT_HORIZONTAL_EASING;
        
        if (player.x !== targetX) {
            const dx = targetX - player.x; 
            player.x += dx * easingFactor; 
            
            if (Math.abs(player.x - targetX) < 0.5 * SCALING_FACTOR) { // Toleranz skaliert
                player.x = targetX;
            }
        }
        
        if (player.y + player.height >= GAME_HEIGHT) { 
            player.y = GAME_HEIGHT - player.height;
            isSinking = false; 
            
            player.x = 50 * SCALING_FACTOR; // Rückkehr zur Basis-X skaliert
            
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
            player.x = 50 * SCALING_FACTOR; // X-Position auf skalierten Wert setzen
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
        drawY = player.y - (5 * SCALING_FACTOR); // Y-Offset skaliert
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

    // ======================================================
    // === POWER-UP SPAWN LOGIK (Stoppt bei WIN_SCORE - 1) ===
    // ======================================================
    
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
            
            if (type === 'MAGNET' && activePowerUp === 'MAGNET') {
                type = 'MULTIPLIER';
            }
            if (type === 'LIFE' && lives === 1) {
                type = 'MULTIPLIER';
            }

            if (type === 'MULTIPLIER') {
                width = MULTIPLIER_WIDTH;
                height = MULTIPLIER_HEIGHT;
            } else if (type === 'MAGNET') {
                width = MAGNET_WIDTH;
                height = MAGNET_HEIGHT;
            } else if (type === 'LIFE') {
                width = LIFEUP_WIDTH;
                height = LIFEUP_HEIGHT;
            } else { 
                width = FLIGHT_POWERUP_WIDTH; 
                height = FLIGHT_POWERUP_HEIGHT; 
            }
            
            // Y-Position des Power-Ups skaliert
            const powerUpY = GAME_HEIGHT - OBSTACLE_HEIGHT - (Math.random() * 20 * SCALING_FACTOR) - height; 
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
            
            // Magnetgeschwindigkeit skaliert
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

    // ======================================================
    // === HINDERNIS-LOGIK (Stoppt bei WIN_SCORE - 1) ===
    // ======================================================
    
    const gapScaling = isFlying ? FLIGHT_SPEED_MULTIPLIER : 1; 
    
    const scaledMinGap = Math.floor(MIN_GAP / gapScaling);
    const scaledMaxGap = Math.floor(MAX_GAP / gapScaling);
    
    if (score < WIN_SCORE - 1 && frame >= nextObstacleFrame) { 
        obstacles.push({
            x: canvas.width,
            // Y-Position des Hindernisses skaliert
            y: (GAME_HEIGHT - OBSTACLE_HEIGHT) + Y_OFFSET, 
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
            
            // Punktgewinn nur bis zu WIN_SCORE - 2, da der letzte Punkt garantiert wird
            if (score < WIN_SCORE - 1) {
                score += 1 * scoreMultiplier; 
            }
            
            i--;
        }
    }
    
    // ======================================================
    // === SOCKE-GEWINN-LOGIK (Einsammeln) ===
    // ======================================================
    
    // Spawnen der Socke (passiert nur einmal, wenn der Score erreicht ist)
    if (score >= WIN_SCORE && !sockSpawned && winObject === null) {
        sockSpawned = true; 
        const SOCK_WIDTH = 700 * SCALING_FACTOR; // Gigantische Breite skaliert
        const SOCK_HEIGHT = 480 * SCALING_FACTOR; // Gigantische Höhe skaliert
        
        winObject = {
            x: canvas.width,
            // Y-Position der Socke skaliert
            y: GAME_HEIGHT - SOCK_HEIGHT - (30 * SCALING_FACTOR), 
            width: SOCK_WIDTH,
            height: SOCK_HEIGHT,
        };
    }
    
    // Socke bewegen und zeichnen
    if (winObject) {
        winObject.x -= currentSpeed; 
        
        // Zeichne das Sockenbild (winningSockImg)
        ctx.drawImage(winningSockImg, winObject.x, winObject.y, winObject.width, winObject.height);
        
        // Kollisionsprüfung mit dem Spieler
        if (
            player.x < winObject.x + winObject.width &&
            player.x + player.width > winObject.x &&
            player.y < winObject.y + winObject.height &&
            player.y + player.height > winObject.y
        ) {
            // Socke eingesammelt: SOFORTIGER GEWINN!
            gameWin(); 
            return; 
        }

        // Wenn die Socke außerhalb des Bildschirms ist, wird sie entfernt 
        if (winObject.x + winObject.width < 0) {
            winObject = null;
        }
    }
    
    // ======================================================
    
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
        
        // Berechnet die X-Position basierend auf der neuen Breite
        const iconX = canvas.width - MAGNET_ICON_WIDTH - MAGNET_ICON_PADDING; 
        
        // Berechnet die Y-Position basierend auf der neuen Höhe
        const iconY = MAGNET_DISPLAY_Y - (MAGNET_ICON_HEIGHT / 2); 
        
        // Verwendet die neuen skalierten Breiten- und Höhenvariablen
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