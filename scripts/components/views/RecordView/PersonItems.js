import React from 'react';

function PersonItems({ data, routeParams }) {
  if (!data.persons?.length) return null;

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Year</th>
        </tr>
      </thead>
      <tbody>
        {data.persons.map((person) => (
          <tr key={person.id}>
            <td>{person.name}</td>
            <td>{person.birth_year}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default PersonItems;
