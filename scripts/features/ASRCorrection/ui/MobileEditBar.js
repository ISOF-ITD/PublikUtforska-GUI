import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

export default function MobileEditBar({
  visible,
  disabled,
  onSave,
  onCancel,
  onPrev,
  onNext,
}) {
  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-20 sm:hidden
                      bg-white/95 backdrop-blur border-t shadow-md"
    >
      <div className="flex justify-between items-center p-3 text-lg">
        <button onClick={onPrev} className="px-2" title="↑">
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        <div className="flex gap-6">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded-lg bg-red-100 text-red-700"
          >
            Avbryt
          </button>
          <button
            disabled={disabled}
            onClick={onSave}
            className="px-3 py-1 rounded-lg bg-green-600 text-white disabled:opacity-50"
          >
            Spara
          </button>
        </div>

        <button onClick={onNext} className="px-2" title="↓">
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );
}
