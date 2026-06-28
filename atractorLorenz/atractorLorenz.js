import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {createScene , createCamera, createRenderer, handleResize, addLights, setupControls} from '../assets/shared.js';

export function mountLorenz(container) {
//Will start the variables of the system
const dt = 0.008;
const alfa = 10; 
const gamma = 8/3;
const beta = 28;


var scene = new THREE.Scene();

// Create the camera
var camera = createCamera(container);



const canvas = document.createElement("canvas");
container.appendChild(canvas);
const renderer = createRenderer(container);




// Mouse control
const controls = new OrbitControls(camera, renderer.domElement );
controls.target.set(0 , 0, 1 );
controls.minDistance = 0.1;
controls.maxDistance = 200;
controls.update();



var x = 2;
var y = 1; 
var z = 1;
  
var estela = [ 
  new THREE.Vector3(x, y, z)
];

var trailPoints = [
  new THREE.Vector3(x, y, z),
];

for (var i = 0; i < 60*360; i++){
  var dx = alfa * (z - x);
  var dz = x * (beta - y) - z; 
  var dy = x * z - gamma * y;

  x += dx*dt;
  y += dy*dt;
  z += dz*dt;

  estela.push(new THREE.Vector3(x,y,z));
}

console.log(estela)

// Creates the geometry of the ball object
const ballGeometry = new THREE.SphereGeometry(1, 32, 16);
var ball = new THREE.Mesh(ballGeometry, new THREE.MeshBasicMaterial({ color: 0x00ffff }));
var initialPosition = new THREE.Vector3(x, y, z);
ball.position.copy(initialPosition);
scene.add(ball);

//Creates the line material
const traceMaterial = new THREE.LineBasicMaterial( { color: 0xff0000 } );
renderer.setClearColor(0x222222, 1);

const totalPuntos = estela.length;
const positions = new Float32Array(totalPuntos*3);

//changed the drawing pattern for better performance
const traceGeometry = new THREE.BufferGeometry();
traceGeometry.setAttribute('position', 
  new THREE.BufferAttribute(positions, 3)
);

const curva = new THREE.Line(traceGeometry, traceMaterial);
curva.frustumCulled = false;
scene.add(curva);


let puntosDibujados = 0;

// Animate the scene
function animate() {
  requestAnimationFrame(animate);

  if (estela.length > 0) {
    const v = estela.shift();
    ball.position.copy(v);

    positions[puntosDibujados*3] = v.x;
    positions[puntosDibujados*3 + 1] = v.y;
    positions[puntosDibujados*3 + 2] = v.z;

    puntosDibujados++;

    traceGeometry.setDrawRange(0, puntosDibujados);
    traceGeometry.attributes.position.needsUpdate = true;
  }
 

  renderer.render(scene, camera);
  
};

animate()
}
