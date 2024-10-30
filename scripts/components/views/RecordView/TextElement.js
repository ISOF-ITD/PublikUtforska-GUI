import TranscribeButton from "../transcribe/TranscribeButton";

function TextElement({ data, highlight }) {
  const isReadyToTranscribe = data.transcriptionstatus === 'readytotranscribe';
  const hasMedia = data.media.length > 0;

  if (isReadyToTranscribe && hasMedia) {
    return (
      <>
      <div>
        <p><strong>{data.transcriptiontype === 'sida' ? `Sida med media` : `Uppteckning`}</strong></p>
        <TranscribeButton recordId={data.id} />
      </div>
      </>
    );
  }

  return (
    <div>
      {highlight ? <span style={{ backgroundColor: 'yellow' }}>{data.text}</span> : <p>{data.text}</p>}
    </div>
  );
}

export default TextElement;
