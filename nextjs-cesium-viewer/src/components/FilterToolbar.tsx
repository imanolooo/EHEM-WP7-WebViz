import React, { useState, useEffect } from 'react';
import XMLParser from './XMLParser';

const xmlUrl = 'database.xml';

// ...
// To be updated, or even removed
// ...

const FilterToolbar = () => {
    const [isXmlParsed, setIsXmlParsed] = useState(false);
    const [toolbarOptions, setToolbarOptions] = useState<string[]>([]);
    const [selectedOption, setSelectedOption] = useState<string>('');

    // Handle the parsed data from the database's XML
    const handleParsedData = (data: any) => {
        const METADATA = data.children[3];
        if (!METADATA || !METADATA.children) {
            console.error('Invalid or missing METADATA in XML data');
            return;
        }

        const fields = METADATA.children;
        const fieldNames: string[] = [];        
        
        fields.forEach((field: any) => {
            const fieldName = field.NAME;
            if (fieldName) {
                fieldNames.push(fieldName);
            }
        });
       
        setToolbarOptions(fieldNames);
        setIsXmlParsed(true);
    };


    // Handle selection change in the dropdown
    const handleSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setSelectedOption(selectedValue);
        console.log(`Hello, ${selectedValue}`);
    };


    return (
        <div className="absolute top-0 left-0 z-10 p-2 bg-transparent bg-opacity-75">
            {!isXmlParsed && <XMLParser url={xmlUrl} onParsed={handleParsedData} />}
            {isXmlParsed &&
                <div className="flex flex-wrap gap-2">
                    <select 
                        className="cesium-button"
                        onChange={handleSelectionChange}
                        value={selectedOption}
                    >
                        <option value="">Select a filter</option>
                        {toolbarOptions.map((option, index) => (
                            <option key={index} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            }
        </div>
    );
    
    
};

export default FilterToolbar;
