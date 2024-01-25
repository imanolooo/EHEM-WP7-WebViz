'use client'    // Client component

import { Ion, createWorldTerrainAsync, Viewer, Cesium3DTileset, ScreenSpaceEventHandler, ScreenSpaceEventType, ConstantProperty, Cartesian3, Cartesian2, Color, VerticalOrigin, LabelStyle, PerspectiveFrustum, HeadingPitchRange, Math, defined, Cesium3DTileStyle, Entity } from "cesium";
import { useEffect, useState } from "react";
import ResponsiveCarousel from "./ResponsiveCarousel";
import CarouselModal from './CarouselModal';




// This is the default access token
//Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhYzk1NzRlNC0yZjgzLTQyMzctYjE0Ni1iODgxZjI2NzJiZjkiLCJpZCI6MTExODcwLCJpYXQiOjE2NjYyNzI4MTZ9.sdSpshnEe-ByALHimDQ4AbIUJ82wWZ8HCUT5zyGgNrE';
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwMjA4MzkzMC0yMGNjLTQxZDItOTIwMC0yMTBiZWE5MTdlMjgiLCJpZCI6MTcwMDY5LCJpYXQiOjE2OTY0OTIwMDV9.Dhq09qaf06rBxQgzlRWU-6eis8i4LO26WFpyDmM0WDE';

export default () => {

  // Handle the modal carousel state
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);

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

        // ------
        // Load the 3D tilesets of the Church (init with only Exterior visible)
        // Exterior
        const buildingTileset = await Cesium3DTileset.fromIonAssetId(2302705);
        viewer.scene.primitives.add(buildingTileset);

        const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        const Menubutton = document.createElement("button");
        let isMenuVisible = false;
        Menubutton.textContent = "Menu";
        Menubutton.classList.add('cesium-button', 'my-Button');
        Menubutton.style.position = "absolute";
        Menubutton.style.top = "10px"; // Adjust the top position as needed
        Menubutton.style.left = "10px"; // Adjust the left position as needed
        Menubutton.addEventListener("click", () => {
          if (isMenuVisible) {
            // Menu is already visible, do nothing or close it if needed
            return;
          }
          // Create a simple menu div
          const menu = document.createElement("div");
          menu.innerHTML = `
          <h3>Menu</h3>
          <ul>
              <li>
                  <p><b>Menu button</b> = Displays the menu.</p>
              </li>
              <li>
                  <p><b>Reset Camera button</b> = Resets the camera to its initial position.</p>
              </li>
              <li>
                  <p><b>Phase Now button</b> = Shows the 3D model as it is now.</p>
              </li>
              <li>
                  <p><b>Phase One button</b> = Shows the 3D model as it was in 1160.</p>
              </li>
              <li>
                  <p><b>Phase Two button</b> = Shows the 3D model as it was in 1170-1183.</p>
              </li>
              <li>
                  <p><b>Phase Three button</b> = Shows the 3D model as it was in 1183-1214.</p>
              </li>
              <li>
                  <p><b>Story Mode(Next Location) button</b> = Displays the annotations/points on the 3D model with
                      descriptions of what each one is.</p>
              </li>
          </ul>`;

          // Style the menu (adjust styles as needed)
          menu.style.position = "absolute";
          menu.style.top = "100px";
          menu.style.left = "200px";
          menu.style.padding = "20px";
          menu.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
          menu.style.border = "1px solid #ccc";

          // Append the menu to the Cesium container
          
          viewer.container.appendChild(menu);
          isMenuVisible = true;

          // Close the menu when clicking outside of it
          handler.setInputAction(() => {
            viewer.container.removeChild(menu);
            handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
            isMenuVisible = false;
          }, ScreenSpaceEventType.LEFT_CLICK);

          // Prevent clicks inside the menu from closing it
          menu.addEventListener("click", (event) => {
            event.stopPropagation();
          });
        });

        // Append the button to the Cesium container
        viewer.container.appendChild(Menubutton);

        const Resetbutton = document.createElement("button");
        Resetbutton.textContent = "Reset Camera";
        Resetbutton.classList.add('cesium-button', 'my-Button');
        Resetbutton.style.position = "absolute";
        Resetbutton.style.top = "10px"; // Adjust the top position as needed
        Resetbutton.style.left = "85px"; // Adjust the left position as needed
        Resetbutton.addEventListener("click", () => {
          resetCamera();
        });
        viewer.container.appendChild(Resetbutton);

        const PhaseNowButton = document.createElement("button");
        PhaseNowButton.textContent = "Phase Now";
        PhaseNowButton.classList.add('cesium-button', 'my-Button');
        PhaseNowButton.style.position = "absolute";
        PhaseNowButton.style.top = "10px"; // Adjust the top position as needed
        PhaseNowButton.style.left = "225px"; // Adjust the left position as needed
        PhaseNowButton.addEventListener("click", () => {
          addPhaseNow();
        });
        viewer.container.appendChild(PhaseNowButton);

        const PhaseOneButton = document.createElement("button");
        PhaseOneButton.textContent = "Phase One";
        PhaseOneButton.classList.add('cesium-button', 'my-Button');
        PhaseOneButton.style.position = "absolute";
        PhaseOneButton.style.top = "10px"; // Adjust the top position as needed
        PhaseOneButton.style.left = "345px"; // Adjust the left position as needed
        PhaseOneButton.addEventListener("click", () => {
          addPhaseOne();
        });
        viewer.container.appendChild(PhaseOneButton);

        const PhaseTwoButton = document.createElement("button");
        PhaseTwoButton.textContent = "Phase Two";
        PhaseTwoButton.classList.add('cesium-button', 'my-Button');
        PhaseTwoButton.style.position = "absolute";
        PhaseTwoButton.style.top = "10px"; // Adjust the top position as needed
        PhaseTwoButton.style.left = "460px"; // Adjust the left position as needed
        PhaseTwoButton.addEventListener("click", () => {
          addPhaseTwo();
        });
        viewer.container.appendChild(PhaseTwoButton);

        const PhaseThreeButton = document.createElement("button");
        PhaseThreeButton.textContent = "Phase Three";
        PhaseThreeButton.classList.add('cesium-button', 'my-Button');
        PhaseThreeButton.style.position = "absolute";
        PhaseThreeButton.style.top = "10px"; // Adjust the top position as needed
        PhaseThreeButton.style.left = "575px"; // Adjust the left position as needed
        PhaseThreeButton.addEventListener("click", () => {
          addPhaseThree();
        });
        viewer.container.appendChild(PhaseThreeButton);


        // // Set up variables for camera controls
        var moveSpeed = 2.0;
        // Add keyboard event listener for WASD movement
        document.addEventListener('keydown', function (e) {
          switch (e.key) {
            case 'w':
              viewer.camera.moveForward(moveSpeed);
              break;
            case 's':
              viewer.camera.moveBackward(moveSpeed);
              break;
            case 'a':
              viewer.camera.moveLeft(moveSpeed);
              break;
            case 'd':
              viewer.camera.moveRight(moveSpeed);
              break;
          }
        });
        // Camera settings
        // Move the camera to the new building with more space
        viewer.flyTo(buildingTileset, {
          offset: new HeadingPitchRange(
            Math.toRadians(-35),
            Math.toRadians(0),
            35
          ),
        });

        viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
        // Apply the default style if it exists (based on the initial code)
        var extras = buildingTileset.asset.extras;
        if (
          defined(extras) &&
          defined(extras.ion) &&
          defined(extras.ion.defaultStyle)
        ) {
          buildingTileset.style = new Cesium3DTileStyle(extras.ion.defaultStyle);
        }
        const resetCamera = () => {
          const primitives = viewer.scene.primitives;

          for (let i = 0; i < primitives.length; i++) {
            const primitive = primitives.get(i);

            if (primitive instanceof Cesium3DTileset) {
              viewer.flyTo(primitive, {
                offset: new HeadingPitchRange(
                  Math.toRadians(-35),
                  Math.toRadians(0),
                  35
                ),
              });
            }
          }
        };
        // Path to your JSON file
        const jsonFilePath = 'data.json';

        // Variable to store the phases and their locations
        var phases: Record<string, { locations: Array<any> }> = {};

        // Variable to store the locations
        // const locations: any[] = [];
        var currentIndex = 0;

        // Variable to store the current label entity
        let currentLabelEntity: Entity | null = null;

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
                    heading: Math.toRadians(location.heading),
                    pitch: Math.toRadians(location.pitch),
                    roll: viewer.camera.roll,
                  },
                  duration: 3.0,
                  complete: function () { },
                });
              } else if (phases[currentPhase].locations[index].move == 0) {
                resetCamera();
              }
            }

            // Function to handle the next button click
            function onNextButtonClick() {
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

            // Add event listener for the next button
            const nextButton = document.createElement('nextButton');
            nextButton.textContent = "Story Mode(Next Location)";
            nextButton.classList.add('cesium-button', 'my-Button');
            nextButton.style.position = "absolute";
            nextButton.style.top = "10px"; // Adjust the top position as needed
            nextButton.style.left = "705px"; // Adjust the left position as needed
            nextButton?.addEventListener('click', onNextButtonClick);
            viewer.container.appendChild(nextButton);

            // Initial setup
            setCameraToLocation(currentIndex);
          })
          .catch(error => {
            console.error('Error fetching JSON:', error);
          });

        const addPhaseNow = async () => {
          hideAllTilesets();
          const newbuildingTileset = await Cesium3DTileset.fromIonAssetId(2302705);
          viewer.scene.primitives.add(newbuildingTileset);

          resetCamera();
          //viewer.entities.remove(currentLabel);
          // currentLabelEntity = null;
          hideEntities();
          showEntitiesNow();
          currentPhase = "Phase Now";
          currentIndex = 0;

        };
        const addPhaseOne = async () => {
          hideAllTilesets();
          const newbuildingTileset = await Cesium3DTileset.fromIonAssetId(2301221);
          viewer.scene.primitives.add(newbuildingTileset);

          resetCamera();
          //viewer.entities.remove(currentLabel);
          // currentLabelEntity = null;
          hideEntities();
          showEntitiesNow();
          currentPhase = "Phase One";
          currentIndex = 0;

        };

        const addPhaseTwo = async () => {
          hideAllTilesets();
          const newbuildingTileset = await Cesium3DTileset.fromIonAssetId(2301244);
          viewer.scene.primitives.add(newbuildingTileset);

          resetCamera();
          //viewer.entities.remove(currentLabel);
          // currentLabelEntity = null;
          hideEntities();
          showEntitiesNow();
          currentPhase = "Phase Two";
          currentIndex = 0;

        };

        const addPhaseThree = async () => {
          hideAllTilesets();
          const newbuildingTileset = await Cesium3DTileset.fromIonAssetId(2301245);
          viewer.scene.primitives.add(newbuildingTileset);

          resetCamera();
          hideEntities();
          showEntitiesNow();
          currentPhase = "Phase Three";
          currentIndex = 0;

        };

        const hideAllTilesets = async () => {
          const primitives = viewer.scene.primitives;
          for (let i = 0; i < primitives.length; i++) {
            const primitive = primitives.get(i);
            if (primitive instanceof Cesium3DTileset) {
              primitives.remove(primitive);
              i--;
            }
          }
        };
        const hideEntities = async () => {
          // Remove the current label entity
          if (currentLabelEntity) {
            viewer.entities.remove(currentLabelEntity);
            currentLabelEntity = null;
          }
        };
        const showEntitiesNow = async () => {

        };
        // ------
        // Carousel
        // Create a custom button in the Cesium's existing toolbar
        const carouselButton = document.createElement('button');
        carouselButton.classList.add('cesium-button', 'cesium-toolbar-button');
        carouselButton.innerHTML = 'OC';

        // Add a click event handler to open the Carousel
        carouselButton.addEventListener('click', () => {
          setIsCarouselOpen(true);
        });

        // Get the Cesium toolbar container element
        const toolbar = viewer.container.querySelector('.cesium-viewer-toolbar');

        // Insert your custom button before an existing button
        if (toolbar) {
          const modeButton = toolbar.querySelector('.cesium-viewer-geocoderContainer');
          toolbar.insertBefore(carouselButton, modeButton);
        }

      } catch (error) {
        console.log(error);
      }
    };


    initializeViewer();
  }, []);

  return (
    <div>
      {/* Return the Cesium Viewer */}
      <div id="cesiumContainer" />

      {/* Return the Image Carousel Modal */}
      <CarouselModal isOpen={isCarouselOpen} onClose={() => setIsCarouselOpen(false)} openModal={() => setIsCarouselOpen(true)}>
        <ResponsiveCarousel />
      </CarouselModal>
    </div>
  );
};