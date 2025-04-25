import { useArSceneState } from '../../_hooks_/useArSceneState';
import { useWebXR } from '../../_hooks_/useWebXR';
import styles from './ArSceneControls.module.css';
import { useState, useEffect } from 'react';

const ArSceneControls = () => {

    const { videoRef, isSessionActive, setSessionNotActive, setSessionActive } = useArSceneState();
    const { session, xrError, handleStartARSession, handleEndARSession } = useWebXR();

    console.log('Initial load', session);

    useEffect(() => {
        handleSessionValidation(session, setSessionNotActive, setSessionActive);
    }, [session]);

    return (
        <div className={styles.container}>
            
            {/* Display WebXR session error, if any */}
            {xrError && <div className={styles.error}>{xrError}</div>}

            <video ref={videoRef} className={styles.video} />

            {/* Display AR session info if it's active */}
            {session && <div className={styles.arStatus}>AR Session Active!</div>}

            
            <div id="overlay">
                <button className={styles.buttonAR} onClick={() => {
                    handleARSession(isSessionActive, setSessionNotActive, setSessionActive, handleEndARSession, handleStartARSession);
                }}>
                    {session ? 'End AR Session' : 'Start AR Session'}
                </button>
            </div>
        </div>
    );
};

export default ArSceneControls;

export const handleARSession = async (isSessionActive, setSessionNotActive, setSessionActive, handleEndARSession, handleStartARSession) => {
    try {
        if (isSessionActive) {
            await handleEndARSession();
            setSessionNotActive();
        } else {
            await handleStartARSession();
            setSessionActive();
        };
    } catch (error) {
        console.error('Error handling AR session:', error);
        throw error;
    };
};

export const handleSessionValidation = (session, setSessionNotActive, setSessionActive) => {
    if (session) {
        setSessionActive();
    } else {
        setSessionNotActive();
    };
};