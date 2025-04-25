import { vi, beforeEach, describe, expect, it } from 'vitest';
import { 
    useWebXR, 
    checkWebXRPossible, 
    onXRFrame, 
    initializeWebGl2, 
    requestReferenceSpace, 
    initializeHitSource, 
    getHitTestResults 
} from '../../app/_hooks_/useWebXR';

describe('useWebXR', () => {
    let populateSetXRErrorMock;

    beforeEach(() => {
        populateSetXRErrorMock = vi.fn();
    });

    it('should return the proper error message if navigator is undefined', async () => {
        global.navigator = undefined;
        await checkWebXRPossible(populateSetXRErrorMock); 
        expect(populateSetXRErrorMock).toHaveBeenCalledWith('Navigator object is undefined.');
    });

    it('should return the proper error message if webXR is not supported', async () => {
        global.navigator = { xr: undefined };
        await checkWebXRPossible(populateSetXRErrorMock);
        expect(populateSetXRErrorMock).toHaveBeenCalledWith('WebXR is not supported on this device.');
    });

    it('should return the proper error message if AR is not supported', async () => {
        global.navigator = { xr: { isSessionSupported: vi.fn().mockResolvedValue(false) } };
        await checkWebXRPossible(populateSetXRErrorMock);
        expect(populateSetXRErrorMock).toHaveBeenCalledWith('AR is not supported on this device.');
    });

    it('should not run the populateSetXRError if everything is valid', async () => {
        global.navigator = { xr: { isSessionSupported: vi.fn().mockResolvedValue(true) } };
        await checkWebXRPossible(populateSetXRErrorMock);
        expect(populateSetXRErrorMock).not.toHaveBeenCalled();
    });
});

describe('onXRFrame', () => {
    let mockSession;
    let mockReferenceSpace;
    let mockFrame;

    beforeEach(() => {
        mockSession = {
            requestAnimationFrame: vi.fn()
        };
        mockReferenceSpace = {};
        mockFrame = {
            getViewerPose: vi.fn()
        };
    });

    it('should request animation frame if referenceSpace is null', () => {
        onXRFrame(mockSession, null, 0, mockFrame);
        expect(mockSession.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should request animation frame if referenceSpace is undefined', () => {
        onXRFrame(mockSession, undefined, 0, mockFrame);
        expect(mockSession.requestAnimationFrame).toHaveBeenCalled();
    });
});

describe('initializeWebGl2', () => {
    let mockSession;
    let xrLayer;

    beforeEach(() => {
        mockSession = {
            updateRenderState: vi.fn(),
        };
        
        const mockWebGLContext = {
            someWebGLProperty: 'test',
          };

        global.document.createElement = vi.fn(() => ({
            getContext: vi.fn(() => mockWebGLContext)
        }));

        global.XRWebGLLayer = vi.fn().mockImplementation(() => ({
            mockLayerProperty: 'mockValue',
        }));
    });

    it('should verify that createElement called to create canvas', () => {
        xrLayer = initializeWebGl2(mockSession);

        expect(global.document.createElement).toHaveBeenCalledWith('canvas');
    });

    it('should verify that XRWebGLLayer was created', () => {
        xrLayer = initializeWebGl2(mockSession);

        expect(global.XRWebGLLayer).toHaveBeenCalledWith(mockSession, {
            "someWebGLProperty": "test",
        });
        expect(xrLayer).toEqual({ mockLayerProperty: 'mockValue' });

        expect(mockSession.updateRenderState).toHaveBeenCalledWith({ baseLayer: xrLayer });
    });

    it('should throw an error if WebGL2 context is not available', () => {
        global.document.createElement = vi.fn(() => ({
          getContext: vi.fn(() => null),
        }));
    
        expect(() => initializeWebGl2(mockSession)).toThrowError('WebGL context not available.');
      });
});

describe('requestReferenceSpace', () => {
    let mockSession;

    beforeEach(() => {
        mockSession = {
            requestReferenceSpace: vi.fn(),
        };
    });

    it('should request a reference space successfully', async () => {
        const mockReferenceSpace = { someReferenceProperty: 'test' };
        mockSession.requestReferenceSpace.mockResolvedValue(mockReferenceSpace);

        const result = await requestReferenceSpace(mockSession);

        expect(mockSession.requestReferenceSpace).toHaveBeenCalledWith('viewer');

        expect(result).toEqual(mockReferenceSpace);
    });

    it('should throw an error if requestReferenceSpace fails', async () => {

        const mockError = new Error('Test error');
        mockSession.requestReferenceSpace.mockRejectedValue(mockError);

        try {
            await requestReferenceSpace(mockSession);
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toContain('Failed to request reference space: ');
            expect(error.message).toContain(mockError.message);
        };
    });

    it('should throw an error if session is missing', async () => {
        await expect(requestReferenceSpace(undefined)).rejects.toThrowError(
            'Failed to request reference space: Missing session.'
        );
    });

    it('should throw a generic error if error has no message', async () => {
        const mockErrorWithoutMessage = new Error();
        mockSession.requestReferenceSpace.mockRejectedValue(mockErrorWithoutMessage);

        await expect(requestReferenceSpace(mockSession)).rejects.toThrowError(
            'Failed to request reference space: Error'
        );
    });
});

describe('initializeHitSource', () => {
    let mockSession;
    let mockReferenceSpace;

    beforeEach(() => {
        mockSession = { requestHitTestSource: vi.fn() };
        mockReferenceSpace = {};
    });

    it('should return an initialized hit source on success', async () => {
        const mockHitSource = { id: 1 };
        mockSession.requestHitTestSource.mockResolvedValue(mockHitSource);

        const result  = await initializeHitSource(mockSession, mockReferenceSpace);

        expect(result).toEqual(mockHitSource);
        expect(mockSession.requestHitTestSource).toHaveBeenCalledWith({ space: mockReferenceSpace });
    });

    it('should throw an error if requestHitTestSource fails', async () => {
        const mockErrorMessage = 'Some error occurred';
        mockSession.requestHitTestSource.mockRejectedValue(new Error(mockErrorMessage)); 

        await expect(initializeHitSource(mockSession, mockReferenceSpace)).rejects.toThrowError(
            `Failed to initialize the hit source: ${mockErrorMessage}`
        );
    });

    it('should handle missing session or referenceSpace parameters', async () => {
        
        await expect(initializeHitSource(undefined, mockReferenceSpace)).rejects.toThrowError(
            'Failed to initialize the hit source: Missing session.'
        );

        await expect(initializeHitSource(mockSession, undefined)).rejects.toThrowError(
            'Failed to initialize the hit source: Missing referenceSpace.'
        );
    });

    it('should throw a generic error message if no message is present in the error object', async () => {
        const mockErrorWithoutMessage = new Error();
        mockSession.requestHitTestSource.mockRejectedValue(mockErrorWithoutMessage);

        await expect(initializeHitSource(mockSession, mockReferenceSpace)).rejects.toThrowError(
            'Failed to initialize the hit source: Error'
        );
    });
});

describe('getHitTestResults', () => {
    let frameMock;
    let hitTestSourceMock;

    beforeEach(() => {
        frameMock = {
            getHitTestResults: vi.fn(),
        };

        hitTestSourceMock = {};
    });

    it('should return hit test results when valid data is returned', () => {
        const mockHitTestResults  = [
            {
                getPose: vi.fn(() => ({
                    transform: {
                        position: { x: 1, y: 2, z: 3 },
                        orientation: { x: 0, y: 0, z: 0, w: 1 },
                    },
                })),
            },
        ];

        frameMock.getHitTestResults.mockReturnValue(mockHitTestResults);

        const result = getHitTestResults(frameMock, hitTestSourceMock);

        expect(result).toEqual(mockHitTestResults);

    });

    it('should return an empty array if no hit test results are found', () => {
        frameMock.getHitTestResults.mockReturnValue([]);
    
        const result = getHitTestResults(frameMock, hitTestSourceMock);
    
        expect(result).toEqual([]);
    });

    it('should throw an error if frame is null', () => {
        expect(() => {
            getHitTestResults(null, hitTestSourceMock);
        }).toThrow('Failed to get hit results: frame is null or undefined');
    });

    it('should throw an error if frame is undefined', () => {
        expect(() => {
            getHitTestResults(undefined, hitTestSourceMock);
        }).toThrow('Failed to get hit results: frame is null or undefined');
    });

    it('should throw an error if hitTestSource is null', () => {
        expect(() => {
            getHitTestResults(frameMock, null);
        }).toThrow('Failed to get hit results: hitTestSource is null or undefined');
    });
    
      it('should throw an error if hitTestSource is undefined', () => {
        expect(() => {
            getHitTestResults(frameMock, undefined);
        }).toThrow('Failed to get hit results: hitTestSource is null or undefined');
    });

    it('should handle error in getHitTestResults method gracefully', () => {
        frameMock.getHitTestResults.mockImplementation(() => {
            throw new Error('Some internal error');
        });
    
        expect(() => {
            getHitTestResults(frameMock, hitTestSourceMock);
        }).toThrow('Failed to get hit test results: Some internal error');
    });

    it('should return an empty array if no hit test results are found', () => {
        frameMock.getHitTestResults.mockReturnValue([]);
    
        const result = getHitTestResults(frameMock, hitTestSourceMock);
    
        expect(result).toEqual([]);
    });
});

