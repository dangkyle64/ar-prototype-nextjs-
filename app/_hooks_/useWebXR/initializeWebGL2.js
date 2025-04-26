export const initializeWebGl2 = (session) => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { xrCompatible: true });

    if (!gl) {
        throw new Error('WebGL context not available.');
    }

    const xrLayer = new XRWebGLLayer(session, gl);
    session.updateRenderState({ baseLayer: xrLayer });

    return { gl, xrLayer };
};