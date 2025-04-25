import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';

export const usePlyModel = (plyFileUrl, modelPosition) => {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [modelRef, setModelRef] = useState(null);

    useEffect(() => {
        if (!plyFileUrl || !modelPosition) return;

        const loader = new PLYLoader();
        loader.load(plyFileUrl, (geometry) => {
            const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
            const mesh = new THREE.Mesh(geometry, material);

            mesh.position.set(modelPosition.x, modelPosition.y, modelPosition.z);
            
            // xrSession.scene.add(mesh);

            setModelRef(mesh);
            setIsModelLoaded(true);
        });

        return () => {
            if (modelRef) {
                modelRef.geometry.dispose();
                modelRef.material.dispose();
            }
        };
    }, [plyFileUrl, modelPosition]);

    return { isModelLoaded, modelRef };
};
