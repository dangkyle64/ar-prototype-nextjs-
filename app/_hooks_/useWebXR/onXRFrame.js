export const onXRFrame = (session, referenceSpace, time, frame, hitTestSource, scene, camera, renderer, sphere) => {
    if (!referenceSpace) {
        session.requestAnimationFrame((time, frame) => onXRFrame(session, referenceSpace, time, frame, hitTestSource, scene, camera, renderer, sphere));
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
        camera.quaternion.set(cameraRotation.x, cameraRotation.y, cameraRotation.z, cameraRotation.w);

        // Place the sphere 2 meters in front of the camera
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        forward.multiplyScalar(2);
        sphere.position.copy(camera.position.clone().add(forward));
        //sphere.position.set(camera.position.x + 1, camera.position.y, camera.position.z + 2);

        console.log('Camera Position:', camera.position);
        console.log('Sphere Position:', sphere.position);
        //console.log('Camera Position:', cameraPosition);
        //console.log('Camera Rotation (Quaternion):', cameraRotation);

        renderer.render(scene, camera);
    } else {
        console.error("xrPose or its views are undefined");
    };
    
    session.requestAnimationFrame((time, frame) => onXRFrame(session, referenceSpace, time, frame, hitTestSource, scene, camera, renderer, sphere));
};