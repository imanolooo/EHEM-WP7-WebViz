'use client'    // Client component

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Carousel } from "react-responsive-carousel";
import XMLParser from "./XMLParser";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import OpenSeadragon from 'openseadragon';
import * as Annotorious from '@recogito/annotorious-openseadragon';

import '@recogito/annotorious-openseadragon/dist/annotorious.min.css';


interface ResponsiveCarouselProps {
    selectedPhase?: string | null;
}

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


const imgsUrlPrefix = 'https://ehem.virvig.eu/imgs/';
const thumbnailsUrlPrefix = 'https://ehem.virvig.eu/thumbs/';
// example: https://ehem.virvig.eu/thumbs/GM000013.jpg

const GraphicMaterialsXmlUrl = './xml_exports/Graphic_Materials.xml';
const AnnotationsXmlUrl = './xml_exports/Annotations.xml';
const ArchitecturalPhasesXmlUrl = './xml_exports/Architectural_Phases.xml';
const ArchitecturalSpacesXmlUrl = './xml_exports/Architectural_Spaces.xml';
const Link_GraphicMaterialsArchitecturalPhasesXmlUrl = './xml_exports/Graphic_Materials_link_Architectural_Phases.xml';
const Link_GraphicMaterialsArchitecturalSpacesXmlUrl = './xml_exports/Graphic_Materials_link_Architectural_Spaces.xml';


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
        "body": {
            "type": "TextualBody",
            "value": annotationData.text,
            "purpose": "commenting"
        },
        "target": {
            "source": currentImage,
            "selector": {
                "type": "SvgSelector",
                "value": `<svg><polygon points="${points}" /></svg>`
            }
        }
    };
}


const ResponsiveCarousel: React.FC<ResponsiveCarouselProps> = ({ selectedPhase }) => {
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
    const [authors, setAuthors] = useState<string[]>([]);
    const [dates, setDates] = useState<string[]>([]);
    const [titles, setTitles] = useState<string[]>([]);

    const [graphMatIds, setGraphMatIds] = useState<any[]>([]);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);

    let [currentImage, setCurrentImage] = useState<string | null>(null);

    // Log changes in selectedPhase
    // useEffect(() => {
    //     // console.log("Selected Phase in ResponsiveCarousel:", selectedPhase);
    //     // Here, add any logic that needs to run when selectedPhase changes
    // }, [selectedPhase]);

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
        const GraphMat_Version = []; // Version (row.children[12])
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

                if (i === 3) {
                    setCurrentImage(imageUrl); // Set the first image as the current image (if it's the first one in the list
                }
            } else {
                GraphMat_ImageUrls.push('Unknown ImageUrl');
                GraphMat_ThumbnailUrls.push('Unknown ThumbnailUrl');
            }
        }

        // General
        setTitles(GraphMat_Titles);
        setAuthors(GraphMat_Authors);
        setDates(GraphMat_Dates);
        // Important
        setGraphMatIds(GraphMat_Ids);
        setImageUrls(GraphMat_ImageUrls);
        setThumbnailUrls(GraphMat_ThumbnailUrls);
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
                const annotationData: AnnotationData = {
                    text: row_data[1].children[0],
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

        setIsArchitecturalSpacesXmlParsed(true);
    };

    // ---
    // old parsing of single XML
    // // Handle the parsed data from the database's XML
    // const old_handleParsedData = (data: any) => {

    //     // Get the RESULTSET from the XML data
    //     const RESULTSET = data.children[4];
    //     if (!RESULTSET || !RESULTSET.children) {
    //         console.error('Invalid or missing RESULTSET in XML data');
    //         return;
    //     }
    //     const rows = RESULTSET.children; // Each row is a <ROW> element / entry in database
    
    //     // Initialize the new arrays
    //     const newImageUrls: string[] = [];
    //     const newThumbnailUrls:string[] = [];
    //     let firstImageUrl: string | null = null;
    //     const newAuthors: string[] = [];
    //     const newDates: string[] = [];
    //     const newDescriptions: string[] = [];
    //     const newAnnotations: Annotation[] = [];
    

    //     // Loop through each row in the XML data to get the required information
    //     rows.forEach((row: any, index: number) => {

    //         // Skip the last row, that contains 'https://ehem.virvig.eu/imgs/GM0064.png'
    //         // which is empty and causes errors.
    //         if (index < rows.length - 1) {

    //             // Get the author
    //             if (row.children && row.children[1] && row.children[1].children &&
    //                 row.children[1].children[0].children) {
    //                 const author = row.children[1].children[0].children[0];
    //                 if (author && typeof author === 'string') {
    //                     newAuthors.push(author);
    //                 } else {
    //                     newAuthors.push('Unknown author'); // Fallback for missing author
    //                 }
    //             } else {
    //                 newAuthors.push('Unknown author'); // Also a fallback for missing author data
    //             }

    //             // Get the dates
    //             if (row.children && row.children[3] && row.children[3].children &&
    //                 row.children[3].children[0].children) {
    //                 const date = row.children[3].children[0].children[0];

    //                 if (date && typeof date === 'string') {
    //                     newDates.push(date);
    //                 } else {
    //                     newDates.push('Unknown date'); // Fallback for missing date
    //                 }
    //             } else {
    //                 newDates.push('Unknown date'); // Also a fallback for missing date data
    //             }

    //             // Get the descriptions
    //             if (row.children && row.children[4] && row.children[4].children &&
    //                 row.children[4].children[0].children) {
    //                 const description = row.children[4].children[0].children[0];

    //                 if (description && typeof description === 'string') {
    //                     newDescriptions.push(description);
    //                 } else {
    //                     newDescriptions.push('No description.'); // Fallback for missing description
    //                 }
    //             } else {
    //                 newDescriptions.push('No description.'); // Also a fallback for missing description data
    //             }

    //             // Get the image URLs
    //             var imageUrl = '';
    //             if (row.children && row.children[6] && row.children[6].children) {
    //                 const imageFilename = row.children[6].children[0].children[0];
    //                 if (imageFilename && typeof imageFilename === 'string') {
    //                     const encodedFilename = encodeURIComponent(imageFilename);
    //                     imageUrl = `${imgsUrlPrefix}${encodedFilename}`;
    //                     const thumbnailUrl = `${thumbnailsUrlPrefix}${encodedFilename}`;
        
    //                     // if (imageUrl !== 'https://ehem.virvig.eu/imgs/GM0064.png') {
    //                         newImageUrls.push(imageUrl);
    //                         newThumbnailUrls.push(thumbnailUrl);
    //                     // }
    //                     if (index === 0) {
    //                         firstImageUrl = imageUrl;
    //                         currentImage = imageUrl;
    //                     }
    //                 }
    //             }

    //             // Get the annotations
    //             const annotationsText = row.children[16];
    //             const annotationsPoints = row.children[17];

    //             // Process annotations from both columns
    //             if (annotationsText && annotationsText.children && annotationsPoints && annotationsPoints.children) {
    //                 const rowAnnotations: AnnotationData[] = [];
    //                 annotationsText.children.forEach((annotationText: any, index: number) => {
    //                     const annotationPoint = annotationsPoints.children[index];
    //                     if (annotationPoint) {
    //                         // Create single annotation object with embedded arrays for text and points
    //                         const text = annotationText.children[0];
    //                         const points = annotationPoint.children[0].split(' ');
    //                         const id = `${imageUrl}-${index}`; // Append index to imageUrl to create a unique ID
    //                         rowAnnotations.push({ text, points, imageUrl, id });
    //                     } 
    //                 });
    //                 newAnnotations.push({ type: 'Annotation', data: rowAnnotations });
    //             }
    //             else {
    //                 // If no annotations exist for the row, store an empty annotation
    //                 newAnnotations.push({ type: 'Annotation', data: [] });
    //             }
                    
    //         }

    //     });

        
    
    //     setImageUrls(newImageUrls); // Setting image URLs
    //     setCurrentImage(firstImageUrl); // Setting the first image as the current image
    //     setThumbnailUrls(newThumbnailUrls); // Setting thumbnail URLs
    //     setAuthors(newAuthors); // Setting authors
    //     setDates(newDates); // Setting dates
    //     setDescriptions(newDescriptions); // Setting descriptions
    //     setAnnotations(newAnnotations); // Setting annotations 
    //     setIsXmlParsed(true); // Setting the XML as parsed
    // };
  
    // Declare the OpenSeadragon viewer reference
    // ---

    // Declare the OpenSeadragon viewer reference
    const viewerRef = useRef<HTMLDivElement>(null);

    // Initialize OpenSeadragon viewer and Annotorious annotations
    useEffect(() => {
        if (!isGraphicMaterialsXmlParsed || !isAnnotationsXmlParsed 
            || !isArchitecturalPhasesXmlParsed || !isArchitecturalSpacesXmlParsed 
            || !imageUrls.length || !currentImage || !viewerRef.current) {
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
            maxZoomLevel: 4,
            gestureSettingsMouse: {
                clickToZoom: false, // Disable zoom on click
            },
            // Additional OpenSeadragon configuration...
        });

        // Initialize Annotorious with the viewer
        const config = {};
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
    
        return () => {
            viewer.destroy(); // Clean up viewer
            anno.destroy(); // Clear annotations
        };
    }, [isGraphicMaterialsXmlParsed, isAnnotationsXmlParsed,
        isArchitecturalPhasesXmlParsed ,isArchitecturalSpacesXmlParsed, currentImage,
        annotations, viewerRef.current]);
    

    // Handle thumbnail click
    const handleThumbnailClick = (thumbnailUrl: string) => {
        const index = thumbnailUrls.indexOf(thumbnailUrl);
        if (index !== -1) {
            setCurrentImage(imageUrls[index]);
        }
    };

    // Render custom thumbnails
    const renderCustomThumbnails = () => {
        return thumbnailUrls.map((thumbnailUrl, index) => {
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
        return thumbnailUrls.map((thumbnailUrl, index) => (
            <div key={index} className="display-flex overflow-x-auto whitespace-nowrap"
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
            
            {/* Render the Carousel after the .xml is parsed */}
            {isGraphicMaterialsXmlParsed && isAnnotationsXmlParsed
            && isArchitecturalPhasesXmlParsed && isArchitecturalSpacesXmlParsed &&
                // React.Fragment docs: https://legacy.reactjs.org/docs/fragments.html
                // Return multiple elements without adding extra nodes to the DOM
                <React.Fragment>
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
                            infiniteLoop={true}
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
                                : 'Select an image to see the description.'
                            }
                        </p>
                        {/** ID */} 
                        <p>
                            {currentImage ? 
                                <><strong>ID:</strong> {graphMatIds[imageUrls.indexOf(currentImage)]}</> 
                                : 'Select an image to see the description.'
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
                        <p>
                            etc... 
                            <br/>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        </p>
                    </div>
                </React.Fragment>
            }
        </div>
    );
    
}

export default ResponsiveCarousel;