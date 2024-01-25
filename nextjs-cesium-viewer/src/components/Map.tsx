'use client'    // Client component

import { Ion, createWorldTerrainAsync, Viewer, Cesium3DTileset, Cartesian3, PerspectiveFrustum, defined, Color, PolygonHierarchy, Quaternion, Matrix3, Transforms, HeadingPitchRoll, ConstantProperty, Cartographic, Matrix4, Entity, HeadingPitchRange } from "cesium";
import { Math as CesiumMath } from 'cesium';
import { useEffect, useState } from "react";
import Modal from './Modal';

import "cesium/Build/Cesium/Widgets/widgets.css"


// ------
// Debug-box-related
type Point = {
    x: number;
    y: number;
    z: number;
};

type Orientation = { // degrees
    heading: number;
    pitch: number;
    roll: number;
}

type LocalPosition = {
    east: number;  // meters east
    north: number; // meters north
    up: number;    // meters up
};

type Dimensions = {
    length: number;
    width: number;
    height: number;
};

let boxIdCounter = 0;

type PhaseBoxProps = {
    viewer: Viewer;
    points: Point[];
    color: Color;
    orientation: Orientation;
    localPosition: LocalPosition;
    dimensions: Dimensions;
};

type BoxEntityInfo = {
    id: string;
    entity: Entity;
    position: Cartesian3;
    orientation: Orientation;
    dimensions: Dimensions;
};

// ------
// Phase - related
const phases = [
    { id: 2401793, text: "Phase IX" },
    { id: 2401794, text: "Phase X" },
    { id: 2401797, text: "Phase XI" },
    { id: 2401801, text: "Phase XII" },
    { id: 2401804, text: "Phase XIII" }
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



// This is the default access token
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZWYyNTk3YS02M2Q1LTRhZjctODc1NC05NzA5YjlkMGMzNTkiLCJpZCI6MTg1MzUwLCJpYXQiOjE3MDMwMDczNjZ9.D1C9jwUVvtc09v6HJtZ3pWGBzAjA3mQZPaRs8Gis4WY';

const tilesets: Cesium3DTileset[] = [];

export default () => {

    const [isCarouselOpen, setIsCarouselOpen] = useState(false); // Handle the modal carousel state
    const [viewer, setViewer] = useState<Viewer>();


    // Initialize the Cesium Viewer
    useEffect(() => {
        const initializeViewer = async () => {
            try {
                // Create the Viewer
                const viewer = new Viewer("cesiumContainer", {
                    terrainProvider: await createWorldTerrainAsync(),   // Await the promise
                    timeline: false,    // Disable timebar at the bottom
                    animation: false,    // Disable animation (clock-like) widget
                    creditContainer: document.createElement("none") // Remove the logo and credits of Cesium Ion
                });
                setViewer(viewer);
                const scene = viewer.scene;

                // IX
                const tileset_Phase_IX = await Cesium3DTileset.fromIonAssetId(2401793); // IX
                scene.primitives.add(tileset_Phase_IX);
                tileset_Phase_IX.show = true;
                tilesets.push(tileset_Phase_IX);
                // X
                const tileset_Phase_X = await Cesium3DTileset.fromIonAssetId(2401794); // X
                scene.primitives.add(tileset_Phase_X);
                tileset_Phase_X.show = false;
                tilesets.push(tileset_Phase_X);
                // XI
                const tileset_Phase_XI = await Cesium3DTileset.fromIonAssetId(2401797); // XI
                scene.primitives.add(tileset_Phase_XI);
                tileset_Phase_XI.show = false;
                tilesets.push(tileset_Phase_XI);
                // XII
                const tileset_Phase_XII = await Cesium3DTileset.fromIonAssetId(2401801); // XII
                scene.primitives.add(tileset_Phase_XII);
                tileset_Phase_XII.show = false;
                tilesets.push(tileset_Phase_XII);
                // XIII
                const tileset_Phase_XIII = await Cesium3DTileset.fromIonAssetId(2401804); // XIII
                scene.primitives.add(tileset_Phase_XIII);
                tileset_Phase_XIII.show = false;
                tilesets.push(tileset_Phase_XIII);

                // ------
                // Camera settings
                await viewer.zoomTo(tileset_Phase_IX);
                // await viewer.zoomTo(tilesetExterior);
                viewer.camera.position = new Cartesian3(4736954.40901528, 155726.14313851847, 4254884.18938475);
                viewer.camera.direction = new Cartesian3(-0.42410389201848225, 0.8530220500056251, 0.30412048760150384);
                viewer.camera.up = new Cartesian3(0.7062752621207551, 0.10134975317909911, 0.7006450468295589);
                scene.camera.frustum = new PerspectiveFrustum({
                  fov: 1.4,
                  aspectRatio: viewer.canvas.clientWidth / viewer.canvas.clientHeight,
                  near: 1.0,
                  far: 500000000.0
                })    // default viewer's camera PerspectiveFrustum values (https://cesium.com/learn/cesiumjs/ref-doc/PerspectiveFrustum.html)
                scene.screenSpaceCameraController.enableCollisionDetection = false;

                // Set up variables for camera controls
                var moveSpeed = 2.0;
                // Add keyboard event listener for WASD movement
                document.addEventListener('keydown', function (e) {
                    if (e.key === 'w' || e.key === 'W')
                        viewer.camera.moveForward(moveSpeed);
                    else if (e.key === 's' || e.key === 'S')
                        viewer.camera.moveBackward(moveSpeed);
                    else if (e.key === 'a' || e.key === 'A')
                        viewer.camera.moveLeft(moveSpeed);
                    else if (e.key === 'd' || e.key === 'D')
                        viewer.camera.moveRight(moveSpeed);
                    else if (e.key === 'q' || e.key === 'Q')
                        viewer.camera.moveUp(moveSpeed);
                    else if (e.key === 'e' || e.key === 'E')
                        viewer.camera.moveDown(moveSpeed);
                });

                const resetCamera = () => {
                const primitives = viewer.scene.primitives;
        
                for (let i = 0; i < primitives.length; i++) {
                    const primitive = primitives.get(i);
        
                    if (primitive instanceof Cesium3DTileset) {
                    viewer.flyTo(primitive, {
                        offset: new HeadingPitchRange(
                        CesiumMath.toRadians(-35),
                        CesiumMath.toRadians(0),
                        35
                        ),
                    });
                    }
                }
                };

                const resetButton = document.createElement('button');
                resetButton.textContent = "Reset Camera";
                resetButton.classList.add('cesium-button');
                resetButton.addEventListener("click", () => {
                    resetCamera();
                });
                viewer.container.appendChild(resetButton);

                
                // ------
                // Carousel
                // Create a custom button in the Cesium's existing toolbar
                const carouselButton = document.createElement('button');
                carouselButton.classList.add('cesium-button');
                carouselButton.innerHTML = 'GraphMat';    // Open Carousel button name

                // Add a click event handler to open the Carousel
                carouselButton.addEventListener('click', () => {
                    setIsCarouselOpen(true);
                });  


                // ------
                // Phases Dropdown Menu
                const phasesDropdown = document.createElement('select');
                phasesDropdown.id = 'toolbar';
                phasesDropdown.classList.add('cesium-button');
                phasesDropdown.innerHTML = 'Phases';    // Phases Toolbar button name

                // Populate dropdown with options
                phases.forEach(phase => {
                    const option = document.createElement('option');
                    option.value = phase.id.toString();
                    option.textContent = phase.text;
                    phasesDropdown.appendChild(option);
                });

                // Dropdown event listener
                phasesDropdown.addEventListener('change', (event) => {
                    const selectedOption = event.target as HTMLSelectElement;
                    const selectedPhaseId = parseInt(selectedOption.value); // Translate it to int

                    // Hide all the phase tilesets
                    for (let tileset of tilesets) {
                        tileset.show = false;
                    }

                    // Show the selected phase tileset
                    if (selectedPhaseId == 2401793) {
                        tileset_Phase_IX.show = true;
                    }
                    else if (selectedPhaseId == 2401794) {
                        tileset_Phase_X.show = true;
                    }
                    else if (selectedPhaseId == 2401797) {
                        tileset_Phase_XI.show = true;
                    }
                    else if (selectedPhaseId == 2401801) {
                        tileset_Phase_XII.show = true;
                    }
                    else if (selectedPhaseId == 2401804) {
                        tileset_Phase_XIII.show = true;
                    }
                });

                // ------
                // Toolbar 

                // Get the Cesium toolbar container element
                const toolbar = viewer.container.querySelector('.cesium-viewer-toolbar');

                // Insert GM Carousel button before the existing buttons
                if (toolbar) {
                    const modeButton = toolbar.querySelector('.cesium-viewer-geocoderContainer');
                    toolbar.insertBefore(carouselButton, modeButton);
                }

                // Insert the Phases Dropdown toolbar before the GM Carousel
                if (toolbar) {
                    toolbar.insertBefore(phasesDropdown, carouselButton);
                }
                
                if (toolbar) {
                    toolbar.insertBefore(resetButton, phasesDropdown);
                }

            } catch (error) {
                console.log(error);
            }
        };

        initializeViewer();
    }, []);
    
    return (
        <div>
            {/* Cesium */}
            {/* Return the Cesium Viewer */}
            <div id="cesiumContainer" />

            {/* Debug Boxes */}

            {/* Phase IX */}
            {viewer && <PhaseBox viewer={viewer} points={phaseIXPoints_main} color={Color.RED}
            orientation={{ heading: 21, pitch: 6, roll: 6 }}
            localPosition={{ east: -1.0, north: -2.5, up: 0 }} dimensions={{ length: 11, width: 6, height: 8 }} />}
            {viewer && <PhaseBox viewer={viewer} points={phaseIXPoints_secondary} color={Color.RED}
            orientation={{ heading: 21, pitch: 6, roll: 6 }}
            localPosition={{ east: -0.5, north: -2.0, up: 0 }} dimensions={{ length: 4.5, width: 4.5, height: 8 }} />}
                
            {/* Phase X */}
            {viewer && <PhaseBox viewer={viewer} points={phaseXPoints_top} color={Color.BLUE} 
            orientation={{ heading: 21, pitch: 6, roll: 6 }}
            localPosition={{ east: 0.0, north: -1.8, up: 0 }} dimensions={{ length: 13, width: 4, height: 6 }} />}
            {viewer && <PhaseBox viewer={viewer} points={phaseXPoints_bottom} color={Color.BLUE} 
            orientation={{ heading: 21, pitch: 6, roll: 6 }}
            localPosition={{ east: 0.0, north: -4.2, up: 0 }} dimensions={{ length: 13, width: 4, height: 6 }} />}

            {/* Phase XI */}
            {viewer && <PhaseBox viewer={viewer} points={phaseXIPoints} color={Color.GREEN}
            orientation={{ heading: 21, pitch: 6, roll: 6 }}
            localPosition={{ east: -2.0, north: -1.0, up: 0 }} dimensions={{ length: 3, width: 6, height: 6 }} />}

            {/* Phase XIII */}
            {viewer && <PhaseBox viewer={viewer} points={phaseXIIIPoints} color={Color.YELLOW}
            orientation={{ heading: 21, pitch: 8, roll: 6 }}
            localPosition={{ east: -1.0, north: -5.0, up: 0 }} dimensions={{ length: 6.0, width: 5.0, height: 6 }} />}

            {/* Graphic Material Modal */}
            {/* Return the Image Carousel Modal */}
            <Modal isOpen={isCarouselOpen} onClose={() => setIsCarouselOpen(false)} openModal={() => setIsCarouselOpen(true)}>
            </Modal>

           
        </div>
    );
};


// Function to calculate the centroid of the 4 corners
function calculateCentroid(points: any[]) {
    let sumX = 0, sumY = 0, sumZ = 0;
    points.forEach(point => {
        sumX += point.x;
        sumY += point.y;
        sumZ += point.z;
    });
    return new Cartesian3(sumX / points.length, sumY / points.length, sumZ / points.length);
}

// Create the debug box
function createBox(viewer: Viewer, centroid: Cartesian3, dimensions: Dimensions,
    orientation: Orientation, localPosition: LocalPosition, color: Color, alpha: number) {

    const heading = CesiumMath.toRadians(orientation.heading);
    const pitch = CesiumMath.toRadians(orientation.pitch);
    const roll = CesiumMath.toRadians(orientation.roll);

    const hpr = new HeadingPitchRoll(heading, pitch, roll);
    const localFrame = Transforms.eastNorthUpToFixedFrame(centroid);

    const localOffset = new Cartesian3(localPosition.east, localPosition.north, localPosition.up);
    const adjustedPosition = Matrix4.multiplyByPoint(localFrame, localOffset, new Cartesian3());

    const orientationQuaternion = Transforms.headingPitchRollQuaternion(adjustedPosition, hpr);

    const boxEntity =  viewer.entities.add({
        id: `debugBox-${boxIdCounter++}`,
        position: adjustedPosition,
        orientation: new ConstantProperty(orientationQuaternion),
        box: {
            dimensions: new Cartesian3(dimensions.length, dimensions.width, dimensions.height),
            material: color.withAlpha(alpha),
            outline: true,
            outlineColor: Color.BLACK,
        }
    });

    return { // In the structure of type BoxEntityInfo
        id: `debugBox-${boxIdCounter++}`,
        entity: boxEntity,
        position: centroid,
        orientation: orientation,
        dimensions: dimensions
    };
}

// Debug Box Component
function PhaseBox({ viewer, points, color, orientation, localPosition, dimensions }: PhaseBoxProps) {
    useEffect(() => {
        if (!viewer) return;

        const centroid = calculateCentroid(points.map(p => new Cartesian3(p.x, p.y, p.z)));
        const boxEntity = createBox(viewer, centroid, dimensions, orientation, localPosition, color, 0.5);

        // Additional logic for each phase
        // .....

    }, [viewer, points, color, orientation, localPosition, dimensions]);

    return null; // This component does not render anything to the DOM
}


// Function to check if the camera is inside a box
// function isCameraInsideBox(cameraPosition: Cartesian3, debugBoxes: BoxEntityInfo[]) {
//     for (const box of debugBoxes) {
//         const boxEntity = box.entity;
//         const boxDimensions = box.dimensions; // Assuming this is a Cartesian3 object with box dimensions

//         // Create a transformation matrix from the box's orientation and position
//         const hpr = HeadingPitchRoll.fromQuaternion(boxEntity.orientation);
//         const transformMatrix = Transforms.headingPitchRollToFixedFrame(boxEntity.position, hpr);

//         // Invert the transformation matrix
//         const inverseTransform = Matrix4.inverse(transformMatrix, new Matrix4());

//         // Transform the camera position into the box's local space
//         const localCameraPosition = Matrix4.multiplyByPoint(inverseTransform, cameraPosition, new Cartesian3());

//         // Half dimensions of the box
//         const halfDimensions = Cartesian3.multiplyByScalar(new Cartesian3(boxDimensions.length, boxDimensions.width, boxDimensions.height), 0.5, new Cartesian3());

//         // Check if the local camera position falls within the box's dimensions
//         if (Math.abs(localCameraPosition.x) <= halfDimensions.x &&
//             Math.abs(localCameraPosition.y) <= halfDimensions.y &&
//             Math.abs(localCameraPosition.z) <= halfDimensions.z) {
//             console.log(`Camera is inside box: ${box.id}`);
//             return box.id; // Return the ID of the box the camera is inside
//         }
//     }
//     return null; // Return null if the camera is not inside any box
// }

