'use client'    // Client component

import { Ion, createWorldTerrainAsync, Viewer, Camera, Cartesian3, PerspectiveFrustum, Color, Transforms, HeadingPitchRoll,
    ConstantProperty, Matrix4, Entity, IonResource, JulianDate, LabelStyle, VerticalOrigin,
    Cartesian2, defined, ScreenSpaceEventType, CameraEventType, ConstantPositionProperty, ShadowMode, Rectangle, Cesium3DTileset } from "cesium";
import { Math as CesiumMath } from 'cesium';
import React, { useEffect, useRef, useState } from "react";
import Modal from './Modal';
import { phasesInfo, phaseIXPoints_main, phaseIXPoints_secondary, phaseXPoints_top, phaseXPoints_bottom, phaseXIPoints, phaseXIIIPoints } from './Phases';
import { PhaseBoxDataType, PhaseBoxProps, Dimensions, LocalPosition, Orientation, Point } from './DebugBoxTypes';
import "cesium/Build/Cesium/Widgets/widgets.css"
import {FirstPersonCameraController} from './FirstPersonNavigation';
import {Experimental} from './Experimental';
import StoriesDisplay from "./StoriesDisplay";
import MiniMap from "./MiniMap";
import { useSearchParams } from "next/navigation";


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
    entityType: 'GLTF' | 'Tileset';
    model?: Entity; // For GLTF models
    tileset?: Cesium3DTileset; // For 3D Tilesets
};
const modelPosition = Cartesian3.fromDegrees(1.883635, 42.107455, 644.8);
const heading = CesiumMath.toRadians(21.5 + 90);
const pitch = CesiumMath.toRadians(0);
const roll = CesiumMath.toRadians(0);
const modelHPR = new HeadingPitchRoll(heading, pitch, roll);
const orientation = Transforms.headingPitchRollQuaternion(modelPosition, modelHPR);
//< Phase Model information


const Map = () => {
    const viewerRef = useRef<Viewer>();

    // Get the app version from the URL
    const searchParams = useSearchParams();
    const appVersion = searchParams.get('version');

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null); // Graphic material
    const [selectedImage, setSelectedImage] = useState<string | null>(null); // Phase
    const modelImageNames = ['ix', 'x', 'xi', 'xii', 'xiii', 'xxi'];

    // const models: CesiumModel[] = [];
    const [models, setModels] = useState<CesiumModel[]>([]);
    let currentModelEntity: Entity | null = null;

    const [isModalOpen, setIsModalOpen] = useState(false); // Handle the modal state
    const [viewer, setViewer] = useState<Viewer>();
    const [phaseBoxes, setPhaseBoxes] = useState<JSX.Element[]>([]);    
    const [selectedPhase, setSelectedPhase] = useState<string | null>(); // Initialize it to Phase IX
    const [selectedNavMode, setSelectedNavMode] = useState<string | null>(); 
    const [firstPersonCameraController, setFirstPersonCameraController] = useState<FirstPersonCameraController | null>();
    const [experimental, setExperimental] = useState<Experimental | null>();
    const destPosRef = useRef<Cartesian3 | null>(null);
    const [destPos, setDestPos] = useState<Cartesian3 | null>(null);
    const [enabledPois, setEnabledPois] = useState<string[]>([]);

    const [buttonText, setButtonText] = useState('Phase IXth cent.');

    function setGMimage(image:string)
    {
        console.log("setGMimage: " + image);
        // execute after one second
        setTimeout(() => {
            setCurrentImage(image);
        }, 1000);
        setTimeout(() => {
            setCurrentImage(image);
        }, 2000);
        setTimeout(() => {
            setCurrentImage(image);
        }, 3000);
        
    }

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
        <>

           

            {/* Menu Content */}
            <div className={`fixed inset-x-0 bottom-7 z-20>`}>
                 {/* Toggle Button */}
                 <div className={`flex justify-end`}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)} 
                        /*fixed bottom-20 right-2 transition-transform transform ${isMenuOpen ? 'translate-y-0' : 'translate-y-full'*/
                        className={`text-white bg-[#303336] hover:bg-[#48b] hover:border-[#aef] hover:shadow-[0_0_8px_#fff] font-bold py-2 px-4 rounded}`}>
                        {isMenuOpen ? '▼ ' : '▲ '} {buttonText}
                    </button>
                </div>
                <div className={`bg-opacity-75 bg-black flex items-center overflow-x-auto ${isMenuOpen ? 'py-4' : 'py-0'} ${isMenuOpen ? 'block' : 'hidden'}`}>
                    <div className="flex flex-grow justify-center space-x-4 px-4">
                        {modelImageNames.map((name) => (
                            <img 
                                key={name} 
                                src={`/${name}.jpg`} 
                                alt={`Select ${name}`}
                                className="min-w-[100px] max-w-[200px] w-auto h-16 md:h-24 cursor-pointer transform hover:scale-110 transition-transform duration-200"
                                onClick={() => { selectImage(name); setIsMenuOpen(!isMenuOpen)}}
                            />
                        ))}
                    </div>
                </div>
            </div>

            
        </>
    );
    
    // Image selector from the Phase Selection menu
    const selectImage = (imageName: string) => {
        const index = modelImageNames.indexOf(imageName);
        if (index !== -1) {
            const modelId = phasesInfo[index].id; // Assuming the orders match
            setSelectedImage(String(modelId)); // Now storing the model ID instead
            //console.log(phasesInfo[index].text);
            setButtonText(phasesInfo[index].text);
        }
    };
    
    // Load the selected phase .glB model
    const loadModel = async (modelId: number) => {
        console.log('Selected model ID: ', modelId);
        // Hide any previously shown models or tilesets
        models.forEach((model) => {
            if (model.model) model.model.show = false; // For GLTF models
            if (model.tileset) model.tileset.show = false; // For 3D Tilesets
        });
    
        let selectedModel = models.find(model => model.id === modelId);
        if (selectedModel) {
            if (selectedModel.entityType === 'GLTF' && !selectedModel.model) {
                // Load GLTF model
                const modelUri = await IonResource.fromAssetId(selectedModel.id);
                if (viewer) {
                    selectedModel.model = viewer.entities.add({
                        position: modelPosition,
                        orientation: new ConstantProperty(orientation),
                        model: {
                            uri: modelUri,
                            show: true,
                        },
                        name: "St. Quirze de Pedret - " + selectedModel.name
                    });
                }
            } else if (selectedModel.entityType === 'Tileset' && !selectedModel.tileset) {
                // Load 3D Tileset
                const tileset = await Cesium3DTileset.fromIonAssetId(selectedModel.id);
                if (viewer) {
                    viewer.scene.primitives.add(tileset);
                    tileset.show = true;
                    selectedModel.tileset = tileset; // Assign the tileset
                }
            } else {
                // Entity already loaded; just show it
                if (selectedModel.model) selectedModel.model.show = true;
                if (selectedModel.tileset) selectedModel.tileset.show = true;
            }
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

                var extent = Rectangle.fromDegrees(1.88000, 42.10300, 1.88700, 42.11200);
                Camera.DEFAULT_VIEW_RECTANGLE = extent;
                Camera.DEFAULT_VIEW_FACTOR = 0;

                // Create the Viewer
                const viewer = new Viewer("cesiumContainer", {
                    terrainProvider: await createWorldTerrainAsync(),   // Await the promise
                    timeline: (appVersion === 'researcher'),    // Disable timebar at the bottom
                    animation: false,    // Disable animation (clock-like) widget
                    baseLayerPicker: false,
                    fullscreenButton: false,
                    geocoder: false,
                    sceneModePicker: false,
                    selectionIndicator: false,
                    navigationHelpButton: false,
                    creditContainer: document.createElement("none"), // Remove the logo and credits of Cesium Ion
                    vrButton: false,
                    shadows: false,
                    scene3DOnly: true,
                    msaaSamples: 1
                });
                setViewer(viewer);
                viewerRef.current = viewer;
                const scene = viewer.scene;
                scene.globe.depthTestAgainstTerrain = false; // temporary 
                //scene.useWebVR = true;
                

                //----- Marios -------

                // yellow circle
                const intersectionPointEntity = new Entity({
                    position: new Cartesian3(0, 0, 0),
                    point: {
                        pixelSize: 0, // invisible
                        color: Color.TRANSPARENT,
                        outlineColor: Color.YELLOW,
                        outlineWidth: 0, // invisible

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
                phasesInfo.forEach((phase) => {
                    // Check if phase.text matches "Phase XXI" or any other
                    // specific phases you want to treat as Tilesets
                    const isTileset = false;// phase.text === "Phase XXII"
                    //                  || phase.text === "Another Tileset Phase"; // Example for adding more conditions
                
                    const model = {
                        id: phase.id,
                        name: phase.text,
                        entityType: isTileset ? 'Tileset' as 'Tileset' : 'GLTF' as 'GLTF',
                        model: undefined, // Placeholder for GLTF
                        tileset: undefined, // Placeholder for 3DTilesets
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
                    name: "St. Quirze de Pedret - " + phasesInfo[0].text
                });

                viewer.infoBox.viewModel.enableCamera = false;
                viewer.infoBox.viewModel.isCameraTracking = false;

                // Assuming the first model is a GLTF model
                // Update the corresponding model in the `models` array to include the entity reference
                const firstModelIndex = models.findIndex(model => model.id === phasesInfo[0].id);
                if (firstModelIndex !== -1) {
                    models[firstModelIndex].model = firstModelEntity;
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
                    if (firstPersonCameraController && firstPersonCameraController._enabled) return; // Disable this WASD movement when in first person mode
                    if (e.key === 'w' || e.key === 'W')
                        viewer.camera.moveForward(moveSpeed);
                    else if (e.key === 's' || e.key === 'S')
                        viewer.camera.moveBackward(moveSpeed);
                    else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft')
                        viewer.camera.moveLeft(moveSpeed);
                    else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight')
                        viewer.camera.moveRight(moveSpeed);
                    else if (e.key === 'q' || e.key === 'Q' || e.key === 'ArrowUp')
                        viewer.camera.moveUp(moveSpeed);
                    else if (e.key === 'e' || e.key === 'E' || e.key === 'ArrowDown')
                        viewer.camera.moveDown(moveSpeed);
                    //else if (e.key === 'z' || e.key === 'Z')
                        //setIsModalOpen(true);
                }); 

                const resetCamera = () => {
                    if (currentModelEntity) {
                        console.log("Entra");
                        /*viewer.flyTo(currentModelEntity, {
                            offset: new HeadingPitchRange(
                                CesiumMath.toRadians(100),
                                CesiumMath.toRadians(-15),
                                35
                            ),
                        });
                        */
                        viewer.camera.flyTo({
                            destination: new Cartesian3(4736929.155177345, 155752.35991777678, 4254912.231938995),
                            orientation: {
                              direction: new Cartesian3(-0.11077147452686226, 0.9481225389143196, -0.2979820995190974),
                              up: new Cartesian3(0.7, 0.1, 0.68)
                            },
                            duration: 2.0,
                            complete: function () { },
                          });
                        
                           
                    }
                };

                const resetButton = document.createElement('button');
                resetButton.textContent = "Reset Camera";
                resetButton.classList.add('cesium-button');
                resetButton.addEventListener("click", () => {
                    resetCamera();
                });
                // viewer.container.appendChild(resetButton);  // not show "Reset Camera" button

                
                // ------
                // Modal settings

                // Create a custom button in the Cesium's existing toolbar
                const carouselButton = document.createElement('button');
                carouselButton.classList.add('cesium-button');
                carouselButton.innerHTML = 'Show graphic materials';    // Open Modal button name

                // Add a click event handler to open the Modal
                carouselButton.addEventListener('click', () => {
                    setIsModalOpen(true);
                });  

                // Predefined cameras dropdown menu
                const camerasDropdown = document.createElement('select');
                camerasDropdown.id = 'camera-menu';
                camerasDropdown.classList.add('cesium-button');
                camerasDropdown.innerHTML = 'Reset camera';    

                {
                    const option0 = document.createElement('option');
                    option0.value = 'Reset camera options';
                    option0.textContent = option0.value;
                    camerasDropdown.appendChild(option0);

                    const option1 = document.createElement('option');
                    option1.value = 'Exterior';
                    option1.textContent = option1.value;
                    camerasDropdown.appendChild(option1);

                    const option4 = document.createElement('option');
                    option4.value = 'Interior - central apse';
                    option4.textContent = option4.value;
                    camerasDropdown.appendChild(option4);

                    const option5 = document.createElement('option');
                    option5.value = 'Interior - South apse';
                    option5.textContent = option5.value;
                    camerasDropdown.appendChild(option5);

                    const option6 = document.createElement('option');
                    option6.value = 'Interior - North apse';
                    option6.textContent = option6.value;
                    camerasDropdown.appendChild(option6);

                    const option2 = document.createElement('option');
                    option2.value = 'Interior - central nave';
                    option2.textContent = option2.value;
                    camerasDropdown.appendChild(option2);

                    const option3 = document.createElement('option');
                    option3.value = 'Interior - lateral nave';
                    option3.textContent = option3.value;
                    camerasDropdown.appendChild(option3);
                }


                // Dropdown event listener
                camerasDropdown.addEventListener('change', async (event) => {
                    const selectedPreset = (event.target as HTMLSelectElement).value;

                    var current = "";
                    models.forEach((model) => {
                        if (model.model && model.model.show) current = model.name;
                    });
                    console.log(current);
                    

                    if (selectedPreset === "Exterior")
                        {
                            viewer.camera.flyTo({
                                destination: new Cartesian3(4736929.155177345, 155752.35991777678, 4254912.231938995),
                                orientation: {
                                  direction: new Cartesian3(-0.11077147452686226, 0.9481225389143196, -0.2979820995190974),
                                  up: new Cartesian3(0.7, 0.1, 0.68)
                                },
                                duration: 2.0,
                                complete: function () { },
                              });
                        }

                    if (selectedPreset === 'Interior - central nave')
                        {
                            viewer.camera.flyTo({
                                destination: new Cartesian3(4736923.39130684, 155781.5167396294, 4254904.071742702),
                                orientation: {
                                    direction: new Cartesian3(0.21014269413278533, 0.9317886965129191, -0.2959896504159732),
                                    up: new Cartesian3(0.74, 0.04, 0.66)
                                },
                                duration: 2.0,
                                complete: function () { },
                                });
                        }        

                    if (selectedPreset === 'Interior - lateral nave')
                        {
                            viewer.camera.flyTo({
                                destination: new Cartesian3(4736920.362838485, 155783.3106908225, 4254907.5690728845),
                                orientation: {
                                    direction: new Cartesian3(0.21014253517221007, 0.9317887874336441, -0.29598947705000567),
                                    up: new Cartesian3(0.74, 0.04, 0.66)
                                },
                                duration: 2.0,
                                complete: function () { if (current === "Phase IXth cent.")
                                    {
                                        alert("At the IXth century, the lateral nave did not exist.");
                                    }},
                                });
                            
            
                        } 
                    if (selectedPreset === 'Interior - central apse')
                    {
                            viewer.camera.flyTo({
                                destination: new Cartesian3(4736924.668139745, 155787.9354748301, 4254902.17556473),
                                orientation: {
                                    direction: new Cartesian3(0.3039150467251132, 0.9319177785280904,  -0.19790123404704027),
                                    up: new Cartesian3(0.71, -0.08, 0.7)
                                },
                                duration: 2.0,
                                complete: function () { },
                                });
                    }       
                    if (selectedPreset === 'Interior - South apse')
                        {
                                viewer.camera.flyTo({
                                    destination: new Cartesian3(4736926.595173732, 155786.69117951262, 4254898.480223486),
                                    orientation: {
                                        direction: new Cartesian3(0.28189714009233474, 0.9501324185846848,  -0.13335062640340287),
                                        up: new Cartesian3(0.71, -0.11, 0.7)
                                    },
                                    duration: 2.0,
                                    complete: function () {if (current === "Phase IXth cent.")
                                        {
                                            alert("At the IXth century, the South apse did not exist.");
                                        } },
                                    });
                                    
                        }      


                    if (selectedPreset === 'Interior - North apse')
                        {
                                viewer.camera.flyTo({
                                    destination: new Cartesian3(4736921.901812582, 155789.75842352153, 4254905.055329703),
                                    orientation: {
                                        direction: new Cartesian3(0.2818966612638122, 0.9501326155778395,  -0.13335023503364837),
                                        up: new Cartesian3(0.71, -0.11, 0.7)
                                    },
                                    duration: 2.0,
                                    complete: function () { if (current === "Phase IXth cent.")
                                        {
                                            alert("At the IXth century, the North apse did not exist.");
                                        }},
                                    });
                                    
                        }       
                       
                       
                       


                    camerasDropdown.value = 'Reset camera options';
                    
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
                option1.textContent = "Navigation: Orbit"
                navModeDropdown.appendChild(option1);

                const option2 = document.createElement('option');
                option2.value = NAV_MODE_FLY;
                option2.textContent = "Navigation: Fly";
                navModeDropdown.appendChild(option2);

                const option3 = document.createElement('option');
                option3.value = NAV_MODE_FLY_EXPERT;
                option3.textContent = "Nav: Fly expert";
                navModeDropdown.appendChild(option3);


                // Nav Modes Dropdown event listener
                navModeDropdown.addEventListener('change', async (event) => {
                    const id = (event.target as HTMLSelectElement).value;                    
                    //console.log('Selected Nav Mode: ', id);
                    if(firstPersonCameraController){
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
                const jsonFilePath = 'data2.json';

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
                            var adjustedPointDistance = 0.90 * currentDistance;  // 0.98
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
                    //viewer.screenSpaceEventHandler.setInputAction(function (movement: any) {}, ScreenSpaceEventType.LEFT_CLICK);
    
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

                    //toolbar.insertBefore(resetButton, navModeDropdown);
                    toolbar.insertBefore(camerasDropdown, navModeDropdown);

                    // Insert the Debug button before the Reset Camera
                    // toolbar.insertBefore(toggleDebug, resetButton);

                    // Insert the Light button before the Debug button
                    // toolbar.insertBefore(lightToggle, toggleDebug);

                    // Insert the Next Location button
                    // toolbar.insertBefore(nextButton, resetButton);
                }   

                const firstPersonCameraController = new FirstPersonCameraController({ cesiumViewer : viewer });
                setFirstPersonCameraController(firstPersonCameraController); 

                const experimental = new Experimental(viewer, viewer.scene);
                setExperimental(experimental);

                // Carlos
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
                    if (event.key=='t') 
                    {
                        experimental?.start();
                    }
                    // if (event.key=='1') 
                    // {
                    //     experimental.addPOIs("centralApse"); 
                    // }
                    // if (event.key=='2') 
                    // {
                    //     experimental.addPOIs("southApse"); 
                    // }
                  }, false);


            } catch (error) {
                console.log(error);
            }
        };

        initializeViewer();
    }, []); // Only run this effect once, after the initial render


    // Whenever enabledPois state changes, update the POIs
    useEffect(() => {
        
        if (!viewer || !experimental) { return; }

        const updatePOIs = (poiIds: string[]) => {
            experimental.addPOIs([]);
            experimental.addPOIs(enabledPois);
        }

        // Call updatePOIs whenever enabledPois changes
        updatePOIs(enabledPois);

    }, [enabledPois, experimental]);

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
    
    // Function to set the destination position
    const setCameraView = (cameraConfig: { position: any; direction: any; up: any; frustum: any; }) => {
        if (viewerRef.current) {
          const { position, direction, up, frustum } = cameraConfig;
    
          viewerRef.current.camera.flyTo({
            destination: new Cartesian3(position.x, position.y, position.z),
            orientation: {
              direction: new Cartesian3(direction.x, direction.y, direction.z),
              up: new Cartesian3(up.x, up.y, up.z),
            },
            duration: 2.0,
            complete: function () { },
          });
        }
      };
      
    return (
        <div>
            {/* Cesium */}
            {/* Return the Cesium Viewer */}
            <div id="cesiumContainer" />

            {/* Phases Image Menu */}
            {renderMenu()}

            {/* Graphic Material Modal */}
            {/* Return the Image Carousel Modal */}
            <Modal
                isOpen={isModalOpen}
                currentImage = {currentImage}
                setCurrentImage = {setCurrentImage}
                onClose={() => setIsModalOpen(false)}
                showCarousel={true}
                backgroundStyle="bg-black bg-opacity-75" 
                allowInteraction={false} // it's the default, can be omitted, but I leave it for readability
            />

            {/* Stories */}
            <StoriesDisplay setCameraView={ setCameraView } loadModel={loadModel} setGMmodal={setIsModalOpen} setGMimage={setGMimage} setCurrentImage={setCurrentImage} onPoisEnabled={setEnabledPois} />

            {/* Conditionally render phaseBoxes */}
            {viewer && phaseBoxes}

            <MiniMap setCameraView={ setCameraView } loadModel={loadModel} setGMmodal={setIsModalOpen} setGMimage={setGMimage} setCurrentImage={setCurrentImage} onPoisEnabled={setEnabledPois} />

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