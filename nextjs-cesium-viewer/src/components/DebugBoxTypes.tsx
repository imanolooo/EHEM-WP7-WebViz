import { Cartesian3, Color, Entity, Viewer } from "cesium";


// ------
// Debug-box-related


export type Point = {
    x: number;
    y: number;
    z: number;
};

export type Orientation = { // degrees
    heading: number;
    pitch: number;
    roll: number;
}

export type LocalPosition = {
    east: number;  // meters east
    north: number; // meters north
    up: number;    // meters up
};

export type Dimensions = {
    length: number;
    width: number;
    height: number;
};

export type PhaseBoxProps = {
    viewer: Viewer;
    points: Point[];
    color: Color;
    orientation: Orientation;
    localPosition: LocalPosition;
    dimensions: Dimensions;
};

export type PhaseBoxDataType = {
    points: Point[];
    color: Color;
    orientation: Orientation;
    localPosition: LocalPosition;
    dimensions: Dimensions;
};

// export type BoxEntityInfo = {
//     id: string;
//     entity: Entity;
//     position: Cartesian3;
//     orientation: Orientation;
//     dimensions: Dimensions;
// };

// at the end of createBox inside Map.tsx 
// return { // In the structure of type BoxEntityInfo
    //     id: `debugBox-${boxIdCounter}`,
    //     entity: boxEntity,
    //     position: centroid,
    //     orientation: orientation,
    //     dimensions: dimensions
    // };