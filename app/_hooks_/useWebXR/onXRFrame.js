export const onXRFrame = (session, referenceSpace, time, frame, hitTestSource, scene, camera, renderer) => {
    if (!referenceSpace) {
        session.requestAnimationFrame((time, frame) => onXRFrame(session, referenceSpace, time, frame, hitTestSource, scene, camera, renderer));
        return;
    };
    
    const xrPose = frame.getViewerPose(referenceSpace);
    //console.log('xrPose:', xrPose);

    if(xrPose && xrPose.views && xrPose.views.length > 0) {
        const pose = xrPose.views[0];
        const transform = pose.transform;
        const cameraPosition = transform.position;
        const cameraRotation = transform.orientation;

        camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        camera.rotation.set(cameraRotation.x, cameraRotation.y, cameraRotation.z);

        //console.log('Camera Position:', cameraPosition);
        //console.log('Camera Rotation (Quaternion):', cameraRotation);

        renderer.render(scene, camera);
    } else {
        console.error("xrPose or its views are undefined");
    };
    
    session.requestAnimationFrame((time, frame) => onXRFrame(session, referenceSpace, time, frame, hitTestSource, scene, camera, renderer));
};