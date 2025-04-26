export const initializeHitSource = async (session, referenceSpace) => {
    try {

        if (!session) {
            throw new Error('Failed to initialize the hit source: Missing session.');
        };

        if (!referenceSpace) {
             throw new Error('Failed to initialize the hit source: Missing referenceSpace.');
        };

        const initializedHitTestSource = await session.requestHitTestSource({ space: referenceSpace });
        //console.log('HitTestSource initialized:', initializedHitTestSource);
        return initializedHitTestSource;
    } catch (error) {
        throw new Error(`Failed to initialize the hit source: ${error.message || error}`);
    };
};