import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

var scene = new THREE.Scene();

// Create the camera
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;
camera.position.x = -60;
camera.position.y = 80;



// Adjusting the pixel ratio
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Ajustar el tamaño del renderizador cuando se redimensiona la ventana
window.addEventListener('resize', function () {
    var newWidth = window.innerWidth;
    var newHeight = window.innerHeight;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
});

// Crear los ejes coordenados
var axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);

// Mouse control
const controls = new OrbitControls(camera, renderer.domElement );
controls.target.set(0 , 0, 1 );
controls.minDistance = 2;
controls.maxDistance = 500;
controls.update();

//Will start the variables of the system
var dt = 0.008;
var alfa = 10; 
var gamma = 8/3;
var beta = 28;

var x = 2;
var y = 1; 
var z = 1;
  
var estela = [ 
  new THREE.Vector3(x, y, z)
];

var trailPoints = [
  new THREE.Vector3(x, y, z),
];

for (var i = 0; i < 60*60*5; i++){
  var dx = alfa * (z - x);
  var dz = x * (beta - y) - z; 
  var dy = x * z - gamma * y;

  x += dx*dt;
  y += dy*dt;
  z += dz*dt;

  estela.push(new THREE.Vector3(x,y,z));
}

console.log(estela)


const ballGeometry = new THREE.SphereGeometry(1, 32, 16);
var ball = new THREE.Mesh(ballGeometry, new THREE.MeshBasicMaterial({ color: 0x00ffff }));
var initialPosition = new THREE.Vector3(x, y, z);
ball.position.copy(initialPosition);
scene.add(ball);

const traceMaterial = new THREE.LineBasicMaterial( { color: 0xff0000 } );
var suavidad = 0;


// Animate the scene
var animate = function () {
  requestAnimationFrame(animate);
  if (estela.length > 0) {
    var currentVector = estela.shift();
    ball.position.set(currentVector.x, currentVector.y, currentVector.z);
  }

  trailPoints.push(new THREE.Vector3( ball.position.x, ball.position.y, ball.position.z));
  var trace = new THREE.CatmullRomCurve3( trailPoints);
  suavidad ++;
  var puntos = trace.getPoints( suavidad );
  var traceGeometry = new THREE.BufferGeometry().setFromPoints( puntos );

  var curva = new THREE.Line( traceGeometry, traceMaterial );
  scene.remove(scene.getObjectByName("curva"));
  curva.name = "curva";
  scene.add(curva)

  renderer.render(scene, camera);
  
};

animate()

