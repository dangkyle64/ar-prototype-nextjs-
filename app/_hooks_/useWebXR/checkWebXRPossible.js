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