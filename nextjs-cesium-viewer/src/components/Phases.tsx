// ------
// Phase-related
//     // Tilesets
//     // { id: 2477247, text: "Phase IX" },
//     // { id: 2477248, text: "Phase X" },
//     // { id: 2477249, text: "Phase XI" },
//     // { id: 2477250, text: "Phase XII" },
//     // { id: 2477251, text: "Phase XIII" }

//     // GLB models
//     // { id: 2486360, text: "Phase IX" },
//     // { id: 2486363, text: "Phase X" },
//     // { id: 2486367, text: "Phase XI" },
//     // { id: 2486368, text: "Phase XII" },
//     // { id: 2486372, text: "Phase XIII" }

export const phasesInfo = [
    // GLB models (new - translated origin - no Draco)
    /*{ id: 2504193, text: "Phase IX" },
    { id: 2504189, text: "Phase X" },
    { id: 2504192, text: "Phase XI" },
    { id: 2504191, text: "Phase XII" },
    { id: 2504190, text: "Phase XIII" },
    // 3D Tilset -> NO TILESET
    { id: 2533920, text: "Phase XXI" }*/
    /*{ id: 2536536, text: "Phase IXth cent." },
    { id: 2536537, text: "Phase Xth cent." },
    { id: 2536538, text: "Phase XIth cent." },
    { id: 2536539, text: "Phase XIIth cent." },
    { id: 2536540, text: "Phase XIIIth cent." },
    { id: 2540789, text: "Phase XXIth cent." }*/
    { id: 2540856, text: "Phase IXth cent." },
    { id: 2540857, text: "Phase Xth cent." },
    { id: 2540858, text: "Phase XIth cent." },
    { id: 2540859, text: "Phase XIIth cent." },
    { id: 2540862, text: "Phase XIIIth cent." },
    { id: 2540819, text: "Phase XXIth cent." }
];


// Phase IX
export const phaseIXPoints_main = [
    { x: 4736921.275051899, y: 155780.7992326276,  z: 4254903.635465469 },   // 1
    { x: 4736919.078558417, y: 155782.5448048238,  z: 4254906.701666768 },   // 2
    { x: 4736921.551735409, y: 155791.415475381,   z: 4254903.598241987 },   // 3
    { x: 4736923.238670296, y: 155789.02869342198, z: 4254900.048742468 },   // 4
];
export const phaseIXPoints_secondary = [
    { x: 4736921.551735409, y: 155791.415475381,   z: 4254903.598241987 },  // 3
    { x: 4736923.238670296, y: 155789.02869342198, z: 4254900.048742468 },  // 4
    { x: 4736923.304626978, y: 155795.59219304976, z: 4254902.326165935 },  // 5
    { x: 4736925.156289683, y: 155794.501318515,   z: 4254900.056746761 },  // 6
];

// Phase X
export const phaseXPoints_top = [
    { x: 4736919.078558417,  y: 155782.5448048238,  z: 4254906.701666768 },   // 2
    { x: 4736917.442880731,  y: 155784.0460917098,  z: 4254909.354462574 },   // 7
    { x: 4736919.4644265305, y: 155793.10161341645, z: 4254906.700814347 },   // 8
    { x: 4736921.551735409,  y: 155791.415475381,   z: 4254903.598241987 },   // 3
];

export const phaseXPoints_bottom = [
    { x: 4736921.275051899,  y: 155780.7992326276,  z: 4254903.635465469 },  // 1
    { x: 4736926.3798482595, y: 155778.7703270956,  z: 4254899.582549576 },  // 10
    { x: 4736926.620684734,  y: 155788.50797998527, z: 4254897.801063492 },  // 11
    { x: 4736921.551735409,  y: 155791.415475381,   z: 4254903.598241987 },  // 4
];

// Phase XI (same outline as Phase XII)
export const phaseXIPoints = [
    { x: 4736921.275051899, y: 155780.7992326276,  z: 4254903.635465469 },  // 1
    { x: 4736919.078558417, y: 155782.5448048238,  z: 4254906.701666768 },  // 2
    { x: 4736920.373439955, y: 155780.1964367563,  z: 4254906.295053598},   // 13
    { x: 4736923.35886236,  y: 155778.54841953184, z: 4254902.473716368 },  // 14
];


// Phase XIII
export const phaseXIIIPoints = [
    { x: 4736923.490581084, y: 155788.0811738723,  z: 4254901.063082168 },  // 15
    { x: 4736925.953476667, y: 155786.66641559973, z: 4254898.420621295 },  // 16
    { x: 4736926.620684734, y: 155788.50797998527, z: 4254897.801063492 },  // 11
    { x: 4736921.551735409, y: 155791.415475381,   z: 4254903.598241987 },  // 4
];