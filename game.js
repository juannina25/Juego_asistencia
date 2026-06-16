// ========================================================================
// GALAGA DE PALABRAS - Typing of tha Rusth
// VERSIÓN CON JEFES CADA 2 NIVELES, SIN ATAQUES NUMÉRICOS, PUNTAJE POR LETRA
// ========================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 600;

// Elementos DOM
const startScreen = document.getElementById('startScreen');
const uiOverlay = document.getElementById('uiOverlay');
const gameOverScreen = document.getElementById('gameOver');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreSpan = document.getElementById('finalScore');
const finalLevelSpan = document.getElementById('finalLevel');

const livesElement = document.getElementById('lives');
const scoreElement = document.getElementById('score');
const forceFieldElement = document.getElementById('forceField');
const levelElement = document.getElementById('level');
const targetWordElement = document.getElementById('targetWord');
const wordProgressElement = document.getElementById('wordProgress');
const wordLengthElement = document.getElementById('wordLength');
const typingIndicator = document.getElementById('typingIndicator');

// ================================
//  VARIABLES GLOBALES
// ================================
let gameRunning = false;
let score = 0;
let lives = 3;
let forceFieldUses = 3;
let currentLevel = 1;
let currentWordIndex = 0;
let currentWord = "";
let userProgress = "";
let wordPenalties = 0;
let wordsForLevel = [];
let isBossFight = false;
let bossText = "";
let bossStartTime = 0;
let bossSpawnTime = 0;
let bossApproachTime = 120000; // se ajusta por nivel
let bossX = canvas.width/2, bossY = 80;
let bossStartX, bossStartY, bossTargetX, bossTargetY;
let bossAngle = 0;
let palabrasActivas = [];
let palabraSeleccionada = null;
let esperandoPrimeraLetra = true;
let spawnInterval = null;
let tiempoEntrePalabras = 4000;
let animacionId = null;
let ultimaTecla = "";
let tiempoTecla = 0;
let levelComplete = false;

// Nave y animación
let nave = {
    x: canvas.width/2,
    y: canvas.height/2,
    offsetX: 0,
    offsetDir: 1,
    img: null
};

// Imágenes del jefe
let bossImgNormal = null;
let bossImgFinal = null;

// Explosiones y estrellas
let explosiones = [];
let estrellas = [];

// Disparos láser
let laserEffect = {
    activo: false,
    desdeX: 0,
    desdeY: 0,
    hastaX: 0,
    hastaY: 0,
    letra: '',
    framesRestantes: 0
};

// ================================
//  INICIALIZACIÓN DE ESTRELLAS Y EXPLOSIONES
// ================================
function initEstrellas() {
    for (let i = 0; i < 200; i++) {
        estrellas.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.5 + 0.3,
            parpadeo: Math.random() * Math.PI * 2
        });
    }
}
function actualizarEstrellas() {
    for (let e of estrellas) {
        e.y += e.speed;
        e.parpadeo += 0.05;
        if (e.y > canvas.height) { e.y = 0; e.x = Math.random() * canvas.width; }
        e.alpha = 0.3 + Math.sin(e.parpadeo) * 0.3;
    }
}
function dibujarEstrellas() {
    for (let e of estrellas) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${e.alpha})`;
        ctx.arc(e.x, e.y, e.size, 0, Math.PI*2);
        ctx.fill();
    }
}

function crearExplosion(x, y, tipo = "normal") {
    let particulas = [];
    const num = tipo === "grande" ? 40 : 15;
    for (let i = 0; i < num; i++) {
        const ang = Math.random() * Math.PI * 2;
        const vel = Math.random() * 5 + 2;
        particulas.push({
            x, y,
            vx: Math.cos(ang) * vel,
            vy: Math.sin(ang) * vel,
            vida: 1,
            size: Math.random() * 4 + 2,
            color: `hsl(${Math.random() * 60 + 20}, 100%, 50%)`
        });
    }
    explosiones.push({ particulas, vida: 1 });
}
function actualizarExplosiones() {
    for (let i = 0; i < explosiones.length; i++) {
        const exp = explosiones[i];
        exp.vida -= 0.05;
        for (let p of exp.particulas) {
            p.x += p.vx; p.y += p.vy;
            p.vx *= 0.98; p.vy *= 0.98;
        }
        if (exp.vida <= 0) { explosiones.splice(i,1); i--; }
    }
}
function dibujarExplosiones() {
    for (const exp of explosiones) {
        for (const p of exp.particulas) {
            ctx.globalAlpha = p.vida * exp.vida;
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.arc(p.x, p.y, p.size * exp.vida, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
    ctx.globalAlpha = 1;
}

// ================================
//  CARGA DE IMÁGENES
// ================================
function cargarImagenes() {
    nave.img = new Image();
    nave.img.src = 'img/nave.png';
    nave.img.onerror = () => { nave.img = null; };
    bossImgNormal = new Image();
    bossImgNormal.src = 'img/jefe_base.png';
    bossImgNormal.onerror = () => { bossImgNormal = null; };
    bossImgFinal = new Image();
    bossImgFinal.src = 'img/jefe_final.png';
    bossImgFinal.onerror = () => { bossImgFinal = null; };
}

// ================================
//  DIBUJO DE LA NAVE
// ================================
function dibujarNave() {
    const drawX = nave.x + nave.offsetX;
    if (nave.img && nave.img.complete && nave.img.naturalWidth > 0) {
        ctx.drawImage(nave.img, drawX - 25, nave.y - 25, 50, 50);
    } else {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00ffff";
        ctx.beginPath();
        ctx.moveTo(drawX, nave.y - 20);
        ctx.lineTo(drawX + 15, nave.y + 10);
        ctx.lineTo(drawX + 5, nave.y + 10);
        ctx.lineTo(drawX + 5, nave.y + 20);
        ctx.lineTo(drawX - 5, nave.y + 20);
        ctx.lineTo(drawX - 5, nave.y + 10);
        ctx.lineTo(drawX - 15, nave.y + 10);
        ctx.closePath();
        ctx.fillStyle = "#00ffff";
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(drawX - 3, nave.y - 10);
        ctx.lineTo(drawX, nave.y - 25);
        ctx.lineTo(drawX + 3, nave.y - 10);
        ctx.fillStyle = "#ff00ff";
        ctx.fill();
        ctx.restore();
    }
}
function actualizarAnimacionNave() {
    if (!gameRunning) return;
    nave.offsetX += nave.offsetDir * 0.8;
    if (nave.offsetX > 8) nave.offsetDir = -1;
    if (nave.offsetX < -8) nave.offsetDir = 1;
}

// ================================
//  DIBUJO DE PALABRAS
// ================================
function dibujarPalabras() {
    for (let p of palabrasActivas) {
        ctx.save();
        if (palabraSeleccionada && palabraSeleccionada.id === p.id) {
            ctx.shadowBlur = 15; ctx.shadowColor = "#00ff00";
        } else if (p.esJefe) {
            ctx.shadowBlur = 20; ctx.shadowColor = "#ff0000";
        } else {
            ctx.shadowBlur = 5; ctx.shadowColor = "#ff00ff";
        }
        let fontSize = (p.esJefe ? 32 : 20 + Math.floor(currentLevel/2));
        ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        const ancho = ctx.measureText(p.texto).width;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(p.x - ancho/2 - 5, p.y - 20, ancho + 10, 30);
        if (palabraSeleccionada && palabraSeleccionada.id === p.id) ctx.fillStyle = "#00ff00";
        else if (p.esJefe) ctx.fillStyle = "#ff0000";
        else ctx.fillStyle = "#ffff00";
        ctx.fillText(p.texto, p.x - ancho/2, p.y);
        ctx.restore();
    }
}

// ================================
//  DIBUJO DEL JEFE
// ================================
function dibujarJefe() {
    if (!isBossFight) return;
    ctx.save();
    const isFinal = (currentLevel >= 10);
    const img = isFinal ? bossImgFinal : bossImgNormal;
    if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, bossX - 40, bossY - 40, 80, 80);
    } else {
        ctx.font = "bold 48px monospace";
        ctx.fillStyle = "#ff0000";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ff0000";
        ctx.fillText("👾", bossX - 25, bossY + 15);
    }
    const elapsed = Date.now() - bossSpawnTime;
    const progress = Math.min(1, elapsed / bossApproachTime);
    ctx.fillStyle = "#330000";
    ctx.fillRect(bossX - 150, bossY - 55, 300, 12);
    ctx.fillStyle = "#ff6600";
    ctx.fillRect(bossX - 150, bossY - 55, 300 * progress, 12);
    ctx.strokeStyle = "#ffff00";
    ctx.strokeRect(bossX - 150, bossY - 55, 300, 12);
    const timeLeft = Math.max(0, bossApproachTime - elapsed);
    ctx.fillStyle = "#003300";
    ctx.fillRect(bossX - 150, bossY - 40, 300, 12);
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(bossX - 150, bossY - 40, 300 * (timeLeft / bossApproachTime), 12);
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(bossX - 150, bossY - 40, 300, 12);
    ctx.font = "12px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`ACERCAMIENTO: ${Math.floor(progress*100)}%`, bossX - 140, bossY - 58);
    ctx.fillText(`TIEMPO: ${Math.ceil(timeLeft/1000)}s`, bossX - 140, bossY - 43);
    ctx.restore();
}

// ================================
//  REGISTRAR DISPARO LÁSER
// ================================
function registrarDisparo(letra, objetivoX, objetivoY) {
    laserEffect.activo = true;
    laserEffect.desdeX = nave.x + nave.offsetX;
    laserEffect.desdeY = nave.y;
    laserEffect.hastaX = objetivoX;
    laserEffect.hastaY = objetivoY;
    laserEffect.letra = letra;
    laserEffect.framesRestantes = 8;
}

// ================================
//  MOVIMIENTO DE PALABRAS NORMALES
// ================================
function actualizarPalabras() {
    for (let i = 0; i < palabrasActivas.length; i++) {
        const p = palabrasActivas[i];
        if (p.esJefe) continue;
        p.targetX = nave.x;
        p.targetY = nave.y;
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 10) {
            p.angulo += 0.03;
            const curvaX = Math.sin(p.angulo) * p.radioCurvatura * 0.015;
            const curvaY = Math.cos(p.angulo) * p.radioCurvatura * 0.015;
            const dirX = (dx / dist) * p.velocidad + curvaX;
            const dirY = (dy / dist) * p.velocidad + curvaY;
            p.x += dirX;
            p.y += dirY;
        } else {
            perderVida(p.texto);
            crearExplosion(p.x, p.y, "normal");
            palabrasActivas.splice(i,1); i--;
            if (palabraSeleccionada && palabraSeleccionada.id === p.id) {
                palabraSeleccionada = null; currentWord = ""; userProgress = ""; esperandoPrimeraLetra = true; updateWordDisplay();
            }
        }
        if (p.x < -200 || p.x > canvas.width+200 || p.y < -200 || p.y > canvas.height+200) {
            perderVida(p.texto);
            palabrasActivas.splice(i,1); i--;
            if (palabraSeleccionada && palabraSeleccionada.id === p.id) {
                palabraSeleccionada = null; currentWord = ""; userProgress = ""; esperandoPrimeraLetra = true; updateWordDisplay();
            }
        }
    }
}

// ================================
//  MOVIMIENTO DEL JEFE HACIA LA NAVE
// ================================
function actualizarJefe() {
    if (!isBossFight) return;
    // Movimiento circular + acercamiento
    bossAngle += 0.02;
    const radio = 150;
    const offsetX = Math.cos(bossAngle) * radio;
    const offsetY = Math.sin(bossAngle * 1.5) * 30;
    const ahora = Date.now();
    const tiempoTranscurrido = ahora - bossSpawnTime;
    const factor = Math.min(1, tiempoTranscurrido / bossApproachTime);
    bossTargetX = nave.x;
    bossTargetY = nave.y;
    bossX = bossStartX + (bossTargetX - bossStartX) * factor + offsetX * (1 - factor);
    bossY = bossStartY + (bossTargetY - bossStartY) * factor + offsetY * (1 - factor);
    if (Math.hypot(bossX - nave.x, bossY - nave.y) < 45) {
        perderTodasLasVidas();
        return;
    }
    const timeLeft = bossApproachTime - tiempoTranscurrido;
    if (timeLeft <= 0) {
        perderTodasLasVidas();
        return;
    }
    typingIndicator.innerHTML = `⏱️ TIEMPO RESTANTE: ${Math.ceil(timeLeft/1000)}s - ESCRIBE EL TEXTO COMPLETO ⏱️`;
}

// ================================
//  GENERACIÓN DE PALABRAS NORMALES
// ================================
function generarPalabra() {
    if (currentWordIndex >= wordsForLevel.length) return;
    if (isBossFight) return;
    const word = wordsForLevel[currentWordIndex++];
    const lado = Math.floor(Math.random() * 3); // arriba, derecha, izquierda
    let x, y;
    switch(lado) {
        case 0: x = Math.random() * canvas.width; y = -40; break;
        case 1: x = canvas.width + 40; y = Math.random() * canvas.height; break;
        default: x = -40; y = Math.random() * canvas.height;
    }
    const velocidadBase = 0.4 + (currentLevel - 1) * 0.2;
    palabrasActivas.push({
        id: Date.now() + Math.random(),
        texto: word,
        x, y,
        velocidad: velocidadBase,
        angulo: Math.random() * Math.PI * 2,
        radioCurvatura: 50 + Math.random() * 150,
        targetX: nave.x, targetY: nave.y,
        seleccionada: false,
        esJefe: false
    });
}
function iniciarSpawneo() {
    if (spawnInterval) clearInterval(spawnInterval);
    spawnInterval = setInterval(() => {
        if (!gameRunning || isBossFight || levelComplete) return;
        if (currentWordIndex < wordsForLevel.length) {
            if (palabrasActivas.length < 5) {
                generarPalabra();
            }
        } else if (currentWordIndex >= wordsForLevel.length && palabrasActivas.length === 0 && !isBossFight) {
            if (currentLevel % 2 === 0) {
                iniciarJefe();
            } else {
                completarNivel();
            }
        }
    }, tiempoEntrePalabras);
}

// ================================
//  INICIALIZAR NIVEL NORMAL
// ================================
function initLevel() {
    const levelData = getWordsForLevel(currentLevel);
    wordsForLevel = levelData.words;
    currentWordIndex = 0;
    isBossFight = false;
    levelComplete = false;
    palabraSeleccionada = null;
    currentWord = "";
    userProgress = "";
    esperandoPrimeraLetra = true;
    palabrasActivas = [];
    if (spawnInterval) clearInterval(spawnInterval);
    tiempoEntrePalabras = Math.max(1200, 4000 - (currentLevel - 1) * 250);
    updateUI();
    updateWordDisplay();
    typingIndicator.innerHTML = `🎮 NIVEL ${currentLevel} - ${levelData.language} 🎮`;
    setTimeout(() => {
        if (typingIndicator.innerHTML.includes("NIVEL"))
            typingIndicator.innerHTML = "✏️ ESCRIBE LA PRIMERA LETRA ✏️";
    }, 2000);
    iniciarSpawneo();
    // generar palabras iniciales
    for (let i = 0; i < 2; i++) setTimeout(() => generarPalabra(), i * 800);
}

// ================================
//  INICIAR JEFE (CADA 2 NIVELES, CON TIEMPO PROGRESIVO)
// ================================
function iniciarJefe() {
    if (isBossFight) return;
    if (spawnInterval) clearInterval(spawnInterval);
    isBossFight = true;
    const levelData = getWordsForLevel(currentLevel);
    bossText = levelData.bossText;
    // Tiempo base: 120 segundos (120000 ms) para el primer jefe (nivel 2)
    // Cada jefe sucesivo resta 15 segundos (15000 ms)
    // nivel 2: 120s, nivel 4: 105s, nivel 6: 90s, nivel 8: 75s, nivel 10: 60s
    const bossIndex = currentLevel / 2; // 1,2,3,4,5
    bossApproachTime = Math.max(60000, 120000 - (bossIndex - 1) * 15000);
    bossStartTime = Date.now();
    bossSpawnTime = Date.now();
    bossAngle = 0;
    bossStartX = Math.random() * canvas.width;
    bossStartY = -80;
    bossX = bossStartX;
    bossY = bossStartY;
    bossTargetX = nave.x;
    bossTargetY = nave.y;
    currentWord = bossText;
    userProgress = "";
    esperandoPrimeraLetra = false;
    palabraSeleccionada = null;
    updateWordDisplay();
    typingIndicator.innerHTML = `👾 ¡JEFE! ESCRIBE EL SIGUIENTE TEXTO (${bossText.length} caracteres): 👾`;
    setTimeout(() => {
        if (isBossFight) typingIndicator.innerHTML = `⏱️ TIEMPO: ${Math.ceil(bossApproachTime/1000)}s - ¡ESCRIBE RAPIDO! EL JEFE SE ACERCA ⏱️`;
    }, 2000);
}

// ================================
//  PÉRDIDA DE VIDAS Y CAMPO DE FUERZA
// ================================
function perderVida(causa) {
    if (!gameRunning) return;
    lives--;
    updateUI();
    crearExplosion(nave.x, nave.y, "grande");
    canvas.style.animation = 'shake 0.3s ease-in-out';
    setTimeout(() => canvas.style.animation = '', 300);
    if (lives <= 0) gameOver();
    else typingIndicator.innerHTML = `💥 ¡${causa} TE GOLPEO! -1 vida 💥`;
}
function perderTodasLasVidas() {
    if (!gameRunning) return;
    for (let i = 0; i < 20; i++)
        setTimeout(() => crearExplosion(nave.x + (Math.random()-0.5)*100, nave.y + (Math.random()-0.5)*100, "grande"), i*50);
    canvas.style.animation = 'shake 0.5s ease-in-out';
    typingIndicator.innerHTML = "💀 ¡EL JEFE TE CHOCO! ¡PIERDES TODAS LAS VIDAS! 💀";
    lives = 0;
    updateUI();
    setTimeout(() => gameOver(), 1000);
}
function activarCampoFuerza() {
    if (!gameRunning) return;
    if (forceFieldUses <= 0) {
        typingIndicator.innerHTML = "⚠️ NO HAY CAMPOS DE FUERZA ⚠️";
        return;
    }
    forceFieldUses--;
    updateUI();
    for (let p of palabrasActivas) if (!p.esJefe) crearExplosion(p.x, p.y, "normal");
    palabrasActivas = palabrasActivas.filter(p => p.esJefe);
    palabraSeleccionada = null;
    currentWord = "";
    userProgress = "";
    esperandoPrimeraLetra = true;
    updateWordDisplay();
    typingIndicator.innerHTML = `✨ CAMPO DE FUERZA: todas las palabras normales destruidas ✨`;
}

// ================================
//  SELECCIÓN Y DISPARO DE LETRAS
// ================================
function seleccionarYDisparar(letra) {
    const letraMin = letra.toLowerCase();
    const encontrada = palabrasActivas.find(p => !p.esJefe && p.texto.toLowerCase().startsWith(letraMin));
    if (encontrada) {
        palabraSeleccionada = encontrada;
        currentWord = encontrada.texto;
        esperandoPrimeraLetra = false;
        userProgress = currentWord[0];
        wordPenalties = 0;
        updateWordDisplay();
        registrarDisparo(letra, encontrada.x, encontrada.y);
        typingIndicator.innerHTML = `🎯 " ${currentWord} " SELECCIONADA! Sigue escribiendo... 🎯`;
        if (currentWord.length === 1) completarPalabra();
        return true;
    }
    return false;
}

function dispararLetra(letra) {
    if (!gameRunning) return;
    ultimaTecla = letra;
    tiempoTecla = Date.now();

    // Escritura del jefe
    if (isBossFight && currentWord === bossText) {
        const esperada = bossText[userProgress.length];
        if (esperada && letra.toLowerCase() === esperada.toLowerCase()) {
            userProgress += esperada;
            updateWordDisplay();
            registrarDisparo(letra, bossX, bossY);
            if (userProgress.length === bossText.length) {
                completarPalabra();
            } else {
                typingIndicator.innerHTML = `⚔️ ESCRIBIENDO JEFE: ${userProgress.length}/${bossText.length} caracteres ⚔️`;
            }
        } else if (esperada) {
            wordPenalties += 200;
            typingIndicator.innerHTML = `❌ ERROR en jefe! Esperaba "${esperada}" -200 pts ❌`;
            canvas.style.animation = 'shake 0.1s ease-in-out';
            setTimeout(() => canvas.style.animation = '', 100);
        }
        return;
    }

    // Modo normal: seleccionar o continuar palabra
    if (esperandoPrimeraLetra) {
        if (!seleccionarYDisparar(letra)) {
            typingIndicator.innerHTML = `❌ No hay palabra que empiece con "${letra.toUpperCase()}" ❌`;
        }
        return;
    }
    if (!palabraSeleccionada) {
        esperandoPrimeraLetra = true;
        return;
    }
    const esperada = currentWord[userProgress.length];
    if (esperada && letra.toLowerCase() === esperada.toLowerCase()) {
        userProgress += esperada;
        updateWordDisplay();
        registrarDisparo(letra, palabraSeleccionada.x, palabraSeleccionada.y);
        if (userProgress.length === currentWord.length) {
            completarPalabra();
        } else {
            typingIndicator.innerHTML = `🔫 ${userProgress.length}/${currentWord.length} letras`;
        }
    } else if (esperada) {
        wordPenalties += 200;
        typingIndicator.innerHTML = `❌ ERROR: "${esperada.toUpperCase()}" -200 pts ❌`;
        canvas.style.animation = 'shake 0.1s ease-in-out';
        setTimeout(() => canvas.style.animation = '', 100);
    }
}

// ================================
//  COMPLETAR PALABRA / JEFE (con puntuación por letra)
// ================================
function completarPalabra() {
    const letrasAcertadas = currentWord.length;
    const puntosTotales = (letrasAcertadas * 500) - wordPenalties;
    score += puntosTotales;  // puede ser negativo
    updateUI();

    if (isBossFight && currentWord === bossText) {
        isBossFight = false;
        crearExplosion(bossX, bossY, "grande");
        typingIndicator.innerHTML = `💥 ¡JEFE DERROTADO! ${puntosTotales >= 0 ? '+' : ''}${Math.floor(puntosTotales)} pts 💥`;
        completarNivel();
        return;
    }

    if (palabraSeleccionada) crearExplosion(palabraSeleccionada.x, palabraSeleccionada.y, "normal");
    const idx = palabrasActivas.findIndex(p => p.texto === currentWord);
    if (idx !== -1) palabrasActivas.splice(idx, 1);
    palabraSeleccionada = null;
    currentWord = "";
    userProgress = "";
    esperandoPrimeraLetra = true;
    updateWordDisplay();
    typingIndicator.innerHTML = `🎯 ${puntosTotales >= 0 ? '+' : ''}${Math.floor(puntosTotales)} pts: "${currentWord}" destruida 🎯`;

    // Si no hay palabras activas y aún quedan por generar, generar una inmediatamente
    if (!isBossFight && palabrasActivas.length === 0 && currentWordIndex < wordsForLevel.length) {
        generarPalabra();
    }

    if (!isBossFight && currentWordIndex >= wordsForLevel.length && palabrasActivas.length === 0) {
        completarNivel();
    }
}

function completarNivel() {
    if (levelComplete) return;
    levelComplete = true;
    if (spawnInterval) clearInterval(spawnInterval);
    for (let i = 0; i < 15; i++)
        setTimeout(() => crearExplosion(Math.random() * canvas.width, Math.random() * canvas.height, "pequena"), i * 80);
    if (currentLevel >= 10) {
        typingIndicator.innerHTML = "🎉 ¡VICTORIA! COMPLETASTE EL JUEGO 🎉";
        gameWin();
        return;
    }
    currentLevel++;
    score += 2000;
    updateUI();
    typingIndicator.innerHTML = `✅ NIVEL ${currentLevel-1} COMPLETADO +2000 pts ✅`;
    setTimeout(() => {
        initLevel();
    }, 2000);
}

// ================================
//  ACTUALIZACIÓN DE UI
// ================================
function updateUI() {
    livesElement.textContent = lives;
    scoreElement.textContent = Math.floor(score);
    forceFieldElement.textContent = forceFieldUses;
    levelElement.textContent = currentLevel;
}
function updateWordDisplay() {
    if (currentWord) {
        let display = "";
        for (let i = 0; i < userProgress.length; i++) {
            const ch = userProgress[i];
            display += `<span style="color:#00ff00">${ch === ' ' ? '␣' : ch}</span>`;
        }
        for (let i = userProgress.length; i < currentWord.length; i++) {
            const ch = currentWord[i];
            display += `<span style="color:${isBossFight ? '#ff0000' : '#ffffff'}">${ch === ' ' ? '␣' : ch}</span>`;
        }
        targetWordElement.innerHTML = display;
        wordLengthElement.textContent = currentWord.length;
        wordProgressElement.textContent = userProgress.length;
        if (isBossFight) {
            targetWordElement.style.fontSize = "16px";
            targetWordElement.style.letterSpacing = "0px";
            targetWordElement.style.wordBreak = "break-all";
            targetWordElement.style.whiteSpace = "normal";
        } else {
            targetWordElement.style.fontSize = "32px";
            targetWordElement.style.letterSpacing = "4px";
            targetWordElement.style.wordBreak = "normal";
            targetWordElement.style.whiteSpace = "nowrap";
            targetWordElement.style.overflowX = "auto";
        }
    } else {
        targetWordElement.innerHTML = "⚡";
        wordLengthElement.textContent = "0";
        wordProgressElement.textContent = "0";
    }
}

// ================================
//  GAME OVER Y VICTORIA
// ================================
function gameOver() {
    gameRunning = false;
    if (spawnInterval) clearInterval(spawnInterval);
    finalScoreSpan.textContent = Math.floor(score);
    finalLevelSpan.textContent = currentLevel;
    gameOverScreen.style.display = "flex";
    uiOverlay.style.display = "none";
}
function gameWin() {
    gameRunning = false;
    if (spawnInterval) clearInterval(spawnInterval);
    finalScoreSpan.textContent = Math.floor(score);
    finalLevelSpan.textContent = currentLevel;
    gameOverScreen.style.display = "flex";
    uiOverlay.style.display = "none";
    document.querySelector('#gameOver h2').textContent = "🏆 ¡VICTORIA! 🏆";
}

// ================================
//  INICIAR JUEGO
// ================================
function startGame() {
    gameRunning = true;
    score = 0;
    lives = 3;
    forceFieldUses = 3;
    currentLevel = 1;
    currentWordIndex = 0;
    currentWord = "";
    userProgress = "";
    wordPenalties = 0;
    isBossFight = false;
    esperandoPrimeraLetra = true;
    palabrasActivas = [];
    palabraSeleccionada = null;
    levelComplete = false;
    if (spawnInterval) clearInterval(spawnInterval);
    startScreen.style.display = "none";
    uiOverlay.style.display = "block";
    gameOverScreen.style.display = "none";
    updateUI();
    initLevel();
    window.focus();
}
function restartGame() { startGame(); }

// ================================
//  MANEJO DE TECLADO
// ================================
function handleKeyDown(e) {
    if (!gameRunning) return;
    if (e.key === 'Enter') {
        e.preventDefault();
        activarCampoFuerza();
        return;
    }
    if (e.key === 'Backspace') {
        e.preventDefault();
        if (!esperandoPrimeraLetra && userProgress.length > 0) {
            userProgress = userProgress.slice(0, -1);
            updateWordDisplay();
        }
        return;
    }
    if (e.key === ' ') {
        e.preventDefault();
        if (!esperandoPrimeraLetra && currentWord) {
            const sig = currentWord[userProgress.length];
            if (sig === ' ') {
                userProgress += ' ';
                updateWordDisplay();
                registrarDisparo('␣', palabraSeleccionada ? palabraSeleccionada.x : nave.x, palabraSeleccionada ? palabraSeleccionada.y : nave.y);
                if (userProgress.length === currentWord.length) completarPalabra();
            }
        }
        return;
    }
    const esLetra = /^[a-zA-Z0-9]$/i.test(e.key);
    if (esLetra) {
        e.preventDefault();
        dispararLetra(e.key);
    }
}

// ================================
//  BUCLE DE DIBUJO
// ================================
function gameLoop() {
    if (gameRunning) {
        actualizarEstrellas();
        actualizarExplosiones();
        actualizarPalabras();
        if (isBossFight) actualizarJefe();
        actualizarAnimacionNave();
        if (laserEffect.activo) {
            laserEffect.framesRestantes--;
            if (laserEffect.framesRestantes <= 0) laserEffect.activo = false;
        }
    }
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    dibujarEstrellas();
    if (gameRunning) {
        dibujarPalabras();
        dibujarJefe();
        dibujarNave();
        dibujarExplosiones();
        if (laserEffect.activo) {
            ctx.beginPath();
            ctx.moveTo(laserEffect.desdeX, laserEffect.desdeY);
            ctx.lineTo(laserEffect.hastaX, laserEffect.hastaY);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ff00';
            ctx.font = "bold 28px monospace";
            ctx.fillStyle = "#ffff00";
            ctx.fillText(laserEffect.letra.toUpperCase(), laserEffect.hastaX, laserEffect.hastaY - 25);
            ctx.shadowBlur = 0;
        }
        if (ultimaTecla && Date.now() - tiempoTecla < 150) {
            ctx.font = "bold 32px monospace";
            ctx.fillStyle = "#00ff00";
            ctx.shadowBlur = 10;
            ctx.fillText(ultimaTecla.toUpperCase(), nave.x + nave.offsetX + 30, nave.y - 30);
            ctx.shadowBlur = 0;
        }
    }
    requestAnimationFrame(gameLoop);
}

// ================================
//  INICIALIZACIÓN
// ================================
function init() {
    initEstrellas();
    cargarImagenes();
    startButton.addEventListener('click', startGame);
    if (restartButton) restartButton.addEventListener('click', restartGame);
    window.addEventListener('keydown', handleKeyDown);
    gameLoop();
}
init();