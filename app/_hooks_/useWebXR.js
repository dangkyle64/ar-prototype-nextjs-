import { useEffect, useState } from 'react';
import { useErrorState } from './useErrorState';
import { useArSceneState } from './useArSceneState';
import { checkWebXRPossible } from './useWebXR/checkWebXRPossible.js';
import { initializeWebGl2 } from './useWebXR/initializeWebGL2.js';
import { requestReferenceSpace } from './useWebXR/requestReferenceSpace.js';
import { initializeHitSource } from './useWebXR/initializeHitSource.js';
import { onXRFrame } from './useWebXR/onXRFrame.js';

const requestARSession = async (overlayElement) => {
    try {
        const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['local', 'hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: overlayElement }
        });

        return session; 
    } catch (error) {
        throw new Error('Error requesting AR session: ' + error.message);
    };
};

const requestInitializeWebGL2 = (session) => {
    try {
        return initializeWebGl2(session);
    } catch(error) {
        throw new Error('Error initializing WebGL: ', error);
    };
};

const handleStartARSessionOrchestral = async () => {
    const overlayElement = document.getElementById('overlay');

    try {
        const session = await requestARSession(overlayElement);

        requestInitializeWebGL2(session);
    } catch(error) {
        console.error(error);
        return;
    };
};
export const useWebXR = () => {
    const { session, referenceSpace, setSessionState, setReferenceSpaceState, toggleIsSessionEnded } = useArSceneState();
    const { xrError, populateSetXRError } = useErrorState();

    const [hitTestSource, setHitTestSource] = useState(null);
    const [modelPosition, setModelPosition] = useState(null);

    useEffect(() => {
        checkWebXRPossible(populateSetXRError);
    }, []);

    const handleStartARSession = async () => {

        const overlayElement = document.getElementById('overlay');
        
        try {

            const session = await requestARSession(overlayElement);
            setSessionState(session);
            initializeWebGl2(session);
            
            const returnedReferenceSpace = await requestReferenceSpace(session);
            setReferenceSpaceState(returnedReferenceSpace);

            const initializedHitTestSource = await initializeHitSource(session, returnedReferenceSpace);
            setHitTestSource(initializedHitTestSource);

            session.addEventListener('end', () => {
                setSessionState(null);
            });
            console.log('onXRFRame started. referenceSpace: ', returnedReferenceSpace);

            session.requestAnimationFrame((time, frame) => onXRFrame(session, returnedReferenceSpace, time, frame, initializedHitTestSource, setModelPosition));

        } catch (error) {
            console.log('Error: ', error);
            populateSetXRError('Error starting AR session: ' + error.message);
        };
    };

    const handleEndARSession = async () => {
        console.log(session);
        if (session && typeof session.requestAnimationFrame === 'function') {
            try {
                await session.end();
                setSessionState(null);
                setReferenceSpaceState(null);
                toggleIsSessionEnded();

                if (hitTestSource) {
                    hitTestSource.cancel();
                    hitTestSource = null;
                };

            } catch(error) {
                populateSetXRError('Error ending AR session: ' + error.message);
            };
        } else {
            console.log('No active AR session to end');
        };
    };

    return {
        session,
        referenceSpace,
        xrError,
        modelPosition,
        handleStartARSession,
        handleEndARSession,
    };
};

const createHitPosePositionOrientation = () => {

    const hitTestData = [];
    const maxEntriesForHitPoints = 5;

    return (time, hitTestResults, referenceSpace) => {
        const hitPose = hitTestResults[0].getPose(referenceSpace);
        if (hitPose) {
            //console.log('Hit Pose:', hitPose);
                
            const { x, y, z } = hitPose.transform.position;
            const { x: qx, y: qy, z: qz, w: qw } = hitPose.transform.orientation;

            hitTestData.push({
                time: time,
                hitPose: { x, y, z },
                orientation: { x: qx, y: qy, z: qz, w: qw },
            });

            if (hitTestData.length > maxEntriesForHitPoints) {
                hitTestData.shift();  
            };
        };

        return hitTestData || [];
    };
};

const hitPoseTracker = createHitPosePositionOrientation();

const performHitTest = (time, frame, referenceSpace, hitTestSource, setModelPosition) => {
    const hitTestResults = getHitTestResults(frame, hitTestSource);

    if (hitTestResults.length > 0) {
        const hitTestData = hitPoseTracker(time, hitTestResults, referenceSpace);
        const hitPose = hitTestResults[0].getPose(referenceSpace);

        if (hitPose) {
            const { x, y, z } = hitPose.transform.position;
            setModelPosition({ x, y, z });
            console.log('Hit position:', { x, y, z });
        };
        
    } else {
        console.log('No hit test results found');
    };
};

export const getHitTestResults = (frame, hitTestSource) => {

    let hitTestResults = [];
    if (frame === null || frame === undefined ) {
        throw new Error('Failed to get hit results: frame is null or undefined');
    };

    if (hitTestSource === null || hitTestSource === undefined) {
        throw new Error('Failed to get hit results: hitTestSource is null or undefined');
    };

    try {
        hitTestResults = frame.getHitTestResults(hitTestSource);
    } catch(error) {
        //console.log('Hit Test Results: ', hitTestResults);
        throw new Error('Failed to get hit test results: ' + error.message);
    };
    
    //console.log('Hit Test Results: ', hitTestResults);

    return hitTestResults || [];
};