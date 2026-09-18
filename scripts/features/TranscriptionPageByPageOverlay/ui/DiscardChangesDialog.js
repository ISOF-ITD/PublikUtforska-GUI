import PropTypes from 'prop-types';
import { useRef } from 'react';
import ModalDialog, {
  ModalDialogDescription,
  ModalDialogTitle,
} from '../../../components/ModalDialog';
import { l } from '../../../lang/Lang';

export default function DiscardChangesDialog({ open, onCancel, onConfirm }) {
  const cancelButtonRef = useRef(null);

  return (
    <ModalDialog
      open={open}
      onClose={onCancel}
      role="alertdialog"
      initialFocus={cancelButtonRef}
      closeOnBackdrop
      containerClassName="fixed inset-0 z-[3200] flex items-center justify-center bg-[var(--color-overlay-strong)] p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-body shadow-xl">
        <ModalDialogTitle className="text-lg font-semibold">
          {l('Lämna utan att spara?')}
        </ModalDialogTitle>
        <ModalDialogDescription className="mt-3 text-sm text-muted">
          {l('Det finns osparade ändringar. Är du säker på att du vill lämna sidan?')}
        </ModalDialogDescription>
        <div className="mt-5 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {l('Avbryt')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="button button-primary rounded-lg px-4 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {l('Lämna sidan')}
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}

DiscardChangesDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
