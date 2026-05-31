import {
  MDBBtn,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
} from 'mdb-react-ui-kit';

export interface InfoModalProps {
  title?: string;
  bodyText?: string;
  btnText?: string;
  onConfirm?: () => void;
  open: boolean;
  onClose?: () => void;
}

export const InfoModal = ({
  title,
  bodyText,
  btnText,
  onConfirm,
  open,
  onClose,
  ...rest
}: InfoModalProps) => {
  return (
    <MDBModal open={open} onClose={onClose} tabIndex="-1" {...rest}>
      <MDBModalDialog centered>
        <MDBModalContent>
          <MDBModalHeader>
            {title && <MDBModalTitle>{title}</MDBModalTitle>}
            {onClose && (
              <MDBBtn
                className="btn-close"
                color="none"
                onClick={onClose}
              ></MDBBtn>
            )}
          </MDBModalHeader>
          {bodyText && <MDBModalBody>{bodyText}</MDBModalBody>}

          <MDBModalFooter>
            {btnText && (
              <MDBBtn
                color="primary"
                onClick={() => {
                  onConfirm && onConfirm();
                  onClose && onClose();
                }}
              >
                {btnText}
              </MDBBtn>
            )}
          </MDBModalFooter>
        </MDBModalContent>
      </MDBModalDialog>
    </MDBModal>
  );
};
