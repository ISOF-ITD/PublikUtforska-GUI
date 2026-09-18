import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Description,
} from '@headlessui/react';
import PropTypes from 'prop-types';
import {
  useCallback, useEffect, useRef,
} from 'react';
import {
  beginInputModalityTracking,
  lastInputWasKeyboardEvent,
} from '../utils/inputModality';

export function ModalDialogTitle({
  as = 'h2',
  children,
  className = undefined,
  id = undefined,
  tabIndex = undefined,
  titleRef = undefined,
}) {
  return (
    <DialogTitle
      as={as}
      className={className}
      id={id}
      tabIndex={tabIndex}
      ref={titleRef}
    >
      {children}
    </DialogTitle>
  );
}

ModalDialogTitle.propTypes = {
  as: PropTypes.elementType,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  id: PropTypes.string,
  tabIndex: PropTypes.number,
  titleRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
};

export function ModalDialogDescription({
  as = 'p',
  children,
  className = undefined,
}) {
  return (
    <Description as={as} className={className}>
      {children}
    </Description>
  );
}

ModalDialogDescription.propTypes = {
  as: PropTypes.elementType,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default function ModalDialog({
  open,
  onClose,
  role = 'dialog',
  initialFocus = undefined,
  initialFocusIndicatorClassName = 'modal-initial-focus-visible',
  fallbackFocus = undefined,
  closeOnBackdrop = false,
  containerClassName,
  children,
}) {
  const wasOpenRef = useRef(open);
  const fallbackFocusRef = useRef(fallbackFocus);
  fallbackFocusRef.current = fallbackFocus;

  useEffect(beginInputModalityTracking, []);

  useEffect(() => {
    if (!open || !lastInputWasKeyboardEvent()) {
      return undefined;
    }

    const focusClasses = initialFocusIndicatorClassName.split(/\s+/).filter(Boolean);
    const removeFocusClasses = () => {
      initialFocus?.current?.classList.remove(...focusClasses);
    };
    const animationFrameId = window.requestAnimationFrame(() => {
      initialFocus?.current?.classList.add(...focusClasses);
    });
    document.addEventListener('pointerdown', removeFocusClasses, { capture: true, once: true });
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      document.removeEventListener('pointerdown', removeFocusClasses, true);
      removeFocusClasses();
    };
  }, [initialFocus, initialFocusIndicatorClassName, open]);

  const restoreFallbackFocus = useCallback(() => {
    const animationFrameId = window.requestAnimationFrame(() => {
      const fallback = fallbackFocusRef.current?.current;
      const { activeElement } = document;
      if (
        fallback?.isConnected
        && (!activeElement || activeElement === document.body)
      ) {
        fallback.focus();
      }
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;
    if (!wasOpen || open) return undefined;

    return restoreFallbackFocus();
  }, [open, restoreFallbackFocus]);

  useEffect(() => () => {
    if (wasOpenRef.current) restoreFallbackFocus();
  }, [restoreFallbackFocus]);

  const handleBackdropMouseDown = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      role={role}
      initialFocus={initialFocus}
    >
      <DialogPanel
        className={containerClassName}
        onMouseDown={handleBackdropMouseDown}
        data-modal-dialog-container=""
      >
        {children}
      </DialogPanel>
    </Dialog>
  );
}

ModalDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  role: PropTypes.oneOf(['dialog', 'alertdialog']),
  initialFocus: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  initialFocusIndicatorClassName: PropTypes.string,
  fallbackFocus: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  closeOnBackdrop: PropTypes.bool,
  containerClassName: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
