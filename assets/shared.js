import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";



export function createScene(){
    return new THREE.Scene();
}

// Create the camera
export function createCamera(container) {
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 50;
  return camera;
}

// Adjusting the pixel ratio 
export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(container.devicePixelRatio);
  renderer.shadowMap.enabled = true; //Comment this when performance is needed
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; //Comment this when performance is needed
  container.appendChild(renderer.domElement);
  renderer.physicallyCorrectLights = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

// Adjust the size of the renderer when the windows resize
export function handleResize(camera, renderer) {
  window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
}

//Adds light
export function addLights(scene) {
  const ambientLight = new THREE.AmbientLight(0x404040, 1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 10);

  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  // Area of the light. Erase when performance is needed
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;

  scene.add(directionalLight);
}

//Add the axes helper
export function addAxesHelper(scene, size = 2) {
  const axesHelper = new THREE.AxesHelper(size);
  scene.add(axesHelper);
}

//Camera movement controls
export function setupControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 1);
  controls.minDistance = 2;
  controls.maxDistance = 50;
  controls.update();
  return controls;
}
