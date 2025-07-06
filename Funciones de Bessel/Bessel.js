import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

//var scene = new THREE.Scene();

// Variables globales
let scene, camera, renderer, membrane, controls;
let polarCoordinates = [];
let originalPositions = [];
let time = 0;
let animationParams = {
    radialAmplitude: 1,
    radialFrequency: 2,
    angularAmplitude: 0.5,
    angularFrequency: 6,
    rotationSpeed: 1,
    membraneRadius: 4
};
let isWireframe = false;
let colorIndex = 0;
const colors = [0x00ff88, 0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0xf0932b];

// Inicializar la escena
function init() {
    // Crear escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Crear cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 10);
    camera.lookAt(0, 0, 0);

    // Crear renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);

    // Crear la membrana circular
    createCircularMembrane();

    // Agregar luces
    addLights();

    // Controles de cámara
    setupCameraControls();

    // Event listeners para controles
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

function addLights() {
    // Luz ambiental
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Luz direccional
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Luz puntual para efectos
    const pointLight = new THREE.PointLight(0x00ff88, 1, 100);
    pointLight.position.set(0, 8, 0);
    scene.add(pointLight);
}

function setupCameraControls() {
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    renderer.domElement.addEventListener('mousedown', (e) => {
        mouseDown = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    renderer.domElement.addEventListener('mouseup', () => {
        mouseDown = false;
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (!mouseDown) return;

        const deltaX = e.clientX - mouseX;
        const deltaY = e.clientY - mouseY;

        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);
        spherical.theta -= deltaX * 0.01;
        spherical.phi += deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);

        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    renderer.domElement.addEventListener('wheel', (e) => {
        const distance = camera.position.length();
        const newDistance = distance + e.deltaY * 0.01;
        camera.position.normalize().multiplyScalar(Math.max(3, Math.min(20, newDistance)));
    });
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

function deformMembrane() {
    const positions = membrane.geometry.attributes.position.array;
    
    for (let i = 0; i < polarCoordinates.length; i++) {
        const polar = polarCoordinates[i];
        const r = polar.r;
        const theta = polar.theta;
        
        // Aplicar deformaciones usando coordenadas polares
        const radialWave = Math.sin(r * animationParams.radialFrequency + time * animationParams.rotationSpeed) * animationParams.radialAmplitude;
        const angularWave = Math.cos(theta * animationParams.angularFrequency + time * animationParams.rotationSpeed) * animationParams.angularAmplitude;
        
        // Combinar ondas radiales y angulares
        const z = radialWave * (1 - r / animationParams.membraneRadius) + angularWave * Math.sin(r * 0.5);
        
        positions[i * 3 + 2] = z;
    }
    
    membrane.geometry.attributes.position.needsUpdate = true;
    membrane.geometry.computeVertexNormals();
}

function createRipple() {
    const positions = membrane.geometry.attributes.position.array;
    
    for (let i = 0; i < polarCoordinates.length; i++) {
        const polar = polarCoordinates[i];
        const r = polar.r;
        
        // Ondas concéntricas que se expanden desde el centro
        const ripple = Math.sin(r * 3 - time * 4) * Math.exp(-r * 0.3) * 2;
        
        positions[i * 3 + 2] = ripple;
    }
    
    membrane.geometry.attributes.position.needsUpdate = true;
    membrane.geometry.computeVertexNormals();
}

function createSpiral() {
    const positions = membrane.geometry.attributes.position.array;
    
    for (let i = 0; i < polarCoordinates.length; i++) {
        const polar = polarCoordinates[i];
        const r = polar.r;
        const theta = polar.theta;
        
        // Crear un patrón espiral
        const spiral = Math.sin(r * 2 + theta * 3 + time * 2) * (1 - r / animationParams.membraneRadius) * 1.5;
        
        positions[i * 3 + 2] = spiral;
    }
    
    membrane.geometry.attributes.position.needsUpdate = true;
    membrane.geometry.computeVertexNormals();
}

function createFlower() {
    const positions = membrane.geometry.attributes.position.array;
    
    for (let i = 0; i < polarCoordinates.length; i++) {
        const polar = polarCoordinates[i];
        const r = polar.r;
        const theta = polar.theta;
        
        // Patrón de flor con pétalos
        const petals = Math.cos(theta * 8) * Math.sin(r * 1.5) * (1 - r / animationParams.membraneRadius) * 1.2;
        const center = Math.exp(-r * 0.5) * Math.sin(time * 3) * 0.5;
        
        positions[i * 3 + 2] = petals + center;
    }
    
    membrane.geometry.attributes.position.needsUpdate = true;
    membrane.geometry.computeVertexNormals();
}

function createRadialWaves() {
    const positions = membrane.geometry.attributes.position.array;
    
    for (let i = 0; i < polarCoordinates.length; i++) {
        const polar = polarCoordinates[i];
        const r = polar.r;
        const theta = polar.theta;
        
        // Ondas que se propagan radialmente
        const radialWave = Math.sin(theta * 4 + time * 2) * Math.cos(r * 2) * (1 - r / animationParams.membraneRadius) * 1;
        
        positions[i * 3 + 2] = radialWave;
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

// Manejar redimensionamiento de ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Inicializar cuando se carga la página
init();