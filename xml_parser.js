/*
Uses as DOMParser, so it needs browser environments where DOMParser is available.
For a Node.js environment, you need to install the 'xmldom' library to parse the XML strings.
To check compatibility: https://caniuse.com/?search=DOMParser
*/


function parseXmlNode(node) {
    
    let nodeData = {};  // Object to store node data

    // Process node attributes
    if (node.attributes) {
        for (let attr of node.attributes) {
            nodeData[attr.name] = attr.value;
        }
    }

    // Process child nodes
    let childNodes = node.childNodes;
    if (childNodes.length > 0) {
        nodeData.children = [];
        childNodes.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                nodeData.children.push(parseXmlNode(child));
            }
        });
    }

    return nodeData;
}

function parseXmlString(xmlString) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlString, "text/xml");
    return parseXmlNode(xmlDoc.documentElement);
}


// Usage example
var x = new XMLHttpRequest();
x.open("GET", "database.xml", true);
x.onreadystatechange = function () {
    if (x.readyState == 4 && x.status == 200) {
        var parsedData = parseXmlString(x.responseText);
        console.log(parsedData);
    }
};
x.send(null);   // Send the request
