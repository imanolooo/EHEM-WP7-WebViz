'use client'    // Client component

import { Ion, createWorldTerrainAsync, Viewer, Cartesian3, PerspectiveFrustum, Color, Transforms, HeadingPitchRoll,
    ConstantProperty, Matrix4, Entity, HeadingPitchRange, IonResource, JulianDate, LabelStyle, VerticalOrigin,
    Cartesian2, defined, ScreenSpaceEventType, CameraEventType, ConstantPositionProperty, ShadowMode } from "cesium";
import { Math as CesiumMath } from 'cesium';
import React, { useContext, useEffect, useRef, useState } from "react";
import Modal from './Modal';
import { phasesInfo, phaseIXPoints_main, phaseIXPoints_secondary, phaseXPoints_top, phaseXPoints_bottom, phaseXIPoints, phaseXIIIPoints } from './Phases';
import { PhaseBoxDataType, PhaseBoxProps, Dimensions, LocalPosition, Orientation, Point } from './DebugBoxTypes';
import "cesium/Build/Cesium/Widgets/widgets.css"
import {FirstPersonCameraController} from './FirstPersonNavigation';
import { useSearchParams } from "next/navigation";
import CesiumContext from '@/contexts/CesiumContext';


// This is the default access token
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YTEzMWI1ZS05NmIxLTQ4NDEtYWUzZC04OTU4NmE1YTc2ZDUiLCJpZCI6MTg1MzUwLCJpYXQiOjE3MDI5OTc0MDR9.LtVjMcGUML_mgWbk5GwdseCcF_nYM-xTc3j5q0TrDBw';

let boxIdCounter = 0;
let boxEntities: Entity[] = []; // Global variable to store box entities

const NAV_MODE_DEFAULT = "0";
const NAV_MODE_FLY = "1";
const NAV_MODE_FLY_EXPERT = "2";
// let currentCameraMode = 'exterior'; // Assume the camera starts in exterior mode

//> Phase Model information
type CesiumModel = {
    id: number;
    name: string;
    entity: Entity | null;
};
const modelPosition = Cartesian3.fromDegrees(1.883635, 42.107455, 644.8);
const heading = CesiumMath.toRadians(21.5 + 90);
const pitch = CesiumMath.toRadians(0);
const roll = CesiumMath.toRadians(0);
const modelHPR = new HeadingPitchRoll(heading, pitch, roll);
const orientation = Transforms.headingPitchRollQuaternion(modelPosition, modelHPR);
//< Phase Model information


const Map = () => {

    const { setCameraView } = useContext(CesiumContext);

    console.log(setCameraView);

    // Get the app version from the URL
    const searchParams = useSearchParams();
    const appVersion = searchParams.get('version');

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const modelImageNames = ['ix', 'x', 'xi', 'xii', 'xiii'];

    // const models: CesiumModel[] = [];
    const [models, setModels] = useState<CesiumModel[]>([]);
    let currentModelEntity: Entity | null = null;

    const [isModalOpen, setIsModalOpen] = useState(false); // Handle the modal state
    const [viewer, setViewer] = useState<Viewer>();
    const [phaseBoxes, setPhaseBoxes] = useState<JSX.Element[]>([]);    
    const [selectedPhase, setSelectedPhase] = useState<string | null>(); // Initialize it to Phase IX
    const [selectedNavMode, setSelectedNavMode] = useState<string | null>(); 
    const [firstPersonCameraController, setFirstPersonCameraController] = useState<FirstPersonCameraController | null>();
    const destPosRef = useRef<Cartesian3 | null>(null);
    const [destPos, setDestPos] = useState<Cartesian3 | null>(null);

    // utility for getting the current time
    /* 
    useEffect(() => {
        const handleKeyDown = (event: { key: any; }) => {
        switch (event.key) {
        case 'G':
            // Start animating forward
            if (viewer) {
                viewer.clock.multiplier = 4000; // Adjust speed as needed
                viewer.clock.shouldAnimate = true;
            }
            break;
        case 'F':
            // Start animating backward
            if (viewer) {
                viewer.clock.multiplier = -4000; // Adjust speed as needed
                viewer.clock.shouldAnimate = true;
            }
            break;
        case 'T':
            // Log the current date and time
            if (viewer) {
                const currentTime = viewer.clock.currentTime;
                const date = JulianDate.toDate(currentTime);
                console.log(date.toString());
            }
            break;
        }
        };
    
    const handleKeyUp = (event: { key: string; }) => {
        if (event.key === 'G' || event.key === 'F') {
            // Stop animating
            if (viewer) {
                viewer.clock.shouldAnimate = false;
            }
        }
    };

    document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    
        return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        };
    }, [viewer]);
    */
    
    // Phases Selection menu
    const renderMenu = () => (
        <div className={`fixed inset-x-0 bottom-0 z-20 bg-opacity-75 bg-black p-4 flex justify-center items-center space-x-4 overflow-x-auto ${isMenuOpen ? 'block' : 'hidden'}`}>
            {modelImageNames.map((name) => (
                <img 
                    key={name} 
                    src={`/${name}.jpg`} 
                    alt={`Select ${name}`} 
                    className="h-16 md:h-24 cursor-pointer transform hover:scale-110 transition-transform duration-200" 
                    onClick={() => selectImage(name)}
                />
            ))}
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="absolute top-0 right-0 mt-4 mr-4 bg-blue-500 text-white p-2 rounded">
                {isMenuOpen ? 'Close' : 'Open'} Phase Selection
            </button>
        </div>
    );
    
    // Image selector from the Phase Selection menu
    const selectImage = (imageName: string) => {
        const index = modelImageNames.indexOf(imageName);
        if (index !== -1) {
            const modelId = phasesInfo[index].id; // Assuming the orders match
            setSelectedImage(String(modelId)); // Now storing the model ID instead
        }
    };
    
    // Load the selected phase .glB model
    const loadModel = async (modelId: number) => {
        models.forEach((model) => {
            // Hide any previously shown model
            if (model.entity) model.entity.show = false;
        });
        
        let selectedModel = models.find(model => model.id === modelId);
        if (selectedModel) {
            if (!selectedModel.entity) {
                // Model not yet loaded; load it now
                const modelUri = await IonResource.fromAssetId(selectedModel.id);
                if (viewer) {
                    selectedModel.entity = viewer.entities.add({
                        position: modelPosition,
                        orientation: new ConstantProperty(orientation),
                        model: {
                            uri: modelUri,
                            show: true, // Show immediately after loading
                        },
                    });
                }
            } else {
                // Model already loaded; just show it
                selectedModel.entity.show = true;
            }
            // Update the currentModelEntity reference
            currentModelEntity = selectedModel.entity;
        }
    };
    
    // Load the model corresponding to the selected image
    useEffect(() => {
        if (selectedImage !== null) {
            loadModel(Number(selectedImage));
        }
    }, [selectedImage]);

    // Cesium Viewer and everything
    useEffect(() => {
        const initializeViewer = async () => {
            try {
                // ------
                // Viewer settings

                // Create the Viewer
                const viewer = new Viewer("cesiumContainer", {
                    terrainProvider: await createWorldTerrainAsync(),   // Await the promise
                    timeline: true,    // Disable timebar at the bottom
                    animation: false,    // Disable animation (clock-like) widget
                    creditContainer: document.createElement("none"), // Remove the logo and credits of Cesium Ion
                    vrButton: true,
                    shadows: true,
                    scene3DOnly: true,
                    msaaSamples: 1
                });
                setViewer(viewer);
                const scene = viewer.scene;
                scene.globe.depthTestAgainstTerrain = true;
                //scene.useWebVR = true;
                

                //----- Marios -------

                // yellow circle
                const intersectionPointEntity = new Entity({
                    position: new Cartesian3(0, 0, 0),
                    point: {
                        pixelSize: 100,
                        color: Color.TRANSPARENT,
                        outlineColor: Color.YELLOW,
                        outlineWidth: 2,

                    },
                });
                viewer.entities.add(intersectionPointEntity);

                // ----- end of Marios ----- //


                // ------
                // Light settings
                const currentTime = JulianDate.fromDate(new Date(2024, 3, 5, 17, 0, 0, 0));
                viewer.clock.currentTime = currentTime.clone();                
                // Enable the lighting based on the sun's position
                viewer.scene.globe.enableLighting = true;


                // ------
                // Model settings

                // only store the models' metadata for now
                phasesInfo.forEach(phase => {
                    const model = {
                        id: phase.id,
                        name: phase.text,
                        entity: null, // Initially, there's no entity loaded
                    };
                    models.push(model);
                });

                // Load the first model by default and store its entity reference
                const firstModelUri = await IonResource.fromAssetId(phasesInfo[0].id);
                const firstModelEntity = viewer.entities.add({
                    position: modelPosition,
                    orientation: new ConstantProperty(orientation),
                    model: {
                        uri: firstModelUri,
                        show: true, // Show immediately after loading
                    },
                });

                // Update the corresponding model in the `models` array to include the entity reference
                const firstModelIndex = models.findIndex(model => model.id === phasesInfo[0].id);
                if (firstModelIndex !== -1) {
                    models[firstModelIndex].entity = firstModelEntity;
                }
                // Update the currentModelEntity reference
                currentModelEntity = firstModelEntity;
                if (currentModelEntity?.model)
                    currentModelEntity.model.shadows = new ConstantProperty(ShadowMode.DISABLED);


                // ------
                // Camera settings

                viewer.camera.position = new Cartesian3(4736954.40901528, 155726.14313851847, 4254884.18938475);
                viewer.camera.direction = new Cartesian3(-0.42410389201848225, 0.8530220500056251, 0.30412048760150384);
                viewer.camera.up = new Cartesian3(0.7062752621207551, 0.10134975317909911, 0.7006450468295589);
                scene.camera.frustum = new PerspectiveFrustum({
                  fov: 1.5,
                  aspectRatio: viewer.canvas.clientWidth / viewer.canvas.clientHeight,
                  near: 0.2,
                  far: 500000000.0
                })    // default viewer's camera PerspectiveFrustum values (https://cesium.com/learn/cesiumjs/ref-doc/PerspectiveFrustum.html)
                scene.screenSpaceCameraController.enableCollisionDetection = false;
                scene.screenSpaceCameraController.enableLook = true;
                scene.screenSpaceCameraController.enableRotate = true;
                scene.screenSpaceCameraController.translateEventTypes = [];
                scene.screenSpaceCameraController.rotateEventTypes = [];
                scene.screenSpaceCameraController.tiltEventTypes = CameraEventType.LEFT_DRAG;
                scene.screenSpaceCameraController.minimumZoomDistance = 0.2;

                const cameraInteractionRadius = 15; // Example radius in meters
                /*
                viewer.scene.preUpdate.addEventListener(() => {
                    const cameraPosition = viewer.camera.positionWC;
                    const distanceToModel = Cartesian3.distance(cameraPosition, modelPosition);
                    
                    if (distanceToModel < cameraInteractionRadius) {
                        if (currentCameraMode !== 'interior') {
                            console.log("Switching to interior view");

                            // Change navigation mode to first person
                            navModeDropdown.value = NAV_MODE_FLY; 
                            firstPersonCameraController.start();
                            firstPersonCameraController._continuousMotion = false;

                            currentCameraMode = 'interior';
                        }
                    } else {
                        if (currentCameraMode !== 'exterior') {
                            console.log("Switching to exterior view");

                            // Change navigation mode to default
                            navModeDropdown.value = NAV_MODE_DEFAULT;
                            firstPersonCameraController.stop();

                            currentCameraMode = 'exterior';
                        }
                    }
                });
                */
                // Set up variables for camera controls
                var moveSpeed = 1.0;
                // Add keyboard event listener for WASD movement
                document.addEventListener('keydown', function (e) {
                    if (firstPersonCameraController._enabled) return; // Disable this WASD movement when in first person mode
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
                    if (currentModelEntity) {
                        viewer.flyTo(currentModelEntity, {
                            offset: new HeadingPitchRange(
                                CesiumMath.toRadians(100),
                                CesiumMath.toRadians(0),
                                35
                            ),
                        });
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
                /*
                // Load the 3D models on demand

                const phasesDropdown = document.createElement('select');
                phasesDropdown.id = 'phases-menu';
                phasesDropdown.classList.add('cesium-button');
                phasesDropdown.innerHTML = 'Phases';    // Phases Toolbar button name
                phasesInfo.forEach(phase => {
                    const option = document.createElement('option');
                    option.value = phase.id.toString();
                    option.textContent = phase.text;
                    phasesDropdown.appendChild(option);
                });

                // Dropdown event listener
                phasesDropdown.addEventListener('change', async (event) => {
                    const selectedPhaseId = parseInt((event.target as HTMLSelectElement).value);
                    models.forEach((model) => {
                        // Hide any previously shown model
                        if (model.entity) model.entity.show = false;
                    });
                    
                    let selectedModel = models.find(model => model.id === selectedPhaseId);
                    if (selectedModel) {
                        if (!selectedModel.entity) {
                            // Model not yet loaded; load it now
                            const modelUri = await IonResource.fromAssetId(selectedModel.id);
                            selectedModel.entity = viewer.entities.add({
                                position: modelPosition,
                                orientation: new ConstantProperty(orientation),
                                model: {
                                    uri: modelUri,
                                    show: true, // Show immediately after loading
                                },
                            });
                            // Update the currentModelEntity reference
                            currentModelEntity = selectedModel.entity;
                        } else {
                            // Model already loaded; just show it
                            selectedModel.entity.show = true;
                            // Update the currentModelEntity reference
                            currentModelEntity = selectedModel.entity;
                        }
                        
                        console.log('Selected model position: ', selectedModel.entity.position);
                        console.log('Current model position: ', currentModelEntity.position);
                    }
                });
                */


                // ------
                // Navigation Modes Dropdown Menu settings
                
                const navModeDropdown = document.createElement('select');
                navModeDropdown.id = 'nav-menu';
                navModeDropdown.classList.add('cesium-button');
                navModeDropdown.innerHTML = 'Navigation';    // Toolbar button name

                const option1 = document.createElement('option');
                option1.value = NAV_MODE_DEFAULT;
                option1.textContent = "Navigation: default (globe)"
                navModeDropdown.appendChild(option1);

                const option2 = document.createElement('option');
                option2.value = NAV_MODE_FLY;
                option2.textContent = "Navigation: Fly-through";
                navModeDropdown.appendChild(option2);

                const option3 = document.createElement('option');
                option3.value = NAV_MODE_FLY_EXPERT;
                option3.textContent = "Navigation: Fly-through (expert)";
                navModeDropdown.appendChild(option3);


                // Nav Modes Dropdown event listener
                navModeDropdown.addEventListener('change', async (event) => {
                    const id = (event.target as HTMLSelectElement).value;                    
                    //console.log('Selected Nav Mode: ', id);
                    if (id === NAV_MODE_FLY) {
                        firstPersonCameraController.start();
                        firstPersonCameraController._continuousMotion = false;
                    }
                    else if (id === NAV_MODE_FLY_EXPERT) {
                        firstPersonCameraController.start();
                        firstPersonCameraController._continuousMotion = true;
                    }
                    else if (id === NAV_MODE_DEFAULT) {
                        firstPersonCameraController.stop();
                    }
                });


                // ------
                // Debug settings
                
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



                // test 

                const nextButton = document.createElement("button");
                nextButton.textContent = "Story Mode(Next Location)";
                nextButton.classList.add('cesium-button');

                //-----Marios-----

                // Path to your JSON file
                const jsonFilePath = 'data.json';

                // Variable to store the phases and their locations
                var phases: Record<string, { locations: Array<any> }> = {};

                // Variable to store the locations
                // const locations: any[] = [];
                var currentIndex = 0;

                // Variable to store the current label entity
                let currentLabelEntity: Entity | null = null;
                let labelTextEntity: Entity | null = null;
                let labelDescriptionEntity: Entity | null = null;


                // Variable to store the current phase
                var currentPhase = '';

                // Fetch the JSON data
                fetch(jsonFilePath)
                .then(response => response.json())
                .then((data: Record<string, any>) => {
                    phases = data;
                    // Assuming your JSON file has an array of locations
                    // locations = data.locations;
                    currentPhase = 'Phase Now';
                    addAnnotations(currentPhase);
                    // Function to set the camera to the current location and update description
                    function setCameraToLocation(index: number) {
                        const location = phases[currentPhase]?.locations[index];
                        if (!location) return;

                        const destination = Cartesian3.fromDegrees(
                            location.lon,
                            location.lat,
                            location.height
                        );

                        // Calculate vector from camera to destination
                        const cameraPosition = viewer.camera.positionWC.clone();
                        const direction = new Cartesian3();
                        Cartesian3.subtract(destination, cameraPosition, direction);

                        // Set a desired distance (e.g., 1000 meters) from the destination
                        const distance = -1.0;
                        Cartesian3.normalize(direction, direction);
                        Cartesian3.multiplyByScalar(direction, distance, direction);

                        const finalDestination = Cartesian3.add(
                            destination,
                            direction,
                            new Cartesian3()
                        );

                        // Remove the current label entity
                        if (currentLabelEntity) {
                            viewer.entities.remove(currentLabelEntity);
                            currentLabelEntity = null;
                        }

                        // Create a label for the current location
                        if (location.descriptions || location.image) {
                            currentLabelEntity = viewer.entities.add({
                                position: destination,
                                label: {
                                    text: location.descriptions,
                                    show: false,
                                    font: location.font,
                                    fillColor: Color.WHITE,
                                    outlineColor: Color.BLACK,
                                    outlineWidth: 2,
                                    style: LabelStyle.FILL_AND_OUTLINE,
                                    verticalOrigin: VerticalOrigin.BOTTOM,
                                    pixelOffset: new Cartesian2(0, 40),
                                    backgroundColor: Color.fromCssColorString(
                                    'rgba(0,0,0,0.7)'
                                    ),
                                    showBackground: true,
                                    backgroundPadding: new Cartesian2(8, 4),
                                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                                },
                                billboard: {
                                    image: location.image,
                                    show: false,
                                    verticalOrigin: VerticalOrigin.BOTTOM,
                                    width: location.image_width,
                                    height: location.image_height,
                                    pixelOffset: new Cartesian2(0, location.pixelOffset),
                                },
                            });

                        }

                        if (phases[currentPhase].locations[index].move == 1) {
                            viewer.scene.camera.flyTo({
                                destination: finalDestination,
                                orientation: {
                                    heading: CesiumMath.toRadians(location.heading),
                                    pitch: CesiumMath.toRadians(location.pitch),
                                    roll: viewer.camera.roll,
                                },
                                duration: 3.0,
                                complete: function () { },
                            });
                        } else if (phases[currentPhase].locations[index].move == 0) {
                            resetCamera();
                        }
                    }

                    //escape -> camera move normally
                    document.addEventListener('keyup', function (event) {
                        if (event.key === 'Escape') {
                            viewer.scene.camera.lookAtTransform(originalPosition);
                            intersectionPointEntity.show = false; // carlos; provisional
                            if (tempLabel) {
                                if (tempLabel.label) {
                                    tempLabel.label.show = new ConstantProperty(false);
                                }
                            }
                            if (currentLabelEntity) {
                                if (currentLabelEntity.label) {
                                    currentLabelEntity.label.show = new ConstantProperty(false);
                                }
                            }
                        }
                    });

                    //click on 3d object and zoom camera to this position
                    var destinationPosition: Cartesian3 | null = null;
                    var positions: Cartesian3 | null = null;
                    var SelectedPositions: Cartesian3 | null = null;
                    var tempLabel: Entity;
                    let firstframe = true;

                    const originalPosition = viewer.scene.camera.transform.clone();

                    // left double click to zoom to the selected position
                    viewer.screenSpaceEventHandler.setInputAction(function (movement: any) {
                        
                        viewer.scene.camera.lookAtTransform(originalPosition);
                        var pickedObject = viewer.scene.pick(movement.position);

                        if (defined(pickedObject)) {

                            destinationPosition = viewer.scene.pickPosition(movement.position);
                            setDestPos(destinationPosition);
                            intersectionPointEntity.show = false; // carlos; provisional

                            if (tempLabel) {
                                if (tempLabel.label) {
                                    tempLabel.label.show = new ConstantProperty(false);
                                }
                            }
                            if (currentLabelEntity) {
                                if (currentLabelEntity.label) {
                                    currentLabelEntity.label.show = new ConstantProperty(false);
                                }
                            }

                            // Get the current camera distance
                            var currentDistance = Cartesian3.distance(viewer.camera.position, destinationPosition as Cartesian3);

                            // Adjust the destination position based on a factor (e.g., 2 times the current distance)
                            var adjustedDistance = 0.70 * currentDistance;
                            var adjustedDestination = Cartesian3.multiplyByScalar(
                                Cartesian3.normalize(
                                    Cartesian3.subtract(destinationPosition as Cartesian3, viewer.camera.position, new Cartesian3()),
                                    new Cartesian3()
                                ),
                                adjustedDistance,
                                new Cartesian3()
                            );

                            // Adjust the selected point to be slightly in front of the actual model position, to avoid occlusion
                            var adjustedPointDistance = 0.98 * currentDistance;
                            var adjustedPointDestination = Cartesian3.multiplyByScalar(
                                Cartesian3.normalize(
                                    Cartesian3.subtract(destinationPosition as Cartesian3, viewer.camera.position, new Cartesian3()),
                                    new Cartesian3()
                                ),
                                adjustedPointDistance,
                                new Cartesian3()
                            );

                            viewer.camera.flyTo({
                                destination: Cartesian3.add(viewer.camera.position, adjustedDestination, new Cartesian3()),
                                orientation: {
                                    heading: viewer.camera.heading,
                                    pitch: viewer.camera.pitch,
                                    roll: viewer.camera.roll
                                },
                                duration: 2.0,

                            });

                            intersectionPointEntity.position = new ConstantPositionProperty(Cartesian3.add(viewer.camera.position, adjustedPointDestination, new Cartesian3()));
                            intersectionPointEntity.show = true;
                        }


                        //add label descriptions for every positions from the data.json
                        for (var i = 0; i < phases[currentPhase].locations.length; i++) {

                            positions = Cartesian3.fromDegrees(phases[currentPhase].locations[i].lon, phases[currentPhase].locations[i].lat, phases[currentPhase].locations[i].height);
                            if (firstframe) {
                                SelectedPositions = positions;
                                firstframe = false;
                            }
                            // console.log("pos" + positions);
                            // console.log("dest" + destinationPosition);
                            // Check if there is an existing labelDescriptionEntity and hide it


                            labelDescriptionEntity = viewer.entities.add({
                                position: positions,
                                label: {
                                    text: phases[currentPhase].locations[i].labeldesciption,
                                    show: false,
                                    font: phases[currentPhase].locations[i].font,  // You can customize font for the second label as needed
                                    fillColor: Color.WHITE,
                                    outlineColor: Color.BLACK,
                                    outlineWidth: 2,
                                    style: LabelStyle.FILL_AND_OUTLINE,
                                    verticalOrigin: VerticalOrigin.BOTTOM,
                                    pixelOffset: new Cartesian2(0, 80),  // Adjust pixelOffset for the second label
                                    backgroundColor: Color.fromCssColorString('rgba(0,0,0,0.7)'),
                                    showBackground: true,
                                    backgroundPadding: new Cartesian2(8, 4),
                                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                                },
                            });
                            //check if the clicked position is the same position with the data.json file -> to show the labeldescriptions
                            if (destinationPosition && destinationPosition.equals(positions) && positions.equals(SelectedPositions as Cartesian3))
                            {
                                console.log(phases[currentPhase].locations[i].labeldesciption);

                                if (labelDescriptionEntity) {
                                    if (labelDescriptionEntity.label) {
                                        labelDescriptionEntity.label.show = new ConstantProperty(true);
                                    }
                                }
                                tempLabel = labelDescriptionEntity;

                            }
                            else if (destinationPosition && destinationPosition.equals(positions) && !positions.equals(SelectedPositions as Cartesian3))
                            {

                                if (tempLabel) {
                                    if (tempLabel.label) {
                                        tempLabel.label.show = new ConstantProperty(false);
                                    }
                                }
                                if (labelDescriptionEntity) {
                                    if (labelDescriptionEntity.label) {
                                        labelDescriptionEntity.label.show = new ConstantProperty(true);
                                    }
                                }
                                tempLabel = labelDescriptionEntity;

                            }
                        }

                    }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK); // changed to double click for not interfering with navigation

                    // left click does nothing (disable default behaviour on gltf models)
                    viewer.screenSpaceEventHandler.setInputAction(function (movement: any) {}, ScreenSpaceEventType.LEFT_CLICK);
    
                    //Story Mode Button to increase the index
                    function onNextButtonClick() {
                        viewer.scene.camera.lookAtTransform(originalPosition);
                        intersectionPointEntity.show = false; // carlos; provisional
                        if (tempLabel) {
                            if (tempLabel.label) {
                                tempLabel.label.show = new ConstantProperty(false);
                            }
                        }
                        currentIndex = (currentIndex) % phases[currentPhase]?.locations.length;
                        setCameraToLocation(currentIndex);
                        if (currentLabelEntity) {
                            if (currentLabelEntity.label) {
                                currentLabelEntity.label.show = new ConstantProperty(true);
                            }
                            if (currentLabelEntity.billboard) {
                                currentLabelEntity.billboard.show = new ConstantProperty(true);
                            }
                        }
                        currentIndex += 1;
                    }

                    nextButton?.addEventListener('click', onNextButtonClick);

                    // Initial setup
                    setCameraToLocation(currentIndex);
                    resetCamera(); // carlos
                })
                .catch(error => {
                    console.error('Error fetching JSON:', error);
                });
                //-------end Marios----------

                //---Marios-----
                const addAnnotations = async (Phase: any) => {
                    fetch(jsonFilePath)
                    .then(response => response.json())
                    .then((data: Record<string, any>) => {
        
        
                        for (var phase in data) {
                        if (phase == Phase) {
                            if (data.hasOwnProperty(phase)) {
                            var locations = data[phase].locations;
        
                            for (var i = 0; i < locations.length; i++) {
                                var location = locations[i];
                                if (location.labeltext) {
                                var entity = viewer.entities.add({
                                    position: Cartesian3.fromDegrees(
                                    location.lon,
                                    location.lat,
                                    location.height
                                    ),
                                    point: {
                                    pixelSize: 30,
                                    color: Color.fromCssColorString('rgba(0, 0, 0, 0.8)'),
                                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                                    },
                                    label: {
                                    text: location.labeltext,
                                    font: '14px sans-serif',
                                    fillColor: Color.WHITE,
                                    style: LabelStyle.FILL_AND_OUTLINE,
                                    outlineWidth: 2,
                                    outlineColor: Color.WHITE,
                                    pixelOffset: new Cartesian2(0, 0),
                                    eyeOffset: new Cartesian3(0, 0, 0),
                                    disableDepthTestDistance: Number.POSITIVE_INFINITY
        
                                    }
                                });
        
        
                                }
                            }
                            }
                        }
                        }

                    })
                    .catch(error => {
                        console.error('Error fetching JSON:', error);
                    });
                }
    
                //--- End Marios-----

                // end of test


                // ------
                // Toolbar settings

                // Get the Cesium toolbar container element
                const toolbar = viewer.container.querySelector('.cesium-viewer-toolbar');
                
                if (toolbar) {
                    // Insert GM Carousel button before the existing buttons
                    const modeButton = toolbar.querySelector('.cesium-viewer-geocoderContainer');
                    toolbar.insertBefore(carouselButton, modeButton);
                    // Insert the Phases Dropdown toolbar before the GM Carousel
                    // toolbar.insertBefore(phasesDropdown, carouselButton);
                    // Insert the Navigation Modes Dropdown toolbar before the Phases Dropdown
                    toolbar.insertBefore(navModeDropdown, carouselButton);
                    // Insert the Reset Camera button before the Phases Dropdown
                    toolbar.insertBefore(resetButton, navModeDropdown);

                    // Insert the Debug button before the Reset Camera
                    // toolbar.insertBefore(toggleDebug, resetButton);

                    // Insert the Light button before the Debug button
                    // toolbar.insertBefore(lightToggle, toggleDebug);

                    // Insert the Next Location button
                    // toolbar.insertBefore(nextButton, resetButton);
                }   

                // Carlos
                const firstPersonCameraController = new FirstPersonCameraController({ cesiumViewer : viewer });
                setFirstPersonCameraController(firstPersonCameraController); 

                document.addEventListener('keypress', (event) => {    // TODO: set navigation mode through GUI
                    if (event.key=='f')
                        firstPersonCameraController.start();
                    if (event.key=='g') 
                        firstPersonCameraController.stop();
                    if (event.key=='c') 
                    {
                        if (currentModelEntity?.model)
                            currentModelEntity.model.shadows = new ConstantProperty(ShadowMode.ENABLED);
                    }
                    if (event.key=='C') 
                    {
                        if (currentModelEntity?.model)
                            currentModelEntity.model.shadows = new ConstantProperty(ShadowMode.DISABLED);
                    }

                    if (event.key=='v') 
                    {
                        scene.useWebVR != scene.useWebVR;
                    }

                  }, false);


            } catch (error) {
                console.log(error);
            }
        };

        initializeViewer();
    }, []); // Only run this effect once, after the initial render


    // test

    useEffect(() => {
        const newSetCameraView = (viewConfig: { position: { x: number; y: number; z: number; }; }) => {
            if (viewer) {
                const { position } = viewConfig; // Using only the position for flyTo
        
                // Convert to Cesium's Cartesian3 for the destination
                const cesiumPosition = new Cartesian3(position.x, position.y, position.z);
                
                viewer.camera.flyTo({
                    destination: cesiumPosition
                    // duration: 3.0
                });
            }
        };
        setCameraView(newSetCameraView);
    }, [viewer]);

    // end of test


    // Whenever destPos state changes, update the ref
    useEffect(() => {
        destPosRef.current = destPos;
    }, [destPos]);

    // Add the Log Camera Config and Log Selected Position buttons to the Cesium toolbar
    useEffect(() => {
        if (viewer && appVersion === 'researcher') {
            // Create and append the Log Camera Config button
            if (!document.querySelector('.log-camera-config-button')) {
                const logCameraButton = document.createElement('button');
                logCameraButton.textContent = "Log Camera Config";
                logCameraButton.classList.add('cesium-button', 'log-camera-config-button');
                logCameraButton.addEventListener("click", logCameraConfig);
                const toolbar = viewer.container.querySelector('.cesium-viewer-toolbar');
                toolbar?.insertBefore(logCameraButton, toolbar.firstChild);
            }
    
            // Create and append the Log Selected Position button
            if (!document.querySelector('.log-selected-position-button')) {
                const logPositionButton = document.createElement('button');
                logPositionButton.textContent = "Log Selected Position";
                logPositionButton.classList.add('cesium-button', 'log-selected-position-button');
                logPositionButton.addEventListener("click", logSelectedPosition);
                const toolbar = viewer.container.querySelector('.cesium-viewer-toolbar');
                toolbar?.insertBefore(logPositionButton, toolbar.firstChild);
            }
        }
    }, [viewer]);

    // Function to log camera configurations in JSON format
    const logCameraConfig = () => {
        if(viewer){
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
        }
    };

    // Function to log the selected position information
    const logSelectedPosition = () => {
        const currentDestPos = destPosRef.current;
        if (currentDestPos) {
            const positionInfo = {
                position: {
                    x: currentDestPos.x,
                    y: currentDestPos.y,
                    z: currentDestPos.z
                }
            };
            const positionInfoStr = JSON.stringify(positionInfo, null, 2);
            console.log(positionInfoStr);
            const blob = new Blob([positionInfoStr], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'selectedPosition.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            console.log("No position selected.");
        }
    }
    
    
    return (
        <div>
            {/* Cesium */}
            {/* Return the Cesium Viewer */}
            <div id="cesiumContainer" />

            {/* Toggle Menu Button - Always Visible */}
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 z-30 bg-blue-500 text-white px-4 py-2 rounded-t ${isMenuOpen ? 'hidden' : 'block'}`}>
                Open Phase Selection
            </button>

            {/* Image Menu */}
            {renderMenu()}

            {/* Graphic Material Modal */}
            {/* Return the Image Carousel Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                openModal={() => setIsModalOpen(true)} >
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