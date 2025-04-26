export const initializeReferenceSpace = async (session) => {
    try {
        if (!session) {
            throw new Error('Failed to request reference space: Missing session.');
        };
        
        const referenceSpace = await session.requestReferenceSpace('viewer');
        return referenceSpace;
    } catch(error) {
        throw new Error(`Failed to request reference space: ${error.message || error}`);
    };
};