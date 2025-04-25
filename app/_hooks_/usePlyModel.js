import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { getModelRefState } from './useWebXR';

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
        getModelRefState(mesh);
        setIsModelLoaded(true);
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

    // Fallback: If the model is not loaded, return a sphere
    const fallbackGeometry = new THREE.SphereGeometry(1, 32, 32); // Default sphere
    const fallbackMaterial = new THREE.MeshStandardMaterial({ color: 0x0077ff }); // Blue color
    const fallbackSphere = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    fallbackSphere.position.set(modelPosition.x, modelPosition.y, modelPosition.z);

    return {
        isModelLoaded,
        modelRef: isLoading ? fallbackSphere : modelRef, // Show sphere while loading
        isLoading, // Track loading state
    };
};
