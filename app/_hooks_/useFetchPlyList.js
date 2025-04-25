import { useState, useEffect } from 'react';

const useFetchPlyList = (endpoint) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchPlyList = async () => {
            try {
                const response = await fetch(endpoint);

                console.log(response.body);

                if (!response.ok) {
                    console.error('Fetch failed with status:', response.status);
                    const errorText = await response.text();
                    console.error('Error details:', errorText);
                    throw new Error('Failed to fetch ply files from the S3 bucket');
                };

                const plyData = await response.json();
                setData(plyData);

                console.log(plyData);
            } catch(error) {
                console.error('Error:', error);
            };
        };

        fetchPlyList();
    }, []);

    return { data };
};

export default useFetchPlyList;