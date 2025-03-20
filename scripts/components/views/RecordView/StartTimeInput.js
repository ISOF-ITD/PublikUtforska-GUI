import React, { useContext, useState } from "react";
import InputMask from "react-input-mask";
import { AudioContext } from "../../../contexts/AudioContext";

function StartTimeInput({ value, onChange }) {
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const inputValue = e.target.value;
    const isValid = /^\d{2}:\d{2}$/.test(inputValue);

    if (isValid || inputValue === "") {
      setError("");
    } else {
      setError("Ogiltigt format. Ange MM:SS.");
    }

    onChange(inputValue);
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData("text");
    const isValid = /^\d{2}:\d{2}$/.test(pastedText);

    if (isValid) {
      e.preventDefault();
      onChange(pastedText);
      setError("");
    } else {
      setError("Ogiltigt format. Ange MM:SS.");
    }
  };

  return (
    <div>
      <InputMask
        mask="99:99"
        maskChar={null}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder="MM:SS"
        className={`border rounded border-gray-30 bg-white p-2 w-32 ${error ? "border-red-500" : ""}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function StartTimeInputWithPlayer({ value, onChange }) {
  // Pull relevant player info out of AudioContext
  const { currentTime, visible, playing } = useContext(AudioContext);

  const handleInsertCurrentTime = () => {
    // If the player is hidden or not actually playing anything,
    // you can bail out or simply disable the button.
    if (!visible) return;

    const seconds = Math.floor((currentTime || 0) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    const formatted = `${String(minutes).padStart(2, "0")}:${String(
      remainder
    ).padStart(2, "0")}`;
    onChange(formatted);
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      {/* Masked MM:SS input */}
      <StartTimeInput value={value} onChange={onChange} />

      <a
      className={`px-4 py-2 rounded text-white ${
                        visible
                          ? "bg-isof hover:bg-darker-isof hover:cursor-pointer"
                          : "bg-gray-400 hover:cursor-not-allowed"
                      }`}
        type="button"
        disabled={!visible}
        onClick={handleInsertCurrentTime}
      >
        Använd aktuell tid
      </a>
    </div>
  );
}
