'use client';

import React from 'react';
import useFetchPlyList from '../../_hooks_/useFetchPlyList.js';

const PlyList = () => {
    const { data } = useFetchPlyList('https://ar-prototype-nodejs.onrender.com/api/ply/');

    if (!data) {
        return <div>Loading...</div>;
    };

    return (
        <div>
        <h1>Ply Files</h1>
        <ul>
            {data.map((ply, index) => (
            <li key={index}>{ply}</li>
            ))}
        </ul>
        </div>
    );
};

export default PlyList;
