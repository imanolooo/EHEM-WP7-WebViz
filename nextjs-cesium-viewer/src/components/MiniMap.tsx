import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { phasesInfo} from './Phases';
import { Cartesian3, Cartographic } from 'cesium';
import { dir } from 'console';

class Vec2
{
  x: number;
  y: number;
  constructor(x: number, y: number)
  {
    this.x = x;
    this.y = y;
  }
  length(this: Vec2) : number
  {
    return Math.sqrt(this.x*this.x + this.y*this.y);
  }

  normalized(this: Vec2) : Vec2
  {
    const n = this.length();
    return new Vec2(this.x/n, this.y/n);
  }

  normalize(this: Vec2) : void
  {
    const n = this.length();
    this.x /= n;
    this.y /= n;
  }

  area(this: Vec2, other: Vec2) : number
  {
    return this.x*other.y - this.y*other.x;
  }

  angle(this: Vec2, other: Vec2) : number 
  {
    const n1 = this.length();
    const n2 = other.length();
    const dot = this.dot(other);
    return Math.acos(dot/(n1*n2));
  }



  dot(this: Vec2, other: Vec2) : number
  {
    return this.x*other.x + this.y*other.y;
  }

  add(this: Vec2, other: Vec2) : Vec2
  {
    return new Vec2(this.x + other.x, this.y + other.y);
  } 

  sub(this: Vec2, other: Vec2) : Vec2
  {
    return new Vec2(this.x - other.x, this.y - other.y);
  } 

  mul(this: Vec2, other: number) : Vec2
  {
    return new Vec2(this.x*other, this.y*other);
  } 

}

function barycentric(p0: Vec2, p1: Vec2, p2: Vec2, p: Vec2) : [number, number, number]
{
  var v0 = p1.sub(p0);
  var v1 = p2.sub(p0);
  var v2 = p.sub(p0);
  var d00 = v0.dot(v0);
  var d01 = v0.dot(v1);
  var d11 = v1.dot(v1);
  var d20 = v2.dot(v0);
  var d21 = v2.dot(v1);
  var denom = d00 * d11 - d01 * d01;
  var v = (d11 * d20 - d01 * d21) / denom;
  var w = (d00 * d21 - d01 * d20) / denom;
  var u = 1 - v - w;
  return [u, v, w];
};

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
      "x": 4736924.94547117,
      "y": 155772.65154585388,
      "z": 4254895.636679317
    }
  }; 

  const posBR = {
      "position": {
        "x": 4736929.895482613,
        "y": 155792.20413750756,
        "z": 4254889.889544869
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
        "direction": new Cartesian3(0.19, 0.96, -0.2), "up": new Cartesian3(0.73, 0.0, 0.67) };
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
      const P = new Vec2(carto.longitude, carto.latitude);
      const BL = new Vec2(cBL.longitude, cBL.latitude);
      const BR = new Vec2(cBR.longitude, cBR.latitude);
      const TL = new Vec2(cTL.longitude, cTL.latitude);
      const TR = new Vec2(cTR.longitude, cTR.latitude);

        var local = new Vec2(0,0);
        var bar  = barycentric(BL, BR, TL, P);
        console.log("Barycentric 1: " + bar[0] + " ; " + bar[1] + " ; " + bar[2] + "."); 
        if (bar[0] >= 0 && bar[1] >= 0 && bar[2] >= 0)
          local = new Vec2(bar[1], bar[2]);
        else{
          bar  = barycentric(BR, TR, TL, P);
          console.log("Barycentric 2: " + bar[0] + " ; " + bar[1] + " ; " + bar[2] + "."); 
          local = new Vec2(bar[0]+bar[1], bar[1]+bar[2]);
        }
        /*
      const local = P.sub(BL);
      var v1 = BR.sub(BL);
      var v2 = TL.sub(BL);
      const l1 = v1.length();
      const l2 = v2.length();
      const v1n = v1.normalized();
      const v2n = v2.normalized();  
      
      var Q = new Vec2(local.dot(v1n), local.dot(v2n));
      Q.x /= l1;
      Q.y /= l2;
         */
      var compx = local.x;
      var compy = 1-local.y;
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
