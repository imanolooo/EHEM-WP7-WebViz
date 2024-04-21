import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { phasesInfo} from './Phases';
import { Cartesian3, Cartographic } from 'cesium';
import { dir } from 'console';



interface MiniMapProps {
  setCameraView: any;
  loadModel: any;
  setGMmodal: any;
  setGMimage: any;
  setCurrentImage: any;
  onPoisEnabled: (pois: string[]) => void;
  currentCamera: any
}

const MiniMap = ({ setCameraView, loadModel, setGMmodal, setGMimage, setCurrentImage, onPoisEnabled, currentCamera }: MiniMapProps) => {

  const [isCollapsed, setIsCollapsed] = useState(true);
  //const [stories, setStories] = useState<Story[]>([]);
  //const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentParadeIndex, setCurrentParadeIndex] = useState(0);
  const [displayContent, setDisplayContent] = useState<string[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const timeoutIds = useRef<NodeJS.Timeout[]>([]); // Additional ref to keep track of timeout IDs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalHtmlContent, setModalHtmlContent] = useState('');
  //const [isHoveringTitles, setIsHoveringTitles] = useState(false);
  //const audioRef = useRef(new Audio());
  //const playPauseButtonRef = useRef(null);
  //const muteButtonRef = useRef(null);

  // Handle mouse enter and leave for story titles area
  //const handleMouseEnter = () => setIsHoveringTitles(true);
  //const handleMouseLeave = () => setIsHoveringTitles(false);

  // Toggle collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const posTL = {
    "position": {
      "x": 4736917.438207317,
      "y": 155778.83817035012,
      "z": 4254910.822364716
    }
  };

  

  const posTR = {
    "position": {
      "x": 4736922.531106163,
      "y": 155798.46226214198,
      "z": 4254905.6409090925
    }
  };

  const posBL = {
    "position": {
      "x": 4736925.9079194525,
      "y": 155772.70294584677,
      "z": 4254896.616353796
    }
  }; 

  const posBR = {
    "position": {
      "x": 4736929.875762047,
      "y": 155793.19441249827,
      "z": 4254889.90851941
    }
  };

  const cTL = Cartographic.fromCartesian(new Cartesian3(posTL.position.x, posTL.position.y, posTL.position.z));
  const cTR = Cartographic.fromCartesian(new Cartesian3(posTR.position.x, posTR.position.y, posTR.position.z));
  const cBL = Cartographic.fromCartesian(new Cartesian3(posBL.position.x, posBL.position.y, posBL.position.z));
  const cBR = Cartographic.fromCartesian(new Cartesian3(posBR.position.x, posBR.position.y, posBR.position.z));

  const interpolate = (x: number, y: number) => {
    // biliniar interpolation

      const wTL = (1-x)*(1-y);
      const wTR = x*(1-y);
      const wBL = (1-x)*y;
      const wBR = x*y;
      
      const xout = wTL * cTL.longitude + wTR * cTR.longitude + wBL * cBL.longitude + wBR * cBR.longitude;
      const yout = wTL * cTL.latitude + wTR * cTR.latitude + wBL * cBL.latitude + wBR * cBR.latitude;
      const zout = wTL * cTL.height + wTR * cTR.height + wBL * cBL.height + wBR * cBR.height;

      const heightOffset = 1.3;
      const newPos = Cartesian3.fromRadians(xout, yout, zout+heightOffset);

      return newPos;
  }

  const handleClick = (e: any) => {

    console.log("Click on minimap")
    var d = document.getElementById('minicanvas');
    if (d) d.onclick = function(e) {
      // e = Mouse click event.
      var rect = null;
      if (e.target) rect = d?.getBoundingClientRect();
      if (rect)
        {
          var x = (e.clientX - rect.left)/(rect.right - rect.left); //x position within the element.
        var y = (e.clientY - rect.top) / (rect.bottom - rect.top);  //y position within the element.
        console.log("Left? : " + x + " ; Top? : " + y + ".");
        console.log(interpolate(x, y));
        const pos = interpolate(x,y);
        const config = { "position": pos, 
        "direction": new Cartesian3(0.19, 0.96, -0.2), "up": new Cartesian3(0.63, 0.0, 0.67) };
        setCameraView(config);

        

        }
    }
  }

  const draw = () => {
    console.log("Draw minimap")
    var canvas = document.getElementById('minicanvas') as HTMLCanvasElement;
    var ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    var image = document.getElementById("minimap") as HTMLImageElement; //new Image();
    /*
    image.src = 'miniXIII.png';
    image.id = 'minimap';
    image.onload = function() {
      ctx?.drawImage(image, 0, 0, 200, 200);
    }
    */ 
   if (image) ctx?.drawImage(image, 0, 0, 200, 200);
    
    //image.onclick = function(e) { handleClick(e); }

    const rect = canvas.getBoundingClientRect();
    const w = canvas.width; //rect.width;
    const h = canvas.height; //rect.height;
    console.log("Width: " + w + " ; Height: " + h + ".");

    const camera = currentCamera();
    if (camera)
      {
      const carto = Cartographic.fromCartesian(camera.position);
      const localx = (carto.longitude - cBL.longitude);
      const localy = (carto.latitude - cBL.latitude);
      var dirxhor = (cBR.longitude - cBL.longitude);
      var diryhor = (cBR.latitude - cBL.latitude);
      var dirxvert = (cTL.longitude - cBL.longitude); 
      var diryvert = (cTL.latitude - cBL.latitude);


      const normhor = Math.sqrt(dirxhor*dirxhor + diryhor*diryhor);
      const normvert = Math.sqrt(dirxvert*dirxvert + diryvert*diryvert);
      dirxhor /= normhor;
      diryhor /= normhor;
      dirxvert /= normvert;
      diryvert /= normvert;

      var compx = localx*dirxhor + localy*diryhor;
      var compy = localx*dirxvert + localy*diryvert;
      compx /= normhor;
      compy /= normvert;
      compy = 1-compy;
      console.log("Compx: " + compx + " ; Compy: " + compy + ".");


      
      const x = compx;
      const y = compy;
      console.log("X: " + x + " ; Y: " + y + ".");
      const x0 = w*x;
      const y0 = h*y;
      //console.log("X0: " + x0 + " ; Y0: " + y0 + ".");

      if (ctx)
      {
        ctx.beginPath();
        ctx.fillStyle = "rgb(255 255 200)";
        ctx.moveTo(0,0);  
        ctx.arc(x0, y0, w/20, 0, Math.PI * 2, true); 
        ctx.fill();
        /*
        ctx.moveTo(w/2, h/2);
        ctx.lineTo(w/2+w/10, h/2+h/10);
        ctx.lineTo(w/2-w/10, h/2-h/10);
        ctx.fill();
        ctx.moveTo(0,0);
        */
      }
    }
    //setInterval(draw, 500);
  }

  useEffect(() => {
    setInterval(draw, 200);
  });

  // Render 
  return (
    <div className="absolute bottom-40 left-2 w-1/12 max-w-md bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg shadow-lg shadow-black transition-opacity duration-200 ease-out transform opacity-100">
        <p className="text-white text-center"> 13th Century </p>  
        {/* <img id="minimap" src="miniXIII.png" onClick={(handleClick)}/> */}
        <img id="minimap" src="miniXIII.png" width="0" height="0" />
        <canvas id="minicanvas" width="200" height="200" style={{width: '100%', height: '100%'}} onClick={(handleClick)} >
        </canvas>
        
        
    </div>
        
  );
};


export default MiniMap;
