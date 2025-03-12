import React from "react";

const ConfirmationModal = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={onCancel}
            className=" bg-gray-300 hover:bg-gray-400 rounded"
          >
            Avbryt
          </button>
          <button
            onClick={onConfirm}
            className="bg-isof hover:bg-darkerisof text-white rounded"
          >
            Ja, stäng utan att spara
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;