export const onXRFrame = (session, referenceSpace, time, frame, hitTestSource, scene, camera, renderer) => {
    if (!referenceSpace) {
        session.requestAnimationFrame((time, frame) => onXRFrame(session, referenceSpace, time, frame));
        return;
    };
    
    const xrPose = frame.getViewerPose(referenceSpace);
    console.log('xrPose:', xrPose);

    if(xrPose && xrPose.views && xrPose.views.length > 0) {
        const pose = xrPose.views[0];
        //const transform = pose.transform;
        //const cameraPosition = transform.position;
        //const cameraRotation = transform.orientation;

        const { position = { x: 0, y: 0, z: 0 }, orientation = { x: 0, y: 0, z: 0, w: 1 } } = pose;

        console.log('Pose:', pose);
        console.log('Pose transform: ', pose.transform);
        console.log('Position:', position);
        console.log('Orientation:', orientation);

        camera.position.set(position.x, position.y, position.z);
        camera.rotation.set(orientation.x, orientation.y, orientation.z);

        //console.log('Camera Position:', cameraPosition);
        //console.log('Camera Rotation (Quaternion):', cameraRotation);

        renderer.render(scene, camera);
    } else {
        console.error("xrPose or its views are undefined");
    };
    
    session.requestAnimationFrame((time, frame) => onXRFrame(session, referenceSpace, time, frame, hitTestSource));
};