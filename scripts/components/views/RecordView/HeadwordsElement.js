import React from 'react';

function HeadwordsElement({ data, expanded, toggle }) {
  if (!data.headwords) return null;

  return (
    <div>
      <button onClick={toggle}>{expanded ? 'Hide' : 'Show'} Headwords</button>
      {expanded && <div>{data.headwords}</div>}
    </div>
  );
}

export default HeadwordsElement;
