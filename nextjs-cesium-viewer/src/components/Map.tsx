'use client'    // Client component

import { Ion, createWorldTerrainAsync, Viewer, Cesium3DTileset, Cartesian3, PerspectiveFrustum, defined, Color, PolygonHierarchy, Quaternion, Matrix3, Transforms, HeadingPitchRoll, ConstantProperty, Cartographic, Matrix4, Entity, HeadingPitchRange, Camera } from "cesium";
import { Math as CesiumMath } from 'cesium';
import { useEffect, useRef, useState } from "react";
import Modal from './Modal';

import { phases, phaseIXPoints_main, phaseIXPoints_secondary, phaseXPoints_top, phaseXPoints_bottom, phaseXIPoints, phaseXIIIPoints } from './Phases';
import { PhaseBoxDataType, PhaseBoxProps, Dimensions, LocalPosition, Orientation, Point } from './DebugBoxTypes';

import "cesium/Build/Cesium/Widgets/widgets.css"
import { debug } from "console";


// This is the default access token
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZWYyNTk3YS02M2Q1LTRhZjctODc1NC05NzA5YjlkMGMzNTkiLCJpZCI6MTg1MzUwLCJpYXQiOjE3MDMwMDczNjZ9.D1C9jwUVvtc09v6HJtZ3pWGBzAjA3mQZPaRs8Gis4WY';

const tilesets: Cesium3DTileset[] = [];
let boxIdCounter = 0;
let boxEntities: Entity[] = []; // Global variable to store box entities

export default () => {

    const [isModalOpen, setIsModalOpen] = useState(false); // Handle the modal state
    const [viewer, setViewer] = useState<Viewer>();
    const [phaseBoxes, setPhaseBoxes] = useState<JSX.Element[]>([]);    
    const [selectedPhase, setSelectedPhase] = useState<string | null>('Phase IX'); // Initialize it to Phase IX

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
                var moveSpeed = 1.0;
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
                        CesiumMath.toRadians(100),
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
                // Modal
                // Create a custom button in the Cesium's existing toolbar
                const carouselButton = document.createElement('button');
                carouselButton.classList.add('cesium-button');
                carouselButton.innerHTML = 'GraphMat';    // Open Modal button name

                // Add a click event handler to open the Modal
                carouselButton.addEventListener('click', () => {
                    setIsModalOpen(true);
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
                    const selectedPhaseText = selectedOption.options[selectedOption.selectedIndex].text;

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

                    setSelectedPhase(selectedPhaseText);
                });



                // test 

                // Create the Debug button
                const debugButton = document.createElement('button');
                debugButton.classList.add('cesium-button');
                debugButton.textContent = "Debug";

                // Create the checkbox for the Debug button
                const debugCheckbox = document.createElement('input');
                debugCheckbox.type = 'checkbox';
                debugCheckbox.id = 'debug-checkbox';
                debugCheckbox.checked = false;

                // Append the checkbox next to the Debug button text
                debugButton.appendChild(debugCheckbox);

                // Event listener for Debug button
                debugButton.addEventListener('click', () => {
                    // Toggle the checkbox's checked state
                    debugCheckbox.checked = !debugCheckbox.checked;

                    // Toggle visibility of each box entity
                    boxEntities.forEach(entity => {
                        entity.show = debugCheckbox.checked;
                    });
                });


                // end of test

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

                if (toolbar) {
                    toolbar.insertBefore(debugButton, resetButton);
                }
                
                
                // ------
                // Debug Boxes

                // Define your phase box data array (replace this with actual data)
                const phaseBoxData: PhaseBoxDataType[] = [
                    // Example:
                    // { points: /* ... */, color: /* ... */, orientation: /* ... */, ... }
                    { points: phaseIXPoints_main, color: Color.RED, orientation: { heading: 21, pitch: 6, roll: 6 }, localPosition: { east: -1.0, north: -2.5, up: 0 }, dimensions: { length: 11, width: 6, height: 8 } },
                    { points: phaseIXPoints_secondary, color: Color.RED, orientation: { heading: 21, pitch: 6, roll: 6 }, localPosition: { east: -0.5, north: -2.0, up: 0 }, dimensions: { length: 4.5, width: 4.5, height: 8 } },
                    { points: phaseXPoints_top, color: Color.BLUE, orientation: { heading: 21, pitch: 6, roll: 6 }, localPosition: { east: 0.0, north: -1.8, up: 0 }, dimensions: { length: 13, width: 4, height: 6 } },
                    { points: phaseXPoints_bottom, color: Color.BLUE, orientation: { heading: 21, pitch: 6, roll: 6 }, localPosition: { east: 0.0, north: -4.2, up: 0 }, dimensions: { length: 13, width: 4, height: 6 } },
                    { points: phaseXIPoints, color: Color.GREEN, orientation: { heading: 21, pitch: 6, roll: 6 }, localPosition: { east: -2.0, north: -1.0, up: 0 }, dimensions: { length: 3, width: 6, height: 6 } },
                    { points: phaseXIIIPoints, color: Color.YELLOW, orientation: { heading: 21, pitch: 8, roll: 6 }, localPosition: { east: -1.0, north: -5.0, up: 0 }, dimensions: { length: 6.0, width: 5.0, height: 6 } },   
                ];

                const boxes: JSX.Element[] = phaseBoxData.map((boxData, index) => (
                    <PhaseBox
                        key={`phaseBox-${index}`} // Unique React key for each PhaseBox
                        viewer={viewer}
                        points={boxData.points}
                        color={boxData.color}
                        orientation={boxData.orientation}
                        localPosition={boxData.localPosition}
                        dimensions={boxData.dimensions}
                    />
                ));

                setPhaseBoxes(boxes);


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

            {/* Graphic Material Modal */}
            {/* Return the Image Carousel Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                openModal={() => setIsModalOpen(true)} selectedPhase={selectedPhase}>
            </Modal>

            {/* Conditionally render phaseBoxes */}
            {viewer && phaseBoxes}
        </div>
    );
};



// Debug Box Component
function PhaseBox({ viewer, points, color, orientation, localPosition, dimensions }: PhaseBoxProps) {
    useEffect(() => {
        if (!viewer) return;

        const centroid = calculateCentroid(points.map(p => new Cartesian3(p.x, p.y, p.z)));
        const boxEntity = createBox(viewer, centroid, dimensions, orientation, localPosition, color, 0.5);
        boxEntities.push(boxEntity);

        // Additional logic for each phase
        // .....

    }, [viewer, points, color, orientation, localPosition, dimensions]);

    return null; // This component does not render anything to the DOM
}

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
    
    // Create the box entity and add it to the viewer
    const boxEntity =  viewer.entities.add({
        id: `debugBox-${boxIdCounter++}`,
        position: adjustedPosition,
        orientation: new ConstantProperty(orientationQuaternion),
        box: {
            dimensions: new Cartesian3(dimensions.length, dimensions.width, dimensions.height),
            material: color.withAlpha(alpha),
            outline: true,
            outlineColor: Color.BLACK,
        },
        show: false,    // Hide the box by default
    });

    return boxEntity;  
}
