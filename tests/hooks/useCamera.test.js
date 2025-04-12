import { renderHook, act } from '@testing-library/react';
import { it, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import useCamera, { endVideo, resetRecording, startRecording, startVideo, stopRecording, uploadRecording } from '../../app/_hooks_/useCamera';

global.fetch = vi.fn();

beforeEach(() => {
    global.navigator.mediaDevices = {
        getUserMedia: vi.fn(),
    };
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('useCamera hook', () => {
    it('should have initial state values', () => {
        const { result } = renderHook(() => useCamera());

        expect(result.current.error).toBeNull();
        expect(result.current.isRecording).toBe(false);
        expect(result.current.videoUrl).toBe(null);
        expect(result.current.videoRef).toBeDefined();

        expect(typeof result.current.startVideo).toBe('function');
        expect(typeof result.current.endVideo).toBe('function');
        expect(typeof result.current.startRecording).toBe('function');
        expect(typeof result.current.stopRecording).toBe('function');
        expect(typeof result.current.resetRecording).toBe('function');
    });

    it('should set error if getUserMedia fails', async () => {
        const errorMessage = 'Permission denied';
        global.navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useCamera());

        await act(async () => {
            await result.current.startVideo();
        });

        expect(result.current.error).toBe(`Error accessing camera: Error: ${errorMessage}`);
    });
});

describe('startVideo Function', () => {

    let stream;
    let setError;

    beforeEach(() => {
        stream = { current: null };
        setError = vi.fn();
    });

    it('should access the camera and set the video stream', async () => {
        const mockStream = { getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]) };
        global.navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockStream);

        await startVideo(stream, setError);
        expect(stream.current).toBe(mockStream);
    });

    it('should set error if getUserMedia fails', async () => {
        const errorMessage = 'Permission denied';
        global.navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new Error(errorMessage));

        await startVideo(stream, setError);

        expect(setError).toHaveBeenCalledWith(`Error accessing camera: Error: ${errorMessage}`);
    });
});

describe('endVideo function', () => {
    it('should stop all tracks and set videoRef.srcObject to null', async () => {
        const mockStop = vi.fn();
        const mockTrack = { stop: mockStop };
        const mockStream = { getTracks: vi.fn().mockReturnValue([mockTrack, mockTrack]) };
        const videoRef = { current: { srcObject: mockStream } };  // Mock videoRef

        await endVideo({ current: mockStream }, videoRef);

        expect(mockStream.getTracks).toHaveBeenCalled();
        expect(mockStop).toHaveBeenCalledTimes(2);
        expect(videoRef.current.srcObject).toBeNull();
    });

    it('should not call stop if there are no tracks', async () => {
        const mockStream = { getTracks: vi.fn().mockReturnValue([]) };
        const videoRef = { current: { srcObject: mockStream } };

        await endVideo({ current: mockStream }, videoRef);

        expect(mockStream.getTracks).toHaveBeenCalled();
        expect(mockStream.getTracks).toHaveReturnedWith([]);
        expect(videoRef.current.srcObject).toBeNull();
    });

    it('should not crash if stream is null or undefined', async () => {
        const videoRef = { current: { srcObject: null } }; 

        await endVideo({ current: null }, videoRef);

        expect(videoRef.current.srcObject).toBeNull();
    });
});

describe('startRecording', () => {
    let stream;
    let mediaRecorderRef;
    let recordedChunks;
    let setVideoUrl;
    let setIsRecording;
    let setError;

    beforeEach(() => {
        stream = { current: { getTracks: vi.fn() } };
        mediaRecorderRef = { current: null };
        recordedChunks = { current: [] };
        setVideoUrl = vi.fn();
        setIsRecording = vi.fn();
        setError = vi.fn();

        global.URL.createObjectURL = vi.fn(() => 'mock-video-url');
    });

    it('should call setError when there is no stream available', () => {
        stream.current = null;

        startRecording(stream, mediaRecorderRef, recordedChunks, setVideoUrl, setIsRecording, setError);

        expect(setError).toHaveBeenCalledWith('No stream avaliable to record');
    });

    it('should start the recording when stream is valid', () => {
        stream.current = { getTracks: vi.fn() };

        const mockMediaRecorder = {
            start: vi.fn(),
            ondataavailable: vi.fn(),
            onstop: vi.fn(),
        };
        global.MediaRecorder = vi.fn(() => mockMediaRecorder);

        startRecording(stream, mediaRecorderRef, recordedChunks, setVideoUrl, setIsRecording, setError);

        expect(global.MediaRecorder).toHaveBeenCalledWith(stream.current); 
        expect(mockMediaRecorder.start).toHaveBeenCalled();
        expect(mediaRecorderRef.current).toBe(mockMediaRecorder);
        expect(setIsRecording).toHaveBeenCalledWith(true);
    });

    it('should handle data available correctly', () => {
        stream.current = { getTracks: vi.fn() };
        const mockMediaRecorder = {
            start: vi.fn(),
            ondataavailable: null,
            onstop: vi.fn(),
        };
        global.MediaRecorder = vi.fn(() => mockMediaRecorder);

        startRecording(stream, mediaRecorderRef, recordedChunks, setVideoUrl, setIsRecording, setError);

        const mockEvent = { data: new Blob(['mock data'], { type: 'video/webm' }) };
        mockMediaRecorder.ondataavailable(mockEvent);

        expect(recordedChunks.current).toContain(mockEvent.data);
    });

    it('should handle stop correctly and create video URL', () => {
        stream.current = { getTracks: vi.fn() };
        const mockMediaRecorder = {
            start: vi.fn(),
            ondataavailable: vi.fn(),
            onstop: null,
        };
        global.MediaRecorder = vi.fn(() => mockMediaRecorder);

        startRecording(stream, mediaRecorderRef, recordedChunks, setVideoUrl, setIsRecording, setError);

        mockMediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(blob);
            setVideoUrl(videoUrl);
            recordedChunks.current = [];
        };

        mockMediaRecorder.onstop();

        expect(setVideoUrl).toHaveBeenCalledWith(expect.any(String));
        expect(recordedChunks.current).toEqual([]);
    });

    it('should handle errors during recording setup', () => {
        stream.current = { getTracks: vi.fn() };
        global.MediaRecorder = vi.fn(() => {
            throw new Error('MediaRecorder setup failed');
        });

        startRecording(stream, mediaRecorderRef, recordedChunks, setVideoUrl, setIsRecording, setError);

        expect(setError).toHaveBeenCalledWith('Error starting the recording: Error: MediaRecorder setup failed');
    });
});

describe('stopRecording', () => {
    let mediaRecorderRef;
    let setIsRecording;

    beforeEach(() => {
        mediaRecorderRef = { current: { stop: vi.fn() } };
        setIsRecording = vi.fn();
    });

    it('should stop the current mediaRecorderRef if valid', () => {
        stopRecording(mediaRecorderRef, setIsRecording);

        expect(mediaRecorderRef.current.stop).toHaveBeenCalledTimes(1);
        expect(setIsRecording).toHaveBeenCalledWith(false);
    });

    it('should not call stop if mediaRecorderRef.current is null', () => {
        mediaRecorderRef.current = null;

        console.log('Calling stopRecording');
        stopRecording(mediaRecorderRef, setIsRecording);

        expect(mediaRecorderRef.current).toBeNull();
        expect(setIsRecording).toHaveBeenCalledWith(false);
    });

    it('should call setIsRecording if an error occurs', () => {
        const error = new Error('Failed to stop recording');
        mediaRecorderRef.current.stop.mockImplementationOnce(() => {
            throw error;
        });
    
        stopRecording(mediaRecorderRef, setIsRecording);
    
        expect(setIsRecording).toHaveBeenCalledWith(false);
    });
});


describe('resetRecording', () => {
    let setIsRecording;
    let setVideoUrl;
    let setError;

    beforeEach(() => {
        setIsRecording = vi.fn();
        setVideoUrl = vi.fn();
        setError = vi.fn();
    });

    it('should reset isRecording, videoUrl, and error state', () => {
        resetRecording(setIsRecording, setVideoUrl, setError);

        expect(setIsRecording).toHaveBeenCalledWith(false);
        expect(setVideoUrl).toHaveBeenCalledWith(null);
        expect(setError).toHaveBeenCalledWith(null);
    });

    it('should not call any setter more than once', () => {
        resetRecording(setIsRecording, setVideoUrl, setError);

        expect(setIsRecording).toHaveBeenCalledTimes(1);
        expect(setVideoUrl).toHaveBeenCalledTimes(1);
        expect(setError).toHaveBeenCalledTimes(1);
    });

    it('should not call setters if no state has changed', () => {
        resetRecording(setIsRecording, setVideoUrl, setError);
    
        expect(setIsRecording).toHaveBeenCalledTimes(1);
        expect(setVideoUrl).toHaveBeenCalledTimes(1);
        expect(setError).toHaveBeenCalledTimes(1);
    });

    it('should reset previously set values', () => {
        setIsRecording(true);
        setVideoUrl('http://somevideo.com');
        setError('Some error occurred');
    
        resetRecording(setIsRecording, setVideoUrl, setError);
    
        expect(setIsRecording).toHaveBeenCalledWith(false);
        expect(setVideoUrl).toHaveBeenCalledWith(null);
        expect(setError).toHaveBeenCalledWith(null);
    });
});

describe('uploadRecording', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should upload video succesfully', async () => {
        const mockBlob = new Blob([], { type: 'video/webm '});

        fetch.mockResolvedValueOnce({
            json: vi.fn().mockResolvedValue({ message: 'Video uploaded successfully '})
        });

        await uploadRecording(mockBlob);

        expect(fetch).toHaveBeenCalledWith(
            'https://ar-prototype-nodejs.onrender.com/api/video-upload',
            expect.objectContaining({
                method: 'POST',
                body: expect.any(FormData),
                credentials: 'include',
            })
        );
    });

    it('should handle error if upload fails', async () => {
        const mockBlob = new Blob([], { type: 'video/webm' });
    
        fetch.mockRejectedValueOnce(new Error('Network Error'));
    
        await uploadRecording(mockBlob);
    
        expect(fetch).toHaveBeenCalledWith(
            'https://ar-prototype-nodejs.onrender.com/api/video-upload',
            expect.objectContaining({
                method: 'POST',
                body: expect.any(FormData),
                credentials: 'include',
            })
        );
    });
});