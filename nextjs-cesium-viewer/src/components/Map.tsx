'use client'    // Client component

import { Ion, createWorldTerrainAsync, Viewer, Cesium3DTileset, Cartesian3, PerspectiveFrustum, Color, Transforms, HeadingPitchRoll, ConstantProperty, Matrix4, Entity, HeadingPitchRange, DirectionalLight, Light, Sun, PostProcessStage, Cesium3DTileStyle, Cesium3DTileColorBlendMode, PointPrimitive, IonResource } from "cesium";
import { Math as CesiumMath } from 'cesium';
import { useEffect, useState } from "react";
import Modal from './Modal';

import { phases, phaseIXPoints_main, phaseIXPoints_secondary, phaseXPoints_top, phaseXPoints_bottom, phaseXIPoints, phaseXIIIPoints } from './Phases';
import { PhaseBoxDataType, PhaseBoxProps, Dimensions, LocalPosition, Orientation, Point } from './DebugBoxTypes';

import "cesium/Build/Cesium/Widgets/widgets.css"
import { config } from "process";
import test from "node:test";

// This is the default access token
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YTEzMWI1ZS05NmIxLTQ4NDEtYWUzZC04OTU4NmE1YTc2ZDUiLCJpZCI6MTg1MzUwLCJpYXQiOjE3MDI5OTc0MDR9.LtVjMcGUML_mgWbk5GwdseCcF_nYM-xTc3j5q0TrDBw';

const tilesets: Cesium3DTileset[] = [];
let boxIdCounter = 0;
let boxEntities: Entity[] = []; // Global variable to store box entities


const Map = () => {
    const [cameraConfig, setCameraConfig] = useState({});

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
                const primitives = viewer.scene.primitives;

                // // ------
                // // Tilesets settings

                // const tilesetStyleIncreasedColor = new Cesium3DTileStyle({
                //     color: 'vec4(2.0, 2.0, 2.0, 3.0)', 
                // });

                // // IX
                // // id: 2470191
                // // const tileset_Phase_IX = await Cesium3DTileset.fromIonAssetId(2401793); // IX
                // const tileset_Phase_IX = await Cesium3DTileset.fromIonAssetId(2474014); // IX
                // primitives.add(tileset_Phase_IX);
                // tileset_Phase_IX.show = true;
                // tilesets.push(tileset_Phase_IX);
                // // X
                // const tileset_Phase_X = await Cesium3DTileset.fromIonAssetId(2401794); // X
                // primitives.add(tileset_Phase_X);
                // tileset_Phase_X.show = false;
                // tileset_Phase_X.style = tilesetStyleIncreasedColor;
                // tilesets.push(tileset_Phase_X);
                // // XI
                // const tileset_Phase_XI = await Cesium3DTileset.fromIonAssetId(2401797); // XI
                // primitives.add(tileset_Phase_XI);
                // tileset_Phase_XI.show = false;
                // tileset_Phase_XI.style = tilesetStyleIncreasedColor;
                // tilesets.push(tileset_Phase_XI);
                // // XII
                // const tileset_Phase_XII = await Cesium3DTileset.fromIonAssetId(2401801); // XII
                // primitives.add(tileset_Phase_XII);
                // tileset_Phase_XII.show = false;
                // tileset_Phase_XII.style = tilesetStyleIncreasedColor;
                // tilesets.push(tileset_Phase_XII);
                // // XIII
                // const tileset_Phase_XIII = await Cesium3DTileset.fromIonAssetId(2401804); // XIII
                // primitives.add(tileset_Phase_XIII);
                // tileset_Phase_XIII.show = false;
                // tileset_Phase_XIII.style = tilesetStyleIncreasedColor;
                // tileset_Phase_XIII.maximumScreenSpaceError = 11;
                // tilesets.push(tileset_Phase_XIII);

                // test

                // const position = Cartesian3.fromDegrees(
                //     1.8835915438,
                //     42.1074826297,
                //     644.889999998
                // );
                // const heading = CesiumMath.toRadians(21.5+90);
                // const pitch = CesiumMath.toRadians(-8.5);
                // const roll = CesiumMath.toRadians(6);
                // const hpr = new HeadingPitchRoll(heading, pitch, roll);
                // const orientation = Transforms.headingPitchRollQuaternion(
                //     position,
                //     hpr
                // );

                // const test_model = await IonResource.fromAssetId(2474038);
                // console.log(test_model);
                // const entity = viewer.entities.add({
                //     name: 'test_model',
                //     position: position,
                //     model: {
                //         uri: test_model,
                //     },
                // });
                // console.log(entity);
                
                // viewer.trackedEntity = entity;

                // end of test


                // ------
                // Camera settings

                // await viewer.zoomTo(tileset_Phase_IX);
                // await viewer.zoomTo(entity);
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
                // Light settings

                viewer.shadows = false; // Disable shadows
                // Create directional light
                const dirLightIntensity = 3.0;
                const dirLightInitialDirection = new Cartesian3(
                    viewer.camera.direction.x,
                    viewer.camera.direction.y,
                    viewer.camera.direction.z,
                );
                let dirLightDirection = dirLightInitialDirection;
                
                const dirLight = new DirectionalLight({
                    direction: Cartesian3.normalize(
                        dirLightDirection,
                        new Cartesian3()),
                    intensity: dirLightIntensity, 
                    color: Color.WHITE 
                });

                // Set the light to the scene
                scene.light = dirLight;
                scene.light.intensity = 2.0; // Default light intensity

                // Create the toggle light button
                const lightToggle = document.createElement('button');
                lightToggle.classList.add('cesium-button');
                lightToggle.textContent = "Light";

                // Create the checkbox for the toggle light button
                const checkboxLight = document.createElement('input');
                checkboxLight.type = 'checkbox';
                checkboxLight.id = 'toggle-light-checkbox';
                checkboxLight.style.justifyItems = 'center';
                checkboxLight.style.alignSelf = 'center'; 
                checkboxLight.checked = false;

                lightToggle.appendChild(checkboxLight);

                // test

                const updateLightDirection = () => {
                    const cameraDirection = viewer.camera.direction;
                    dirLight.direction = new Cartesian3(
                        cameraDirection.x,
                        cameraDirection.y,
                        cameraDirection.z
                    );
                };

                // end of test

                // Event listener for toggle light button
                lightToggle.addEventListener('click', () => {
                    // Toggle the checkbox's checked state
                    checkboxLight.checked = !checkboxLight.checked;
                    // Toggle the light intensity between our custom value and the default value (2.0)

                    // Toggle/Update the direction and intensity of light every frame
                    if(checkboxLight.checked){
                        scene.light.intensity = dirLightIntensity;
                        viewer.scene.postRender.addEventListener(updateLightDirection);
                    } else {
                        scene.light.intensity = 2.0;
                        viewer.scene.postRender.removeEventListener(updateLightDirection);
                        dirLightDirection = dirLightInitialDirection;
                    }
                });


                // ------
                // Modal settings

                // Create a custom button in the Cesium's existing toolbar
                const carouselButton = document.createElement('button');
                carouselButton.classList.add('cesium-button');
                carouselButton.innerHTML = 'GraphMat';    // Open Modal button name

                // Add a click event handler to open the Modal
                carouselButton.addEventListener('click', () => {
                    setIsModalOpen(true);
                });  


                // ------
                // Phases Dropdown Menu settings
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

                // // Dropdown event listener
                // phasesDropdown.addEventListener('change', (event) => {
                //     const selectedOption = event.target as HTMLSelectElement;
                //     const selectedPhaseId = parseInt(selectedOption.value); // Translate it to int
                //     const selectedPhaseText = selectedOption.options[selectedOption.selectedIndex].text;

                //     // Hide all the phase tilesets
                //     for (let tileset of tilesets) {
                //         tileset.show = false;
                //     }

                //     // Show the selected phase tileset
                //     if (selectedPhaseId == 2401793) {
                //         tileset_Phase_IX.show = true;
                //     }
                //     else if (selectedPhaseId == 2401794) {
                //         tileset_Phase_X.show = true;
                //     }
                //     else if (selectedPhaseId == 2401797) {
                //         tileset_Phase_XI.show = true;
                //     }
                //     else if (selectedPhaseId == 2401801) {
                //         tileset_Phase_XII.show = true;
                //     }
                //     else if (selectedPhaseId == 2401804) {
                //         tileset_Phase_XIII.show = true;
                //     }

                //     setSelectedPhase(selectedPhaseText);
                // });

                // Create the Debug button
                const toggleDebug = document.createElement('button');
                toggleDebug.classList.add('cesium-button');
                toggleDebug.textContent = "Debug";

                // Create the checkbox for the Debug button
                const checkboxDebug = document.createElement('input');
                checkboxDebug.type = 'checkbox';
                checkboxDebug.id = 'toggle-checkbox';
                checkboxDebug.checked = false;

                // Append the checkbox next to the Debug button text
                toggleDebug.appendChild(checkboxDebug);

                // Event listener for Debug button
                toggleDebug.addEventListener('click', () => {
                    // Toggle the checkbox's checked state
                    checkboxDebug.checked = !checkboxDebug.checked;

                    // Toggle visibility of each box entity
                    boxEntities.forEach(entity => {
                        entity.show = checkboxDebug.checked;
                    });
                });
                

                // ------
                // Debug Boxes settings

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


                // ------
                // Toolbar settings

                // Get the Cesium toolbar container element
                const toolbar = viewer.container.querySelector('.cesium-viewer-toolbar');
                
                if (toolbar) {
                    // Insert GM Carousel button before the existing buttons
                    const modeButton = toolbar.querySelector('.cesium-viewer-geocoderContainer');
                    toolbar.insertBefore(carouselButton, modeButton);
                    // Insert the Phases Dropdown toolbar before the GM Carousel
                    toolbar.insertBefore(phasesDropdown, carouselButton);
                    // Insert the Reset Camera button before the Phases Dropdown
                    toolbar.insertBefore(resetButton, phasesDropdown);
                    // Insert the Debug button before the Reset Camera
                    toolbar.insertBefore(toggleDebug, resetButton);
                    // Insert the Light button before the Debug button
                    toolbar.insertBefore(lightToggle, toggleDebug);
                }   


            } catch (error) {
                console.log(error);
            }
        };

        initializeViewer();
    }, []); 

    // Add the button after the viewer has been initialized
    useEffect(() => {
        if (viewer) {
            // Function to log camera configurations in JSON format
            const logCameraConfig = () => {
                const camera = viewer.camera;
                const cameraConfig = {
                    position: {
                        x: camera.position.x,
                        y: camera.position.y,
                        z: camera.position.z
                    },
                    direction: {
                        x: camera.direction.x,
                        y: camera.direction.y,
                        z: camera.direction.z
                    },
                    up: {
                        x: camera.up.x,
                        y: camera.up.y,
                        z: camera.up.z
                    },
                    frustum: {
                        fov: (camera.frustum as PerspectiveFrustum).fov,
                        aspectRatio: (camera.frustum as PerspectiveFrustum).aspectRatio,
                        near: camera.frustum.near,
                        far: camera.frustum.far
                    }
                };
                // Convert cameraConfig object to JSON string with pretty print
                const cameraConfigStr = JSON.stringify(cameraConfig, null, 2);
                console.log(cameraConfigStr);
                // Create a Blob from the JSON string
                const blob = new Blob([cameraConfigStr], { type: 'text/plain' });
                // Create a URL for the Blob
                const url = URL.createObjectURL(blob);
                // Create a temporary link to trigger the download
                const a = document.createElement('a');
                a.href = url;
                a.download = 'cameraConfig.txt'; // File name for the download
                document.body.appendChild(a); // Append the link to the document
                a.click(); // Trigger the download
                document.body.removeChild(a); // Clean up
                URL.revokeObjectURL(url); // Free up resources by revoking the blob URL
            };

            // Create the button for logging camera configurations
            const logCameraButton = document.createElement('button');
            logCameraButton.textContent = "Log Camera Config";
            logCameraButton.classList.add('cesium-button');
            logCameraButton.addEventListener("click", logCameraConfig);

            // Get the Cesium toolbar container element to append the button
            const toolbar = viewer.container.querySelector('.cesium-viewer-toolbar');
            if (toolbar) {
                // Insert the Log Camera Config button into the toolbar
                toolbar.insertBefore(logCameraButton, toolbar.firstChild);
            }
        }
    }, [viewer]); // Viewer dependency, so it runs after viewer is initialized.
    
    
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




export default Map;