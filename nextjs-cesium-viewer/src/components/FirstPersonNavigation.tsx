'use client'    // Client component

import { Ion, createWorldTerrainAsync, Viewer, Cesium3DTileset, Cartesian3, Cartographic, PerspectiveFrustum, Color, Transforms, HeadingPitchRoll, ConstantProperty, Matrix4, Entity, HeadingPitchRange, DirectionalLight, Light, Sun, PostProcessStage, Cesium3DTileStyle, Cesium3DTileColorBlendMode, PointPrimitive, IonResource, JulianDate, ClockRange, ClockStep, CameraEventType, ScreenSpaceEventHandler, ScreenSpaceEventType } from "cesium";
import { Math as CesiumMath } from 'cesium';

 // Based on: https://github.com/3DGISKing/CesiumJsFirstPersonCameraController 
 const DIRECTION_FORWARD = 0;
 const DIRECTION_BACKWARD = 1;
 const DIRECTION_LEFT = 2;
 const DIRECTION_RIGHT = 3;
 const HUMAN_EYE_HEIGHT = 5.65; //1.70
 const MAX_PITCH_IN_DEGREE = 88;
 const ROTATE_SPEED = 3;
 const DIRECTION_NONE = -1;
 
class FirstPersonCameraController{

_enabled: boolean;
_cesiumViewer: any;
_canvas: any; 
_camera: any; 
_looking: boolean;
HUMAN_WALKING_SPEED: number;
scratchCurrentDirection: any;
scratchDeltaPosition: any;
scratchNextPosition: any;
scratchTerrainConsideredNextPosition: any;
scratchNextCartographic: any;
_direction: any;	
_screenSpaceEventHandler: any;
_disconectOnClockTick: any;
_mousePosition: any;
_startMousePosition: any;
_heading: any;


constructor(options:any) 
{
 this._enabled = false;
 this._cesiumViewer = options.cesiumViewer;
 this._canvas = this._cesiumViewer.canvas;
 this._camera = this._cesiumViewer.camera;	
 this.HUMAN_WALKING_SPEED = 1.5/15.;
 this._connectEventHandlers();
 this._looking = false;
 this._direction = DIRECTION_NONE;
 this._screenSpaceEventHandler = false; 
 
 this.scratchCurrentDirection = new Cartesian3();
 this.scratchDeltaPosition = new Cartesian3();
 this.scratchNextPosition = new Cartesian3();
 this.scratchTerrainConsideredNextPosition = new Cartesian3();
 this.scratchNextCartographic = new Cartographic();
 this._disconectOnClockTick = false;

}

_onClockTick(clock:any) {
 if(!this._enabled)
     return;

 let dt = clock._clockStep;

 if(this._looking)
     this._changeHeadingPitch(dt);

 if(this._direction === DIRECTION_NONE)
     return;

 let distance = this._walkingSpeed() * dt;

 if(this._direction === DIRECTION_FORWARD)
     Cartesian3.multiplyByScalar(this._camera.direction, 1, this.scratchCurrentDirection);
 else if(this._direction === DIRECTION_BACKWARD)
     Cartesian3.multiplyByScalar(this._camera.direction, -1, this.scratchCurrentDirection);
 else if(this._direction === DIRECTION_LEFT)
     Cartesian3.multiplyByScalar(this._camera.right, -1, this.scratchCurrentDirection);
 else if(this._direction === DIRECTION_RIGHT)
     Cartesian3.multiplyByScalar(this._camera.right, 1, this.scratchCurrentDirection);

 Cartesian3.multiplyByScalar(this.scratchCurrentDirection, distance, this.scratchDeltaPosition);

 let currentCameraPosition = this._camera.position;

 Cartesian3.add(currentCameraPosition, this.scratchDeltaPosition, this.scratchNextPosition);

 // consider terrain height

 let globe = this._cesiumViewer.scene.globe;
 let ellipsoid = globe.ellipsoid;

 // get height for next update position
 ellipsoid.cartesianToCartographic(this.scratchNextPosition, this.scratchNextCartographic);

 let height = globe.getHeight(this.scratchNextCartographic);

 if(height === undefined) {
     console.warn('height is undefined!');
     return;
 }

 if(height < 0) {
     console.warn(`height is negative!`);
 }

 //this.scratchNextCartographic.height = height + HUMAN_EYE_HEIGHT;

 ellipsoid.cartographicToCartesian(this.scratchNextCartographic, this.scratchTerrainConsideredNextPosition);

 this._camera.setView({
     destination: this.scratchTerrainConsideredNextPosition,
     orientation: new HeadingPitchRoll(this._camera.heading, this._camera.pitch, this._camera.roll),
     endTransform : Matrix4.IDENTITY
 });
 
 this._direction = DIRECTION_NONE;
};


_connectEventHandlers()
{
 const canvas = this._cesiumViewer.canvas;

 this._screenSpaceEventHandler = new ScreenSpaceEventHandler(this._canvas);

 this._screenSpaceEventHandler.setInputAction(this._onMouseLButtonClicked.bind(this), ScreenSpaceEventType.LEFT_DOWN);
 this._screenSpaceEventHandler.setInputAction(this._onMouseUp.bind(this), ScreenSpaceEventType.LEFT_UP);
 this._screenSpaceEventHandler.setInputAction(this._onMouseMove.bind(this),ScreenSpaceEventType.MOUSE_MOVE);
 this._screenSpaceEventHandler.setInputAction(this._onMouseLButtonDoubleClicked.bind(this), ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

 // needed to put focus on the canvas
 canvas.setAttribute("tabindex", "0");

 canvas.onclick = function () {
     canvas.focus();
 };

 canvas.addEventListener("keydown", this._onKeyDown.bind(this));
 canvas.addEventListener("keyup", this._onKeyUp.bind(this));
 canvas.addEventListener("wheel", this._onMouseWheel.bind(this));
 this._disconectOnClockTick = this._cesiumViewer.clock.onTick.addEventListener(this._onClockTick, this); // check
};

_onMouseLButtonClicked(movement:any) 
{
 this._looking = true;
 this._mousePosition = this._startMousePosition = Cartesian3.clone(movement.position);
};

_onMouseWheel(event:any) {
 console.log(event);
 //if (event.deltaY > 0) this.HUMAN_WALKING_SPEED /=1.5;
 //if (event.deltaY < 0) this.HUMAN_WALKING_SPEED *=1.5;

 if (event.deltaY < 0) this._direction = DIRECTION_FORWARD;
 else this._direction = DIRECTION_BACKWARD;
};


_onMouseLButtonDoubleClicked(movement:any) {
 this._looking = true;
 this._mousePosition = this._startMousePosition = Cartesian3.clone(movement.position);
};

_onMouseUp(position:any) {
 this._looking = false;
};

_onMouseMove(movement:any) {
 this._mousePosition = movement.endPosition;
};

_onKeyDown(event:any) {
 const keyCode = event.keyCode;

 this._direction = DIRECTION_NONE;

 switch (keyCode) {
     case "W".charCodeAt(0):
         this._direction = DIRECTION_FORWARD;
         return;
     case "S".charCodeAt(0):
         this._direction = DIRECTION_BACKWARD;
         return;
     case "D".charCodeAt(0):
         this._direction = DIRECTION_RIGHT;
         return;
     case "A".charCodeAt(0):
         this._direction = DIRECTION_LEFT;
         return;
     case 90: // z
         return;
     default:
         return;
 }
};

_onKeyUp() {
 this._direction = DIRECTION_NONE;
};

_changeHeadingPitch(dt:any) {
 let width = this._canvas.clientWidth;
 let height = this._canvas.clientHeight;

 // Coordinate (0.0, 0.0) will be where the mouse was clicked.
 let deltaX = (this._mousePosition.x - this._startMousePosition.x) / width;
 let deltaY = -(this._mousePosition.y - this._startMousePosition.y) / height;

 let currentHeadingInDegree = CesiumMath.toDegrees(this._camera.heading);
 let deltaHeadingInDegree = (deltaX * ROTATE_SPEED);
 let newHeadingInDegree = currentHeadingInDegree + deltaHeadingInDegree;

 let currentPitchInDegree = CesiumMath.toDegrees(this._camera.pitch);
 let deltaPitchInDegree = (deltaY * ROTATE_SPEED);
 let newPitchInDegree = currentPitchInDegree + deltaPitchInDegree;

 console.log( "rotationSpeed: " + ROTATE_SPEED + " deltaY: " + deltaY + " deltaPitchInDegree" + deltaPitchInDegree);

 if( newPitchInDegree > MAX_PITCH_IN_DEGREE * 2 && newPitchInDegree < 360 - MAX_PITCH_IN_DEGREE) {
     newPitchInDegree = 360 - MAX_PITCH_IN_DEGREE;
 }
 else {
     if (newPitchInDegree > MAX_PITCH_IN_DEGREE && newPitchInDegree < 360 - MAX_PITCH_IN_DEGREE) {
         newPitchInDegree = MAX_PITCH_IN_DEGREE;
     }
 }

 this._camera.setView({
     orientation: {
         heading : CesiumMath.toRadians(newHeadingInDegree),
         pitch : CesiumMath.toRadians(newPitchInDegree),
         roll : this._camera.roll
     }
 });
};




_walkingSpeed(){
 return this.HUMAN_WALKING_SPEED;
};

_enableDefaultScreenSpaceCameraController(enabled:any) {
 const scene = this._cesiumViewer.scene;

 // disable the default event handlers

 scene.screenSpaceCameraController.enableRotate = enabled;
 scene.screenSpaceCameraController.enableTranslate = enabled;
 scene.screenSpaceCameraController.enableZoom = enabled;
 scene.screenSpaceCameraController.enableTilt = enabled;
 scene.screenSpaceCameraController.enableLook = enabled;
};

start() {
 this._enabled = true;

 this._enableDefaultScreenSpaceCameraController(false);

 let currentCameraPosition = this._camera.position;

 let cartographic = new Cartographic();

 let globe = this._cesiumViewer.scene.globe;

 globe.ellipsoid.cartesianToCartographic(currentCameraPosition, cartographic);

 let height = globe.getHeight(cartographic);

 if(height === undefined)
     return false;

 if(height < 0) {
     console.warn(`height is negative`);
 }

 cartographic.height = height + HUMAN_EYE_HEIGHT;

 let newCameraPosition = new Cartesian3();

 globe.ellipsoid.cartographicToCartesian(cartographic, newCameraPosition);

 let currentCameraHeading = this._camera.heading;

 this._heading = currentCameraHeading;

 this._camera.flyTo({
     destination : newCameraPosition,
     orientation : {
         heading : currentCameraHeading, 
         pitch : CesiumMath.toRadians(0),
         roll : 0.0
     }
 });

 return true;
};

stop() {
 this._enabled = false;
 this._enableDefaultScreenSpaceCameraController(false);
};


};


export {FirstPersonCameraController}; 