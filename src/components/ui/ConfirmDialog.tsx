'use client';

import { useId } from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  /** Text for the confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Text for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Visual style for the confirm button */
  variant?: 'danger' | 'primary';
  /** Disable the confirm button (e.g. while processing) */
  isLoading?: boolean;
}

const VARIANT_CLASSES = {
  primary: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500 text-white',
  danger: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white',
};

/**
 * A confirmation dialog built on top of Modal.
 * Use for destructive or irreversible actions that
 * need explicit user acknowledgement.
 *
 * Passes descriptionId to Modal so screen readers announce
 * both the title and the confirmation message.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
}: ConfirmDialogProps) {
  const descId = useId();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm" descriptionId={descId}>
      <p id={descId} className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
          }}
          disabled={isLoading}
          className={`px-4 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${VARIANT_CLASSES[variant]}`}
        >
          {isLoading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
