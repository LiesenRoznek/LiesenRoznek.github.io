import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import {createScene , createCamera, createRenderer, handleResize, addLights, addAxesHelper, setupControls} from './config.js';
import {besselj} from './bessel.js';


// Variables globales
const scene = createScene(); //Create scene
const camera = createCamera(); // Create the camera
const renderer = createRenderer(); // Adjusting the pixel ratio  
let membrane;
let polarCoordinates = [];
let originalPositions = [];
let time = 0;
let animationParams = {
    radialAmplitude: 1,
    radialFrequency: 2,
    angularAmplitude: 0.5,
    angularFrequency: 6,
    rotationSpeed: 1,
    membraneRadius: 10,
    waveVelocity: 1,
    radialMode: 2,
    angularMode: 3,
};
const besselZeros = {
  0: [2.4048, 5.5201, 8.6537, 11.7915, 14.9309],
  1: [3.8317, 7.0156, 10.1735, 13.3237, 16.4706],
  2: [5.1356, 8.4172, 11.6198, 14.7959, 17.9598],
  3: [6.3802, 9.7610, 13.0152, 16.2235, 19.4094],
  4: [7.5883, 11.0647, 14.3725, 17.6159, 20.8269],
  5: [8.7715, 12.3386, 15.7002, 18.9801, 22.2178],
  6: [9.9361, 13.5893, 17.0038, 20.3208, 23.5830]
};

let isWireframe = false;
let colorIndex = 0;
const colors = [0x00ff88, 0xff6b6b, 0x4ecdc4, 0xf9ca24, 0xf0932b];



const gui = new GUI();
gui.open();
const circleFolder  = gui.addFolder("Parameters")
circleFolder.add( animationParams, "rotationSpeed", 0, 10).name("Rotación")
circleFolder.add( animationParams, "angularMode", 0, 6).name("Modo angular").step(1)
circleFolder.add( animationParams, "radialMode", 1, 5).name("Modo radial").step(1)
circleFolder.add({ cambiar: changeColor }, 'cambiar').name('Cambiar Color');
circleFolder.add({toggle: toggleWireframe }, "toggle").name("Alternar estructura")
circleFolder.open()

// Inicializar la escena
function init() {
    
    handleResize(camera, renderer); // Adjust the size of the renderer when the windows resize
    addLights(scene);// Add some lighting and exes
    //addAxesHelper(scene); // Add the axes to the scene
    const controls = setupControls(camera, renderer); // Mouse control

    // Crear la membrana circular
    createCircularMembrane();
    setupControlListeners();

    // Iniciar animación
    animate();
}

function createCircularMembrane() {
    // Crear geometría circular usando coordenadas polares
    const radius = animationParams.membraneRadius;
    const radialSegments = 32;
    const angularSegments = 64;
    
    const vertices = [];
    const indices = [];
    const uvs = [];
    
    // Generar vértices en coordenadas polares
    for (let r = 0; r <= radialSegments; r++) {
        const rho = (r / radialSegments) * radius;
        
        for (let a = 0; a <= angularSegments; a++) {
            const theta = (a / angularSegments) * Math.PI * 2;
            
            // Convertir a coordenadas cartesianas
            const x = rho * Math.cos(theta);
            const y = rho * Math.sin(theta);
            const z = 0;
            
            vertices.push(x, y, z);
            
            // Guardar coordenadas polares para cada vértice
            polarCoordinates.push({ r: rho, theta: theta });
            
            // UVs para textura
            uvs.push(a / angularSegments, r / radialSegments);
        }
    }
    
    // Generar índices para los triángulos
    for (let r = 0; r < radialSegments; r++) {
        for (let a = 0; a < angularSegments; a++) {
            const current = r * (angularSegments + 1) + a;
            const next = current + angularSegments + 1;
            
            // Evitar triángulos degenerados en el centro
            if (r === 0) {
                indices.push(current, next, next + 1);
            } else {
                indices.push(current, next, current + 1);
                indices.push(current + 1, next, next + 1);
            }
        }
    }
    
    // Crear geometría
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    // Guardar posiciones originales
    originalPositions = vertices.slice();
    
    // Material
    const material = new THREE.MeshPhongMaterial({
        color: colors[colorIndex],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        shininess: 100
    });

    // Crear mesh
    membrane = new THREE.Mesh(geometry, material);
    membrane.rotation.x = -Math.PI / 2;
    membrane.receiveShadow = true;
    membrane.castShadow = true;
    
    scene.add(membrane);
}

function setupControlListeners() {
    document.getElementById('radialAmplitude').addEventListener('input', (e) => {
        animationParams.radialAmplitude = parseFloat(e.target.value);
        document.getElementById('radialAmpValue').textContent = e.target.value;
    });

    document.getElementById('radialFrequency').addEventListener('input', (e) => {
        animationParams.radialFrequency = parseFloat(e.target.value);
        document.getElementById('radialFreqValue').textContent = e.target.value;
    });

    document.getElementById('angularAmplitude').addEventListener('input', (e) => {
        animationParams.angularAmplitude = parseFloat(e.target.value);
        document.getElementById('angularAmpValue').textContent = e.target.value;
    });

    document.getElementById('angularFrequency').addEventListener('input', (e) => {
        animationParams.angularFrequency = parseFloat(e.target.value);
        document.getElementById('angularFreqValue').textContent = e.target.value;
    });

    document.getElementById('rotationSpeed').addEventListener('input', (e) => {
        animationParams.rotationSpeed = parseFloat(e.target.value);
        document.getElementById('rotationSpeedValue').textContent = e.target.value;
    });

    document.getElementById('membraneRadius').addEventListener('input', (e) => {
        animationParams.membraneRadius = parseFloat(e.target.value);
        document.getElementById('radiusValue').textContent = e.target.value;
        recreateMembrane();
    });
}

function recreateMembrane() {
    scene.remove(membrane);
    polarCoordinates = [];
    createCircularMembrane();
}

function angular(m, theta) {
    //theta = theta * 180 / Math.PI
    return Math.cos(m*theta) + Math.sin(m*theta)
}

function temporal(c, lambda, t) {
    return Math.cos(c*lambda*t) + Math.sin(c*lambda*t)
}

function deformMembrane() {
    const positions = membrane.geometry.attributes.position.array;
    
    for (let i = 0; i < polarCoordinates.length; i++) {
        const polar = polarCoordinates[i];
        const r = polar.r;
        const theta = polar.theta;
        
        // Aplicar deformaciones usando coordenadas polares
        const radialWave = Math.sin(r * animationParams.radialFrequency + time * animationParams.rotationSpeed) * animationParams.radialAmplitude;
        const angularWave = Math.cos(theta * animationParams.angularFrequency + time * animationParams.rotationSpeed) * animationParams.angularAmplitude;
        
         //
        const c = animationParams.waveVelocity; //Velocidad de onda
        const m = animationParams.angularMode; //
        const n = animationParams.radialMode;
        const lambda = besselZeros[m][n-1]; // 
        const a = animationParams.membraneRadius //Circle radius

        // Combinar ondas radiales y angulares
        const z = besselj(lambda*r/a, m)*angular(m, theta)*temporal(c, lambda, time);
        //const z = radialWave * (1 - r / animationParams.membraneRadius) + angularWave * Math.sin(r * 0.5);
        
        positions[i * 3 + 2] = z;
    }
    
    membrane.geometry.attributes.position.needsUpdate = true;
    membrane.geometry.computeVertexNormals();
}


function resetMembrane() {
    const positions = membrane.geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] = originalPositions[i];
        positions[i + 1] = originalPositions[i + 1];
        positions[i + 2] = originalPositions[i + 2];
    }
    
    membrane.geometry.attributes.position.needsUpdate = true;
    membrane.geometry.computeVertexNormals();
}

function toggleWireframe() {
    isWireframe = !isWireframe;
    membrane.material.wireframe = isWireframe;
}

function changeColor() {
    colorIndex = (colorIndex + 1) % colors.length;
    membrane.material.color.setHex(colors[colorIndex]);
}

function animate() {
    requestAnimationFrame(animate);
    
    time += 0.01;
    
    // Deformar la membrana usando coordenadas polares
    deformMembrane();
    
    // Renderizar
    renderer.render(scene, camera);
}




// Inicializar cuando se carga la página
init();