

export const initializeWebGl2 = (session) => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { xrCompatible: true });

    if (!gl) {
        throw new Error('WebGL context not available.');
    }

    const xrLayer = new XRWebGLLayer(session, gl);
    session.updateRenderState({ baseLayer: xrLayer });

    // Attach Three.js renderer to the WebGL context
    renderer = new THREE.WebGLRenderer({ canvas, context: gl });
    renderer.autoClear = false;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    // Set renderer to use session
    renderer.xr.setSession(session);

    // Create a default scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    return xrLayer;
};