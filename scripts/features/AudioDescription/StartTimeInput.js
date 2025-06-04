import PropTypes from "prop-types";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { InputMask } from "@react-input/mask";
import { AudioContext } from "../../contexts/AudioContext";
import { secondsToMMSS } from "../../utils/timeHelper";

/* ----------  helpers  ---------- */
const mmssToSeconds = (str) => {
  const [m, s] = str.split(":").map(Number);
  return m * 60 + s;
};

/* ----------  component  ---------- */
function StartTimeInput({ value, onChange, maxSeconds }) {
  const [error, setError] = useState("");

  const validate = (raw) => {
    if (raw === "") {
      setError("");
      return true;
    }

    if (!/^\d{2}:\d{2}$/.test(raw)) {
      setError("Ogiltigt format. Ange MM:SS.");
      return false;
    }

    // seconds must be 00-59
    const seconds = Number(raw.slice(-2));
    if (seconds > 59) {
      setError("Sekunder måste vara 00-59.");
      return false;
    }

    if (maxSeconds !== undefined && mmssToSeconds(raw) > maxSeconds) {
      setError(
        `Tiden får inte överstiga inspelningens längd (${secondsToMMSS(
          maxSeconds
        )}).`
      );
      return false;
    }

    setError("");
    return true;
  };

  /* run the validator when the parent changes `value` or `maxSeconds` */
  useEffect(() => {
    validate(value);
  }, [value, maxSeconds]);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v); // always let the parent keep what the user sees
    validate(v);
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (validate(text)) {
      e.preventDefault();
      onChange(text);
    }
  };

  return (
    <div>
      <InputMask
        mask="99:99"
        value={value}
        replacement={{ 9: /\d/ }} // only digits in the slots
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder="MM:SS"
        className={`border rounded border-gray-30 bg-white p-2 w-32 ${
          error ? "border-red-500" : ""
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

StartTimeInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  /** Recording length (in seconds).  If omitted, no upper-limit check is applied. */
  maxSeconds: PropTypes.number,
};

export default function StartTimeInputWithPlayer({ value, onChange }) {
  const { currentTime, visible, durationTime } = useContext(AudioContext);

  /* handler memoisation */
  const handleChange = useCallback((v) => onChange(v), [onChange]);

  const handleInsertCurrentTime = useCallback(() => {
    if (!visible) return;
    const secs = Math.floor((currentTime || 0) / 1000);
    const mm = String(Math.floor(secs / 60)).padStart(2, "0");
    const ss = String(secs % 60).padStart(2, "0");
    onChange(`${mm}:${ss}`);
  }, [currentTime, visible, onChange]);

  return (
    <div className="flex items-center gap-2 mt-2">
      <StartTimeInput
        value={value}
        onChange={handleChange}
        /* enforce upper limit once metadata has loaded */
        maxSeconds={
          durationTime > 0 ? Math.floor(durationTime / 1000) : undefined
        }
      />

      <a
        className={`px-4 py-2 rounded text-white ${
          visible
            ? "bg-isof hover:bg-darker-isof hover:cursor-pointer"
            : "bg-gray-400 hover:cursor-not-allowed"
        }`}
        type="button"
        title="Kopiera aktuell tid från ljudspelaren"
        disabled={!visible}
        onClick={handleInsertCurrentTime}
      >
        Använd tid från ljudspelaren
      </a>
    </div>
  );
}
