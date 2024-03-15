'use client'    // Client component

import { Ion, createWorldTerrainAsync, Viewer, Cesium3DTileset, Cartesian3, Cartographic, PerspectiveFrustum, Color, Transforms, HeadingPitchRoll, ConstantProperty, Matrix4, Entity, HeadingPitchRange, DirectionalLight, Light, Sun, PostProcessStage, Cesium3DTileStyle, Cesium3DTileColorBlendMode, PointPrimitive, IonResource, JulianDate, ClockRange, ClockStep, CameraEventType, ScreenSpaceEventHandler, ScreenSpaceEventType } from "cesium";
import { Math as CesiumMath } from 'cesium';

 // Author: Carlos Andújar
 // Partially based on: https://github.com/3DGISKing/CesiumJsFirstPersonCameraController 
 const DIRECTION_WHEEL_FORWARD = 0;
 const DIRECTION_WHEEL_BACKWARD = 1;
 const DIRECTION_FORWARD = 2;
 const DIRECTION_BACKWARD = 3;
 const DIRECTION_LEFT = 4;
 const DIRECTION_RIGHT = 5;
 const DIRECTION_UP = 6;
 const DIRECTION_DOWN = 7;

 // const HUMAN_EYE_HEIGHT = 5.65; //1.70
 const MAX_PITCH_IN_DEGREE = 88;
 const ROTATE_SPEED = 3;
 const DIRECTION_NONE = -1;
 
class FirstPersonCameraController{
    _currentSpeed: number;
    _defaultSpeed: number;
    _forwardInertia: number;
    _speedWheelSensitivity: number;
    _continuousMotion: boolean;
    _enabled: boolean;
    _cesiumViewer: any;
    _canvas: any; 
    _camera: any; 
    _looking: boolean;
    scratchCurrentDirection: any;
    scratchDeltaPosition: any;
    scratchNextPosition: any;
    scratchTerrainConsideredNextPosition: any;
    scratchNextCartographic: any;
    _direction: any;	
    _screenSpaceEventHandler: any;
    _mousePosition: any;
    _startMousePosition: any;

    constructor(options:any) 
    {
        this._currentSpeed = 0;
        this._forwardInertia = 1.5; // the closer to 1.0, the longer it takes to stop
        this._speedWheelSensitivity = 900; // the lower, the faster
        this._continuousMotion = true; // whether mouse wheel initiates but not stops motion
        this._defaultSpeed = 0.02; // speed for WASD motion 
        this._enabled = false;
        this._cesiumViewer = options.cesiumViewer;
        this._canvas = this._cesiumViewer.canvas;
        this._camera = this._cesiumViewer.camera;
        this._connectEventHandlers();
        this._looking = false;
        this._direction = DIRECTION_NONE;
        this._screenSpaceEventHandler = false; 
        
        this.scratchCurrentDirection = new Cartesian3();
        this.scratchDeltaPosition = new Cartesian3();
        this.scratchNextPosition = new Cartesian3();
        this.scratchTerrainConsideredNextPosition = new Cartesian3();
        this.scratchNextCartographic = new Cartographic();

    }

    _onClockTick(clock:any) {
        if(!this._enabled)
            return;

        let dt = clock._clockStep;

        if(this._looking)
            this._changeHeadingPitch(dt);

        if(this._direction === DIRECTION_NONE)
            return;


        let distance = this._currentSpeed * dt;
        if (this._continuousMotion) 
        {
            if (this._currentSpeed < 0.0) // brake only when the speed is negative
                this._currentSpeed /= this._forwardInertia;
        }
        else
        {
            this._currentSpeed /= this._forwardInertia;  // friction
        }
        //console.log(this._currentSpeed);

        
        if(this._direction === DIRECTION_WHEEL_FORWARD)
            Cartesian3.multiplyByScalar(this._camera.direction, 1, this.scratchCurrentDirection);
        else if(this._direction === DIRECTION_WHEEL_BACKWARD)
            Cartesian3.multiplyByScalar(this._camera.direction, -1, this.scratchCurrentDirection);
        else
            distance = this._defaultSpeed * dt; // for WASD motion

        if(this._direction === DIRECTION_FORWARD)
            Cartesian3.multiplyByScalar(this._camera.direction, 1, this.scratchCurrentDirection);
        else if(this._direction === DIRECTION_BACKWARD)
            Cartesian3.multiplyByScalar(this._camera.direction, -1, this.scratchCurrentDirection);
        else if(this._direction === DIRECTION_LEFT)
            Cartesian3.multiplyByScalar(this._camera.right, -1, this.scratchCurrentDirection);
        else if(this._direction === DIRECTION_RIGHT)
            Cartesian3.multiplyByScalar(this._camera.right, 1, this.scratchCurrentDirection);
        else if(this._direction === DIRECTION_DOWN)
            Cartesian3.multiplyByScalar(this._camera.up, -1, this.scratchCurrentDirection);
        else if(this._direction === DIRECTION_UP)
            Cartesian3.multiplyByScalar(this._camera.up, 1, this.scratchCurrentDirection);
        
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

        if (Math.abs(this._currentSpeed) < 0.001) 
        {
            //this._direction = DIRECTION_NONE;
            this._currentSpeed = 0;
        }
        
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
        this._cesiumViewer.clock.onTick.addEventListener(this._onClockTick, this); 
    };

    _onMouseLButtonClicked(movement:any) 
    {
        this._looking = true;
        this._mousePosition = this._startMousePosition = Cartesian3.clone(movement.position);
    };

    _onMouseWheel(event:any) {
        //console.log(event.deltaY); 
        if (this._continuousMotion)
            if (event.deltaY < 0) // accelerate
                this._currentSpeed += (-event.deltaY) / (this._speedWheelSensitivity * 30); 
            else // break
                this._currentSpeed += (-event.deltaY) / (this._speedWheelSensitivity * 10); 
        else
            this._currentSpeed += (-event.deltaY) / this._speedWheelSensitivity; 
        this._direction = DIRECTION_WHEEL_FORWARD;
    };


    _onMouseLButtonDoubleClicked(movement:any) {
        this._looking = false; // evripidis, set to false, since we "pick" on double click, stop mouse looking
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

        // console.log(keyCode);
        switch (keyCode) {
            case "W".charCodeAt(0):
            case 38: // up
                this._direction = DIRECTION_FORWARD;
                return;
            case "S".charCodeAt(0):
            case 40: // down
                this._direction = DIRECTION_BACKWARD;
                return;
            case "D".charCodeAt(0):
            case 39: // right
                this._direction = DIRECTION_RIGHT;
                return;
            case "A".charCodeAt(0):
            case 37: // left
                this._direction = DIRECTION_LEFT;
                return;

            case "Q".charCodeAt(0):
                    this._direction = DIRECTION_DOWN;
                    return;
            case "E".charCodeAt(0):
                        this._direction = DIRECTION_UP;
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

        //console.log( "rotationSpeed: " + ROTATE_SPEED + " deltaY: " + deltaY + " deltaPitchInDegree" + deltaPitchInDegree);

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


    _enableDefaultScreenSpaceCameraController(enabled:any) {
        const scene = this._cesiumViewer.scene;

        // enable/disable the default event handlers
        scene.screenSpaceCameraController.enableRotate = enabled;
        scene.screenSpaceCameraController.enableTranslate = enabled;
        scene.screenSpaceCameraController.enableZoom = enabled;
        scene.screenSpaceCameraController.enableTilt = enabled;
        scene.screenSpaceCameraController.enableLook = enabled;
    };

    start() {
        this._enabled = true;
        this._enableDefaultScreenSpaceCameraController(false);
        
/*
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
        */

        return true;
    };

    stop() {
        this._enabled = false;
        this._enableDefaultScreenSpaceCameraController(true);
    };

};


export {FirstPersonCameraController}; 