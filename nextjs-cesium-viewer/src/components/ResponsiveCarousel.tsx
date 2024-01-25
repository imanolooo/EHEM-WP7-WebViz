'use client'    // Client component

import React, { useState } from "react";
import { Carousel } from "react-responsive-carousel";
import XMLParser from "./XMLParser";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const xmlUrl = 'database.xml';
const imgsUrlPrefix = 'https://ehem.virvig.eu/imgs/';
const thumbnailsUrlPrefix = 'https://ehem.virvig.eu/thumbs/';
// example: https://ehem.virvig.eu/thumbs/GM000013.jpg


export default function ResponsiveCarousel() {
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
    const [isXmlParsed, setIsXmlParsed] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    
    // Handle the parsed data from the database's XML
    const handleParsedData = (data: any) => {
        const RESULTSET = data.children[4];
        if (!RESULTSET || !RESULTSET.children) {
            console.error('Invalid or missing RESULTSET in XML data');
            return;
        }
        const rows = RESULTSET.children;
    
        const newImageUrls: string[] = [];
        const newThumbnailUrls:string[] = [];
        let firstImageUrl: string | null = null;
    
        rows.forEach((row: any, index: number) => {
            if (row.children && row.children[6] && row.children[6].children) {
                const imageFilename = row.children[6].children[0].children[0];
                if (imageFilename && typeof imageFilename === 'string') {
                    const encodedFilename = encodeURIComponent(imageFilename);
                    const imageUrl = `${imgsUrlPrefix}${encodedFilename}`;
                    const thumbnailUrl = `${thumbnailsUrlPrefix}${encodedFilename}`;
    
                    if (imageUrl !== 'https://ehem.virvig.eu/imgs/GM0064.png') {
                        newImageUrls.push(imageUrl);
                        newThumbnailUrls.push(thumbnailUrl);
                    }
                    if (index === 0) {
                        firstImageUrl = imageUrl;
                    }
                }
            }
        });
    
        setImageUrls(newImageUrls);
        setCurrentImage(firstImageUrl);
        setThumbnailUrls(newThumbnailUrls);
        setIsXmlParsed(true);
    };

    // Change the image based on which thumbnail was selected
    const handleThumbnailClick = (thumbnailUrl: string) => {
        const index = thumbnailUrls.indexOf(thumbnailUrl);
        if (index !== -1) {
            setCurrentImage(imageUrls[index]);
        }
    };
    
    const renderCarouselItems = () => {
        return thumbnailUrls.map((thumbnailUrl, index) => (
            <div key={index} className="flex-shrink-0" onClick={() => handleThumbnailClick(thumbnailUrl)}>
                <img 
                    src={currentImage === imageUrls[index] ? currentImage : thumbnailUrl}
                    alt={`Thumbnail ${index + 1}`} 
                    className="w-full h-auto object-contain"
                />
            </div>
        ));
    };

    return (
        <div className="">
            {/* Render the Carousel after the .xml is parsed */}
            {isXmlParsed &&
                <Carousel
                showArrows={true}
                showStatus={true}
                showIndicators={true}
                infiniteLoop={true}
                dynamicHeight={true}
                selectedItem={currentImage ? imageUrls.indexOf(currentImage) : 0}
                onChange={(newIndex) => setCurrentImage(imageUrls[newIndex])}
                >
                {renderCarouselItems()}
                </Carousel>
            }
            {/* Parse the .xml only once, so it doesn't try to parse it infinitely */}
            {!isXmlParsed && <XMLParser url={xmlUrl} onParsed={handleParsedData} />}
        </div>
    );
}

