import { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

type ConfirmDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

// Delete confirmation shown over the About screen (DESIGN 1.3); not a third screen.
export default function ConfirmDialog({ onCancel, onConfirm }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="confirm__scrim">
      <div
        className="confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-text"
      >
        <h2 id="confirm-title" className="confirm__title">
          למחוק את ההיסטוריה?
        </h2>
        <p id="confirm-text" className="confirm__text">
          פעולה זו תמחק את כל התוצאות השמורות במכשיר.
        </p>
        <div className="confirm__actions">
          <button type="button" ref={cancelRef} className="confirm__btn confirm__btn--cancel" onClick={onCancel}>
            ביטול
          </button>
          <button type="button" className="confirm__btn confirm__btn--delete" onClick={onConfirm}>
            מחק
          </button>
        </div>
      </div>
    </div>
  );
}
