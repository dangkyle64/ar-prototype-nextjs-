import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { getModelRef } from './useWebXR.js';

export const usePlyModel = (plyFileUrl, modelPosition) => {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [modelRef, setModelRef] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Track loading state

    useEffect(() => {
        if (!plyFileUrl || !modelPosition) return;

        const loader = new PLYLoader();
        console.log('LOADING PLY MODEL...');
        setIsLoading(true); // Start loading the model

        loader.load(plyFileUrl, (geometry) => {
            const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(modelPosition.x, modelPosition.y, modelPosition.z);

            setModelRef(mesh);
            getModelRef(mesh); // Optionally store this globally if needed
            setIsModelLoaded(true);
            setIsLoading(false); // Set loading to false once the model is loaded
            console.log('MODEL LOADED');
        });

        // Cleanup
        return () => {
            if (modelRef) {
                modelRef.geometry.dispose();
                modelRef.material.dispose();
            }
        };
    }, [plyFileUrl, modelPosition]);

    // Create the fallback sphere geometry
    const fallbackGeometry = new THREE.SphereGeometry(1, 32, 32); // Default sphere
    const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0x0077ff }); // Blue color
    const fallbackSphere = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    const position = modelPosition || { x: 0, y: 0, z: 0 }; // Default position if modelPosition is not valid
    fallbackSphere.position.set(position.x, position.y, position.z);

    // Return the appropriate model: either the sphere during loading or the loaded model
    return {
        isModelLoaded,
        modelRef: isLoading ? fallbackSphere : modelRef, // Only show sphere while loading
        isLoading, // Track loading state
    };
};
