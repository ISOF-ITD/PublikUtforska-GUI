import PropTypes from 'prop-types';
import { useRef } from 'react';
import ModalDialog, { ModalDialogTitle } from '../../components/ModalDialog';

function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  message,
  confirmLabel = 'Ja, stäng utan att spara', // Default label
  cancelLabel = 'Avbryt', // Default label
  variant = 'default', // 'default' or 'delete'
  fallbackFocus = undefined,
}) {
  const cancelButtonRef = useRef(null);

  return (
    <ModalDialog
      open={isOpen}
      onClose={onCancel}
      role="alertdialog"
      initialFocus={cancelButtonRef}
      fallbackFocus={fallbackFocus}
      containerClassName="fixed inset-0 z-[3200] bg-black bg-opacity-50 flex items-center justify-center p-4"
    >
      <div className="bg-surface text-body p-6 rounded-lg shadow-lg max-w-md w-full">
        <ModalDialogTitle as="p" className="mb-4">
          {message}
        </ModalDialogTitle>
        <div className="flex justify-end gap-4 mt-4">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="bg-surface-hover hover:bg-[var(--color-surface-active)] text-body rounded"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={` text-white rounded ${
              variant === 'delete'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary hover:bg-primary-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}

export default ConfirmationModal;

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'delete']),
  fallbackFocus: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
};
