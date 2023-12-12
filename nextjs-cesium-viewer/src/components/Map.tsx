'use client'    // Client component

import { Ion, IonResource, createWorldTerrainAsync, Viewer, CesiumTerrainProvider, Cesium3DTileset } from "cesium";
import { useEffect, useState } from "react";
import ResponsiveCarousel from "./ResponsiveCarousel";
import CarouselModal from './CarouselModal';

// This is the default access token
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc3MzMsImlhdCI6MTYyNzg0NTE4Mn0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxk';

export default () => {

    // Handle the modal carousel state
    const [isCarouselOpen, setIsCarouselOpen] = useState(false);

    // Initialize the Cesium Viewer
    useEffect(() => {
        const initializeViewer = async () => {
            try {
                const viewer = new Viewer("cesiumContainer", {
                    // Await the promise
                    terrainProvider: await createWorldTerrainAsync() 
                });

                // Load a 3D tileset (based on already implemented code using CesiumJS)
                // const ionResource = await IonResource.fromAssetId(1368494);
                // const tileset = new Cesium3DTileset({
                //     url: ionResource.getUrlComponent(),
                //     debugWireframe: true,
                // });
                // viewer.scene.primitives.add(tileset);

                // Load a 3D tileset given the existing examples (https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html):
                // Also in: ~\nextjs-cesium-template\node_modules\cesium\Source\Cesium.d.ts (query: url, 241 of 461)
                // try {
                //     const tileset = await Cesium.Cesium3DTileset.fromUrl(
                //        "http://localhost:8002/tilesets/Seattle/tileset.json"
                //     );
                //     scene.primitives.add(tileset);
                //   } catch (error) {
                //     console.error(`Error creating tileset: ${error}`);
                //   }

                // // Set the camera view to focus on the loaded asset
                // viewer.zoomTo(tileset);

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