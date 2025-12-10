document.addEventListener('DOMContentLoaded', (event) => {
    // --- KONFIGURATION ---
    const ZIEL_URL = "https://www.google.de"; 
    const WIN_SCORE = 10; 
    const WIN_SOCK_SRC = 'sock_image.png'; 

    // Basis-Dimensionen für Skalierung
    const BASE_WIDTH = 800; 
    const BASE_HEIGHT_RATIO = 585 / 1024; 
    const BASE_HEIGHT = BASE_WIDTH * BASE_HEIGHT_RATIO; 
    // --------------------

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // === VARIABLEN FÜR SKALIERUNG ===
    let SCALING_FACTOR = 1;
    let GAME_WIDTH, GAME_HEIGHT, X_OFFSET_DRAWING, Y_OFFSET_DRAWING;

    // === RESIZE FUNKTION (Wie im Rentier Run) ===
    function resizeGame() {
        // Nutze window.innerWidth/Height für volle Handy-Größe
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Skalierungsfaktor berechnen ('Contain'-Logik)
        const scaleX = canvas.width / BASE_WIDTH;
        const scaleY = canvas.height / BASE_HEIGHT;
        SCALING_FACTOR = Math.min(scaleX, scaleY); 

        // Spielbereich berechnen
        GAME_WIDTH = BASE_WIDTH * SCALING_FACTOR;
        GAME_HEIGHT = BASE_HEIGHT * SCALING_FACTOR; 

        // Zentrierung
        X_OFFSET_DRAWING = (canvas.width - GAME_WIDTH) / 2;
        Y_OFFSET_DRAWING = (canvas.height - GAME_HEIGHT) / 2;
        
        // Hinweis: Wenn sich die Größe während des Spiels ändert (Drehung), 
        // starten wir hier nicht neu, sondern passen nur die Zeichenlogik an.
        // Die physikalischen Positionen (player.x) skalieren wir nicht live um, 
        // das wäre sehr komplex. Am besten Seite neu laden bei Drehung.
    }

    // Initialer Aufruf
    resizeGame();
    
    // Bei Bildschirmdrehung Seite neu laden (einfachste Lösung für korrekte Skalierung)
    window.addEventListener('resize', () => {
        resizeGame();
        // Optional: location.reload(); falls Positionen völlig falsch sind
    });

    // --- OBJEKT-GRÖSSEN FUNKTION ---
    // Wir machen das als Funktion, damit wir Werte abrufen können
    function getScaled(val) { return val * SCALING_FACTOR; }

    // KONSTANTEN WERTE (werden dynamisch berechnet)
    // Wir nutzen Getter, damit sie immer aktuell zum Scaling Factor sind
    const CONFIG = {
        MULTIPLIER_WIDTH: () => getScaled(80),
        MULTIPLIER_HEIGHT: () => getScaled(60),
        LIFEUP_WIDTH: () => getScaled(60),
        LIFEUP_HEIGHT: () => getScaled(60),
        MAGNET_WIDTH: () => getScaled(80),
        MAGNET_HEIGHT: () => getScaled(50),
        FLIGHT_WIDTH: () => getScaled(110),
        FLIGHT_HEIGHT: () => getScaled(80),
        MAGNET_RANGE: () => getScaled(500),
        MAGNET_ICON_W: () => getScaled(100),
        MAGNET_ICON_H: () => getScaled(70),
        OBSTACLE_W: () => getScaled(80),
        OBSTACLE_H: () => getScaled(130),
        Y_OFFSET: () => getScaled(10),
        SOCK_W: () => getScaled(700),
        SOCK_H: () => getScaled(480),
        SPEED: () => getScaled(6)
    };

    // --- ZUSTANDSVARIABLEN ---
    let gameRunning = false;
    let score = 0;
    let gameSpeed = CONFIG.SPEED();
    let scoreMultiplier = 1; 
    let powerUp = null; 
    let activePowerUp = null; 
    let lives = 0; 
    let magnetCharges = 0; 
    let isFlying = false, isSinking = false, isInvulnerable = false;
    let flightStartTime = 0, invulnStartTime = 0;     
    let gameWon = false; 
    let sockSpawned = false; 
    let winObject = null;    
    let obstacles = [];
    let frame = 0;
    let speedIncreasePoint = 100; 
    let nextObstacleFrame = 0;
    const MIN_GAP = 60, MAX_GAP = 120;       

    // Flug Konstanten
    const FLIGHT = {
        DURATION: 5000,
        INVULN: 3000,
        RISE: () => getScaled(2.5),
        SINK: () => getScaled(2.5),
        CENTER_Y: () => GAME_HEIGHT / 2 - getScaled(25),
        CENTER_X: () => GAME_WIDTH / 2 - getScaled(37.5),
        IMG_W: () => getScaled(100),
        IMG_H: () => getScaled(80),
        MULTIPLIER: 2.5,
        EASING: 0.1
    };

    const player = {
        x: 0, // Wird bei Start gesetzt
        y: 0, 
        w_base: 75, h_base: 50,
        jump_base: -18, grav_base: 0.6,
        dy: 0, grounded: false,
        
        // Dynamische Getter für aktuelle Größe
        get width() { return getScaled(this.w_base); },
        get height() { return getScaled(this.h_base); },
        get jumpPower() { return getScaled(this.jump_base); },
        get gravity() { return getScaled(this.grav_base); }
    };

    // Elemente holen
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const introScreen1 = document.getElementById('introScreen1');
    const introScreen2 = document.getElementById('introScreen2');
    const nextIntro1Btn = document.getElementById('nextIntro1');
    const nextIntro2Btn = document.getElementById('nextIntro2');

    // BILDER LADEN
    const playerStandImg = new Image(); playerStandImg.src = 'player_stand.png'; 
    const playerJumpImg = new Image(); playerJumpImg.src = 'player_jump.png';  
    const playerFlightImg = new Image(); playerFlightImg.src = 'player_flight.png'; 
    const obstacleImg = new Image(); obstacleImg.src = 'obstacle.png'; 
    const multiplierImg = new Image(); multiplierImg.src = 'multiplier.png'; 
    const lifeImg = new Image(); lifeImg.src = 'life.png'; 
    const magnetImg = new Image(); magnetImg.src = 'magnet.png'; 
    const flightImg = new Image(); flightImg.src = 'flight_powerup.png'; 
    const winningSockImg = new Image(); winningSockImg.src = WIN_SOCK_SRC; 
    const backgroundImg = new Image(); backgroundImg.src = 'background.jpg'; 
    const pergamentImg = new Image(); pergamentImg.src = 'pergament.jpg'; 
    const eddiImg = new Image(); eddiImg.src = 'eddi_hund.png';
    const arrowRightImg = new Image(); arrowRightImg.src = 'arrow_right.png';

    function activatePowerUp(type) {
        if (type === 'MULTIPLIER') {
            scoreMultiplier = (scoreMultiplier >= 8) ? scoreMultiplier + 2 : scoreMultiplier * 2;
        } else if (type === 'LIFE') {
            if (lives < 1) lives = 1; 
        } else if (type === 'MAGNET') {
            activePowerUp = 'MAGNET';
            magnetCharges = 3; 
        } else if (type === 'FLIGHT') { 
            isFlying = true;
            flightStartTime = performance.now();
            isSinking = false; isInvulnerable = false;
        }
    }

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
        // Initiale Position setzen
        player.y = GAME_HEIGHT - player.height;
        nextObstacleFrame = Math.floor(Math.random() * (MAX_GAP - MIN_GAP)) + MIN_GAP;
        introScreen1.classList.remove('hidden');
        introScreen2.classList.add('hidden');
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
    });

    function handleInput(e) {
        // RENTIER RUN OPTIMIERUNG: Verhindert Standard-Browser-Verhalten
        if (e && e.type === 'touchstart') {
             // e.preventDefault(); // Kann manchmal Scrolling verhindern, hier vorsichtig testen
        }
        
        if (gameRunning && player.grounded) { 
            player.dy = player.jumpPower;
            player.grounded = false;
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') { e.preventDefault(); handleInput(); }
    });

    // Touch-Eingabe
    canvas.addEventListener('mousedown', handleInput);
    // WICHTIG: passive: false erlaubt preventDefault falls nötig
    canvas.addEventListener('touchstart', handleInput, {passive: false}); 

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
            startScreen.classList.remove('hidden'); 
        });
    }
    if (startScreen) {
        startScreen.addEventListener('click', startGame);
        startScreen.addEventListener('touchstart', startGame); // Auch Touch auf Startscreen
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !gameRunning && !startScreen.classList.contains('hidden')) {
                startGame();
            }
        });
    }

    function endGame(isWin) {
        gameRunning = false;
        gameWon = isWin;
        
        const endTitle = document.getElementById('gameOverTitle');
        const endMsg = document.getElementById('gameOverMessage');
        const sockImg = document.getElementById('winSockImage');
        const surprise = document.getElementById('surpriseBtn'); 
        const restart = document.getElementById('restartBtn');    
        
        if (isWin) {
            endTitle.textContent = 'DU HAST ES GESCHAFFT!';
            endMsg.innerHTML = `<span style="font-size: 1.5em; display: block; margin-bottom: 10px;">Eddi ist frei!</span>`;
            sockImg.classList.remove('hidden'); 
            surprise.classList.remove('hidden'); 
            restart.classList.add('hidden'); 
            surprise.onclick = () => { window.location.href = ZIEL_URL; };
        } else {
            endTitle.textContent = 'Game Over';
            endMsg.innerHTML = `Leider nicht geschafft.`; 
            sockImg.classList.add('hidden'); 
            surprise.classList.add('hidden'); 
            restart.classList.remove('hidden'); 
            restart.onclick = startGame;
            // Auch Touch auf Restart Button ermöglichen
            restart.ontouchstart = (e) => { e.preventDefault(); startGame(); };
        }
        gameOverScreen.classList.remove('hidden');
    }

    function startGame() {
        // Falls Größe geändert wurde, sicherstellen dass alles stimmt
        resizeGame();
        
        gameRunning = true;
        score = 0;
        obstacles = [];
        frame = 0;
        scoreMultiplier = 1; 
        lives = 0; 
        gameSpeed = CONFIG.SPEED(); 
        speedIncreasePoint = 100; 
        powerUp = null; 
        activePowerUp = null;
        magnetCharges = 0; 
        isFlying = false; isSinking = false; isInvulnerable = false;
        
        gameWon = false; 
        sockSpawned = false; winObject = null;
        
        nextObstacleFrame = Math.floor(Math.random() * (MAX_GAP - MIN_GAP)) + MIN_GAP; 
        
        player.y = GAME_HEIGHT - player.height;
        player.x = getScaled(50); 
        
        startScreen.classList.add('hidden'); 
        gameOverScreen.classList.add('hidden');
        introScreen1.classList.add('hidden');
        introScreen2.classList.add('hidden');
        animate();
    }

    function animate() {
        if (!gameRunning) return;
        requestAnimationFrame(animate);

        // Hintergrund (Füllen & Zentrieren)
        ctx.fillStyle = '#222'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImg, X_OFFSET_DRAWING, Y_OFFSET_DRAWING, GAME_WIDTH, GAME_HEIGHT); 
        
        if (score >= speedIncreasePoint) {
            gameSpeed += getScaled(0.5);
            speedIncreasePoint += 100; 
        }
        
        const currentSpeed = isFlying ? gameSpeed * FLIGHT.MULTIPLIER : gameSpeed;
        if (score === WIN_SCORE - 1 && score < WIN_SCORE) score = WIN_SCORE;
        
        // --- PHYSIK ---
        if (!isFlying && !isSinking) {
            player.dy += player.gravity;
            player.y += player.dy;
            player.x = getScaled(50); 
        }

        if (player.y + player.height > GAME_HEIGHT) {
            player.y = GAME_HEIGHT - player.height;
            player.dy = 0;
            player.grounded = true;
        }

        // Fluglogik
        if (isFlying) {
            const elapsed = performance.now() - flightStartTime;
            let targetY = FLIGHT.CENTER_Y();
            let targetX = FLIGHT.CENTER_X();
            
            if (player.y > targetY) player.y = Math.max(targetY, player.y - FLIGHT.RISE());
            else player.y = targetY;
            
            if (player.x < targetX) player.x = Math.min(targetX, player.x + FLIGHT.RISE());
            else player.x = targetX;

            if (elapsed >= FLIGHT.DURATION) { isFlying = false; isSinking = true; }
            player.grounded = false; player.dy = 0; 
        } else if (isSinking) {
            player.y += FLIGHT.SINK(); 
            let targetX = getScaled(50);
            if (Math.abs(player.x - targetX) > 1) {
                player.x += (targetX - player.x) * FLIGHT.EASING;
            }
            if (player.y + player.height >= GAME_HEIGHT) { 
                player.y = GAME_HEIGHT - player.height;
                isSinking = false; player.x = targetX;
                isInvulnerable = true; invulnStartTime = performance.now();
            }
        } else if (isInvulnerable) {
            if (performance.now() - invulnStartTime >= FLIGHT.INVULN) isInvulnerable = false; 
        }

        // ZEICHNEN SPIELER
        let imgToDraw = player.grounded ? playerStandImg : playerJumpImg;
        let drawW = player.width, drawH = player.height, drawY = player.y;
        
        if (isFlying || isSinking) { 
            imgToDraw = playerFlightImg;
            drawW = FLIGHT.IMG_W(); drawH = FLIGHT.IMG_H();
            drawY = player.y - getScaled(5);
        } else if (!player.grounded) {
             drawH += CONFIG.Y_OFFSET() * 4.5; // Jump boost visual
             drawY -= CONFIG.Y_OFFSET() * 4.5;
        }

        ctx.drawImage(imgToDraw, player.x + X_OFFSET_DRAWING, drawY + Y_OFFSET_DRAWING, drawW, drawH);
        
        frame++;

        // POWERUPS
        if (score < WIN_SCORE - 1 && powerUp === null && frame % POWERUP_SPAWN_INTERVAL === 0 && Math.random() < POWERUP_CHANCE) {
            let types = ['MULTIPLIER', 'MAGNET', 'LIFE', 'FLIGHT'];
            let type = types[Math.floor(Math.random() * types.length)];
            
            if (type === 'MAGNET' && activePowerUp === 'MAGNET') type = 'MULTIPLIER';
            if (type === 'LIFE' && lives >= 1) type = 'MULTIPLIER';

            let w, h;
            if (type === 'MULTIPLIER') { w = CONFIG.MULTIPLIER_WIDTH(); h = CONFIG.MULTIPLIER_HEIGHT(); }
            else if (type === 'MAGNET') { w = CONFIG.MAGNET_WIDTH(); h = CONFIG.MAGNET_HEIGHT(); }
            else if (type === 'LIFE') { w = CONFIG.LIFEUP_WIDTH(); h = CONFIG.LIFEUP_HEIGHT(); }
            else { w = CONFIG.FLIGHT_WIDTH(); h = CONFIG.FLIGHT_HEIGHT(); }

            powerUp = {
                x: GAME_WIDTH,
                y: GAME_HEIGHT - CONFIG.OBSTACLE_H() - (Math.random() * 20) - h,
                width: w, height: h, type: type
            };
        }

        if (powerUp) {
            if (activePowerUp === 'MAGNET' && magnetCharges > 0) {
                let dx = (powerUp.x + powerUp.width/2) - (player.x + player.width/2);
                let dy = (powerUp.y + powerUp.height/2) - (player.y + player.height/2);
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < CONFIG.MAGNET_RANGE()) {
                    powerUp.x -= (dx/dist) * currentSpeed * 4;
                    powerUp.y -= (dy/dist) * currentSpeed * 4;
                }
            }
            powerUp.x -= currentSpeed;
            
            let pImg;
            if (powerUp.type === 'MULTIPLIER') pImg = multiplierImg;
            else if (powerUp.type === 'MAGNET') pImg = magnetImg;
            else if (powerUp.type === 'LIFE') pImg = lifeImg;
            else pImg = flightImg;

            ctx.drawImage(pImg, powerUp.x + X_OFFSET_DRAWING, powerUp.y + Y_OFFSET_DRAWING, powerUp.width, powerUp.height);

            // Kollision Powerup (vereinfacht)
            if (player.x < powerUp.x + powerUp.width && player.x + player.width > powerUp.x &&
                player.y < powerUp.y + powerUp.height && player.y + player.height > powerUp.y) {
                    if (activePowerUp === 'MAGNET' && powerUp.type !== 'MAGNET') {
                        magnetCharges--; if(magnetCharges<=0) activePowerUp = null;
                    }
                    activatePowerUp(powerUp.type);
                    powerUp = null;
            } else if (powerUp.x + powerUp.width < 0) powerUp = null;
        }

        // HINDERNISSE
        let gapScale = isFlying ? FLIGHT.MULTIPLIER : 1;
        if (score < WIN_SCORE - 1 && frame >= nextObstacleFrame) {
             obstacles.push({
                 x: GAME_WIDTH,
                 y: GAME_HEIGHT - CONFIG.OBSTACLE_H() + CONFIG.Y_OFFSET(),
                 width: CONFIG.OBSTACLE_W(), height: CONFIG.OBSTACLE_H()
             });
             nextObstacleFrame = frame + Math.floor(Math.random() * ((MAX_GAP/gapScale) - (MIN_GAP/gapScale) + 1)) + (MIN_GAP/gapScale);
        }

        for (let i = 0; i < obstacles.length; i++) {
            let obs = obstacles[i];
            obs.x -= currentSpeed;
            ctx.drawImage(obstacleImg, obs.x + X_OFFSET_DRAWING, obs.y + Y_OFFSET_DRAWING, obs.width, obs.height);

            // Hitbox
            let hbW = obs.width * 0.6, hbX = obs.x + obs.width * 0.2;
            let hbH = obs.height * 0.8, hbY = obs.y + obs.height * 0.2;

            if (player.x < hbX + hbW && player.x + player.width > hbX &&
                player.y < hbY + hbH && player.y + player.height > hbY) {
                    if (!isFlying && !isSinking && !isInvulnerable) {
                        if (lives > 0) { lives--; obstacles.splice(i, 1); i--; continue; }
                        else { gameOver(); return; }
                    }
            }
            if (obs.x + obs.width < 0) {
                obstacles.splice(i, 1);
                if (score < WIN_SCORE - 1) score += 1 * scoreMultiplier;
                i--;
            }
        }

        // GEWINN
        if (score >= WIN_SCORE && !sockSpawned && !winObject) {
            sockSpawned = true;
            winObject = { x: GAME_WIDTH, y: GAME_HEIGHT - CONFIG.SOCK_H() - getScaled(30), width: CONFIG.SOCK_W(), height: CONFIG.SOCK_H() };
        }
        if (winObject) {
            winObject.x -= currentSpeed;
            ctx.drawImage(winningSockImg, winObject.x + X_OFFSET_DRAWING, winObject.y + Y_OFFSET_DRAWING, winObject.width, winObject.height);
            if (player.x < winObject.x + winObject.width && player.x + player.width > winObject.x &&
                player.y < winObject.y + winObject.height && player.y + player.height > winObject.y) {
                gameWin(); return;
            }
        }

        // HUD
        ctx.font = `${Math.round(24 * SCALING_FACTOR)}px Arial`; ctx.fillStyle = (scoreMultiplier>1)?'#F33':'#3F3';
        ctx.fillText(`Score: ${score}${scoreMultiplier>1?' (x'+scoreMultiplier+')':''}`, 10*SCALING_FACTOR+X_OFFSET_DRAWING, 30*SCALING_FACTOR+Y_OFFSET_DRAWING);
        
        if (lives > 0) ctx.drawImage(lifeImg, 10*SCALING_FACTOR+X_OFFSET_DRAWING, 50*SCALING_FACTOR+Y_OFFSET_DRAWING, getScaled(60), getScaled(60));
        
        if (activePowerUp === 'MAGNET') {
            let iconX = GAME_WIDTH - CONFIG.MAGNET_ICON_W() - getScaled(20);
            ctx.drawImage(magnetImg, iconX+X_OFFSET_DRAWING, getScaled(15)+Y_OFFSET_DRAWING, CONFIG.MAGNET_ICON_W(), CONFIG.MAGNET_ICON_H());
            ctx.fillStyle = '#FFD700'; ctx.font = `${Math.round(40 * SCALING_FACTOR)}px Arial`;
            ctx.fillText(magnetCharges, iconX+CONFIG.MAGNET_ICON_W()+getScaled(-10)+X_OFFSET_DRAWING, getScaled(60)+Y_OFFSET_DRAWING);
        }
    }
});
