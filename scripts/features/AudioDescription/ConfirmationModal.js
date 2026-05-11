import React from "react";
import PropTypes from "prop-types";

const ConfirmationModal = ({
  isOpen,
  onConfirm,
  onCancel,
  message,
  confirmLabel = "Ja, stäng utan att spara", // Default label
  cancelLabel = "Avbryt", // Default label
  variant = "default", // 'default' or 'delete'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-surface text-body p-6 rounded-lg shadow-lg max-w-md w-full">
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={onCancel}
            className="bg-surface-hover hover:bg-[var(--color-surface-active)] text-body rounded"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={` text-white rounded ${
              variant === "delete"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary hover:bg-primary-hover"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  variant: PropTypes.oneOf(["default", "delete"]),
};
