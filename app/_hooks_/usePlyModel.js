import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';

export const usePlyModel = (plyFileUrl, xrSession) => {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [modelRef, setModelRef] = useState(null);

    useEffect(() => {
        if (!plyFileUrl || !xrSession) return;

        const loader = new PLYLoader();
        
        loader.load(plyFileUrl, (geometry) => {
            const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.set(0, 0, -2); 
            
            xrSession.requestAnimationFrame(() => {
                xrSession.scene.add(mesh);
            });

            setModelRef(mesh);
            setIsModelLoaded(true);
        });

        return () => {
            if (modelRef) {
                xrSession.scene.remove(modelRef);
                modelRef.geometry.dispose();
                modelRef.material.dispose();
            }
        };
    }, [plyFileUrl, xrSession, modelRef]);

    return { isModelLoaded, modelRef };
};
