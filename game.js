// Configuración del canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dimensiones
canvas.width = 1200;
canvas.height = 600;

// Variables del juego
let gameRunning = true;
let gamePaused = false;
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
let bossAngle = 0;
let bossX = canvas.width / 2;
let bossY = 100;
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

// Sistema de estrellas
let estrellas = [];
let explosiones = [];

// Efecto de rayo
let rayoActivo = false;
let rayoTimer = 0;

// Inicializar estrellas
function initEstrellas() {
    for (let i = 0; i < 200; i++) {
        estrellas.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 3 + 1,
            alpha: Math.random() * 0.5 + 0.3,
            parpadeo: Math.random() * Math.PI * 2
        });
    }
}

function actualizarEstrellas() {
    for (let i = 0; i < estrellas.length; i++) {
        const estrella = estrellas[i];
        estrella.y += estrella.speed;
        estrella.parpadeo += 0.05;
        
        if (estrella.y > canvas.height) {
            estrella.y = 0;
            estrella.x = Math.random() * canvas.width;
        }
        
        estrella.alpha = 0.3 + Math.sin(estrella.parpadeo) * 0.3;
    }
}

function dibujarEstrellas() {
    for (const estrella of estrellas) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${estrella.alpha})`;
        ctx.arc(estrella.x, estrella.y, estrella.size, 0, Math.PI * 2);
        ctx.fill();
        
        if (estrella.alpha > 0.5) {
            ctx.shadowBlur = 5;
            ctx.shadowColor = "#ffffff";
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// Sistema de explosiones
function crearExplosion(x, y, tipo = "normal") {
    let particulas = [];
    const numParticulas = tipo === "grande" ? 30 : 15;
    
    for (let i = 0; i < numParticulas; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const velocidad = Math.random() * 5 + 2;
        particulas.push({
            x: x,
            y: y,
            vx: Math.cos(angulo) * velocidad,
            vy: Math.sin(angulo) * velocidad,
            vida: 1,
            size: Math.random() * 4 + 2,
            color: `hsl(${Math.random() * 60 + 20}, 100%, 50%)`
        });
    }
    
    explosiones.push({
        x: x,
        y: y,
        particulas: particulas,
        vida: 1,
        tipo: tipo
    });
}

function actualizarExplosiones() {
    for (let i = 0; i < explosiones.length; i++) {
        const exp = explosiones[i];
        exp.vida -= 0.05;
        
        for (let p of exp.particulas) {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98;
            p.vy *= 0.98;
        }
        
        if (exp.vida <= 0) {
            explosiones.splice(i, 1);
            i--;
        }
    }
}

function dibujarExplosiones() {
    for (const exp of explosiones) {
        for (const p of exp.particulas) {
            ctx.globalAlpha = p.vida * exp.vida;
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.arc(p.x, p.y, p.size * exp.vida, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#ff6600";
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
    ctx.globalAlpha = 1;
}

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

function iniciarSpawneo() {
    spawnInterval = setInterval(() => {
        if (!gameRunning) return;
        if (isBossFight) return;
        if (levelComplete) return;
        if (gamePaused) return;
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

function crearPalabra(texto, x = null, y = null) {
    let startX, startY;
    
    if (x !== null && y !== null) {
        startX = x;
        startY = y;
    } else {
        const lado = Math.floor(Math.random() * 4);
        switch(lado) {
            case 0: startX = Math.random() * canvas.width; startY = -50; break;
            case 1: startX = canvas.width + 50; startY = Math.random() * canvas.height; break;
            case 2: startX = Math.random() * canvas.width; startY = canvas.height + 50; break;
            case 3: startX = -50; startY = Math.random() * canvas.height; break;
        }
    }
    
    const velocidadBase = 0.4 + (currentLevel - 1) * 0.23;
    
    palabrasActivas.push({
        id: Date.now() + Math.random(),
        texto: texto,
        x: startX,
        y: startY,
        velocidad: velocidadBase,
        angulo: Math.random() * Math.PI * 2,
        radioCurvatura: 50 + Math.random() * 150,
        targetX: nave.x,
        targetY: nave.y,
        seleccionada: false
    });
}

// ============ POWER-UP VIDA EXTRA ============
function activarPowerupVida() {
    if (powerupActive || isBossFight) return;
    if (!gameRunning) return;
    
    gamePaused = true;
    powerupActive = true;
    powerupWord = getRandomHardWord();
    powerupTimeLeft = 8000;
    
    tongueTwisterElement.textContent = powerupWord;
    powerupIndicator.style.display = "block";
    const instruction = powerupIndicator.querySelector('.powerup-instruction');
    if (instruction) instruction.textContent = "¡PALABRA DIFÍCIL! +1 VIDA";
    
    userProgress = "";
    currentWord = powerupWord;
    esperandoPrimeraLetra = false;
    palabraSeleccionada = null;
    
    updateWordDisplay();
    
    typingIndicator.innerHTML = `💖 ¡VIDA EXTRA! ESCRIBE: "${powerupWord}" 💖`;
    typingIndicator.style.color = "#ff69b4";
    
    canvas.style.filter = 'brightness(0.8) blur(2px)';
    
    const startTime = Date.now();
    powerupInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, powerupTimeLeft - elapsed);
        const secondsLeft = (remaining / 1000).toFixed(1);
        powerupTimerElement.textContent = `${secondsLeft}s`;
        
        if (remaining < 3000) {
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
            
            typingIndicator.innerHTML = "⏰ ¡PALABRA DIFÍCIL FALLADA! Sin vida extra ⏰";
            typingIndicator.style.color = "#ff6666";
            
            setTimeout(() => {
                if (typingIndicator.innerHTML.includes("FALLADA")) {
                    typingIndicator.innerHTML = "✏️ ESCRIBE LA PRIMERA LETRA DE UNA PALABRA ✏️";
                    typingIndicator.style.color = "#00ff00";
                }
            }, 2000);
        }
    }, 100);
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
    
    crearExplosion(nave.x, nave.y, "grande");
    
    typingIndicator.innerHTML = "💖 ¡PALABRA DIFÍCIL COMPLETADA! +1 VIDA EXTRA 💖";
    typingIndicator.style.color = "#ff69b4";
    
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
        if (typingIndicator.innerHTML.includes("PALABRA DIFÍCIL COMPLETADA")) {
            typingIndicator.innerHTML = "✏️ ESCRIBE LA PRIMERA LETRA DE UNA PALABRA ✏️";
            typingIndicator.style.color = "#00ff00";
        }
    }, 2500);
}

// ============ JEFE ============
function iniciarJefe() {
    if (isBossFight) return;
    
    if (spawnInterval) clearInterval(spawnInterval);
    
    isBossFight = true;
    bossMaxHealth = 15 + currentLevel * 2;
    bossHealth = bossMaxHealth;
    bossAttackCooldown = 0;
    bossAngle = 0;
    bossX = canvas.width / 2;
    bossY = 80;
    ataquesActivos = [];
    palabraSeleccionada = null;
    currentWord = "";
    userProgress = "";
    esperandoPrimeraLetra = true;
    
    palabrasActivas = [];
    crearPalabra(currentBoss, canvas.width / 2 - 100, 60);
    
    typingIndicator.innerHTML = `👾 JEFE: "${currentBoss}" 👾`;
    typingIndicator.style.color = "#ff0000";
    
    setTimeout(() => {
        typingIndicator.innerHTML = `⚔️ HP: ${bossHealth}/${bossMaxHealth} - ESCRIBE EL TRABALENGUA PARA DAÑARLO ⚔️`;
        typingIndicator.innerHTML += " | Tecla R para RAYO LÁSER";
    }, 2000);
}

function actualizarJefe() {
    if (!isBossFight) return;
    if (gamePaused) return;
    
    bossAngle += 0.02;
    const radio = 150;
    bossX = canvas.width / 2 + Math.cos(bossAngle) * radio;
    bossY = 80 + Math.sin(bossAngle * 1.5) * 30;
    
    for (let p of palabrasActivas) {
        if (p.texto === currentBoss) {
            p.x = bossX;
            p.y = bossY;
            p.targetX = bossX;
            p.targetY = bossY;
            p.angulo += 0.05;
        }
    }
    
    if (bossAttackCooldown > 0) {
        bossAttackCooldown--;
    }
    
    if (bossAttackCooldown <= 0 && gameRunning && isBossFight && !gamePaused) {
        bossAttackCooldown = 70;
        const numAtaques = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numAtaques; i++) {
            generarAtaqueNumerico();
        }
    }
    
    for (let i = 0; i < ataquesActivos.length; i++) {
        const ataque = ataquesActivos[i];
        ataque.x += ataque.velocidadX;
        ataque.y += ataque.velocidad;
        
        const distancia = Math.hypot(ataque.x - nave.x, ataque.y - nave.y);
        if (distancia < 35) {
            perderVida("Ataque del jefe");
            crearExplosion(ataque.x, ataque.y, "pequena");
            ataquesActivos.splice(i, 1);
            i--;
        }
        
        if (ataque.y > canvas.height + 100 || ataque.x < -100 || ataque.x > canvas.width + 100) {
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
        x: bossX + (Math.random() - 0.5) * 60,
        y: bossY + 25,
        velocidad: 1.5 + Math.random() * 1,
        velocidadX: (Math.random() - 0.5) * 0.8,
        escrito: ""
    });
}

// ============ FUNCIÓN PARA ESCRIBIR NÚMEROS ============
function escribirNumero(letra) {
    if (!isBossFight) return false;
    if (ataquesActivos.length === 0) return false;
    
    let targetAtaque = null;
    for (let ataque of ataquesActivos) {
        if (ataque.escrito.length < ataque.texto.length) {
            targetAtaque = ataque;
            break;
        }
    }
    
    if (!targetAtaque) return false;
    
    const letraEsperada = targetAtaque.texto[targetAtaque.escrito.length];
    
    if (letra === letraEsperada) {
        targetAtaque.escrito += letra;
        
        typingIndicator.innerHTML = `🔢 NÚMERO: ${targetAtaque.escrito}/${targetAtaque.texto.length} 🔢`;
        typingIndicator.style.color = "#ff8800";
        
        if (targetAtaque.escrito.length === targetAtaque.texto.length) {
            const index = ataquesActivos.indexOf(targetAtaque);
            if (index !== -1) {
                crearExplosion(targetAtaque.x, targetAtaque.y, "pequena");
                ataquesActivos.splice(index, 1);
            }
            
            bossHealth--;
            updateUI();
            
            const damageBonus = 500;
            score += damageBonus;
            updateUI();
            
            typingIndicator.innerHTML = `💥 ¡NÚMERO ${targetAtaque.texto} DESTRUIDO! Daño al jefe +${damageBonus} pts 💥`;
            typingIndicator.style.color = "#00ff00";
            
            if (bossHealth <= 0) {
                completarNivel();
            }
            
            setTimeout(() => {
                if (typingIndicator.innerHTML.includes("DESTRUIDO") && isBossFight) {
                    typingIndicator.innerHTML = `⚔️ JEFE: ${bossHealth}/${bossMaxHealth} HP ⚔️`;
                    typingIndicator.style.color = "#ff0000";
                }
            }, 1500);
        }
        return true;
    } else {
        typingIndicator.innerHTML = `❌ Error en número! Esperaba "${letraEsperada}" ❌`;
        typingIndicator.style.color = "#ff6666";
        setTimeout(() => {
            if (typingIndicator.innerHTML.includes("Error en número") && isBossFight) {
                typingIndicator.innerHTML = `⚔️ ESCRIBE: ${targetAtaque.texto} ⚔️`;
                typingIndicator.style.color = "#ff8800";
            }
        }, 800);
        return false;
    }
}

// ============ RAYO LÁSER ============
function activarEfectoRayo() {
    rayoActivo = true;
    rayoTimer = 10;
}

function dispararRayo() {
    if (!gameRunning) return;
    if (gamePaused) {
        typingIndicator.innerHTML = "⚡ ¡TERMINA LA PALABRA DIFÍCIL PRIMERO! ⚡";
        return;
    }
    
    if (ataquesActivos.length > 0) {
        const destruidos = Math.min(2, ataquesActivos.length);
        for (let i = 0; i < destruidos; i++) {
            const ataque = ataquesActivos[0];
            crearExplosion(ataque.x, ataque.y, "pequena");
            ataquesActivos.shift();
        }
        
        activarEfectoRayo();
        
        typingIndicator.innerHTML = `⚡ ¡RAYO LÁSER! ${destruidos} números destruidos ⚡`;
        typingIndicator.style.color = "#00ffff";
        
        canvas.style.filter = 'brightness(1.5)';
        setTimeout(() => canvas.style.filter = '', 150);
        
        setTimeout(() => {
            if (typingIndicator.innerHTML.includes("RAYO LÁSER") && isBossFight) {
                typingIndicator.innerHTML = `⚔️ JEFE: ${bossHealth}/${bossMaxHealth} HP ⚔️`;
                typingIndicator.style.color = "#ff0000";
            }
        }, 1500);
    } else {
        typingIndicator.innerHTML = "⚠️ ¡No hay números para destruir! ⚠️";
        setTimeout(() => {
            if (typingIndicator.innerHTML.includes("No hay números") && isBossFight) {
                typingIndicator.innerHTML = `⚔️ JEFE: ${bossHealth}/${bossMaxHealth} HP ⚔️`;
                typingIndicator.style.color = "#ff0000";
            }
        }, 1000);
    }
}

// ============ ACTUALIZAR PALABRAS ============
function actualizarPalabras() {
    if (gamePaused) return;
    
    for (let i = 0; i < palabrasActivas.length; i++) {
        const p = palabrasActivas[i];
        
        if (p.texto === currentBoss && isBossFight) {
            continue;
        }
        
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
            crearExplosion(p.x, p.y, "normal");
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

function perderVida(causa) {
    if (!gameRunning) return;
    if (gamePaused) return;
    
    lives--;
    updateUI();
    
    crearExplosion(nave.x, nave.y, "grande");
    
    canvas.style.animation = 'shake 0.3s ease-in-out';
    setTimeout(() => canvas.style.animation = '', 300);
    
    if (lives <= 0) {
        gameOver();
    } else {
        typingIndicator.innerHTML = `💥 ¡${causa} TE GOLPEÓ! -1 vida 💥`;
        typingIndicator.style.color = "#ff6666";
        setTimeout(() => {
            if (typingIndicator.innerHTML.includes("GOLPEÓ")) {
                typingIndicator.innerHTML = esperandoPrimeraLetra ? 
                    "✏️ ESCRIBE LA PRIMERA LETRA DE UNA PALABRA ✏️" : 
                    `✏️ ESCRIBE: ${currentWord} ✏️`;
                typingIndicator.style.color = "#00ff00";
            }
        }, 1500);
    }
}

function activarCampoFuerza() {
    if (!gameRunning) return;
    if (gamePaused) {
        typingIndicator.innerHTML = "⚡ ¡TERMINA LA PALABRA DIFÍCIL PRIMERO! ⚡";
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
    
    for (const p of palabrasActivas) {
        if (p.texto !== currentBoss) {
            crearExplosion(p.x, p.y, "normal");
        }
    }
    
    const destroyed = palabrasActivas.filter(p => p.texto !== currentBoss).length;
    palabrasActivas = palabrasActivas.filter(p => p.texto === currentBoss);
    palabraSeleccionada = null;
    currentWord = "";
    userProgress = "";
    esperandoPrimeraLetra = true;
    
    typingIndicator.innerHTML = `✨ CAMPO DE FUERZA: ${destroyed} palabras destruidas ✨`;
    typingIndicator.style.color = "#00ffff";
    
    canvas.style.filter = 'brightness(2)';
    setTimeout(() => canvas.style.filter = '', 200);
    
    updateWordDisplay();
    
    setTimeout(() => {
        if (typingIndicator.innerHTML.includes("CAMPO DE FUERZA")) {
            typingIndicator.innerHTML = esperandoPrimeraLetra ?
                "✏️ ESCRIBE LA PRIMERA LETRA DE UNA PALABRA ✏️" :
                `✏️ ESCRIBE: ${currentWord} ✏️`;
            typingIndicator.style.color = "#00ff00";
        }
    }, 1500);
}

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
        typingIndicator.style.color = "#ffff00";
        
        if (currentWord.length === 1) {
            completarPalabra();
        }
        
        return true;
    }
    
    return false;
}

function dispararLetra(letra) {
    if (!gameRunning) return;
    
    if (powerupActive) {
        manejarPowerup(letra);
        return;
    }
    
    if (gamePaused) return;
    
    // Si es número y hay jefe, intentar destruir número
    if (isBossFight && /^[0-9]$/.test(letra)) {
        const resultado = escribirNumero(letra);
        if (resultado) return;
    }
    
    ultimaTecla = letra;
    tiempoTecla = Date.now();
    
    if (esperandoPrimeraLetra) {
        const seleccionada = seleccionarYDisparar(letra);
        if (!seleccionada) {
            typingIndicator.innerHTML = `❌ No hay palabra que empiece con "${letra.toUpperCase()}" ❌`;
            typingIndicator.style.color = "#ff6666";
            setTimeout(() => {
                if (typingIndicator.innerHTML.includes("No hay palabra")) {
                    typingIndicator.innerHTML = "✏️ ESCRIBE LA PRIMERA LETRA DE UNA PALABRA VISIBLE ✏️";
                    typingIndicator.style.color = "#00ff00";
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
            typingIndicator.style.color = "#00ff00";
        }
    } else {
        wordPenalties += 200;
        typingIndicator.innerHTML = `❌ ERROR: "${letraEsperada.toUpperCase()}" -200 pts ❌`;
        typingIndicator.style.color = "#ff6666";
        canvas.style.animation = 'shake 0.1s ease-in-out';
        setTimeout(() => canvas.style.animation = '', 100);
        setTimeout(() => {
            if (typingIndicator.innerHTML.includes("ERROR")) {
                typingIndicator.innerHTML = `✏️ ESCRIBE: ${currentWord} ✏️`;
                typingIndicator.style.color = "#00ff00";
            }
        }, 800);
    }
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
        
        typingIndicator.innerHTML = `💖 ${userProgress.length}/${powerupWord.length} letras 💖`;
        typingIndicator.style.color = "#ff69b4";
        
        if (userProgress.length === powerupWord.length) {
            completarPowerup();
            return true;
        }
        return true;
    } else {
        typingIndicator.innerHTML = `❌ Error! Esperaba "${letraEsperada}" ❌`;
        typingIndicator.style.color = "#ff6666";
        canvas.style.animation = 'shake 0.1s ease-in-out';
        setTimeout(() => {
            canvas.style.animation = '';
            if (powerupActive) {
                typingIndicator.innerHTML = `💖 ESCRIBE: "${powerupWord}" 💖`;
                typingIndicator.style.color = "#ff69b4";
            }
        }, 800);
        return false;
    }
}

function completarPalabra() {
    const tiempoMs = Date.now() - wordStartTime;
    const puntosBase = currentWord.length * 15;
    let bonus = 0;
    
    if (tiempoMs < 3000) {
        bonus = 3000 - tiempoMs;
    }
    
    const puntosTotales = puntosBase + bonus - wordPenalties;
    score += Math.max(0, puntosTotales);
    
    if (palabraSeleccionada) {
        crearExplosion(palabraSeleccionada.x, palabraSeleccionada.y, "normal");
    }
    
    if (isBossFight && currentWord === currentBoss) {
        bossHealth--;
        updateUI();
        crearExplosion(bossX, bossY, "grande");
        
        typingIndicator.innerHTML = `💥 ¡DAÑO AL JEFE! +${Math.floor(puntosTotales)} pts 💥`;
        typingIndicator.style.color = "#ff0000";
        
        if (bossHealth <= 0) {
            completarNivel();
        } else {
            palabraSeleccionada = null;
            currentWord = "";
            userProgress = "";
            esperandoPrimeraLetra = true;
            updateWordDisplay();
            return;
        }
    }
    
    typingIndicator.innerHTML = `🎯 +${Math.floor(puntosTotales)} pts: "${currentWord}" destruida 🎯`;
    typingIndicator.style.color = "#ffff00";
    
    const index = palabrasActivas.findIndex(p => p.texto === currentWord);
    if (index !== -1) palabrasActivas.splice(index, 1);
    
    palabraSeleccionada = null;
    currentWord = "";
    userProgress = "";
    esperandoPrimeraLetra = true;
    
    updateUI();
    updateWordDisplay();
    
    if (!isBossFight && currentWordIndex >= wordsForLevel.length && palabrasActivas.length === 0) {
        completarNivel();
    }
    
    if (!powerupActive && gameRunning && !isBossFight && !gamePaused && Math.random() < 0.08) {
        setTimeout(() => activarPowerupVida(), 500);
    }
}

function completarNivel() {
    if (levelComplete) return;
    levelComplete = true;
    
    if (spawnInterval) clearInterval(spawnInterval);
    
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            crearExplosion(Math.random() * canvas.width, Math.random() * canvas.height, "pequena");
        }, i * 80);
    }
    
    if (currentLevel >= 10) {
        typingIndicator.innerHTML = "🎉 ¡VICTORIA! COMPLETASTE EL JUEGO 🎉";
        typingIndicator.style.color = "#ffff00";
        gameWin();
        return;
    }
    
    currentLevel++;
    const levelBonus = 2000;
    score += levelBonus;
    updateUI();
    
    typingIndicator.innerHTML = `✅ NIVEL ${currentLevel - 1} COMPLETADO +${levelBonus} pts ✅`;
    typingIndicator.style.color = "#00ff00";
    
    setTimeout(() => initLevel(), 3000);
}

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
                display += `<span style="color: #ff69b4">${char}</span>`;
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
                display += `<span style="color: ${isBossFight && currentWord === currentBoss ? '#ff0000' : '#ffffff'}">${char}</span>`;
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
        } else if (isBossFight && p.texto === currentBoss) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#ff0000";
        } else {
            ctx.shadowBlur = 5;
            ctx.shadowColor = "#ff00ff";
        }
        
        let fontSize = p.texto === currentBoss ? 28 : 20 + Math.floor(currentLevel / 2);
        ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        const metrics = ctx.measureText(p.texto);
        const ancho = metrics.width;
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(p.x - ancho / 2 - 5, p.y - 20, ancho + 10, 30);
        
        if (palabraSeleccionada && palabraSeleccionada.id === p.id) {
            ctx.fillStyle = "#00ff00";
        } else if (isBossFight && p.texto === currentBoss) {
            ctx.fillStyle = "#ff0000";
            const pulso = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
            ctx.shadowBlur = 20 * pulso;
        } else {
            ctx.fillStyle = "#ffff00";
        }
        
        ctx.fillText(p.texto, p.x - ancho / 2, p.y);
        
        if (isBossFight && p.texto === currentBoss) {
            const barraX = p.x - 100;
            const barraY = p.y - 35;
            const barraAncho = 200;
            const barraAlto = 12;
            
            ctx.fillStyle = "#330000";
            ctx.fillRect(barraX, barraY, barraAncho, barraAlto);
            
            const vidaPorcentaje = bossHealth / bossMaxHealth;
            ctx.fillStyle = "#ff0000";
            ctx.fillRect(barraX, barraY, barraAncho * vidaPorcentaje, barraAlto);
            
            ctx.strokeStyle = "#ffff00";
            ctx.strokeRect(barraX, barraY, barraAncho, barraAlto);
            
            ctx.font = "12px monospace";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(`HP: ${bossHealth}/${bossMaxHealth}`, barraX + 70, barraY - 3);
        }
        
        ctx.restore();
    }
}

function dibujarAtaques() {
    for (const ataque of ataquesActivos) {
        ctx.save();
        ctx.shadowBlur = 0;
        
        ctx.font = "bold 28px 'Courier New', monospace";
        const metrics = ctx.measureText(ataque.texto);
        const ancho = metrics.width;
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(ataque.x - ancho / 2 - 8, ataque.y - 18, ancho + 16, 30);
        
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 2;
        ctx.strokeRect(ataque.x - ancho / 2 - 8, ataque.y - 18, ancho + 16, 30);
        
        ctx.fillStyle = "#ff3333";
        ctx.fillText(ataque.texto, ataque.x - ancho / 2, ataque.y);
        
        if (ataque.escrito && ataque.escrito.length > 0) {
            ctx.font = "18px monospace";
            ctx.fillStyle = "#00ff00";
            ctx.fillText(ataque.escrito, ataque.x - ancho / 2, ataque.y - 12);
        }
        
        ctx.restore();
    }
}

function dibujar() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    dibujarEstrellas();
    dibujarPalabras();
    dibujarAtaques();
    dibujarNave();
    dibujarExplosiones();
    
    if (ultimaTecla && Date.now() - tiempoTecla < 150 && !powerupActive) {
        ctx.font = "bold 32px monospace";
        ctx.fillStyle = "#00ff00";
        ctx.shadowBlur = 10;
        ctx.fillText(ultimaTecla.toUpperCase(), nave.x + 30, nave.y - 30);
        ctx.shadowBlur = 0;
    }
}

function gameLoop() {
    if (!gameRunning) return;
    
    if (!gamePaused) {
        actualizarEstrellas();
        actualizarExplosiones();
        actualizarPalabras();
        actualizarJefe();
    }
    
    dibujar();
    
    if (rayoActivo && ataquesActivos.length > 0) {
        for (let i = 0; i < Math.min(2, ataquesActivos.length); i++) {
            ctx.beginPath();
            ctx.moveTo(nave.x, nave.y);
            ctx.lineTo(ataquesActivos[i].x, ataquesActivos[i].y);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        rayoTimer--;
        if (rayoTimer <= 0) {
            rayoActivo = false;
        }
    }
    
    animacionId = requestAnimationFrame(gameLoop);
}

// ============ MANEJO DE TECLADO (CORREGIDO - TECLA R SOLO RAYO SI HAY JEFE) ============
function handleKeyDown(e) {
    if (!gameRunning) return;
    
    // RAYO LÁSER - SOLO si hay jefe activo
    if ((e.key === 'r' || e.key === 'R' || e.key === 'f' || e.key === 'F') && isBossFight) {
        e.preventDefault();
        e.stopPropagation();
        dispararRayo();
        return;
    }
    
    // ENTER - Campo de fuerza
    if (e.key === 'Enter') {
        e.preventDefault();
        if (!gamePaused && !powerupActive) {
            activarCampoFuerza();
        } else if (powerupActive) {
            typingIndicator.innerHTML = "💖 ¡TERMINA LA PALABRA DIFÍCIL PRIMERO! 💖";
            typingIndicator.style.color = "#ff69b4";
            setTimeout(() => {
                if (typingIndicator.innerHTML.includes("PALABRA DIFÍCIL PRIMERO") && powerupActive) {
                    typingIndicator.innerHTML = `💖 ESCRIBE: "${powerupWord}" 💖`;
                }
            }, 1000);
        }
        return;
    }
    
    // BACKSPACE - Corregir
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
    
    // ESPACIO
    if (e.key === ' ') {
        e.preventDefault();
        
        if (powerupActive) {
            const siguienteChar = powerupWord[userProgress.length];
            if (siguienteChar === ' ') {
                userProgress += ' ';
                updateWordDisplay();
                typingIndicator.innerHTML = `💖 ${userProgress.length}/${powerupWord.length} letras 💖`;
                if (userProgress.length === powerupWord.length) {
                    completarPowerup();
                }
            } else {
                typingIndicator.innerHTML = `❌ Error! Se esperaba "${siguienteChar}" no un espacio ❌`;
                setTimeout(() => {
                    if (powerupActive && typingIndicator.innerHTML.includes("Error")) {
                        typingIndicator.innerHTML = `💖 ESCRIBE: "${powerupWord}" 💖`;
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
    
    // Letras, números y ñ (incluyendo R cuando NO hay jefe)
    const esLetra = /^[a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]$/.test(e.key);
    if (esLetra) {
        e.preventDefault();
        dispararLetra(e.key);
    }
}

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

function init() {
    initEstrellas();
    cargarImagenNave();
    initLevel();
    window.addEventListener('keydown', handleKeyDown);
    window.focus();
    gameLoop();
}

init();