import * as THREE from '../vendor/three.module.js';
import {createLoftBallVisual,LOFT_BALL_SPEC} from './ballVisual.js';
import {LoftObjectAtelier} from './objectAtelier.js';

export const BALL_ATELIER_SPEC=Object.freeze({
  system:'LOFT_BALL_ATELIER_V1',
  fieldOfView:32,
  distance:.110,
  minDistance:.088,
  maxDistance:.145,
  maxPitch:Math.PI*.48,
  damping:12,zoomStep:.009,exposure:1,
  label:'LOFT playable ball, detailed 3D inspection'
});

export class LoftBallAtelier extends LoftObjectAtelier{
  constructor(renderer,host){super(renderer,host,BALL_ATELIER_SPEC);}
  _build(){
    if(this.scene)return;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x111819);
    this.camera=new THREE.PerspectiveCamera(BALL_ATELIER_SPEC.fieldOfView,1,.001,1);
    this.scene.add(new THREE.HemisphereLight(0xf6f0e5,0x455152,.7));
    const key=new THREE.DirectionalLight(0xffedda,2.5);key.position.set(-.10,.07,.04);this.scene.add(key);
    const fill=new THREE.DirectionalLight(0xd8e9ee,.5);fill.position.set(.12,.01,.09);this.scene.add(fill);
    const rim=new THREE.DirectionalLight(0xf8f3e9,1.2);rim.position.set(.08,.06,-.06);this.scene.add(rim);
    // Identical factory and material as the ball in play; only physical display
    // scale, camera and lighting differ. Detail is selected by the shared LOD.
    this.ball=createLoftBallVisual({radius:LOFT_BALL_SPEC.physicalRadius});
    this.object=this.ball;this.scene.add(this.ball);
  }

}
