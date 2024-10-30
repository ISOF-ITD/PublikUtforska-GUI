import React from 'react';

function ContentsElement({ data, expanded, toggle }) {
  if (!data.contents) return null;

  return (
    <div>
      <button onClick={toggle}>{expanded ? 'Hide' : 'Show'} Contents</button>
      {expanded && <div>{data.contents}</div>}
    </div>
  );
}

export default ContentsElement;
