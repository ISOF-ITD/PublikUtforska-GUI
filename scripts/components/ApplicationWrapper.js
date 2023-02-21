// create a react component 
import React from 'react';
import { Navigate, useRoutes } from 'react-router-dom'
import Application from './Application';

export default function ApplicationWrapper(props) {
    let element = useRoutes([
        {
            path: '/',
            element: <Navigate to="/places/recordtype/one_accession_row/has_media/true" />
        },
        {
            path: '/places',
            element: <Navigate to="/places/recordtype/one_accession_row/has_media/true" />
        },
        {
            path: ['/places/:place_id([0-9]+)?', '/records/:record_id', '/person/:person_id'],
            element: <Application />
        }
    ]);
    return element;
}