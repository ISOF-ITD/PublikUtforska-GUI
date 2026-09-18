let lastInputWasKeyboard = false;
let subscribers = 0;

const handleKeyDown = () => {
  lastInputWasKeyboard = true;
};

const handlePointerDown = () => {
  lastInputWasKeyboard = false;
};

export function beginInputModalityTracking() {
  if (subscribers === 0) {
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
  }
  subscribers += 1;

  return () => {
    subscribers -= 1;
    if (subscribers === 0) {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
    }
  };
}

export function lastInputWasKeyboardEvent() {
  return lastInputWasKeyboard;
}
