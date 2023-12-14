'use client'    // Client component

import { Ion, createWorldTerrainAsync, Viewer, Cesium3DTileset, Cartesian3, PerspectiveFrustum, defined, Cesium3DTileStyle } from "cesium";
import { useEffect, useState } from "react";
import ResponsiveCarousel from "./ResponsiveCarousel";
import CarouselModal from './CarouselModal';

// This is the default access token
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhYzk1NzRlNC0yZjgzLTQyMzctYjE0Ni1iODgxZjI2NzJiZjkiLCJpZCI6MTExODcwLCJpYXQiOjE2NjYyNzI4MTZ9.sdSpshnEe-ByALHimDQ4AbIUJ82wWZ8HCUT5zyGgNrE';

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
                const tilesetExterior = await Cesium3DTileset.fromIonAssetId(1368494);
                viewer.scene.primitives.add(tilesetExterior);
                tilesetExterior.show = true;
                // Interior
                const tilesetInterior = await Cesium3DTileset.fromIonAssetId(1369457);
                viewer.scene.primitives.add(tilesetInterior);
                tilesetInterior.show = false;

                // Check if "e/E" was pressed to show tilesetExterior
                document.addEventListener('keydown', (event) => {
                    if (event.key === 'e' || event.key === 'E') {
                        tilesetExterior.show = true;
                        tilesetInterior.show = false;
                    }
                });
                // Check if "i/I" was pressed to show tilesetInterior
                document.addEventListener('keydown', (event) => {
                    if (event.key === 'i' || event.key === 'I') {
                        tilesetExterior.show = false;
                        tilesetInterior.show = true;
                    }
                });
                
                // ------
                // Camera settings
                await viewer.zoomTo(tilesetExterior);
                viewer.camera.position = new Cartesian3(4736954.40901528, 155726.14313851847, 4254884.18938475);
                viewer.camera.direction = new Cartesian3(-0.42410389201848225, 0.8530220500056251, 0.30412048760150384);
                viewer.camera.up = new Cartesian3(0.7062752621207551, 0.10134975317909911, 0.7006450468295589);
                viewer.scene.camera.frustum = new PerspectiveFrustum({
                  fov: 1.4,
                  aspectRatio: viewer.canvas.clientWidth / viewer.canvas.clientHeight,
                  near: 1.0,
                  far: 500000000.0
                })    // default viewer's camera PerspectiveFrustum values (https://cesium.com/learn/cesiumjs/ref-doc/PerspectiveFrustum.html)
                viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
                // Apply the default style if it exists (based on the initial code)
                var extras = tilesetExterior.asset.extras;
                if (
                  defined(extras) &&
                  defined(extras.ion) &&
                  defined(extras.ion.defaultStyle)
                ) {
                  tilesetExterior.style = new Cesium3DTileStyle(extras.ion.defaultStyle);
                }
                
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