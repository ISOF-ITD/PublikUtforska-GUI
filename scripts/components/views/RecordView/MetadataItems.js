import React from 'react';

function MetadataItems({ data }) {
  if (!data.metadata?.length) return null;

  return (
    <div>
      {data.metadata.map((item) => (
        <div key={item.type}>
          <strong>{item.type}</strong>: {item.value}
        </div>
      ))}
    </div>
  );
}

export default MetadataItems;
