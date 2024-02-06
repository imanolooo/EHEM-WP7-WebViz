'use client'    // Client component

import React, { useState, useEffect, useRef } from "react";
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
    points: string[];
}

interface Annotation {
    type: string;
    data: AnnotationData[];
}

const xmlUrl = 'database.xml';
const imgsUrlPrefix = 'https://ehem.virvig.eu/imgs/';
const thumbnailsUrlPrefix = 'https://ehem.virvig.eu/thumbs/';
// example: https://ehem.virvig.eu/thumbs/GM000013.jpg


// test 
function createAnnotoriousAnnotation(annotationData: AnnotationData, currentImage: string | null): any | null {
    if (annotationData.points.length === 0) {
        return null;
    }

    const points = annotationData.points.filter(point => point !== '').map(point => point.replace(',', ' ')).join(', ');

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        "type": "Annotation",
        "body": {
            "type": "TextualBody",
            "value": annotationData.text,
            "format": "text/plain"
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
// end of test


const ResponsiveCarousel: React.FC<ResponsiveCarouselProps> = ({ selectedPhase }) => {
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
    const [authors, setAuthors] = useState<string[]>([]);
    const [dates, setDates] = useState<string[]>([]);
    const [descriptions, setDescriptions] = useState<string[]>([]);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);

    const [isXmlParsed, setIsXmlParsed] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    // Handle the parsed data from the database's XML
    const handleParsedData = (data: any) => {

        // Get the RESULTSET from the XML data
        const RESULTSET = data.children[4];
        if (!RESULTSET || !RESULTSET.children) {
            console.error('Invalid or missing RESULTSET in XML data');
            return;
        }
        const rows = RESULTSET.children; // Each row is a <ROW> element / entry in database
    
        // Initialize the new arrays
        const newImageUrls: string[] = [];
        const newThumbnailUrls:string[] = [];
        let firstImageUrl: string | null = null;
        const newAuthors: string[] = [];
        const newDates: string[] = [];
        const newDescriptions: string[] = [];
        const newAnnotations: Annotation[] = [];
    

        // Loop through each row in the XML data to get the required information
        rows.forEach((row: any, index: number) => {

            // Skip the last row, that contains 'https://ehem.virvig.eu/imgs/GM0064.png'
            // which is empty and causes errors.
            if (index < rows.length - 1) {

                // Get the author
                if (row.children && row.children[1] && row.children[1].children &&
                    row.children[1].children[0].children) {
                    const author = row.children[1].children[0].children[0];
                    if (author && typeof author === 'string') {
                        newAuthors.push(author);
                    } else {
                        newAuthors.push('Unknown author'); // Fallback for missing author
                    }
                } else {
                    newAuthors.push('Unknown author'); // Also a fallback for missing author data
                }

                // Get the dates
                if (row.children && row.children[3] && row.children[3].children &&
                    row.children[3].children[0].children) {
                    const date = row.children[3].children[0].children[0];

                    if (date && typeof date === 'string') {
                        newDates.push(date);
                    } else {
                        newDates.push('Unknown date'); // Fallback for missing date
                    }
                } else {
                    newDates.push('Unknown date'); // Also a fallback for missing date data
                }

                // Get the descriptions
                if (row.children && row.children[4] && row.children[4].children &&
                    row.children[4].children[0].children) {
                    const description = row.children[4].children[0].children[0];

                    if (description && typeof description === 'string') {
                        newDescriptions.push(description);
                    } else {
                        newDescriptions.push('No description.'); // Fallback for missing description
                    }
                } else {
                    newDescriptions.push('No description.'); // Also a fallback for missing description data
                }

                // Get the image URLs
                if (row.children && row.children[6] && row.children[6].children) {
                    const imageFilename = row.children[6].children[0].children[0];
                    if (imageFilename && typeof imageFilename === 'string') {
                        const encodedFilename = encodeURIComponent(imageFilename);
                        const imageUrl = `${imgsUrlPrefix}${encodedFilename}`;
                        const thumbnailUrl = `${thumbnailsUrlPrefix}${encodedFilename}`;
        
                        // if (imageUrl !== 'https://ehem.virvig.eu/imgs/GM0064.png') {
                            newImageUrls.push(imageUrl);
                            newThumbnailUrls.push(thumbnailUrl);
                        // }
                        if (index === 0) {
                            firstImageUrl = imageUrl;
                        }
                    }
                }

                // Get the annotations
                const annotationsText = row.children[16];
                const annotationsPoints = row.children[17];

                // Process annotations from both columns
                if (annotationsText && annotationsText.children && annotationsPoints && annotationsPoints.children) {
                    const rowAnnotations: AnnotationData[] = [];
                    annotationsText.children.forEach((annotationText: any, index: number) => {
                        const annotationPoint = annotationsPoints.children[index];
                        if (annotationPoint) {
                            // Create single annotation object with embedded arrays for text and points
                            const text = annotationText.children[0];
                            const points = annotationPoint.children[0].split(' ');
                            rowAnnotations.push({ text, points });
                        } 
                    });
                    newAnnotations.push({ type: 'Annotation', data: rowAnnotations });
                }
                else {
                    // If no annotations exist for the row, store an empty annotation
                    newAnnotations.push({ type: 'Annotation', data: [] });
                }
                    
            }

        });
    
        setImageUrls(newImageUrls); // Setting image URLs
        setCurrentImage(firstImageUrl); // Setting the first image as the current image
        setThumbnailUrls(newThumbnailUrls); // Setting thumbnail URLs
        setIsXmlParsed(true); // Setting the XML as parsed
        setAuthors(newAuthors); // Setting authors
        setDates(newDates); // Setting dates
        setDescriptions(newDescriptions); // Setting descriptions
        setAnnotations(newAnnotations); // Setting annotations
    };

    useEffect(() => {
        console.log("Annotations:", annotations);
    }, [annotations]);

    // version 1: Simple Carousel viewer
    // // Change the image based on which thumbnail was selected
    // const handleThumbnailClick = (thumbnailUrl: string) => {
    //     const index = thumbnailUrls.indexOf(thumbnailUrl);
    //     if (index !== -1) {
    //         setCurrentImage(imageUrls[index]);
    //     }
    // };
    
    // const renderCarouselItems = () => {
    //     return thumbnailUrls.map((thumbnailUrl, index) => (
    //         <div key={index} className="h-[500px] flex align-center justify-center"
    //         onClick={() => handleThumbnailClick(thumbnailUrl)}
    //         >
    //             <img 
    //                 src={currentImage === imageUrls[index] ? currentImage : thumbnailUrl}
    //                 alt={`Thumbnail ${index + 1}`} 
    //                 className="max-w-full max-h-full object-contain"
    //             />
    //         </div>
    //     ));
    // };
    // end of version 1


    // version 2 - OpenSeadragon (Initialize one OSD viewer per image)

    const viewerRef = useRef<HTMLDivElement>(null);

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

    // Render carousel items
    const renderCarouselItems = () => {
        return thumbnailUrls.map((thumbnailUrl, index) => (
            <div key={index} className="h-[500px] flex align-center justify-center"
                onClick={() => handleThumbnailClick(thumbnailUrl)}
            >
                {currentImage === imageUrls[index] && viewerRef ? (
                    <div ref={viewerRef} key={currentImage} className="openseadragon-container" style={{ width: '100%', height: '500px' }} />
                ) : (
                    <img 
                        src={thumbnailUrl}
                        alt={`Thumbnail ${index + 1}`}
                        className="max-w-full max-h-full object-contain"
                    />
                )}
            </div>
        ));
    };



    // Ensure OpenSeadragon is initialized only once per image
    useEffect(() => {

        if (!isXmlParsed || !imageUrls.length) {
            return; // Wait for XML parsing and image URLs to be available
        }
        
        console.log('isXmlParsed:', isXmlParsed);
        console.log('currentImage:', currentImage);
        console.log('viewerRef.current:', viewerRef.current);
        console.log('current image:', currentImage);
        
        if (isXmlParsed && currentImage && viewerRef.current) {
            // viewerRef.current.innerHTML = ''; // Clear any previous viewer instances

            // Clear any previous viewer instances and insert testing text
            viewerRef.current.innerHTML = '<p>Testing text...</p>'; 

            const viewer = OpenSeadragon({
                element: viewerRef.current,
                tileSources: {
                    type: 'image',
                    url: currentImage || imageUrls[0],
                },
                // Additional OpenSeadragon options...
                // Here I need to extend the maxZoom (like up to x2 or x3)
            });

            
            // test

            // Add annotations to the viewer
            const config = {};

            Annotorious(viewer, config);   
            
            const anno = Annotorious(viewer, config);
            anno.clearAnnotations();

            annotations.forEach(annotation => {
                annotation.data.forEach(annotationData => {
                    const annoAnnotation = createAnnotoriousAnnotation(annotationData, currentImage);
                    if (annoAnnotation !== null) {
                        anno.addAnnotation(annoAnnotation);
                    }
                });
            });

            // end of test
            
            viewer.addHandler('open', () => {
                console.log('OpenSeadragon viewer opened image successfully:', currentImage);
            });
    
            return () => {
                // Clean up viewer on component unmount or when the current image changes
                viewer.destroy();
                // Clear the annotations
                anno.destroy();
            };
        } else {
            console.log('Current image or viewerRef.current is null, skipping OpenSeadragon initialization');
        }

    }, [isXmlParsed, currentImage]);

    // end of version 2
      
    // Log changes in selectedPhase
    useEffect(() => {
        // console.log("Selected Phase in ResponsiveCarousel:", selectedPhase);
        // Here, you can add any logic that needs to run when selectedPhase changes

    }, [selectedPhase]); // The dependency array includes selectedPhase to watch for its changes

    return (
        <div className="">

            {/* Parse the .xml only once, so it doesn't try to parse it infinitely */}
            {!isXmlParsed && <XMLParser url={xmlUrl} onParsed={handleParsedData} />}

            
            {/* Render the Carousel after the .xml is parsed */}
            {isXmlParsed &&
                // React.Fragment docs: https://legacy.reactjs.org/docs/fragments.html
                // Return multiple elements without adding extra nodes to the DOM
                <React.Fragment>
                    {/* Image Carousel */}
                    <Carousel
                        showThumbs={true}
                        renderThumbs={renderCustomThumbnails}
                        showArrows={true}
                        showStatus={true}
                        showIndicators={false}
                        infiniteLoop={true}
                        dynamicHeight={false}
                        selectedItem={currentImage ? imageUrls.indexOf(currentImage) : 0}
                        onChange={(newIndex) => setCurrentImage(imageUrls[newIndex])}
                    >
                        {renderCarouselItems()}
                    </Carousel>

                    <br />
                    <hr className='border-slate-500' />

                    {/* Image Description */}
                    <div className="max-h-64 mt-2 mb-5 p-4 overflow-y-auto text-left text-black">
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
                        {/** Description */} 
                        <p>
                            {currentImage ? 
                                <><strong>Description:</strong> {descriptions[imageUrls.indexOf(currentImage)]}</> 
                                : 'Select an image to see the description.'
                            }
                        </p>
                        <p>
                            etc...
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        </p>
                    </div>
                </React.Fragment>
            }
            
        </div>
    );
    
}

export default ResponsiveCarousel;