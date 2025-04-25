import { useState, useRef } from 'react';

export const useArSceneState = () => {
    const [isCameraStarted, setIsCameraStarted] = useState(false);
    const [session, setSession] = useState(null);
    const [referenceSpace, setReferenceSpace] = useState(null);
    const [hitTestSource, setHitTestSource] = useState(null);
    const [isSessionActive, setIsSessionActive] = useState(false);

    const videoRef = useRef(null);

    const startRoomCamera = () => {
        setIsCameraStarted(true);
    };

    const stopRoomCamera = () => {
        setIsCameraStarted(false);
    };

    const setSessionState = (session) => {
        setSession(session);
    };

    const setReferenceSpaceState = (referenceSpace) => {
        setReferenceSpace(referenceSpace);
    };

    const setHitTestSourceState = (hitTestSource) => {
        setHitTestSource(hitTestSource);
    };

    const setSessionNotActive = () => {
        setIsSessionActive(false);
    };

    const setSessionActive = () => {
        setIsSessionActive(true);
    };

    return {
        isCameraStarted,
        videoRef,
        session,
        referenceSpace,
        hitTestSource,
        isSessionActive,
        startRoomCamera,
        stopRoomCamera,
        setSessionState,
        setReferenceSpaceState,
        setHitTestSourceState,
        setSessionNotActive,
        setSessionActive,
    };
};