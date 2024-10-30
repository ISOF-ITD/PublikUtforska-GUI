import React from 'react';

function PlaceItems({ data, routeParams }) {
  if (!data.places?.length) return null;

  return (
    <table>
      <tbody>
        {data.places.map((place) => (
          <tr key={place.id}>
            <td>{place.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default PlaceItems;
