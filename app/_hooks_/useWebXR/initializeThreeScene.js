import * as THREE from 'three';

export const initializeThreeScene = (gl, session) => {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
        context: gl,
        alpha: false,
    });

    renderer.autoClear = false;
    renderer.xr.enabled = true;
    renderer.xr.setSession(session);
    //renderer.xr.setReferenceSpaceType('viewer');

    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );

    
    sphere.position.set(0, 0, -0.5);
    camera.add(sphere);

    return { scene, camera, renderer, sphere };
};