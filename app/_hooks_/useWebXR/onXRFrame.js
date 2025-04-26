export const onXRFrame = (session, referenceSpace, time, frame, hitTestSource, scene, camera, renderer) => {
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

        const { position, orientation } = xrPose;
        camera.position.set(position.x, position.y, position.z);
        camera.rotation.set(orientation.x, orientation.y, orientation.z);

        //console.log('Camera Position:', cameraPosition);
        //console.log('Camera Rotation (Quaternion):', cameraRotation);

        renderer.render(scene, camera);
    };

    if (hitTestSource) {
        //performHitTest(time, frame, referenceSpace, hitTestSource, setModelPosition);
    };
    
    session.requestAnimationFrame((time, frame) => onXRFrame(session, referenceSpace, time, frame, hitTestSource, setModelPosition));
};