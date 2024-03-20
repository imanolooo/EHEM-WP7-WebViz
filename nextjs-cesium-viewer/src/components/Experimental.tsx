'use client'    // Client component

import { Viewer, Scene, LabelCollection, Cartesian3, Color, DistanceDisplayCondition, Cartographic, PerspectiveFrustum, Transforms, HeadingPitchRoll, ConstantProperty, Matrix4, Entity, HeadingPitchRange, DirectionalLight, Light, Sun, PostProcessStage, Cesium3DTileStyle, Cesium3DTileColorBlendMode, PointPrimitive, IonResource, JulianDate, ClockRange, ClockStep, CameraEventType, ScreenSpaceEventHandler, ScreenSpaceEventType, Property } from "cesium";
import { Math as CesiumMath } from 'cesium';

const POI_RADIUS = 0.15; // meters
const LABEL_OFFSET = -0.2; // meters
const LABEL_FAR_DISTANCE = 4; // meters

class Experimental{
    viewer: Viewer; 
    scene: Scene; 
    storyDropdown: HTMLSelectElement;

    constructor(viewer: Viewer, scene: Scene)
    {
        this.viewer = viewer;
        this.scene = scene;
        this.storyDropdown = document.createElement('select');
    }

    addOption(value:string, text:string, select:HTMLSelectElement) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        select.appendChild(option);
    }

    addAudio(mp3file: string)
    {
        return `<embed src='https://www.cs.upc.edu/~virtual/mp3/` + mp3file + `' loop='true' autostart='true' width='2' height='0'> `;  
    }

    addImage(file: string, width: number = 200, credits: string = "")
    {
        var s = `<div style='text-align: center;'>  <img src='https://www.cs.upc.edu/~virtual/img/` + file + 
        `' width='` + String(width) + `'> </img> <H4> `+  credits + `</H4>  </div>`;
        return s;
    }

    next(id: string, seconds: number) {
        setTimeout(() => { this.storyDropdown.value = id; }, seconds * 1000); // TODO: check if the story is still active

    }   

    showDescription(id: string, name: string, description: string) {
        var poi = this.viewer.entities.getById(id)
        if (!poi) {
            poi = this.viewer.entities.add({
                id: id,
                //position: new Cartesian3(4736926.632121651, 155779.8592714208, 4254893.923154713),
                name : name,
                description: description + '<br> '
            });
        }
        this.viewer.infoBox.viewModel.maxHeight = 900;
        this.viewer.selectedEntity = undefined;
        this.viewer.selectedEntity = poi;
        this.viewer.infoBox.viewModel.enableCamera = false;
        this.viewer.infoBox.viewModel.isCameraTracking = false;
        this.viewer.infoBox.viewModel.maxHeight = 900;
    }

    createStoryDropdown() {
        // Get the Cesium toolbar container element
        const toolbar = this.viewer.container.querySelector('.cesium-viewer-toolbar');
        if (toolbar) {
            // Create a dropdown element
            const slideshowDropdown = document.createElement('select');
            slideshowDropdown.id = 'nav-menu';
            slideshowDropdown.classList.add('cesium-button');
            
            this.addOption("", "Select a story group", slideshowDropdown);
            this.addOption("A", "A. The Monument", slideshowDropdown);
            this.addOption("B", "B. Medieval iconography of the paintings", slideshowDropdown);
            this.addOption("C", "C. Techniques and materials", slideshowDropdown);
            
            // Create a second dropdown element
            this.storyDropdown.id = 'nav-menu';
            this.storyDropdown.classList.add('cesium-button');
            
            // Main dropdown event listener
            slideshowDropdown.addEventListener('change', async (event) => {
                const id = (event.target as HTMLSelectElement).value;                    
                console.log('Selected: ', id);
                if (id === "A") {
                    console.log("Story group A");
                    const L = this.storyDropdown.length;
                    for (var i=0; i<L; i++) this.storyDropdown.remove(0);
                    
                    this.addOption("", "Select a monument story", this.storyDropdown);
                    this.addOption("A1",  "A1. Monument presentation", this.storyDropdown);
                    this.addOption("A1b", "· 9th & 10th centuries", this.storyDropdown);
                    this.addOption("A2",  "A2. Description of the phases", this.storyDropdown);
                    this.addOption("A3",  "A3. Timeline", this.storyDropdown);
                }
                if (id === "B") {
                    console.log("Story group B");
                    const L = this.storyDropdown.length;
                    for (var i=0; i<L; i++) this.storyDropdown.remove(0);
                    
                    this.addOption("", "Select an iconography story", this.storyDropdown);
                    this.addOption("B1", "B1. The salvation is within the church", this.storyDropdown);
                    this.addOption("B2", "B2. The Apocalypse awaits at the central apse", this.storyDropdown);
                    this.addOption("B3", "B3. Forerunners of faith", this.storyDropdown);
                }
            });

            // Dropdown event listener

            this.storyDropdown.addEventListener('change', async (event) => {
                const id = (event.target as HTMLSelectElement).value;                    
                console.log('Selected: ', id);
                if (id === "A1") {
                    console.log("Story A1");
                    this.play_A1();    
                }
                if (id === "A1b") this.play_A1b();
            });


            toolbar.insertBefore(this.storyDropdown, toolbar.firstChild);
            toolbar.insertBefore(slideshowDropdown, toolbar.firstChild);


        }
    }

    play_A1() {
        this.viewer.scene.camera.flyTo({
            destination: new Cartesian3(4737342.976161912, 154993.09233837892, 4254737.396895817),
            orientation: {
                heading: CesiumMath.toRadians(70),
                pitch: CesiumMath.toRadians(0),
                roll: 0,
            },
            duration: 0.0
            });

        this.viewer.scene.camera.flyTo({
            destination: new Cartesian3(4736938.342744554, 155754.99109088015, 4254892.627347932),
            orientation: {
                heading: CesiumMath.toRadians(70),
                pitch: CesiumMath.toRadians(0),
                roll: 0,
            },
            duration: 12.0,
            complete: function () { },
            });

        this.showDescription("poi_A1", "Sant Quirze de Pedret", 
                `<H1> Welcome to Sant Quirze de Pedret </H1> 
                Sant Quirze de Pedret is a small mediaeval church in central Catalonia's 
                Berguedà area, near the Pyrenees foothills and an important old route. 
                The Llobregat River, one of the territory's key waterways, flows nearby. 
                <p> 
                The temple was originally constructed at the end of the ninth century. 
                Its architecture has changed considerably over time, and its walls have 
                been decorated at two different times, with figurative murals painting. ` + 
                this.addAudio("A1a.mp3") + this.addImage("IMG_5615.jpg", 200, "St. Quirze de Pedret, 2019. Photo by C. Andujar")
                );
        this.next("A1b", 28);
    }

    play_A1b() {
        this.viewer.scene.camera.flyTo({
            destination: new Cartesian3(4736938.342744554, 155754.99109088015, 4254892.627347932),
            orientation: {
                heading: CesiumMath.toRadians(70),
                pitch: CesiumMath.toRadians(0),
                roll: 0,
            },
            duration: 2.0,
            complete: function () { },
            }); 

        this.showDescription("poi_A1b", "Sant Quirze de Pedret", 
                `<H1> 9th & 10th century </H1> 
                The first church had a single nave crowned by a quadrangular vaulted apse. `
                + this.addImage("ix.jpg") +
                `<br> Later, in the middle of the 10th century, it was enlarged with two aisles ending with vaulted horseshoe-shaped apses. The first pictorial decoration was limited, as far as we know, to the back wall of the apse and a wall of the original nave.
                <p> ` +
                this.addAudio("A1b.mp3") 
                );
        //this.next("A1a", 28);
    }



    start() {

        console.log("Experimental start");
        this.createStoryDropdown();
        
        //const entity = this.viewer.entities.getById("46ff28c7-d685-4ed2-a2d3-7a7070b159cc");
        //if (entity) entity.description = new ConstantProperty("Hola");

        const labels = this.scene.primitives.add(new LabelCollection());

        this.viewer.infoBox.viewModel.enableCamera = false;
        this.viewer.infoBox.viewModel.isCameraTracking = false;
        this.viewer.infoBox.viewModel.maxHeight = 1900;
        

        var poi1 = this.viewer.entities.add({
            position: new Cartesian3(4736926.539133127, 155780.3329381903,4254907.069384843),
            name : 'St. Quirze de Pedret, 9th century',
            description:'<H1> Sant Quirze de Pedret',
            ellipsoid : {
                radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                material : Color.RED.withAlpha(0.5)
            }
        });

        var poi_orant = this.viewer.entities.add({
            position: new Cartesian3(4736926.905790371, 155793.86066556993, 4254899.979210657),
            name : "Sant Quirze de Pedret, XII century",
            description:"<H1> L'Orant </H1> <embed src='https://samplelib.com/lib/preview/mp3/sample-12s.mp3' loop='true' autostart='true' width='2' height='0'>When the Romanesque paintings were removed, remains of an earlier, pre-Romanesque mural decoration appeared. One of the two fragments is known as the 'Orant', where a male figure is depicted with arms outstretched in a posture of prayer, within a double circle and decorated in zigzag. <br>  <div style='text-align: center;'> <img src='https://visitmuseum.gencat.cat/media/cache/1140x684_portrait/uploads/objects/photos/54ba9fbfef972_orant-de-sant-quirze-de-pedret.jpeg' width='100'> </img> </div> <p> Above this circle, there is a bird with outstretched wings. <video controls width='250'><source src='https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' type='video/mp4' /></video>",
            ellipsoid : {
                radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                material : Color.RED.withAlpha(0.5)
            }
        });

        labels.add({
            position : new Cartesian3(4736926.905790371, 155793.86066556993, 4254899.979210657),
          text : 'Orant',
          eyeOffset : new Cartesian3(0.0, 0.0, LABEL_OFFSET), 
          distanceDisplayCondition: new DistanceDisplayCondition(0.01, LABEL_FAR_DISTANCE)
          });

    };

    stop() {
       
    };

};



export {Experimental}; 