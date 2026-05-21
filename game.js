// Configuración del canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dimensiones
canvas.width = 1200;
canvas.height = 600;

// Variables del juego
let gameRunning = true;
let gamePaused = false; // PAUSA para power-up
let score = 0;
let lives = 3;
let forceFieldUses = 3;
let currentLevel = 1;
let currentWordIndex = 0;
let currentWord = "";
let userProgress = "";
let wordStartTime = 0;
let wordPenalties = 0;
let wordsForLevel = [];
let currentBoss = null;
let isBossFight = false;
let bossHealth = 0;
let bossMaxHealth = 0;
let bossAttackCooldown = 0;
let ataquesActivos = [];
let palabrasActivas = [];
let palabraSeleccionada = null;
let nave = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    img: null
};
let animacionId = null;
let powerupActive = false;
let powerupWord = "";
let powerupTimeLeft = 0;
let powerupInterval = null;
let levelComplete = false;
let ultimaTecla = "";
let tiempoTecla = 0;
let esperandoPrimeraLetra = true;

// Control de spawneo
let spawnInterval = null;
let tiempoEntrePalabras = 4000;

// Elementos DOM
const livesElement = document.getElementById('lives');
const scoreElement = document.getElementById('score');
const forceFieldElement = document.getElementById('forceField');
const levelElement = document.getElementById('level');
const targetWordElement = document.getElementById('targetWord');
const wordProgressElement = document.getElementById('wordProgress');
const wordLengthElement = document.getElementById('wordLength');
const typingIndicator = document.getElementById('typingIndicator');
const powerupIndicator = document.getElementById('powerupIndicator');
const tongueTwisterElement = document.getElementById('tongueTwister');
const powerupTimerElement = document.getElementById('powerupTimer');
const gameOverDiv = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

// ============ CARGA DE IMAGEN ============
function cargarImagenNave() {
    nave.img = new Image();
    nave.img.src = 'img/nave.png';
    nave.img.onerror = function() {
        console.error('No se pudo cargar la imagen de la nave');
        nave.img = null;
    };
}

// ============ INICIALIZAR NIVEL ============
function initLevel() {
    const levelData = getWordsForLevel(currentLevel);
    wordsForLevel = [...levelData.words];
    currentBoss = levelData.boss;
    currentWordIndex = 0;
    isBossFight = false;
    levelComplete = false;
    palabraSeleccionada = null;
    currentWord = "";
    userProgress = "";
    esperandoPrimeraLetra = true;
    ataquesActivos = [];
    
    palabrasActivas = [];
    
    if (spawnInterval) clearInterval(spawnInterval);
    
    // Velocidad de spawneo (nivel 1: 4 segundos)
    tiempoEntrePalabras = Math.max(1000, 4000 - (currentLevel - 1) * 300);
    
    updateUI();
    
    typingIndicator.innerHTML = `🎮 NIVEL ${currentLevel} - ${levelData.language} 🎮`;
    setTimeout(() => {
        typingIndicator.innerHTML = "✏️ ESCRIBE LA PRIMERA LETRA DE CUALQUIER PALABRA ✏️";
    }, 2000);
    
    iniciarSpawneo();
    
    setTimeout(() => {
        if (gameRunning && !isBossFight && currentWordIndex < wordsForLevel.length) {
            generarPalabra();
        }
    }, 500);
}

// ============ SPAWNEO DE PALABRAS ============
function iniciarSpawneo() {
    spawnInterval = setInterval(() => {
        if (!gameRunning) return;
        if (isBossFight) return;
        if (levelComplete) return;
        if (gamePaused) return; // No spawnear durante pausa
        if (palabrasActivas.length >= 6) return;
        if (currentWordIndex < wordsForLevel.length) {
            generarPalabra();
        } else if (currentWordIndex >= wordsForLevel.length && palabrasActivas.length === 0 && !isBossFight) {
            iniciarJefe();
        }
    }, tiempoEntrePalabras);
}

function generarPalabra() {
    if (currentWordIndex >= wordsForLevel.length) return;
    if (isBossFight) return;
    if (gamePaused) return;
    
    const word = wordsForLevel[currentWordIndex];
    currentWordIndex++;
    crearPalabra(word);
}

function crearPalabra(texto) {
    const lado = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(lado) {
        case 0: x = Math.random() * canvas.width; y = -50; break;
        case 1: x = canvas.width + 50; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + 50; break;
        case 3: x = -50; y = Math.random() * canvas.height; break;
    }
    
    const velocidadBase = 0.4 + (currentLevel - 1) * 0.23;
    
    palabrasActivas.push({
        id: Date.now() + Math.random(),
        texto: texto,
        x: x,
        y: y,
        velocidad: velocidadBase,
        angulo: Math.random() * Math.PI * 2,
        radioCurvatura: 50 + Math.random() * 150,
        targetX: nave.x,
        targetY: nave.y,
        seleccionada: false
    });
}

// ============ ACTUALIZAR POSICIONES ============
function actualizarPalabras() {
    if (gamePaused) return; // NO mover palabras durante pausa
    
    for (let i = 0; i < palabrasActivas.length; i++) {
        const p = palabrasActivas[i];
        p.targetX = nave.x;
        p.targetY = nave.y;
        
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        if (distancia > 10) {
            p.angulo += 0.03;
            const curvaX = Math.sin(p.angulo) * p.radioCurvatura * 0.01;
            const curvaY = Math.cos(p.angulo) * p.radioCurvatura * 0.01;
            const dirX = (dx / distancia) * p.velocidad + curvaX;
            const dirY = (dy / distancia) * p.velocidad + curvaY;
            p.x += dirX;
            p.y += dirY;
        } else {
            perderVida(p.texto);
            palabrasActivas.splice(i, 1);
            i--;
            if (palabraSeleccionada && palabraSeleccionada.texto === p.texto) {
                palabraSeleccionada = null;
                currentWord = "";
                userProgress = "";
                esperandoPrimeraLetra = true;
                updateWordDisplay();
            }
            continue;
        }
        
        if (p.x < -200 || p.x > canvas.width + 200 || p.y < -200 || p.y > canvas.height + 200) {
            perderVida(p.texto);
            palabrasActivas.splice(i, 1);
            i--;
            if (palabraSeleccionada && palabraSeleccionada.texto === p.texto) {
                palabraSeleccionada = null;
                currentWord = "";
                userProgress = "";
                esperandoPrimeraLetra = true;
                updateWordDisplay();
            }
        }
    }
}

// ============ ATAQUES DEL JEFE ============
function actualizarAtaquesJefe() {
    if (gamePaused) return;
    if (!isBossFight) return;
    
    if (bossAttackCooldown > 0) {
        bossAttackCooldown--;
    }
    
    if (bossAttackCooldown <= 0 && gameRunning && isBossFight) {
        bossAttackCooldown = 60;
        generarAtaqueNumerico();
    }
    
    for (let i = 0; i < ataquesActivos.length; i++) {
        const ataque = ataquesActivos[i];
        ataque.y += ataque.velocidad;
        
        const distancia = Math.hypot(ataque.x - nave.x, ataque.y - nave.y);
        if (distancia < 35) {
            perderVida("Ataque del jefe");
            ataquesActivos.splice(i, 1);
            i--;
        }
        
        if (ataque.y > canvas.height + 100) {
            ataquesActivos.splice(i, 1);
            i--;
        }
    }
}

function generarAtaqueNumerico() {
    const numero = Math.floor(Math.random() * 100);
    const textoNumero = numero.toString();
    
    ataquesActivos.push({
        id: Date.now() + Math.random(),
        texto: textoNumero,
        numero: numero,
        x: Math.random() * (canvas.width - 100) + 50,
        y: -30,
        velocidad: 2 + Math.random() * 2,
        escrito: ""
    });
}

function atacarNumero(letra) {
    let ataqueActivo = null;
    for (let ataque of ataquesActivos) {
        if (ataque.escrito !== undefined) {
            ataqueActivo = ataque;
            break;
        }
    }
    
    if (!ataqueActivo) return false;
    
    const letraEsperada = ataqueActivo.texto[ataqueActivo.escrito.length];
    if (letra.toLowerCase() === letraEsperada) {
        ataqueActivo.escrito += letra;
        
        if (ataqueActivo.escrito.length === ataqueActivo.texto.length) {
            const index = ataquesActivos.indexOf(ataqueActivo);
            if (index !== -1) ataquesActivos.splice(index, 1);
            
            bossHealth--;
            updateUI();
            
            const damageBonus = 500;
            score += damageBonus;
            updateUI();
            
            typingIndicator.innerHTML = `💥 ¡NÚMERO DESTRUIDO! Daño al jefe +${damageBonus} pts 💥`;
            
            if (bossHealth <= 0) {
                completarNivel();
            }
            return true;
        }
        return true;
    }
    return false;
}

// ============ VIDA Y DAÑO ============
function perderVida(causa) {
    if (!gameRunning) return;
    if (gamePaused) return;
    
    lives--;
    updateUI();
    
    canvas.style.animation = 'shake 0.3s ease-in-out';
    setTimeout(() => canvas.style.animation = '', 300);
    
    if (lives <= 0) {
        gameOver();
    } else {
        typingIndicator.innerHTML = `💥 ¡${causa} TE GOLPEÓ! -1 vida 💥`;
        setTimeout(() => {
            if (typingIndicator.innerHTML.includes("GOLPEÓ")) {
                typingIndicator.innerHTML = esperandoPrimeraLetra ? 
                    "✏️ ESCRIBE LA PRIMERA LETRA DE UNA PALABRA ✏️" : 
                    `✏️ ESCRIBE: ${currentWord} ✏️`;
            }
        }, 1500);
    }
}

// ============ CAMPO DE FUERZA ============
function activarCampoFuerza() {
    if (!gameRunning) return;
    if (gamePaused) {
        typingIndicator.innerHTML = "⚡ ¡TERMINA EL TRABALENGUA PRIMERO! ⚡";
        return;
    }
    if (forceFieldUses <= 0) {
        typingIndicator.innerHTML = "⚠️ NO HAY CAMPOS DE FUERZA ⚠️";
        setTimeout(() => {
            if (typingIndicator.innerHTML.includes("CAMPOS DE FUERZA")) {
                typingIndicator.innerHTML = esperandoPrimeraLetra ?
                    "✏️ ESCRIBE LA PRIMERA LETRA ✏️" :
                    `✏️ ESCRIBE: ${currentWord} ✏️`;
            }
        }, 1500);
        return;
    }
    
    forceFieldUses--;
    updateUI();
    
    const destroyed = palabrasActivas.length;
    palabrasActivas = [];
    palabraSeleccionada = null;
    currentWord = "";
    userProgress = "";
    esperandoPrimeraLetra = true;
    
    typingIndicator.innerHTML = `✨ CAMPO DE FUERZA: ${destroyed} palabras destruidas ✨`;
    
    canvas.style.filter = 'brightness(2)';
    setTimeout(() => canvas.style.filter = '', 200);
    
    updateWordDisplay();
}

// ============ SELECCIÓN DE PALABRA ============
function seleccionarYDisparar(letra) {
    if (powerupActive) return false;
    if (gamePaused) return false;
    
    const letraMinuscula = letra.toLowerCase();
    
    if (palabraSeleccionada && !esperandoPrimeraLetra) {
        return false;
    }
    
    const palabraEncontrada = palabrasActivas.find(p => 
        p.texto.toLowerCase().startsWith(letraMinuscula)
    );
    
    if (palabraEncontrada) {
        palabraSeleccionada = palabraEncontrada;
        currentWord = palabraEncontrada.texto;
        esperandoPrimeraLetra = false;
        
        userProgress = letraMinuscula;
        wordPenalties = 0;
        wordStartTime = Date.now();
        updateWordDisplay();
        
        dibujarDisparo(letra);
        
        typingIndicator.innerHTML = `🎯 " ${currentWord} " SELECCIONADA! Sigue escribiendo... 🎯`;
        
        if (currentWord.length === 1) {
            completarPalabra();
        }
        
        return true;
    }
    
    return false;
}

// ============ DISPARAR LETRA ============
function dispararLetra(letra) {
    if (!gameRunning) return;
    
    if (powerupActive) {
        manejarPowerup(letra);
        return;
    }
    
    if (gamePaused) return;
    
    if (isBossFight && ataquesActivos.length > 0) {
        const ataqueDestruido = atacarNumero(letra);
        if (ataqueDestruido) return;
    }
    
    ultimaTecla = letra;
    tiempoTecla = Date.now();
    
    if (esperandoPrimeraLetra) {
        const seleccionada = seleccionarYDisparar(letra);
        if (!seleccionada) {
            typingIndicator.innerHTML = `❌ No hay palabra que empiece con "${letra.toUpperCase()}" ❌`;
            setTimeout(() => {
                if (typingIndicator.innerHTML.includes("No hay palabra")) {
                    typingIndicator.innerHTML = "✏️ ESCRIBE LA PRIMERA LETRA DE UNA PALABRA VISIBLE ✏️";
                }
            }, 1500);
        }
        return;
    }
    
    if (!palabraSeleccionada || !currentWord) {
        esperandoPrimeraLetra = true;
        return;
    }
    
    const letraEsperada = currentWord[userProgress.length];
    if (!letraEsperada) return;
    
    const letraNormalizada = letra.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const letraEsperadaNormalizada = letraEsperada.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (letraNormalizada.toLowerCase() === letraEsperadaNormalizada.toLowerCase()) {
        userProgress += letraEsperada;
        updateWordDisplay();
        dibujarDisparo(letra);
        
        if (userProgress.length === currentWord.length) {
            completarPalabra();
        } else {
            typingIndicator.innerHTML = `🔫 ${userProgress.length}/${currentWord.length} letras`;
        }
    } else {
        wordPenalties += 200;
        typingIndicator.innerHTML = `❌ ERROR: "${letraEsperada.toUpperCase()}" -200 pts ❌`;
        canvas.style.animation = 'shake 0.1s ease-in-out';
        setTimeout(() => canvas.style.animation = '', 100);
        setTimeout(() => {
            if (typingIndicator.innerHTML.includes("ERROR")) {
                typingIndicator.innerHTML = `✏️ ESCRIBE: ${currentWord} ✏️`;
            }
        }, 800);
    }
}

// ============ POWER-UP TRABALENGUA ============
function activarPowerupVida() {
    if (powerupActive || isBossFight) return;
    if (!gameRunning) return;
    
    // PAUSAR EL JUEGO
    gamePaused = true;
    powerupActive = true;
    powerupWord = getRandomTongueTwister();
    powerupTimeLeft = 5000;
    
    tongueTwisterElement.textContent = powerupWord;
    powerupIndicator.style.display = "block";
    
    userProgress = "";
    currentWord = powerupWord;
    esperandoPrimeraLetra = false;
    palabraSeleccionada = null;
    
    updateWordDisplay();
    
    typingIndicator.innerHTML = `⚡ ¡TRABALENGUA! ESCRIBE: "${powerupWord}" ⚡`;
    typingIndicator.style.color = "#ff00ff";
    
    canvas.style.filter = 'brightness(0.8) blur(2px)';
    
    const startTime = Date.now();
    powerupInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, powerupTimeLeft - elapsed);
        const secondsLeft = (remaining / 1000).toFixed(1);
        powerupTimerElement.textContent = `${secondsLeft}s`;
        
        if (remaining < 1500) {
            powerupTimerElement.style.color = "#ff0000";
        } else {
            powerupTimerElement.style.color = "#ffff00";
        }
        
        if (remaining <= 0) {
            clearInterval(powerupInterval);
            powerupIndicator.style.display = "none";
            powerupActive = false;
            gamePaused = false;
            
            canvas.style.filter = '';
            
            palabraSeleccionada = null;
            currentWord = "";
            userProgress = "";
            esperandoPrimeraLetra = true;
            updateWordDisplay();
            
            typingIndicator.innerHTML = "⏰ ¡TRABALENGUA FALLADO! Sin vida extra ⏰";
            typingIndicator.style.color = "#ff6666";
            
            setTimeout(() => {
                if (typingIndicator.innerHTML.includes("FALLADO")) {
                    typingIndicator.innerHTML = "✏️ ESCRIBE LA PRIMERA LETRA DE UNA PALABRA ✏️";
                    typingIndicator.style.color = "#00ff00";
                }
            }, 2000);
        }
    }, 100);
}

function manejarPowerup(letra) {
    if (!powerupActive || !powerupWord) return false;
    
    const letraEsperada = powerupWord[userProgress.length];
    if (!letraEsperada) return false;
    
    const letraNormalizada = letra.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const letraEsperadaNormalizada = letraEsperada.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (letraNormalizada.toLowerCase() === letraEsperadaNormalizada.toLowerCase()) {
        userProgress += letraEsperada;
        updateWordDisplay();
        
        typingIndicator.innerHTML = `⚡ ${userProgress.length}/${powerupWord.length} letras ⚡`;
        
        if (userProgress.length === powerupWord.length) {
            completarPowerup();
            return true;
        }
        return true;
    } else {
        typingIndicator.innerHTML = `❌ Error! Esperaba "${letraEsperada}" ❌`;
        canvas.style.animation = 'shake 0.1s ease-in-out';
        setTimeout(() => {
            canvas.style.animation = '';
            if (powerupActive) {
                typingIndicator.innerHTML = `⚡ ESCRIBE: "${powerupWord}" ⚡`;
            }
        }, 800);
        return false;
    }
}

function completarPowerup() {
    if (!powerupActive) return;
    
    clearInterval(powerupInterval);
    powerupIndicator.style.display = "none";
    powerupActive = false;
    gamePaused = false;
    
    canvas.style.filter = '';
    
    lives++;
    updateUI();
    
    typingIndicator.innerHTML = "❤️ ¡TRABALENGUA COMPLETADO! +1 VIDA EXTRA ❤️";
    typingIndicator.style.color = "#ff00ff";
    
    canvas.style.animation = 'pulse 0.5s ease-in-out';
    setTimeout(() => {
        canvas.style.animation = '';
    }, 500);
    
    palabraSeleccionada = null;
    currentWord = "";
    userProgress = "";
    esperandoPrimeraLetra = true;
    updateWordDisplay();
    
    setTimeout(() => {
        if (typingIndicator.innerHTML.includes("TRABALENGUA COMPLETADO")) {
            typingIndicator.innerHTML = "✏️ ESCRIBE LA PRIMERA LETRA DE UNA PALABRA ✏️";
            typingIndicator.style.color = "#00ff00";
        }
    }, 2500);
}

// ============ COMPLETAR PALABRA Y NIVEL ============
function completarPalabra() {
    const tiempoMs = Date.now() - wordStartTime;
    const puntosBase = currentWord.length * 15;
    let bonus = 0;
    
    if (tiempoMs < 3000) {
        bonus = 3000 - tiempoMs;
    }
    
    const puntosTotales = puntosBase + bonus - wordPenalties;
    score += Math.max(0, puntosTotales);
    
    typingIndicator.innerHTML = `🎯 +${Math.floor(puntosTotales)} pts: "${currentWord}" destruida 🎯`;
    
    const index = palabrasActivas.findIndex(p => p.texto === currentWord);
    if (index !== -1) palabrasActivas.splice(index, 1);
    
    palabraSeleccionada = null;
    currentWord = "";
    userProgress = "";
    esperandoPrimeraLetra = true;
    
    updateUI();
    updateWordDisplay();
    
    if (isBossFight) {
        completarNivel();
        return;
    }
    
    if (currentWordIndex >= wordsForLevel.length && palabrasActivas.length === 0) {
        completarNivel();
    }
    
    if (!powerupActive && gameRunning && Math.random() < 0.05 && !isBossFight && !gamePaused) {
        setTimeout(() => activarPowerupVida(), 500);
    }
}

function iniciarJefe() {
    if (isBossFight) return;
    
    if (spawnInterval) clearInterval(spawnInterval);
    
    isBossFight = true;
    bossMaxHealth = 10 + currentLevel;
    bossHealth = bossMaxHealth;
    bossAttackCooldown = 0;
    ataquesActivos = [];
    palabraSeleccionada = null;
    currentWord = "";
    userProgress = "";
    esperandoPrimeraLetra = true;
    
    typingIndicator.innerHTML = `👾 JEFE: ${currentBoss} 👾`;
    
    setTimeout(() => {
        typingIndicator.innerHTML = `⚔️ HP: ${bossHealth}/${bossMaxHealth} - ESCRIBE NÚMEROS PARA DAÑARLO ⚔️`;
    }, 2000);
}

function completarNivel() {
    if (levelComplete) return;
    levelComplete = true;
    
    if (spawnInterval) clearInterval(spawnInterval);
    
    if (currentLevel >= 10) {
        typingIndicator.innerHTML = "🎉 ¡VICTORIA! COMPLETASTE EL JUEGO 🎉";
        gameWin();
        return;
    }
    
    currentLevel++;
    const levelBonus = 1000;
    score += levelBonus;
    updateUI();
    
    typingIndicator.innerHTML = `✅ NIVEL ${currentLevel - 1} COMPLETADO +${levelBonus} pts ✅`;
    
    setTimeout(() => initLevel(), 3000);
}

// ============ UI Y DISPLAY ============
function updateWordDisplay() {
    if (powerupActive && powerupWord) {
        let display = "";
        for (let i = 0; i < userProgress.length; i++) {
            const char = userProgress[i];
            if (char === ' ') {
                display += `<span style="color: #00ff00">␣</span>`;
            } else {
                display += `<span style="color: #00ff00">${char}</span>`;
            }
        }
        for (let i = userProgress.length; i < powerupWord.length; i++) {
            const char = powerupWord[i];
            if (char === ' ') {
                display += `<span style="color: #ff6600">␣</span>`;
            } else {
                display += `<span style="color: #ff00ff">${char}</span>`;
            }
        }
        targetWordElement.innerHTML = display;
        wordLengthElement.textContent = powerupWord.length;
        wordProgressElement.textContent = userProgress.length;
    } else if (currentWord) {
        let display = "";
        for (let i = 0; i < userProgress.length; i++) {
            const char = userProgress[i];
            if (char === ' ') {
                display += `<span style="color: #00ff00">␣</span>`;
            } else {
                display += `<span style="color: #00ff00">${char}</span>`;
            }
        }
        for (let i = userProgress.length; i < currentWord.length; i++) {
            const char = currentWord[i];
            if (char === ' ') {
                display += `<span style="color: #ff8800">␣</span>`;
            } else {
                display += `<span style="color: #ffffff">${char}</span>`;
            }
        }
        targetWordElement.innerHTML = display;
        wordLengthElement.textContent = currentWord.length;
        wordProgressElement.textContent = userProgress.length;
    } else {
        targetWordElement.innerHTML = "⚡";
        wordLengthElement.textContent = "0";
        wordProgressElement.textContent = "0";
    }
}

function updateUI() {
    livesElement.textContent = lives;
    scoreElement.textContent = Math.floor(score);
    forceFieldElement.textContent = forceFieldUses;
    levelElement.textContent = currentLevel;
}

function dibujarDisparo(letra) {
    let objetivo = null;
    
    if (palabraSeleccionada) {
        objetivo = palabraSeleccionada;
    } else if (isBossFight && ataquesActivos.length > 0) {
        objetivo = ataquesActivos[0];
    }
    
    if (objetivo) {
        ctx.beginPath();
        ctx.moveTo(nave.x, nave.y);
        ctx.lineTo(objetivo.x, objetivo.y);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ff00';
        
        ctx.font = "bold 28px monospace";
        ctx.fillStyle = "#ffff00";
        ctx.fillText(letra.toUpperCase(), objetivo.x, objetivo.y - 25);
        ctx.shadowBlur = 0;
    }
}

// ============ DIBUJADO ============
function dibujarNave() {
    if (nave.img && nave.img.complete && nave.img.naturalWidth > 0) {
        ctx.drawImage(nave.img, nave.x - 25, nave.y - 25, 50, 50);
    } else {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00ffff";
        ctx.beginPath();
        ctx.moveTo(nave.x, nave.y - 20);
        ctx.lineTo(nave.x + 15, nave.y + 10);
        ctx.lineTo(nave.x + 5, nave.y + 10);
        ctx.lineTo(nave.x + 5, nave.y + 20);
        ctx.lineTo(nave.x - 5, nave.y + 20);
        ctx.lineTo(nave.x - 5, nave.y + 10);
        ctx.lineTo(nave.x - 15, nave.y + 10);
        ctx.closePath();
        ctx.fillStyle = "#00ffff";
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(nave.x - 3, nave.y - 10);
        ctx.lineTo(nave.x, nave.y - 25);
        ctx.lineTo(nave.x + 3, nave.y - 10);
        ctx.fillStyle = "#ff00ff";
        ctx.fill();
        ctx.restore();
    }
}

function dibujarPalabras() {
    for (const p of palabrasActivas) {
        ctx.save();
        if (palabraSeleccionada && palabraSeleccionada.id === p.id) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#00ff00";
        } else {
            ctx.shadowBlur = 5;
            ctx.shadowColor = "#ff00ff";
        }
        
        let fontSize = 20 + Math.floor(currentLevel / 2);
        ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        const metrics = ctx.measureText(p.texto);
        const ancho = metrics.width;
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(p.x - ancho / 2 - 5, p.y - 20, ancho + 10, 28);
        
        if (palabraSeleccionada && palabraSeleccionada.id === p.id) {
            ctx.fillStyle = "#00ff00";
        } else {
            ctx.fillStyle = "#ffff00";
        }
        
        ctx.fillText(p.texto, p.x - ancho / 2, p.y);
        ctx.restore();
    }
}

function dibujarAtaques() {
    for (const ataque of ataquesActivos) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff0000";
        ctx.font = "bold 24px monospace";
        ctx.fillStyle = "#ff0000";
        ctx.fillText(ataque.texto, ataque.x, ataque.y);
        
        if (ataque.escrito && ataque.escrito.length > 0) {
            ctx.font = "16px monospace";
            ctx.fillStyle = "#00ff00";
            ctx.fillText(ataque.escrito, ataque.x - 15, ataque.y - 15);
        }
        ctx.restore();
    }
}

function dibujarJefe() {
    if (!isBossFight) return;
    
    const barraX = canvas.width / 2 - 200;
    const barraY = 30;
    const barraAncho = 400;
    const barraAlto = 20;
    
    ctx.fillStyle = "#330000";
    ctx.fillRect(barraX, barraY, barraAncho, barraAlto);
    
    const vidaPorcentaje = bossHealth / bossMaxHealth;
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(barraX, barraY, barraAncho * vidaPorcentaje, barraAlto);
    
    ctx.strokeStyle = "#ffff00";
    ctx.strokeRect(barraX, barraY, barraAncho, barraAlto);
    
    ctx.font = "14px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${currentBoss} - HP: ${bossHealth}/${bossMaxHealth}`, barraX, barraY - 5);
}

function dibujar() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
        ctx.fillRect((i * 131) % canvas.width, (i * 253) % canvas.height, 1, 1);
    }
    
    dibujarPalabras();
    dibujarAtaques();
    dibujarNave();
    dibujarJefe();
    
    if (ultimaTecla && Date.now() - tiempoTecla < 150 && !powerupActive) {
        ctx.font = "bold 32px monospace";
        ctx.fillStyle = "#00ff00";
        ctx.shadowBlur = 10;
        ctx.fillText(ultimaTecla.toUpperCase(), nave.x + 30, nave.y - 30);
        ctx.shadowBlur = 0;
    }
}

// ============ GAME LOOP ============
function gameLoop() {
    if (!gameRunning) return;
    
    if (!gamePaused) {
        actualizarPalabras();
        actualizarAtaquesJefe();
    }
    
    dibujar();
    animacionId = requestAnimationFrame(gameLoop);
}

// ============ MANEJO DE TECLADO ============
function handleKeyDown(e) {
    if (!gameRunning) return;
    
    if (e.key === 'Enter') {
        e.preventDefault();
        if (!gamePaused && !powerupActive) {
            activarCampoFuerza();
        } else if (powerupActive) {
            typingIndicator.innerHTML = "⚡ ¡TERMINA EL TRABALENGUA PRIMERO! ⚡";
            setTimeout(() => {
                if (typingIndicator.innerHTML.includes("TRABALENGUA PRIMERO") && powerupActive) {
                    typingIndicator.innerHTML = `⚡ ESCRIBE: "${powerupWord}" ⚡`;
                }
            }, 1000);
        }
        return;
    }
    
    if (e.key === 'Backspace') {
        e.preventDefault();
        if (powerupActive) {
            if (userProgress.length > 0) {
                userProgress = userProgress.slice(0, -1);
                updateWordDisplay();
                typingIndicator.innerHTML = `⌫ Corrigiendo... ${userProgress.length}/${powerupWord.length}`;
            }
        } else if (!gamePaused && !esperandoPrimeraLetra && userProgress.length > 0) {
            userProgress = userProgress.slice(0, -1);
            updateWordDisplay();
        }
        return;
    }
    
    if (e.key === ' ') {
        e.preventDefault();
        
        if (powerupActive) {
            const siguienteChar = powerupWord[userProgress.length];
            if (siguienteChar === ' ') {
                userProgress += ' ';
                updateWordDisplay();
                typingIndicator.innerHTML = `⚡ ${userProgress.length}/${powerupWord.length} letras ⚡`;
                if (userProgress.length === powerupWord.length) {
                    completarPowerup();
                }
            } else {
                typingIndicator.innerHTML = `❌ Error! Se esperaba "${siguienteChar}" no un espacio ❌`;
                setTimeout(() => {
                    if (powerupActive && typingIndicator.innerHTML.includes("Error")) {
                        typingIndicator.innerHTML = `⚡ ESCRIBE: "${powerupWord}" ⚡`;
                    }
                }, 800);
            }
            return;
        }
        
        if (!gamePaused && !esperandoPrimeraLetra && currentWord) {
            const siguienteChar = currentWord[userProgress.length];
            if (siguienteChar === ' ') {
                userProgress += ' ';
                updateWordDisplay();
                dibujarDisparo('␣');
                if (userProgress.length === currentWord.length) {
                    completarPalabra();
                }
            }
        }
        return;
    }
    
    const esLetra = /^[a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]$/.test(e.key);
    if (esLetra) {
        e.preventDefault();
        dispararLetra(e.key);
    }
}

// ============ GAME OVER Y WIN ============
function gameOver() {
    gameRunning = false;
    if (spawnInterval) clearInterval(spawnInterval);
    if (powerupInterval) clearInterval(powerupInterval);
    finalScoreElement.textContent = Math.floor(score);
    gameOverDiv.style.display = "block";
    if (animacionId) cancelAnimationFrame(animacionId);
}

function gameWin() {
    gameRunning = false;
    if (spawnInterval) clearInterval(spawnInterval);
    if (powerupInterval) clearInterval(powerupInterval);
    finalScoreElement.textContent = Math.floor(score);
    gameOverDiv.style.display = "block";
    document.querySelector('#gameOver h2').textContent = "🏆 ¡VICTORIA! 🏆";
    if (animacionId) cancelAnimationFrame(animacionId);
}

// ============ INICIALIZAR ============
function init() {
    cargarImagenNave();
    initLevel();
    window.addEventListener('keydown', handleKeyDown);
    window.focus();
    gameLoop();
}

init();