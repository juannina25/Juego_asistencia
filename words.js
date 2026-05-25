// Base de datos de palabras por nivel e idioma
const WORDS_DB = {
    // Niveles 1-2: Español
    1: {
        language: "Español",
        words: ["SOL", "LUNA", "NAVE", "ESTRELLA", "GALAXIA", "COMETA", "ASTEROIDE", "ORION", "SATURNO", "MARTE", "JUPITER", "URANO"],
        boss: "EL CIELO ESTRELLADO"
    },
    2: {
        language: "Español",
        words: ["TELESCOPIO", "NEBULOSA", "SUPERNOVA", "GRAVEDAD", "ORBITA", "ECLIPSE", "METEORO", "COSMOS", "UNIVERSO", "VIA LACTEA", "AGUJERO NEGRO", "ENANA BLANCA"],
        boss: "LA EXPLORACION ESPACIAL"
    },
    
    // Niveles 3-4: Inglés
    3: {
        language: "Inglés",
        words: ["STAR", "MOON", "ROCKET", "PLANET", "ORBIT", "SOLAR", "SPACE", "COSMIC", "NEBULA", "ASTEROID", "COMET", "MARS"],
        boss: "THE FINAL FRONTIER"
    },
    4: {
        language: "Inglés",
        words: ["GALAXY", "TELESCOPE", "SATELLITE", "GRAVITY", "ATMOSPHERE", "EXPLORATION", "INTERSTELLAR", "SUPERNOVA", "BLACKHOLE", "ANDROMEDA", "MILKY WAY", "LIGHT YEAR"],
        boss: "BEYOND THE UNIVERSE"
    },
    
    // Niveles 5-6: Portugués
    5: {
        language: "Português",
        words: ["ESTRELA", "NAVE", "COMETA", "PLANETA", "ORBITA", "SATURNO", "MARTE", "JUPITER", "URANO", "NETUNO", "SOL", "LUA"],
        boss: "EXPLORAÇÃO ESTELAR"
    },
    6: {
        language: "Português",
        words: ["GALÁXIA", "TELESCÓPIO", "ASTEROIDE", "GRAVIDADE", "NEBULOSA", "SUPERNOVA", "COSMOS", "UNIVERSO", "CONSTELAÇÃO", "BURACO NEGRO", "ESTRELA CADENTE", "SATÉLITE"],
        boss: "VIAGEM INTERGALÁCTICA"
    },
    
    // Niveles 7-8: Aimara (Aymara)
    7: {
        language: "Aymara",
        words: ["ALAXA", "ARUMA", "URU", "PACHA", "WARA", "PHATHA", "K'AYRA", "JACH'A", "QHANTATA", "ILLAPA", "WILA", "THAYA"],
        boss: "ALAX PACHA"
    },
    8: {
        language: "Aymara",
        words: ["WILA", "QHANTU", "ANATA", "MARKA", "QULLA", "THAYA", "CH'AMAKA", "PHUYSI", "JALLU", "CHHUKU", "K'ARI", "P'IQI"],
        boss: "JACH'A QHANTU"
    },
    
    // Niveles 9-10: Mezcla + velocidad alta
    9: {
        language: "Mezcla",
        words: ["ESTRELLA", "GALAXY", "COMETA", "UNIVERSO", "STARDUST", "NEBULOSA", "COSMOS", "PLANETA", "ORBIT", "METEORITO", "ASTEROID", "ESPACIO"],
        boss: "COSMIC VOYAGE"
    },
    10: {
        language: "Mezcla",
        words: ["SUPERNOVA", "GRAVEDAD", "TELESCOPIO", "SATELLITE", "ATMOSPHERE", "EXPLORATION", "CONSTELLATION", "ANDROMEDA", "BURACO NEGRO", "SUPERMASSIVE", "INTERGALACTIC", "COSMIC VOYAGE"],
        boss: "THE ETERNAL COSMOS"
    }
};

// Palabras difíciles para vidas extra (máximo 15 caracteres)
const HARD_WORDS = [
    "EXTRATERRESTRE",
    "INCONSTITUCIONAL",
    "ELECTRODOMESTICO",
    "CIRCUNLOQUIO",
    "PARADIGMATICO",
    "MAGNANIMAMENTE",
    "INCONSECUENTE",
    "DESAFORTUNADO",
    "EXTRAORDINARIO",
    "INVEROSIMIL",
    "CONTRADICCION",
    "INDEPENDIENTE",
    "RESPLANDECIENTE",
    "TRASCENDENTAL",
    "MULTIDIMENSIONAL"
];

// Trabalenguas para jefes
const TONGUE_TWISTERS = [
    "TRES TRISTES TIGRES",
    "PABLITO CLAVO UN CLAVITO",
    "EL CIELO ESTA ENLADRILLADO",
    "COMO POCO COCO COMO",
    "PEPE PECAS PICA PAPAS",
    "ERRE CON ERRE CIGARRO",
    "ERES UN LENTO LAMENTO",
    "TRABALENGUAS TRABAJOSO",
    "EL VOLCAN DE PARANGARICUTIRIMICUARO",
    "RAPIDAS PALABRAS RAPIDAS",
    "TRES TIGRES TRIGO TRAGABAN",
    "PAN PAN VINO VINO"
];

// Función para obtener palabras de un nivel
function getWordsForLevel(level) {
    const levelData = WORDS_DB[level];
    if (!levelData) return WORDS_DB[10];
    
    return {
        language: levelData.language,
        words: [...levelData.words],
        boss: levelData.boss
    };
}

// Obtener palabra difícil aleatoria
function getRandomHardWord() {
    return HARD_WORDS[Math.floor(Math.random() * HARD_WORDS.length)];
}

// Obtener trabalengua aleatorio para jefe
function getRandomTongueTwister() {
    return TONGUE_TWISTERS[Math.floor(Math.random() * TONGUE_TWISTERS.length)];
}