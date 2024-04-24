'use client'    // Client component

import React, { useState, useEffect, useRef, useLayoutEffect, use } from "react";
import { useSearchParams } from 'next/navigation'
import { Carousel } from "react-responsive-carousel";
import XMLParser from "./XMLParser";
import OpenSeadragon from 'openseadragon';
import * as Annotorious from '@recogito/annotorious-openseadragon';
import "react-responsive-carousel/lib/styles/carousel.min.css";

import '@recogito/annotorious-openseadragon/dist/annotorious.min.css';
// import '@recogito/annotorious-shape-labels/dist/annotorious-shape-labels.min.js';


interface AnnotationData {
    text: string;
    points: string;
    imageUrl: string;
    id: string;
    grahMatId: string;
}

interface Annotation {
    type: string;
    data: AnnotationData[];
}

const keyToPhaseUUID: { [key: string]: string } = {
    '1': "3499571232320707957443215480729307058623549712539786656438",
    '2': "2025080909350698142359024115616879762766565409414772530811",
    '3': "5622945963191582858360417193921260502800211757871433641928",
    '4': "5207883142471703088573806435335977945904842489348384582030"
};



const imgsUrlPrefix = 'https://ehem.virvig.eu/imgs/';
const thumbnailsUrlPrefix = 'https://ehem.virvig.eu/thumbs/';
// example: https://ehem.virvig.eu/thumbs/GM000013.jpg

const GraphicMaterialsXmlUrl = './Graphic_Materials.xml';
const AnnotationsXmlUrl = './Annotations.xml';
const ArchitecturalPhasesXmlUrl = './Architectural_Phases.xml';
const ArchitecturalSpacesXmlUrl = './Architectural_Spaces.xml';
const Link_GraphicMaterialsArchitecturalPhasesXmlUrl = './Graphic_Materials_link_Architectural_Phases.xml';
const Link_GraphicMaterialsArchitecturalSpacesXmlUrl = './Graphic_Materials_link_Architectural_Spaces.xml';


// Create an Annotorious annotation from the annotation data
function createAnnotoriousAnnotation(annotationData: AnnotationData, currentImage: string | null): any | null {
    if (annotationData.points.length === 0) {
        return null;
    }

    // Transform the points array into a string of space-separated coordinates
    const points = annotationData.points.trim().replace(/,/g, ' ');

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        "id": annotationData.id,
        "type": "Annotation",
        "body": [{
            "type": "TextualBody",
            "value": annotationData.text,
            //"purpose": "commenting", 
            "format" : "text/html"  // support HTML tags
        },
        /*{
            "type": "TextualBody",
            "value": annotationData.text,
            "purpose": "tagging", 
            "format" : "text/html"  // support HTML tags
        }*/
        ],
        "target": {
            "source": currentImage,
            "selector": {
                "type": "SvgSelector",
                "value": `<svg><polygon points="${points}" /></svg>`
            }
        }
    };
}


interface Props {
    currentImage: any,
    setCurrentImage: any;
}

const ResponsiveCarousel: React.FC<Props> = ({currentImage, setCurrentImage}) => {
    // Get the app version from the URL
    const searchParams = useSearchParams();
    const appVersion = searchParams.get('version');
    // States to store the parsed data
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
    const [authors, setAuthors] = useState<string[]>([]);
    const [dates, setDates] = useState<string[]>([]);
    const [titles, setTitles] = useState<string[]>([]);
    const [graphMatIds, setGraphMatIds] = useState<any[]>([]);
    const [architecturalPhases, setArchitecturalPhases] = useState<any[]>([]);
    const [architecturalPhasesDates, setArchitecturalPhasesDates] = useState<any[]>([]);
    const [architecturalSpaces, setArchitecturalSpaces] = useState<any[]>([]);
    const [architecturalSpacesNames, setArchitecturalSpacesNames] = useState<any[]>([]);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    //let   [currentImage, setCurrentImage] = useState<string | null>(null);
    const [isCurrentImageSet, setIsCurrentImageSet] = useState(false);

    const [graphicMaterialToSpace, setGraphicMaterialToSpace] = useState<Map<string, string>>(new Map());
    const [graphicMaterialToPhase, setGraphicMaterialToPhase] = useState<Map<string, string>>(new Map());
    const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
    const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
    const [filteredThumbnailUrls, setFilteredThumbnailUrls] = useState<string[]>([]);
    const [filteredImageUrls, setFilteredImageUrls] = useState<string[]>([]);


    // Boolean states to check if the XMLs are parsed
    const [isGraphicMaterialsXmlParsed, setIsGraphicMaterialsXmlParsed] = useState(false);
    const [isAnnotationsXmlParsed, setIsAnnotationsXmlParsed] = useState(false);
    const [isArchitecturalPhasesXmlParsed, setIsArchitecturalPhasesXmlParsed] = useState(false);
    const [isArchitecturalSpacesXmlParsed, setIsArchitecturalSpacesXmlParsed] = useState(false);
    const [isLink_GraphicMaterialsArchitecturalPhasesXmlParsed, setIsLink_GraphicMaterialsArchitecturalPhasesXmlParsed] = useState(false);
    const [isLink_GraphicMaterialsArchitecturalSpacesXmlParsed, setIsLink_GraphicMaterialsArchitecturalSpacesXmlParsed] = useState(false);

    // Helper function to get ImageUrl from Graphic Materials, in order to use for Annotations
    const getImageUrlByGraphicMaterialId = (graphicMaterialId: string) => {
        const index = graphMatIds.indexOf(graphicMaterialId);
        // If the graphicMaterialId is found, return the corresponding image URL
        if (index !== -1) {
          return imageUrls[index];
        }
      
        return null;
    };

    // Parse and store Graphic Materials
    const handleGraphicMaterialsParsedData  = (data: any) => {
        const GraphMat_Ids = []; // Ids (row.children[0])
        const GraphMat_UUIDNumbers = []; // UUID Numbers (row.children[1])
        const GraphMat_Titles = []; // Title (row.children[2])
        const GraphMat_Authors = []; // Authors (row.children[4])
        const GraphMat_Dates = []; // Dates (row.children[10])
        const GraphMat_Version: any[] = []; // Version (row.children[12])
        const GraphMat_ImageUrls = []; // ImageUrls (row.children[13])
        const GraphMat_ThumbnailUrls = []; // ThumbnailUrls (row.children[13]), same as imgUrls but with a different prefix
        // Get the ROWS from the XML data
        // Skip the last row, that contains 'https://ehem.virvig.eu/imgs/GM0064.png' which is empty and causes errors.
        for (let i = 3; i < data.children.length - 1; i++) {
            const ROW = data.children[i];
            if (!ROW || !ROW.children) {
                console.error('Invalid or missing ROW in XML data.');
                return;
            }
            const row_data = ROW.children;
    
            // Safely get the required information from each row
            GraphMat_Ids.push(row_data[0] && row_data[0].children && row_data[0].children[0] ? row_data[0].children[0] : 'Unknown ID');
            GraphMat_UUIDNumbers.push(row_data[1] && row_data[1].children && row_data[1].children[0] ? row_data[1].children[0] : 'Unknown UUID');
            GraphMat_Titles.push(row_data[2] && row_data[2].children && row_data[2].children[0] ? row_data[2].children[0] : 'Unknown Title');
            GraphMat_Authors.push(row_data[4] && row_data[4].children && row_data[4].children[0] ? row_data[4].children[0] : 'Unknown Author');
            GraphMat_Dates.push(row_data[10] && row_data[10].children && row_data[10].children[0] ? row_data[10].children[0] : 'Unknown Date');
            GraphMat_Version.push(row_data[12] && row_data[12].children && row_data[12].children[0] ? row_data[12].children[0] : 'Unknown Version');
            
            // Handling File_Name for image and thumbnail URLs
            const fileNameNode = row_data[13] && row_data[13].children && row_data[13].children[0] ? row_data[13].children[0] : null;
            if (fileNameNode && typeof fileNameNode === 'string') {
                const encodedFilename = encodeURIComponent(fileNameNode);
                const imageUrl = `${imgsUrlPrefix}${encodedFilename}`;
                const thumbnailUrl = `${thumbnailsUrlPrefix}${encodedFilename}`;
                GraphMat_ImageUrls.push(imageUrl);
                GraphMat_ThumbnailUrls.push(thumbnailUrl);
            } else {
                GraphMat_ImageUrls.push('Unknown ImageUrl');
                GraphMat_ThumbnailUrls.push('Unknown ThumbnailUrl');
            }
        }
        
        // Filter function based on appVersion and GraphMat_Version
        const filterByAppVersion = (index: number) => {
            // No URL version --> General public
            if (!appVersion) {
                return GraphMat_Version[index] === 'Yes, public';
            // URL version == 'restorer' --> EHEM internal use
            } else if (appVersion === 'restorer') {
                return GraphMat_Version[index] === 'Yes, EHEM internal use'
                        || GraphMat_Version[index] === 'Yes, public';
            }
            else if (appVersion === 'researcher') {
                return GraphMat_Version[index] === 'Yes, EHEM internal use'
                || GraphMat_Version[index] === 'Yes, public'
                || GraphMat_Version[index] === 'No';
            }
        };

        // Apply the filter based on appVersion
        const filteredIndexes = GraphMat_Version.map((_, index) => index).filter(filterByAppVersion);

        // Utility to filter array by indexes
        const filterArrayByIndexes = (array: any[], indexes: number[]) => indexes.map(index => array[index]);

        // After filtering, set the current image to the first image of the filtered array
        if (filteredIndexes.length > 0) {
            const firstFilteredIndex = filteredIndexes[0];
            const firstImageUrl = GraphMat_ImageUrls[firstFilteredIndex];
            if (firstImageUrl) {
                // Set the first filtered image as the current image
                setCurrentImage(firstImageUrl);
            }
        } else {
            // Set a default image just in case the filtering criteria are not met
            setCurrentImage('defaultImageURL');
        }

        // Set data based on appVersion
        setTitles(filterArrayByIndexes(GraphMat_Titles, filteredIndexes));
        setAuthors(filterArrayByIndexes(GraphMat_Authors, filteredIndexes));
        setDates(filterArrayByIndexes(GraphMat_Dates, filteredIndexes));
        setGraphMatIds(filterArrayByIndexes(GraphMat_Ids, filteredIndexes));
        setImageUrls(filterArrayByIndexes(GraphMat_ImageUrls, filteredIndexes));
        setThumbnailUrls(filterArrayByIndexes(GraphMat_ThumbnailUrls, filteredIndexes));

        // finished parsing and filtering
        setIsGraphicMaterialsXmlParsed(true);
    };
    
    // Parse and store Annotations
    const handleAnnotationsParsedData = (data: any) => {
        const Annotations_Ids = []; // Ids (row.children[0])
        const Annotations_Text = []; // Text (row.children[1])
        const Annotations_Points = []; // Points (row.children[2])
        const Annotations_GraphMat_ID = []; // GraphMat_ID (row.children[4])
        const newAnnos: Annotation[] = []; // temp Annotations array to push

        // Get the ROWS from the XML data
        for (let i = 3; i < data.children.length; i++) {
            const ROW = data.children[i];
            if (!ROW || !ROW.children) {
                console.error('Invalid or missing ROW in XML data.');
                return;
            }
            const row_data = ROW.children;

            // Safely get the required information from each row
            Annotations_Ids.push(row_data[0] && row_data[0].children && row_data[0].children[0] ? row_data[0].children[0] : 'Unknown ID');
            Annotations_Text.push(row_data[1] && row_data[1].children && row_data[1].children[0] ? row_data[1].children[0] : 'No Text');
            Annotations_Points.push(row_data[2] && row_data[2].children && row_data[2].children[0] ? row_data[2].children[0] : 'No Points');
            Annotations_GraphMat_ID.push(row_data[4] && row_data[4].children && row_data[4].children[0] ? row_data[4].children[0] : 'No GraphMat_ID');

            // Finding the corresponding image URL
            const imageUrl = getImageUrlByGraphicMaterialId(row_data[4].children[0]);

            if (imageUrl && row_data[2].children[0].length > 0) {
                // Creating the AnnotationData object
                var cleanText = row_data[1].children[0]; 
                console.log(cleanText);
                //cleanText = cleanText.replace("&lt;", "<").replace("&gt;", ">");
                cleanText = cleanText.replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
                const annotationData: AnnotationData = {
                    text: cleanText,
                    points: row_data[2].children[0],
                    imageUrl: imageUrl,
                    id: row_data[0].children[0],
                    grahMatId: row_data[4].children[0],
                };
                newAnnos.push({ type: 'Annotation', data: [annotationData] });
            }
        }
        setAnnotations(newAnnos);
        setIsAnnotationsXmlParsed(true);
    };

    // Parse and store Architectural Phases
    const handleArchitecturalPhasesParsedData = (data: any) => {
        const ArchPhases_mk_ArchSpace_ID = []; // Ids (row.children[0])
        const ArchPhases_UUIDNumbers = []; // UUID Numbers (row.children[1])
        const ArchPhases_Names = []; // Names (row.children[2])
        const ArchPhases_Dates = []; // Dates (row.children[3])
        const ArchPhases_Descriptions = []; // Descriptions (row.children[5])
        const ArchPhases_Ids = []; // Ids (row.children[10])

        // Get the ROWS from the XML data
        for (let i = 3; i < data.children.length; i++) {
            const ROW = data.children[i];
            if (!ROW || !ROW.children) {
                console.error('Invalid or missing ROW in XML data.');
                return;
            }
            const row_data = ROW.children;
    
            // Safely get the required information from each row
            ArchPhases_mk_ArchSpace_ID.push(row_data[0] && row_data[0].children && row_data[0].children[0] ? row_data[0].children[0] : 'Unknown ID');
            ArchPhases_UUIDNumbers.push(row_data[1] && row_data[1].children && row_data[1].children[0] ? row_data[1].children[0] : 'Unknown UUID');
            ArchPhases_Names.push(row_data[2] && row_data[2].children && row_data[2].children[0] ? row_data[2].children[0] : 'Unknown Name');
            ArchPhases_Dates.push(row_data[3] && row_data[3].children && row_data[3].children[0] ? row_data[3].children[0] : 'Unknown Date');
            ArchPhases_Descriptions.push(row_data[5] && row_data[5].children && row_data[5].children[0] ? row_data[5].children[0] : 'No Description');
            ArchPhases_Ids.push(row_data[10] && row_data[10].children && row_data[10].children[0] ? row_data[10].children[0] : 'No ID'); 
        };
        
        setArchitecturalPhases(ArchPhases_UUIDNumbers);
        setArchitecturalPhasesDates(ArchPhases_Dates);
        setIsArchitecturalPhasesXmlParsed(true);
    };

    // Parse and store Architectural Spaces
    const handleArchitecturalSpacesParsedData = (data: any) => {
        const ArchSpaces_mk_ArchPhase_ID = []; // mk_ArchPhase_ID (row.children[0])
        const ArchSpaces_Names = []; // Names (row.children[2])
        const ArchSpaces_UUIDNumbers = []; // UUID Numbers (row.children[4])
        const ArchSpaces_Descriptions = []; // Descriptions (row.children[8])
        const ArchSpaces_Ids = []; // Ids (row.children[16])

        // Get the ROWS from the XML data
        for (let i = 3; i < data.children.length; i++) {
            const ROW = data.children[i];
            if (!ROW || !ROW.children) {
                console.error('Invalid or missing ROW in XML data.');
                return;
            }
            const row_data = ROW.children;

            // Safely get the required information from each row
            ArchSpaces_mk_ArchPhase_ID.push(row_data[0] && row_data[0].children && row_data[0].children[0] ? row_data[0].children[0] : 'Unknown ID');
            ArchSpaces_Names.push(row_data[2] && row_data[2].children && row_data[2].children[0] ? row_data[2].children[0] : 'Unknown Name');
            ArchSpaces_UUIDNumbers.push(row_data[4] && row_data[4].children && row_data[4].children[0] ? row_data[4].children[0] : 'Unknown UUID');
            ArchSpaces_Descriptions.push(row_data[8] && row_data[8].children && row_data[8].children[0] ? row_data[8].children[0] : 'No Description');
            ArchSpaces_Ids.push(row_data[16] && row_data[16].children && row_data[16].children[0] ? row_data[16].children[0] : 'No ID');
        }

        setArchitecturalSpaces(ArchSpaces_UUIDNumbers);
        setArchitecturalSpacesNames(ArchSpaces_Names);
        setIsArchitecturalSpacesXmlParsed(true);
    };

    // Parse and store the links (Maps) between Graphic Materials and Architectural Phases
    const handleGraphicMaterialSpaceLinks = (data: any) => {
        const tempMap = new Map<string, string>();
    
        for (let i = 3; i < data.children.length; i++) {
            const ROW = data.children[i];
            if (!ROW || !ROW.children) {
                console.error('Invalid or missing ROW in XML data.');
                continue;
            }
            const row_data = ROW.children;
    
            const graphicMatId = row_data[0] && row_data[0].children && row_data[0].children[0] ? row_data[0].children[0] : 'Unknown GraphicMatId';
            const spaceId = row_data[2] && row_data[2].children && row_data[2].children[0] ? row_data[2].children[0] : 'Unknown SpaceId';
    
            if (graphicMatId !== 'Unknown GraphicMatId' && spaceId !== 'Unknown SpaceId') {
                tempMap.set(graphicMatId, spaceId);
            }
        }
    
        setGraphicMaterialToSpace(tempMap);
        setIsLink_GraphicMaterialsArchitecturalSpacesXmlParsed(true);
    };
    
    // Parse and store the links (Maps) between Graphic Materials and Architectural Phases
    const handleGraphicMaterialPhaseLinks = (data: any) => {
        const tempMap = new Map<string, string>();
    
        for (let i = 3; i < data.children.length; i++) {
            const ROW = data.children[i];
            if (!ROW || !ROW.children) {
                console.error('Invalid or missing ROW in XML data.');
                continue;
            }
            const row_data = ROW.children;
    
            const graphicMatId = row_data[0] && row_data[0].children && row_data[0].children[0] ? row_data[0].children[0] : 'Unknown GraphicMatId';
            const phaseId = row_data[3] && row_data[3].children && row_data[3].children[0] ? row_data[3].children[0] : 'Unknown PhaseId';
    
            if (graphicMatId !== 'Unknown GraphicMatId' && phaseId !== 'Unknown PhaseId') {
                tempMap.set(graphicMatId, phaseId);
            }
        }
    
        setGraphicMaterialToPhase(tempMap);
        setIsLink_GraphicMaterialsArchitecturalPhasesXmlParsed(true);
    };

    // Set the first image after filtering as the current image
    // and initialize the selected phase and space
    useEffect(() => {
        if(!isCurrentImageSet){
            setCurrentImage(imageUrls[0]);
            if(currentImage) { setIsCurrentImageSet(true); }
        }
        if(!selectedPhase) { setSelectedPhase("all"); }
        if(!selectedSpace) { setSelectedSpace("all"); }
    });

    // Filter the images and thumbnails based on the selected phase and space
    useEffect(() => {
        let filteredIds: string[] = [];
        let newFilteredThumbnailUrls: string[] = [];
        let newFilteredImageUrls: string[] = [];
    
        if (selectedPhase !== "all" || selectedSpace !== "all") {
            if (selectedPhase !== "all") {
                filteredIds.push(...Array.from(graphicMaterialToPhase)
                    .filter(([_, phaseId]) => phaseId === selectedPhase)
                    .map(([graphicMatId, _]) => graphicMatId));
            }
            if (selectedSpace !== "all") {
                const spaceFilteredIds = Array.from(graphicMaterialToSpace)
                    .filter(([_, spaceId]) => spaceId === selectedSpace)
                    .map(([graphicMatId, _]) => graphicMatId);
                filteredIds = filteredIds.length > 0 ? filteredIds.filter(id => spaceFilteredIds.includes(id)) : spaceFilteredIds;
            }
    
            // Filter thumbnails and images by the filtered IDs
            newFilteredImageUrls = imageUrls.filter((_, index) => filteredIds.includes(graphMatIds[index]));
            newFilteredThumbnailUrls = thumbnailUrls.filter((_, index) => filteredIds.includes(graphMatIds[index]));
        } else {
            // Show all thumbnails and images if "Show All" is selected
            newFilteredThumbnailUrls = [...thumbnailUrls];
            newFilteredImageUrls = [...imageUrls];
        }
    
        setFilteredImageUrls(newFilteredImageUrls);
        setFilteredThumbnailUrls(newFilteredThumbnailUrls);
    
        // Update the current image to the first in the filtered list or reset if empty
        setCurrentImage(newFilteredImageUrls.length > 0 ? newFilteredImageUrls[0] : null);
    
    }, [selectedPhase, selectedSpace, graphicMaterialToPhase, graphicMaterialToSpace, graphMatIds, imageUrls, thumbnailUrls]);


    // Declare the OpenSeadragon viewer reference
    const viewerRef = useRef<HTMLDivElement>(null);

    // Initialize OpenSeadragon viewer and Annotorious annotations
    useEffect(() => {
        if (!isGraphicMaterialsXmlParsed || !isAnnotationsXmlParsed 
            || !isArchitecturalPhasesXmlParsed || !isArchitecturalSpacesXmlParsed 
            || !imageUrls.length || !filteredImageUrls.length
            || !currentImage || !viewerRef.current) {
                // console.log('Prerequisites not met: ', isGraphicMaterialsXmlParsed, isAnnotationsXmlParsed, isArchitecturalPhasesXmlParsed, isArchitecturalSpacesXmlParsed, imageUrls.length, currentImage, viewerRef);
            return; // Ensure prerequisites are met
        }

        // Initialize OpenSeadragon viewer
        const viewer = OpenSeadragon({
            element: viewerRef.current!,
            tileSources: {
                type: 'image',
                url: currentImage,
            },
            maxZoomLevel: 3, // Limit zoom level to 3x
            gestureSettingsMouse: {
                clickToZoom: false, // Disable zoom on click
            },
            // Additional OpenSeadragon configuration...
        });

        // Initialize Annotorious with the viewer
        const config = {};
        //console.log('Config', config);
        const anno = Annotorious(viewer, config);
        // Make annotations read-only, cannot create new or edit existing annotations
        anno.readOnly = true; 
    
        // Filter annotations for the current image
        const relevantAnnotations = annotations.flatMap(annotation => 
            annotation.data.filter(annotationData => 
                annotationData.imageUrl === currentImage
            )
        );

        // Add filtered annotations to Annotorious
        relevantAnnotations.forEach(annotationData => {
            const annoAnnotation = createAnnotoriousAnnotation(annotationData, currentImage);
            if (annoAnnotation) {
                anno.addAnnotation(annoAnnotation);
            }
        });
    
        for (var i=0; i<document.styleSheets.length; i++) {
            document.styleSheets[i].insertRule('.a9s-annotation .a9s-outer { stroke-width: 5px }'); // Change the stroke width of the annotation border
            document.styleSheets[i].insertRule('.a9s-annotation.hover .a9s-inner  { fill:rgba(255,240,0,0.1)  }'); // Change the color opacity
            document.styleSheets[i].insertRule('.a9s-annotation.hover .a9s-outer  { stroke-width: 8px }'); 
            document.styleSheets[i].insertRule('.r6o-editor  { font-family: Arial }');
            
        }


        return () => {
            viewer.destroy(); // Clean up viewer
            anno.destroy(); // Clear annotations
        };
    }, [isGraphicMaterialsXmlParsed, isAnnotationsXmlParsed,
        isArchitecturalPhasesXmlParsed ,isArchitecturalSpacesXmlParsed, currentImage,
        annotations, viewerRef.current]);
    

    // Handle thumbnail click
    const handleThumbnailClick = (thumbnailUrl: string) => {
        console.log('Thumbnail clicked:', thumbnailUrl);
        const index = filteredThumbnailUrls.indexOf(thumbnailUrl);
        if (index !== -1) {
            setCurrentImage(filteredImageUrls[index]);
            console.log(filteredImageUrls[index]);
        }
    };

    
    const openGM = (name: string) => {
        console.log('Opening GM:', name);
        const url = getImageUrlByGraphicMaterialId(name);
        // filteredImageUrls.forEach((url, index) => { if (url.includes(name)) { setCurrentImage(filteredImageUrls[index]); } });
        if (url) 
        {
                const index = filteredImageUrls.indexOf(url);
                if (index !== -1) {
                    setCurrentImage(filteredImageUrls[index]);
                }
        }
    }
    

    // Render custom thumbnails
    const renderCustomThumbnails = () => {
        return filteredThumbnailUrls.map((thumbnailUrl, index) => {
            // You can access the current image or any other state here as needed
            const isSelected = currentImage === imageUrls[index];
            return (
                <button
                    key={index}
                    onClick={() => handleThumbnailClick(thumbnailUrl)}
                    className={`thumbnail ${isSelected ? 'selected-thumbnail' : ''}`}
                >
                    <img src={thumbnailUrl} alt={`Thumbnail ${index + 1}`} />
                </button>
            );
        });
    };
    
    // Render carousel items without OpenSeadragon viewer
    const renderCarouselItems = () => {
        return filteredThumbnailUrls.map((thumbnailUrl, index) => (
            <div key={index} className="display-flex overflow-x-auto whitespace-nowrap h-24" 
                onClick={() => handleThumbnailClick(thumbnailUrl)} />
        ));
    };

    return (
        <div>
            {/* Parse the .xmls only once, so it doesn't try to parse it infinitely */}
            {!isGraphicMaterialsXmlParsed && <XMLParser url={GraphicMaterialsXmlUrl} onParsed={handleGraphicMaterialsParsedData } />}
            {isGraphicMaterialsXmlParsed && !isAnnotationsXmlParsed && <XMLParser url={AnnotationsXmlUrl} onParsed={handleAnnotationsParsedData } />}
            {!isArchitecturalPhasesXmlParsed && <XMLParser url={ArchitecturalPhasesXmlUrl} onParsed={handleArchitecturalPhasesParsedData } />}
            {!isArchitecturalSpacesXmlParsed && <XMLParser url={ArchitecturalSpacesXmlUrl} onParsed={handleArchitecturalSpacesParsedData } />}
            {!isLink_GraphicMaterialsArchitecturalPhasesXmlParsed 
            && isGraphicMaterialsXmlParsed && isArchitecturalPhasesXmlParsed
            && <XMLParser url={Link_GraphicMaterialsArchitecturalPhasesXmlUrl} onParsed={handleGraphicMaterialPhaseLinks } />}
            {!isLink_GraphicMaterialsArchitecturalSpacesXmlParsed 
            && isGraphicMaterialsXmlParsed && isArchitecturalSpacesXmlParsed
            && <XMLParser url={Link_GraphicMaterialsArchitecturalSpacesXmlUrl} onParsed={handleGraphicMaterialSpaceLinks } />}

            {/* Render the Carousel after the .xml is parsed */}
            {isGraphicMaterialsXmlParsed && isAnnotationsXmlParsed
            && isArchitecturalPhasesXmlParsed && isArchitecturalSpacesXmlParsed &&
                // React.Fragment docs: https://legacy.reactjs.org/docs/fragments.html
                // Return multiple elements without adding extra nodes to the DOM
                <React.Fragment>
                    {/* Simple UI */}
                    {/* Dropdown for selecting a phase */}
                    <select onChange={(e) => setSelectedPhase(e.target.value)} defaultValue="all" className="text-black mr-2">
                        <option value="all">All Phases</option>
                        {architecturalPhases.map((phaseId, index) => (
                            <option key={phaseId} value={phaseId} className="text-black">
                                {architecturalPhasesDates[index]}
                            </option>
                        ))}
                    </select>

                    {/* Dropdown for selecting a space */}
                    <select onChange={(e) => setSelectedSpace(e.target.value)} defaultValue="all" className="text-black">
                        <option value="all">All Spaces</option>
                        {architecturalSpaces.map((spaceId, index) => (
                            <option key={spaceId} value={spaceId} className="text-black">
                                {architecturalSpacesNames[index]}
                            </option>
                        ))}
                    </select>


                    {/* Always present OpenSeadragon viewer container */}
                    <div 
                        ref={viewerRef} 
                        className="openseadragon-container" 
                        style={{ width: '100%', height: '500px', display: currentImage ? 'block' : 'none' }}
                        />
                    
                    {/* Thumbnail Carousel */}
                    <div className="flex overflow-x-auto">
                        <Carousel
                            showThumbs={true}
                            renderThumbs={renderCustomThumbnails}
                            showArrows={false}
                            showStatus={true}
                            showIndicators={false}
                            infiniteLoop={false}  // changed 
                            dynamicHeight={false}
                            selectedItem={currentImage ? imageUrls.indexOf(currentImage) : 0}
                            onChange={(newIndex) => setCurrentImage(imageUrls[newIndex])}
                        >
                            {renderCarouselItems()}
                        </Carousel>
                    </div>
                    
                    <br />
                    <hr className='border-slate-500' />

                    {/* Image Description */}
                    <div className="max-h-64 mt-2 mb-5 p-4 overflow-y-auto text-left text-black">
                        {/** Title */} 
                        <p>
                            {currentImage ? 
                                <><strong>Title:</strong> {titles[imageUrls.indexOf(currentImage)]}</> 
                                : 'Select an image to see the title.'
                            }
                        </p>
                        {/** ID */} 
                        <p>
                            {currentImage ? 
                                <><strong>ID:</strong> {graphMatIds[imageUrls.indexOf(currentImage)]}</> 
                                : 'Select an image to see the ID.'
                            }
                        </p>
                        {/** Author */} 
                        <p>
                            {currentImage ? 
                                <><strong>Author:</strong> {authors[imageUrls.indexOf(currentImage)]}</> 
                                : 'Select an image to see the author.'
                            }
                        </p>
                        {/** Date */} 
                        <p>
                            {currentImage ? 
                                <><strong>Date:</strong> {dates[imageUrls.indexOf(currentImage)]}</> 
                                : 'Select an image to see the date.'
                            }
                        </p>
                        {/* <p>
                            etc... 
                            <br/>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        </p> */}
                    </div>
                </React.Fragment>
            }
        </div>

    );
    
}

export default ResponsiveCarousel;

