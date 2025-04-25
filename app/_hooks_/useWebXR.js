import { useEffect, useState } from 'react';
import { useErrorState } from './useErrorState';
import { useArSceneState } from './useArSceneState';

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

            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local', 'hit-test'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: overlayElement}
            });
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

export const checkWebXRPossible = async (populateSetXRError) => {
    if (typeof navigator === 'undefined') {
        populateSetXRError('Navigator object is undefined.');
        return;
    };

    if (!navigator.xr) {
        populateSetXRError('WebXR is not supported on this device.');
        return;
    };

    const isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
    if (!isARSupported) {
        populateSetXRError('AR is not supported on this device.');
        return;
    };
};

export const initializeWebGl2 = (session) => {
    const canvas = document.createElement('canvas');
    const webGL = canvas.getContext('webgl2', { xrCompatible: true });

    if (!webGL) {
        throw new Error('WebGL context not available.');
    };

    const xrLayer = new XRWebGLLayer(session, webGL);
    session.updateRenderState({ baseLayer: xrLayer });

    return xrLayer;
};

export const requestReferenceSpace = async (session) => {
    try {

        if (!session) {
            throw new Error('Failed to request reference space: Missing session.');
        }
        
        const referenceSpace = await session.requestReferenceSpace('viewer');
        return referenceSpace;
    } catch(error) {
        throw new Error(`Failed to request reference space: ${error.message || error}`);
    };
};

export const initializeHitSource = async (session, referenceSpace) => {
    try {

        if (!session) {
            throw new Error('Failed to initialize the hit source: Missing session.');
        };

        if (!referenceSpace) {
             throw new Error('Failed to initialize the hit source: Missing referenceSpace.');
        };

        const initializedHitTestSource = await session.requestHitTestSource({ space: referenceSpace });
        //console.log('HitTestSource initialized:', initializedHitTestSource);
        return initializedHitTestSource;
    } catch (error) {
        throw new Error(`Failed to initialize the hit source: ${error.message || error}`);
    };
};

export const onXRFrame = (session, referenceSpace, time, frame, hitTestSource, setModelPosition) => {
    if (!referenceSpace) {
        session.requestAnimationFrame((time, frame) => onXRFrame(session, referenceSpace, time, frame));
        return;
    };
    
    const xrPose = frame.getViewerPose(referenceSpace);

    if(xrPose) {
        const pose = xrPose.views[0];
        const transform = pose.transform;
        const cameraPosition = transform.position;
        const cameraRotation = transform.orientation;

        console.log('Camera Position:', cameraPosition);
        console.log('Camera Rotation (Quaternion):', cameraRotation);
    };

    if (hitTestSource) {
        performHitTest(time, frame, referenceSpace, hitTestSource, setModelPosition);
    };

    session.requestAnimationFrame((time, frame) => onXRFrame(session, referenceSpace, time, frame, hitTestSource, setModelPosition));
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