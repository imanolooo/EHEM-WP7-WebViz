'use client'    // Client component

import { Viewer, Scene, LabelCollection, Cartesian3, Color, DistanceDisplayCondition, Cartographic, PerspectiveFrustum, Transforms, HeadingPitchRoll, ConstantProperty, Matrix4, Entity, HeadingPitchRange, DirectionalLight, Light, Sun, PostProcessStage, Cesium3DTileStyle, Cesium3DTileColorBlendMode, PointPrimitive, IonResource, JulianDate, ClockRange, ClockStep, CameraEventType, ScreenSpaceEventHandler, ScreenSpaceEventType, Property } from "cesium";
import { Math as CesiumMath } from 'cesium';

const POI_RADIUS = 0.06; // meters
const LABEL_OFFSET = -0.2; // meters
const LABEL_FAR_DISTANCE = 9; // meters

class POI {
    id: string;
    title: string;
    description: string;
    locationx: number;
    locationy: number;
    locationz: number;

    constructor(id: string, title: string, description: string, locationx: number, locationy: number, locationz: number) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.locationx = locationx; 
        this.locationy = locationy; 
        this.locationz = locationz; 
    }

}

class Experimental{
    viewer: Viewer; 
    scene: Scene; 
    storyDropdown: HTMLSelectElement;
    labels: LabelCollection;
    pois: POI[] = [];

    constructor(viewer: Viewer, scene: Scene)
    {
        this.viewer = viewer;
        this.scene = scene;
        this.storyDropdown = document.createElement('select');
        this.labels = this.scene.primitives.add(new LabelCollection());

        this.addAllPois();
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
        //this.createStoryDropdown();
        
        //const entity = this.viewer.entities.getById("46ff28c7-d685-4ed2-a2d3-7a7070b159cc");
        //if (entity) entity.description = new ConstantProperty("Hola");

        this.viewer.infoBox.viewModel.enableCamera = false;
        this.viewer.infoBox.viewModel.isCameraTracking = false;
        this.viewer.infoBox.viewModel.maxHeight = 1900;
    }

    /*
    addPOIs(id: string) 
    {
        this.labels.removeAll();
        // declare abc as an array of strings
        var ids = new Array();
        this.viewer.entities.values.forEach(entity => { if (entity.ellipsoid) ids.push(entity.id); });
        ids.forEach(id => { var entity = this.viewer.entities.getById(id); if (entity) this.viewer.entities.remove(entity); });
        if (id==="centralApse") 
        {
            var poiOrant = this.viewer.entities.add({
                position: new Cartesian3(4736926.962825191, 155793.86441249054, 4254900.037438289),
                name : 'Orant',
                description:"<H1> Orant </H1> When the Romanesque paintings were removed, fragments of an earlier, pre-Romanesque mural decoration appeared. One of the fragments is the 'Orant', a bearded male figure with open arms in a prayerful attitude. <br><br><img src='https://visitmuseum.gencat.cat/media/cache/1140x684_portrait/uploads/objects/photos/54ba9fbfef972_orant-de-sant-quirze-de-pedret.jpeg' width='400'> ",
                ellipsoid : {
                    radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                    material : Color.RED.withAlpha(1.0)
                }
            });

            this.labels.add({
            position : new Cartesian3(4736926.962825191, 155793.86441249054, 4254900.037438289),
            text : 'Orant',
            eyeOffset : new Cartesian3(-0.05, 0.0, LABEL_OFFSET),
            distanceDisplayCondition: new DistanceDisplayCondition(0.01, LABEL_FAR_DISTANCE),
            disableDepthTestDistance: LABEL_FAR_DISTANCE
            });

            

            var poiCavaller = this.viewer.entities.add({
                position: new Cartesian3(4736925.556599217, 155794.5915427292, 4254901.407861949),
                name : 'Cavaller',
                description:"<H1> Cavaller </H1> When the Romanesque paintings were removed, fragments of an earlier, pre-Romanesque mural decoration appeared. One of the fragments is the 'Cavaller',  a warrior on horseback. <br><br><img src='https://www.cs.upc.edu/~virtual/img/cavaller.jpg' width='400'>",
                ellipsoid : {
                    radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                    material : Color.RED.withAlpha(1.0)
                }
            });

            this.labels.add({
            position : new Cartesian3(4736925.556599217, 155794.5915427292, 4254901.407861949),
            text : 'Cavaller',
            eyeOffset : new Cartesian3(-0.08, 0.0, LABEL_OFFSET),
            distanceDisplayCondition: new DistanceDisplayCondition(0.01, LABEL_FAR_DISTANCE),
            disableDepthTestDistance: LABEL_FAR_DISTANCE
            });
        }
        if (id==="southApse")
        {
            var poiChrist = this.viewer.entities.add({
                position: new Cartesian3(4736929.057067022, 155790.07447817564, 4254899.004732476),
                name : 'Divine Incarnation',
                description:"<H1> Divine Incarnation </H1> At the apex, there is a portrayal of the infant Jesus Christ, clutching a scroll, seated on the Virgin Mary's lap, surrounded by an aureole or mandorla. This imagery symbolizes Christ's incarnation and his role as the founder of the Christian Church.",
                ellipsoid : {
                    radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                    material : Color.RED.withAlpha(1.0)
                }
            });

            this.labels.add({
            position : new Cartesian3(4736929.057067022, 155790.07447817564, 4254899.004732476),
            text : 'Divine Incarnation',
            eyeOffset : new Cartesian3(-0.18, 0.0, LABEL_OFFSET),
            distanceDisplayCondition: new DistanceDisplayCondition(0.01, LABEL_FAR_DISTANCE),
            disableDepthTestDistance: LABEL_FAR_DISTANCE
            });

            

            var poiCrownedlady = this.viewer.entities.add({
                position: new Cartesian3(4736928.800539953, 155789.13254590853, 4254897.888945552),
                name : 'Church on Earth',
                description:"<H1> Church on Earth </H1> The Church's terrestrial phase is depicted by means of a double visual metaphor. Next to the entrance, at the visitor’s right-hand side, there is the church personified as a crowned lady seated on a church-like edifice, reflecting the ethos of the Gregorian Reform. However, this iconography, with few parallels, notably in southern Italy, raises questions about its cultural transmission to Catalonia.",
                ellipsoid : {
                    radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                    material : Color.RED.withAlpha(1.0)
                }
            });

            this.labels.add({
            position : new Cartesian3(4736928.800539953, 155789.13254590853, 4254897.888945552),
            text : 'Church on Earth',
            eyeOffset : new Cartesian3(-0.15, 0.0, LABEL_OFFSET),
            distanceDisplayCondition: new DistanceDisplayCondition(0.01, LABEL_FAR_DISTANCE),
            disableDepthTestDistance: LABEL_FAR_DISTANCE
            });

            

            var poiWise = this.viewer.entities.add({
                position: new Cartesian3(4736927.884777924, 155790.40944153548, 4254899.321675795),
                name : 'The Parable of the Virgins',
                description:"<H1> The Parable of the Virgins </H1> The rest of the medium zone of the wall illustrates the parable of the wise and foolish virgins (Matthew 25,1-4), with the wise seated at a table with Christ. The juxtaposition of natural and metaphorical light, through burning and extinguished torches, underscores the theme of spiritual preparedness for salvation.",
                ellipsoid : {
                    radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                    material : Color.RED.withAlpha(1.0)
                }
            });

            this.labels.add({
            position : new Cartesian3(4736927.884777924, 155790.40944153548, 4254899.321675795),
            text : 'The Parable of the Virgins',
            eyeOffset : new Cartesian3(-0.26, 0.0, LABEL_OFFSET),
            distanceDisplayCondition: new DistanceDisplayCondition(0.01, LABEL_FAR_DISTANCE),
            disableDepthTestDistance: LABEL_FAR_DISTANCE
            });

            

            var poiFoolish = this.viewer.entities.add({
                position: new Cartesian3(4736929.009021637, 155790.2253358087, 4254897.839051721),
                name : 'The Parable of the Virgins',
                description:"<H1> The Parable of the Virgins </H1> The rest of the medium zone of the wall illustrates the parable of the wise and foolish virgins (Matthew 25,1-4), with the wise seated at a table with Christ. The juxtaposition of natural and metaphorical light, through burning and extinguished torches, underscores the theme of spiritual preparedness for salvation.",
                ellipsoid : {
                    radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                    material : Color.RED.withAlpha(1.0)
                }
            });

            this.labels.add({
            position : new Cartesian3(4736929.009021637, 155790.2253358087, 4254897.839051721),
            text : 'The Parable of the Virgins',
            eyeOffset : new Cartesian3(-0.26, 0.0, LABEL_OFFSET),
            distanceDisplayCondition: new DistanceDisplayCondition(0.01, LABEL_FAR_DISTANCE),
            disableDepthTestDistance: LABEL_FAR_DISTANCE
            });
        }




    };
    */

    addAllPois() {
		this.pois.push(new POI("Orant", "Orant", `<p style="font-size:14px; font-family:Verdana, sans-serif">When the Romanesque paintings were removed, fragments of an earlier, pre-Romanesque mural decoration appeared. This fragment is the 'Orant', 
a bearded male figure, probably a saint, with open arms in a prayerful attitude.
<br><br><img src='orant.jpg' height='480'>

`, 4736926.962825191, 155793.86441249054, 4254900.037438289));
		this.pois.push(new POI("Cavaller", "Cavaller", `<p style="font-size:14px; font-family:Verdana, sans-serif">When the Romanesque paintings were removed, fragments of an earlier, pre-Romanesque mural decoration appeared. This fragment is the 'Cavaller' or the Knight, 
a warrior on horseback who probably represents a saint. 
<br><br><img src='cavaller.jpg' height='600'>

`, 4736925.556599217, 155794.5915427292, 4254901.407861949));
		this.pois.push(new POI("Christ", "Divine Incarnation", `<p style="font-size:14px; font-family:Verdana, sans-serif">At the apex, there is a portrayal of the infant Jesus Christ, clutching a scroll, seated on the Virgin Mary's lap, surrounded by an aureole or mandorla. This imagery symbolizes Christ's incarnation and his role as the founder of the Christian Church.`, 4736929.057067022, 155790.07447817564, 4254899.004732476));
		this.pois.push(new POI("Crownedlady", "Church on Earth", `<p style="font-size:14px; font-family:Verdana, sans-serif">The Church's terrestrial phase is depicted by means of a double visual metaphor. Next to the entrance, at the visitor’s right-hand side, there is the church personified as a crowned lady seated on a church-like edifice, reflecting the ethos of the Gregorian Reform. However, this iconography, with few parallels, notably in southern Italy, raises questions about its cultural transmission to Catalonia.`, 4736928.800539953, 155789.13254590853, 4254897.888945552));
		this.pois.push(new POI("Wise", "The Parable of the Virgins", `<p style="font-size:14px; font-family:Verdana, sans-serif">The rest of the medium zone of the wall illustrates the parable of the wise and foolish virgins (Matthew 25,1-4), with the wise seated at a table with Christ. The juxtaposition of natural and metaphorical light, through burning and extinguished torches, underscores the theme of spiritual preparedness for salvation.`, 4736927.884777924, 155790.40944153548, 4254899.321675795));
		this.pois.push(new POI("Foolish", "The Parable of the Virgins", `<p style="font-size:14px; font-family:Verdana, sans-serif">The rest of the medium zone of the wall illustrates the parable of the wise and foolish virgins (Matthew 25,1-4), with the wise seated at a table with Christ. The juxtaposition of natural and metaphorical light, through burning and extinguished torches, underscores the theme of spiritual preparedness for salvation.`, 4736929.009021637, 155790.2253358087, 4254897.839051721));
		this.pois.push(new POI("SaintWriting", "Seated saint writing", `<p style="font-size:14px; font-family:Verdana, sans-serif">Unidentified Saint seated and writing. `, 4736928.6574164545, 155788.77521022837, 4254898.795277267));
		this.pois.push(new POI("scaMaria", "Inscription ", `<p style="font-size:14px; font-family:Verdana, sans-serif">SCA MARIA, inscription that identifies the Virgin`, 4736928.676959032, 155789.87453088397, 4254899.403179705));
		this.pois.push(new POI("dado", "Dado definition", `<p style="font-size:14px; font-family:Verdana, sans-serif">According to the Encyclopaedia Britannica, “dado, in Classical architecture, the plain portion between the base and cornice of the pedestal of a column and, in later architecture, the panelled, painted, or otherwise decorated lower part of a wall, up to 2 or 3 feet (60 to 90 cm) above the floor.”`, 4736927.925878803, 155789.6636105353, 4254896.76965745));
		this.pois.push(new POI("maiestas", "Maiestas Domini", `<p style="font-size:14px; font-family:Verdana, sans-serif">In the apse of the chapel, a notably deteriorated yet still compelling depiction of the “Maiestas Domini”, or “Christ in Majesty” presides from the vault.`, 4736928.007143847, 155792.61236939128, 4254903.079557159));
		this.pois.push(new POI("ox", "The ox, symbol of St. Luke the Evangelist", `<p style="font-size:14px; font-family:Verdana, sans-serif">The figure of an ox, also holding a book, is clearly identifiable. This iconography aligns with St. Luke the Evangelist, whose gospel opens with an account of Zechariah's sacrifice. The ox, a traditional symbol of sacrifice, metaphorically suggests the human aspiration for a spiritual life, transcending base animalistic instincts.`, 4736927.384003448, 155794.32320798773, 4254903.170072327));
		this.pois.push(new POI("lion", "The lion, symbol of St. Mark the Evangelist", `<p style="font-size:14px; font-family:Verdana, sans-serif">The lion, depicted holding a book, represents St. Mark the Evangelist. The symbolism draws from the Gospel of St. Mark, which begins with the narrative of St. John the Baptist in the wilderness. The lion's portrayal, embodying strength and nobility, serves as a metaphorical prefiguration of Christ.`, 4736928.641813144, 155793.59030907456, 4254902.063322327));
		this.pois.push(new POI("eagle", "The eagle, symbol of St. John", `<p style="font-size:14px; font-family:Verdana, sans-serif">The depiction of an eagle symbolizing St. John the Evangelist can only be surmised. `, 4736928.124939195, 155790.8495206062, 4254902.603389485));
		this.pois.push(new POI("angel", "The angel, symbol of St. Matthew", `<p style="font-size:14px; font-family:Verdana, sans-serif">Unfortunately, the representation of the angel, an emblem of St. Matthew the Evangelist, has faded into decay and is no longer recognizable.`, 4736927.090062655, 155791.89067310668, 4254903.903101254));
		this.pois.push(new POI("dextera1", "The Hand of God in the window", `<p style="font-size:14px; font-family:Verdana, sans-serif">The Hand of God alludes to the physical and spiritual enlighten of the place. `, 4736927.363361403, 155794.51194876738, 4254901.611712034));
		this.pois.push(new POI("throne", "The vacant throne", `<p style="font-size:14px; font-family:Verdana, sans-serif">The vacant throne with the roll of the seven seals`, 4736927.734282723, 155794.21991309212, 4254901.861325407));
		this.pois.push(new POI("elders", "Elders of the Apocalypse", `<p style="font-size:14px; font-family:Verdana, sans-serif">Only about nine figures of the 24 elders mentioned in the Apocalypse have survived. They are seated on high-backed chairs and hold a harp in their hands. A crown hangs above their heads.`, 4736927.192590896, 155793.97169476436, 4254900.583162181));
		this.pois.push(new POI("Lamb_inscription", "Inscription mentioning the Lamb", `<p style="font-size:14px; font-family:Verdana, sans-serif">
The inscription [AGNVS DEI QVI T]OL[L]ITP[E] / [CCAT]A MON / DI alludes to the presence of the Lamb, which would be accompanying it. The text has liturgical significance, as it evokes the Roman Mass prayer of the Agnus dei: "Lamb of God, who takes away the sin of the world, have mercy on us"). At the same time, it recalls the words of John the Baptist when he saw Jesus: "Behold the Lamb of God, who takes away the sin of the world.(Jo. 1,29)`, 4736928.086128469, 155793.70484611992, 4254902.240684626));
		this.pois.push(new POI("scales", "The scales of the Apocalyptic knight", `<p style="font-size:14px; font-family:Verdana, sans-serif">Accoding to Rev. 6,5, this horseman symbolizes scarcity on earth.`, 4736927.789278445, 155792.03589676268, 4254900.393080054));
		this.pois.push(new POI("hell", "The gates of hell", `<p style="font-size:14px; font-family:Verdana, sans-serif">Just around the corner is an elongated black spot, which could be identified as the gate of Hell.`, 4736928.289110475, 155793.55130542885, 4254900.138990375));
		this.pois.push(new POI("Death", "The horseman of Death", `<p style="font-size:14px; font-family:Verdana, sans-serif">Next to the gates of hell there is a saddened figure holding reins in his hand: he is the horseman of Death.`, 4736928.062460028, 155793.12627936073, 4254900.128780006));
		this.pois.push(new POI("martyrs", "The souls of the martyrs", `<p style="font-size:14px; font-family:Verdana, sans-serif">Six busts, dressed in white robes, that represent the souls of the martyrs mentioned at the opening of the fifth seal.`, 4736926.012778861, 155794.3124003423, 4254903.060940844));
		this.pois.push(new POI("altar", "The altar", `<p style="font-size:14px; font-family:Verdana, sans-serif">The altar, which has been placed above the souls of the martyrs as the biblical text says, is a very prominent feature.`, 4736926.508230306, 155794.40806272783, 4254903.18560753));
		this.pois.push(new POI("ciborium", "Canopy or ciborium ", `<p style="font-size:14px; font-family:Verdana, sans-serif">The purpose of the canopy or ciborium is to protect and embellish the altar<br><br><img src='ciborium.jpg' width='60%'>`, 4736926.642469661, 155794.20561968195, 4254903.283976408));
		this.pois.push(new POI("sky", "The rolling sky", `<p style="font-size:14px; font-family:Verdana, sans-serif">The sky is represented by a white parchment resembling a tablecloth. The inscription (C)OELO is the key to identifying this fragment. <br><br><img src='coelo.jpg' width='60%'>`, 4736925.866166571, 155794.30033455332, 4254902.978532835));
	}



    addPOIs(ids: string[]) {
        // remove all previous POIs
        this.labels.removeAll();
        this.viewer.entities.values.forEach(entity => { if (entity.ellipsoid) ids.push(entity.id); });
        ids.forEach(id => { var entity = this.viewer.entities.getById(id); if (entity) this.viewer.entities.remove(entity); });

        // Add new POIs based on the ids array
        this.pois.forEach(poi => {
            // add only if in the list of ids
            if (!ids.includes(poi.id)) return;
            // add red ellipsoid
            var poiEntity = this.viewer.entities.add({
                position: new Cartesian3(poi.locationx, poi.locationy, poi.locationz),
                name : poi.title,
                description: poi.description,
                ellipsoid : {
                    radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                    material : Color.RED.withAlpha(1.0)
                }
            });
            // add label
            this.labels.add({
                position : new Cartesian3(poi.locationx, poi.locationy, poi.locationz),
                text : poi.title,
                eyeOffset : new Cartesian3(-0.05, 0.0, LABEL_OFFSET),
                distanceDisplayCondition: new DistanceDisplayCondition(0.01, LABEL_FAR_DISTANCE),
                disableDepthTestDistance: LABEL_FAR_DISTANCE
                });
        });

    }


    // Evripidis
    // refactored addPOIs()
    addPOIsOld(ids: string[]) {
        this.labels.removeAll();
        this.viewer.entities.values.forEach(entity => { if (entity.ellipsoid) ids.push(entity.id); });
        ids.forEach(id => { var entity = this.viewer.entities.getById(id); if (entity) this.viewer.entities.remove(entity); });

        // Add new POIs based on the ids array
        ids.forEach(id => {
            switch (id) {
                case "Christ":
                    
                    var poiOrant = this.viewer.entities.add({
                        position: new Cartesian3(4736926.962825191, 155793.86441249054, 4254900.037438289),
                        name : 'Orant',
                        description:"<H1> Orant </H1> When the Romanesque paintings were removed, fragments of an earlier, pre-Romanesque mural decoration appeared. One of the fragments is the 'Orant', a bearded male figure with open arms in a prayerful attitude. <br><br><img src='https://visitmuseum.gencat.cat/media/cache/1140x684_portrait/uploads/objects/photos/54ba9fbfef972_orant-de-sant-quirze-de-pedret.jpeg' width='400'> ",
                        ellipsoid : {
                            radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                            material : Color.RED.withAlpha(1.0)
                        }
                    });
        
                    this.labels.add({
                    position : new Cartesian3(4736926.962825191, 155793.86441249054, 4254900.037438289),
                    text : 'Orant',
                    eyeOffset : new Cartesian3(-0.05, 0.0, LABEL_OFFSET),
                    distanceDisplayCondition: new DistanceDisplayCondition(0.01, LABEL_FAR_DISTANCE),
                    disableDepthTestDistance: LABEL_FAR_DISTANCE
                    });
        
                    
        
                    var poiCavaller = this.viewer.entities.add({
                        position: new Cartesian3(4736925.556599217, 155794.5915427292, 4254901.407861949),
                        name : 'Cavaller',
                        description:"<H1> Cavaller </H1> When the Romanesque paintings were removed, fragments of an earlier, pre-Romanesque mural decoration appeared. One of the fragments is the 'Cavaller',  a warrior on horseback. <br><br><img src='https://www.cs.upc.edu/~virtual/img/cavaller.jpg' width='400'>",
                        ellipsoid : {
                            radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                            material : Color.RED.withAlpha(1.0)
                        }
                    });
        
                    this.labels.add({
                    position : new Cartesian3(4736925.556599217, 155794.5915427292, 4254901.407861949),
                    text : 'Cavaller',
                    eyeOffset : new Cartesian3(-0.08, 0.0, LABEL_OFFSET),
                    distanceDisplayCondition: new DistanceDisplayCondition(0.01, LABEL_FAR_DISTANCE),
                    disableDepthTestDistance: LABEL_FAR_DISTANCE
                    });

                    break;

                case "Crownedlady":
                    
                    var poiChrist = this.viewer.entities.add({
                        position: new Cartesian3(4736929.057067022, 155790.07447817564, 4254899.004732476),
                        name : 'Divine Incarnation',
                        description:"<H1> Divine Incarnation </H1> At the apex, there is a portrayal of the infant Jesus Christ, clutching a scroll, seated on the Virgin Mary's lap, surrounded by an aureole or mandorla. This imagery symbolizes Christ's incarnation and his role as the founder of the Christian Church.",
                        ellipsoid : {
                            radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                            material : Color.RED.withAlpha(1.0)
                        }
                    });
        
                    this.labels.add({
                    position : new Cartesian3(4736929.057067022, 155790.07447817564, 4254899.004732476),
                    text : 'Divine Incarnation',
                    eyeOffset : new Cartesian3(-0.18, 0.0, LABEL_OFFSET),
                    distanceDisplayCondition: new DistanceDisplayCondition(0.01, LABEL_FAR_DISTANCE),
                    disableDepthTestDistance: LABEL_FAR_DISTANCE
                    });
        
                    
        
                    var poiCrownedlady = this.viewer.entities.add({
                        position: new Cartesian3(4736928.800539953, 155789.13254590853, 4254897.888945552),
                        name : 'Church on Earth',
                        description:"<H1> Church on Earth </H1> <h1> The Church's terrestrial phase </h1> is depicted by means of a double visual metaphor. Next to the entrance, at the visitor’s right-hand side, there is the church personified as a crowned lady seated on a church-like edifice, reflecting the ethos of the Gregorian Reform. However, this iconography, with few parallels, notably in southern Italy, raises questions about its cultural transmission to Catalonia.",
                        ellipsoid : {
                            radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                            material : Color.RED.withAlpha(1.0)
                        }
                    });
        
                    this.labels.add({
                    position : new Cartesian3(4736928.800539953, 155789.13254590853, 4254897.888945552),
                    text : 'Church on Earth',
                    eyeOffset : new Cartesian3(-0.15, 0.0, LABEL_OFFSET),
                    distanceDisplayCondition: new DistanceDisplayCondition(0.01, LABEL_FAR_DISTANCE),
                    disableDepthTestDistance: LABEL_FAR_DISTANCE
                    });
        
                    
        
                    var poiWise = this.viewer.entities.add({
                        position: new Cartesian3(4736927.884777924, 155790.40944153548, 4254899.321675795),
                        name : 'The Parable of the Virgins',
                        description:"<H1> The Parable of the Virgins </H1> The rest of the medium zone of the wall illustrates the parable of the wise and foolish virgins (Matthew 25,1-4), with the wise seated at a table with Christ. The juxtaposition of natural and metaphorical light, through burning and extinguished torches, underscores the theme of spiritual preparedness for salvation.",
                        ellipsoid : {
                            radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                            material : Color.RED.withAlpha(1.0)
                        }
                    });
        
                    this.labels.add({
                    position : new Cartesian3(4736927.884777924, 155790.40944153548, 4254899.321675795),
                    text : 'The Parable of the Virgins',
                    eyeOffset : new Cartesian3(-0.26, 0.0, LABEL_OFFSET),
                    distanceDisplayCondition: new DistanceDisplayCondition(0.01, LABEL_FAR_DISTANCE),
                    disableDepthTestDistance: LABEL_FAR_DISTANCE
                    });
        
                    
        
                    var poiFoolish = this.viewer.entities.add({
                        position: new Cartesian3(4736929.009021637, 155790.2253358087, 4254897.839051721),
                        name : 'The Parable of the Virgins',
                        description:"<H1> The Parable of the Virgins </H1> The rest of the medium zone of the wall illustrates the parable of the wise and foolish virgins (Matthew 25,1-4), with the wise seated at a table with Christ. The juxtaposition of natural and metaphorical light, through burning and extinguished torches, underscores the theme of spiritual preparedness for salvation.",
                        ellipsoid : {
                            radii : new Cartesian3(POI_RADIUS, POI_RADIUS, POI_RADIUS),
                            material : Color.RED.withAlpha(1.0)
                        }
                    });
        
                    this.labels.add({
                    position : new Cartesian3(4736929.009021637, 155790.2253358087, 4254897.839051721),
                    text : 'The Parable of the Virgins',
                    eyeOffset : new Cartesian3(-0.26, 0.0, LABEL_OFFSET),
                    distanceDisplayCondition: new DistanceDisplayCondition(0.01, LABEL_FAR_DISTANCE),
                    disableDepthTestDistance: LABEL_FAR_DISTANCE
                    });

                    break;

                
                // case "centralApse":
                //     // I stole the previous code from here and put it in "case "Christ"
                //     break;
                // case "southApse":
                //     // I stole the previous code from here and put it in "case "Crownedlady"
                //     break;
            }
        });

    }

    stop() {
       
    };

};



export {Experimental}; 