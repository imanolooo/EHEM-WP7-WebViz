'use client'    // Client component

import { Ion, createWorldTerrainAsync, Viewer, Cesium3DTileset, Cartesian3, PerspectiveFrustum, Color, Transforms, HeadingPitchRoll, ConstantProperty, Matrix4, Entity, HeadingPitchRange, DirectionalLight, Light, Sun, PostProcessStage, Cesium3DTileStyle, Cesium3DTileColorBlendMode, PointPrimitive, IonResource, JulianDate, ClockRange, ClockStep, LabelStyle, VerticalOrigin, Cartesian2, defined, ConstantPositionProperty, ScreenSpaceEventType, CameraEventType } from "cesium";
import { Math as CesiumMath } from 'cesium';
import { useEffect, useState } from "react";
import Modal from './Modal';
import { phasesInfo, phaseIXPoints_main, phaseIXPoints_secondary, phaseXPoints_top, phaseXPoints_bottom, phaseXIPoints, phaseXIIIPoints } from './Phases';
import { PhaseBoxDataType, PhaseBoxProps, Dimensions, LocalPosition, Orientation, Point } from './DebugBoxTypes';
import "cesium/Build/Cesium/Widgets/widgets.css"
import {FirstPersonCameraController} from './FirstPersonNavigation';

// This is the default access token
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YTEzMWI1ZS05NmIxLTQ4NDEtYWUzZC04OTU4NmE1YTc2ZDUiLCJpZCI6MTg1MzUwLCJpYXQiOjE3MDI5OTc0MDR9.LtVjMcGUML_mgWbk5GwdseCcF_nYM-xTc3j5q0TrDBw';

let boxIdCounter = 0;
let boxEntities: Entity[] = []; // Global variable to store box entities

type CesiumModel = {
    id: number;
    name: string;
    entity: Entity | null;
};


const Map = () => {
    const [cameraConfig, setCameraConfig] = useState({});

    const models: CesiumModel[] = [];
    let currentModelEntity: Entity | null = null;

    const [isModalOpen, setIsModalOpen] = useState(false); // Handle the modal state
    const [viewer, setViewer] = useState<Viewer>();
    const [phaseBoxes, setPhaseBoxes] = useState<JSX.Element[]>([]);    
    const [selectedPhase, setSelectedPhase] = useState<string | null>(); // Initialize it to Phase IX
    const [firstPersonCameraController, setFirstPersonCameraController] = useState<FirstPersonCameraController | null>();

    // utility for getting the current time
    // useEffect(() => {
    //     const handleKeyDown = (event: { key: any; }) => {
    //     switch (event.key) {
    //     case 'G':
    //         // Start animating forward
    //         if (viewer) {
    //             viewer.clock.multiplier = 4000; // Adjust speed as needed
    //             viewer.clock.shouldAnimate = true;
    //         }
    //         break;
    //     case 'F':
    //         // Start animating backward
    //         if (viewer) {
    //             viewer.clock.multiplier = -4000; // Adjust speed as needed
    //             viewer.clock.shouldAnimate = true;
    //         }
    //         break;
    //     case 'T':
    //         // Log the current date and time
    //         if (viewer) {
    //             const currentTime = viewer.clock.currentTime;
    //             const date = JulianDate.toDate(currentTime);
    //             console.log(date.toString());
    //         }
    //         break;
    //     }
    //     };
    
    // const handleKeyUp = (event: { key: string; }) => {
    //     if (event.key === 'G' || event.key === 'F') {
    //         // Stop animating
    //         if (viewer) {
    //             viewer.clock.shouldAnimate = false;
    //         }
    //     }
    // };

    // document.addEventListener('keydown', handleKeyDown);
    //     document.addEventListener('keyup', handleKeyUp);
    
    //     return () => {
    //     document.removeEventListener('keydown', handleKeyDown);
    //     document.removeEventListener('keyup', handleKeyUp);
    //     };
    // }, [viewer]);

    // Initialize the Cesium Viewer
    useEffect(() => {
        const initializeViewer = async () => {
            try {
                // ------
                // Viewer settings

                // Create the Viewer
                const viewer = new Viewer("cesiumContainer", {
                    terrainProvider: await createWorldTerrainAsync(),   // Await the promise
                    timeline: false,    // Disable timebar at the bottom
                    animation: false,    // Disable animation (clock-like) widget
                    creditContainer: document.createElement("none") // Remove the logo and credits of Cesium Ion
                });
                setViewer(viewer);
                const scene = viewer.scene;

                //----- Marios -------

                var destinationPosition: Cartesian3 | null = null


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

                const modelPosition = Cartesian3.fromDegrees(1.883635, 42.107455, 644.8);
                const heading = CesiumMath.toRadians(21.5 + 90);
                const pitch = CesiumMath.toRadians(0);
                const roll = CesiumMath.toRadians(0);
                const modelHPR = new HeadingPitchRoll(heading, pitch, roll);
                const orientation = Transforms.headingPitchRollQuaternion(modelPosition, modelHPR);

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
                viewer.trackedEntity = currentModelEntity;
                viewer.scene.globe.depthTestAgainstTerrain = true;

                // ------
                // Camera settings

                // await viewer.zoomTo(tileset_Phase_IX);
                // await viewer.zoomTo(entity);
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
                            viewer.trackedEntity = currentModelEntity;
                        } else {
                            // Model already loaded; just show it
                            selectedModel.entity.show = true;
                            // Update the currentModelEntity reference
                            currentModelEntity = selectedModel.entity;
                            viewer.trackedEntity = currentModelEntity;
                        }
                        
                        console.log('Selected model position: ', selectedModel.entity.position);
                        console.log('Current model position: ', currentModelEntity.position);
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
                viewer.container.appendChild(nextButton);

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
-
                    //escape -> camera move normally
                    document.addEventListener('keyup', function (event) {
                    if (event.key === 'Escape') {
                        // isRKeyPressed = false;
                        viewer.scene.camera.lookAtTransform(originalPosition);
                        intersectionPointEntity.show = false;
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
                    var destinationPosition: Cartesian3 | null = null
                    var positions: Cartesian3 | null = null;
                    var SelectedPositions: Cartesian3 | null = null;
                    var tempLabel: Entity;
                    let firstframe = true;

                    const originalPosition = viewer.scene.camera.transform.clone();

                    viewer.screenSpaceEventHandler.setInputAction(function (movement: any) {

                    viewer.scene.camera.lookAtTransform(originalPosition);
                    var pickedObject = viewer.scene.pick(movement.position);
                    if (defined(pickedObject)) {
                        if (defined(pickedObject.id)) {
                        destinationPosition = pickedObject.id.position?.getValue(JulianDate.now());
                        } else {
                        destinationPosition = viewer.scene.pickPosition(movement.position);
                        }
                        intersectionPointEntity.show = false;
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
                        // destinationPosition = pickedObject.id.position?.getValue(JulianDate.now());

                        // Get the current camera distance
                        var currentDistance = Cartesian3.distance(viewer.camera.position, destinationPosition as Cartesian3);

                        // Adjust the destination position based on a factor (e.g., 2 times the current distance)
                        var adjustedDistance = 0.85 * currentDistance;
                        var adjustedDestination = Cartesian3.multiplyByScalar(
                        Cartesian3.normalize(
                            Cartesian3.subtract(destinationPosition as Cartesian3, viewer.camera.position, new Cartesian3()),
                            new Cartesian3()
                        ),
                        adjustedDistance,
                        new Cartesian3()
                        );
                        var adjustedPointDistance = 0.995 * currentDistance;
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
                        viewer.scene.camera.lookAt(destinationPosition as Cartesian3, new HeadingPitchRange(0, -Math.PI / 8, 1000000));
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
                        if (destinationPosition && destinationPosition.equals(positions) && positions.equals(SelectedPositions as Cartesian3)) {
                        console.log(phases[currentPhase].locations[i].labeldesciption);


                        if (labelDescriptionEntity) {
                            if (labelDescriptionEntity.label) {
                            labelDescriptionEntity.label.show = new ConstantProperty(true);
                            }
                        }
                        tempLabel = labelDescriptionEntity;

                        } else if (destinationPosition && destinationPosition.equals(positions) && !positions.equals(SelectedPositions as Cartesian3)) {

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


                    viewer.screenSpaceEventHandler.setInputAction(function (movement: any) {
                            }, ScreenSpaceEventType.LEFT_CLICK); // left click does nothing (disable default behaviour on gltf models)
    

                    //Story Mode Button to increase the index
                    function onNextButtonClick() {
                    viewer.scene.camera.lookAtTransform(originalPosition);
                    intersectionPointEntity.show = false;
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
                    toolbar.insertBefore(phasesDropdown, carouselButton);
                    // Insert the Reset Camera button before the Phases Dropdown
                    toolbar.insertBefore(resetButton, phasesDropdown);
                    // Insert the Debug button before the Reset Camera
                    // toolbar.insertBefore(toggleDebug, resetButton);
                    // Insert the Light button before the Debug button
                    // toolbar.insertBefore(lightToggle, toggleDebug);
                    toolbar.insertBefore(nextButton, resetButton);
                }   

                // Carlos
                const firstPersonCameraController = new FirstPersonCameraController({ cesiumViewer : viewer });
                setFirstPersonCameraController(firstPersonCameraController); 

                document.addEventListener('keypress', (event) => {    // TODO: set navigation mode through GUI
                    if (event.key=='f')
                        firstPersonCameraController.start();
                    if (event.key=='g') 
                        firstPersonCameraController.stop();
                  }, false);


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