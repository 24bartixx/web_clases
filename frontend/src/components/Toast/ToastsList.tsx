import React from 'react';
import ToastItem, { type ToastItemData } from './ToastItem';

export default function ToastsList({
  toasts,
  onClose,
}: {
  toasts: ToastItemData[];
  onClose: (id: string) => void;
}) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="gap-2 position-fixed d-flex flex-column"
      style={{
        top: 12,
        right: 12,
        zIndex: 9999,
        width: 'min(360px, calc(100vw - 24px))',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
