import { useState } from 'react';

export const useErrorState = () => {
    const [xrError, setXRError] = useState(null);

    const populateSetXRError = (error) => {
        setXRError(error);
    };

    return {
        xrError,
        populateSetXRError,
    };
};