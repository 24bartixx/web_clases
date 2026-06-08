import { useEffect } from 'react';
import { MDBBtn, MDBCard, MDBCardBody, MDBTypography } from 'mdb-react-ui-kit';

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastPayload = {
  title: string;
  message: string;
  variant: ToastVariant;
};

export type ToastItemData = ToastPayload & {
  id: string;
};

export default function ToastItem({
  toast,
  onClose,
}: {
  toast: ToastItemData;
  onClose: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <MDBCard 
      className="text-white border-0 shadow-3 rounded-4"
      style={{ backgroundColor: { success: '#2e7d32', error: '#d32f2f', info: '#0288d1' }[toast.variant] }}
    >
      <MDBCardBody className="gap-3 p-3 d-flex align-items-start">
        <div className="flex-grow-1">
          <MDBTypography tag="h6" className="mb-1 text-white fw-bold">
            {toast.title}
          </MDBTypography>
          <MDBTypography tag="p" className="mb-0 text-white-50 small">
            {toast.message}
          </MDBTypography>
        </div>

        <MDBBtn
          size="sm"
          color="light"
          outline
          className="flex-shrink-0 ms-auto"
          onClick={() => onClose(toast.id)}
        >
          ×
        </MDBBtn>
      </MDBCardBody>
    </MDBCard>
  );
}
