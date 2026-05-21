// Base de datos de palabras por nivel e idioma
const WORDS_DB = {
    // Niveles 1-2: Español
    1: {
        language: "Español",
        words: ["SOL", "LUNA", "NAVE", "ESTRELLA", "GALAXIA", "COMETA", "ASTEROIDE", "ORION", "SATURNO", "MARTE"],
        boss: "EL CIELO ESTRELLADO"
    },
    2: {
        language: "Español",
        words: ["TELESCOPIO", "NEBULOSA", "SUPERNOVA", "GRAVEDAD", "ORBITA", "ECLIPSE", "METEORO", "COSMOS", "UNIVERSO", "VIA LACTEA"],
        boss: "LA EXPLORACION ESPACIAL"
    },
    
    // Niveles 3-4: Inglés
    3: {
        language: "Inglés",
        words: ["STAR", "MOON", "ROCKET", "PLANET", "ORBIT", "SOLAR", "SPACE", "COSMIC", "NEBULA", "ASTEROID"],
        boss: "THE FINAL FRONTIER"
    },
    4: {
        language: "Inglés",
        words: ["GALAXY", "TELESCOPE", "SATELLITE", "GRAVITY", "ATMOSPHERE", "EXPLORATION", "INTERSTELLAR", "SUPERNOVA", "BLACKHOLE", "ANDROMEDA"],
        boss: "BEYOND THE UNIVERSE"
    },
    
    // Niveles 5-6: Portugués
    5: {
        language: "Português",
        words: ["ESTRELA", "NAVE", "COMETA", "PLANETA", "ORBITA", "SATURNO", "MARTE", "JUPITER", "URANO", "NETUNO"],
        boss: "EXPLORAÇÃO ESTELAR"
    },
    6: {
        language: "Português",
        words: ["GALÁXIA", "TELESCÓPIO", "ASTEROIDE", "GRAVIDADE", "NEBULOSA", "SUPERNOVA", "COSMOS", "UNIVERSO", "CONSTELAÇÃO", "BURACO NEGRO"],
        boss: "VIAGEM INTERGALÁCTICA"
    },
    
    // Niveles 7-8: Aimara (Aymara)
    7: {
        language: "Aymara",
        words: ["ALAXA", "ARUMA", "URU", "PACHA", "WARA", "PHATHA", "K'AYRA", "JACH'A", "QHANTATA", "ILLAPA"],
        boss: "ALAX PACHA"
    },
    8: {
        language: "Aymara",
        words: ["WILA", "QHANTU", "ANATA", "MARKA", "QULLA", "THAYA", "CH'AMAKA", "PHUYSI", "JALLU", "CHHUKU"],
        boss: "JACH'A QHANTU"
    },
    
    // Niveles 9-10: Mezcla + velocidad alta
    9: {
        language: "Mezcla",
        words: ["ESTRELLA", "GALAXY", "COMETA", "UNIVERSO", "STARDUST", "NEBULOSA", "COSMOS", "PLANETA", "ORBIT", "METEORITO"],
        boss: "COSMIC VOYAGE"
    },
    10: {
        language: "Mezcla",
        words: ["SUPERNOVA", "GRAVEDAD", "TELESCOPIO", "SATELLITE", "ATMOSPHERE", "EXPLORATION", "CONSTELLATION", "ANDROMEDA", "BURACO NEGRO", "SUPERMASSIVE"],
        boss: "THE ETERNAL COSMOS"
    }
};

// Trabalenguas para power-ups
const TONGUE_TWISTERS = [
    "tres tristes tigres",
    "pablito clavo un clavito",
    "el cielo está enladrillado",
    "como poco coco como",
    "pepe pecas pica papas",
    "erre con erre cigarro",
    "eres un lento lamento",
    "trabalenguas trabajoso",
    "el volcán de Parangaricutirimícuaro",
    "rapidas palabras rapidas"
];

// Función para obtener palabras de un nivel
function getWordsForLevel(level) {
    const levelData = WORDS_DB[level];
    if (!levelData) return WORDS_DB[10]; // Máximo nivel
    
    return {
        language: levelData.language,
        words: [...levelData.words],
        boss: levelData.boss
    };
}

// Obtener trabalengua aleatorio
function getRandomTongueTwister() {
    return TONGUE_TWISTERS[Math.floor(Math.random() * TONGUE_TWISTERS.length)];
}