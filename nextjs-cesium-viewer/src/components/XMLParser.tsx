import React, { useState, useEffect, useCallback } from 'react';

// Define types via interfaces
interface XMLNode {
  [key: string]: any;
}

interface XMLParserProps {
    url: string;
    onParsed: (data: XMLNode) => void;  // Callback prop
}


// Parse XML node function with additional logging
const parseXmlNode = (node: any): XMLNode => {
  let nodeData: XMLNode = {};

  // Check if node is a text node and capture its content
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue;
  }

  if (node.attributes) {
    for (let attr of node.attributes) {
      nodeData[attr.name] = attr.value;
    }
  }

  let childNodes = node.childNodes;
  if (childNodes.length > 0) {
    nodeData.children = [];
    childNodes.forEach((child: any) => {
      if (child.nodeType === Node.ELEMENT_NODE || child.nodeType === Node.TEXT_NODE) {
        nodeData.children.push(parseXmlNode(child));
      }
    });
  }

  return nodeData;
};


const XMLParser: React.FC<XMLParserProps> = ({ url, onParsed }) => {
  const [xmlData, setXmlData] = useState<XMLNode | null>(null);

  // Parse XML string function
  // Now, parseXmlString doesn't depend on any function defined inside the component
  const parseXmlString = useCallback((xmlString: string): XMLNode => {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlString, "text/xml");
    return parseXmlNode(xmlDoc.documentElement);
  }, []); // No dependencies needed here

  useEffect(() => {
    const fetchXMLData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const text = await response.text();
        const parsedData = parseXmlString(text);
        setXmlData(parsedData);
        onParsed(parsedData);
      } catch (error) {
        console.error('Error fetching XML data:', error);
      }
    };

    fetchXMLData();
  }, [url, onParsed, parseXmlString]);

  return (
    <></>
  )
};

export default XMLParser;
