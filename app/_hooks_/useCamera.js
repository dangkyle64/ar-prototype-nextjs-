import { useRef, useState, useEffect } from 'react';

const useCamera = () => {
    const [error, setError] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null);
    const [videoBlob, setVideoBlob] = useState(null);

    const videoRef = useRef(null);
    const stream = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunks = useRef([]);

    const startVideoHandler = async () => {
        await startVideo(stream, setError); 
    };

    const endVideoHandler = () => {
        endVideo(stream, videoRef);
    };

    const startRecordingHandler = () => {
        startRecording(stream, mediaRecorderRef, recordedChunks, setVideoUrl, setIsRecording, setError, setVideoBlob);
    };

    const stopRecordingHandler = () => {
        stopRecording(mediaRecorderRef, setIsRecording)
    };

    const resetRecordingHandler = () => {
        resetRecording(setIsRecording, setVideoUrl, setError);
    };

    const uploadRecordingHandler = () => {
        uploadRecording(videoBlob)
    };

    useEffect(() => {
        if (videoRef.current && stream.current) {
            videoRef.current.srcObject = stream.current;
        }
    }, [stream.current]);

    return { 
        videoRef, 
        isRecording,
        videoUrl,
        error, 
        startVideo: startVideoHandler, 
        endVideo: endVideoHandler,
        startRecording: startRecordingHandler,
        stopRecording: stopRecordingHandler,
        resetRecording: resetRecordingHandler,
        uploadRecording: uploadRecordingHandler,
    };
};

export default useCamera;

export const startVideo = async (stream, setError) => {
    try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        stream.current = mediaStream;
    } catch(error) {
        setError(`Error accessing camera: ${error}`);
    };
};

export const endVideo = async (stream, videoRef) => {
    const tracks = stream.current?.getTracks();
    tracks?.forEach((tracks) => tracks.stop());
    videoRef.current.srcObject = null;
};

export const startRecording = (stream, mediaRecorderRef, recordedChunks, setVideoUrl, setIsRecording, setError, setVideoBlob) => {
    if (!stream.current && stream.current === null) {
        setError('No stream avaliable to record');
        return;
    };

    try {
        //console.log(stream.current);
        const mediaRecorder = new MediaRecorder(stream.current);

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
            recordedChunks.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(blob);
            setVideoUrl(videoUrl);
            setVideoBlob(blob);
            recordedChunks.current = [];
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch(error) {
        setError(`Error starting the recording: ${error}`);
    };
};

export const stopRecording = (mediaRecorderRef, setIsRecording) => {
    try {
        //console.log('Checking mediaRecorderRef:', mediaRecorderRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current !== null) {
            mediaRecorderRef.current.stop();
        };
    } catch(error) {
        console.error("Failed to stop recording", error);
    };
    setIsRecording(false);
};

export const resetRecording = (setIsRecording, setVideoUrl, setError) => {
    setIsRecording(false);
    setVideoUrl(null);
    setError(null);
};

export const uploadRecording = async (videoBlob) => {
    const formData = new FormData();
    
    console.log('This works: ', videoBlob);

    formData.append('video', videoBlob, 'recorded-video.webm');
    
    await fetch('https://ar-prototype-nodejs.onrender.com/api/video-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
    })
    .then(response => response.json())
    .then(data => console.log('Video uploaded: ', data))
    .catch(error => console.error('Error uploading video:', error));
};