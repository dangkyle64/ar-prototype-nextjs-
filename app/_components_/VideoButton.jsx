'use client';

import styles from './VideoButton.module.css';
import useCamera from '../_hooks_/useCamera';
import { useState, useEffect } from 'react';

import RecordedVideoMenu from './RecordedVideoMenu/RecordedVideoMenu';

const VideoButton = () => {

    const { 
        videoRef, 
        isRecording, 
        videoUrl, 
        error, 
        startVideo, 
        endVideo, 
        startRecording, 
        stopRecording, 
        resetRecording,
        uploadRecording,
    } = useCamera();
    
    const [showRecordedVideoOptions, setShowRecordedVideoOptions] = useState(false);
    const [showVideo, setShowVideo] = useState(true);

    useEffect(() => {
        if (error) {
            console.error(error);
        }
    }, [error]);

    const handleRecordingStart = async () => {
        await startVideo();
        startRecording();
    };

    const handleRecordingEnd = () => {
        endVideo();
        stopRecording();
        setShowRecordedVideoOptions(true);
        setShowVideo(false);
    };

    const handleReset = () => {
        resetRecording();
        setShowRecordedVideoOptions(false);
        setShowVideo(true);
    }

    const handleToggleRecordedVideo = () => {
        setShowRecordedVideoOptions(false);
        setShowVideo(true);
    };

    //upload function to send to backend
    return (
        <>
            {showVideo && (
                <div className={styles.container}>
                    <video ref={videoRef} className={styles.video} autoPlay muted></video>
                    {error && <div className={styles.error}>{error}</div>}
    
                    {!isRecording ? (
                        <button className={styles.buttonRecord} onClick={handleRecordingStart}>Start Recording</button>
                    ) : (
                        <button className={styles.buttonRecordClose} onClick={handleRecordingEnd}>Stop Recording</button>
                    )}    
                </div>
            )}

            {showRecordedVideoOptions && (
                <RecordedVideoMenu
                    videoUrl={videoUrl}
                    handleToggleRecordedVideo={handleToggleRecordedVideo}
                    resetRecording={handleReset}
                    uploadRecording={uploadRecording}
                />
            )}        
        </>
    );
    
};

export default VideoButton;