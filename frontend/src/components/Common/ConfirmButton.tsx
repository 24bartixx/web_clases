import {
  MDBBtn,
  MDBModal,
  MDBModalBody,
  MDBModalContent,
  MDBModalDialog,
  MDBModalFooter,
  MDBModalHeader,
  MDBModalTitle,
} from 'mdb-react-ui-kit';
import { useState } from 'react';
import type { ComponentProps, CSSProperties, MouseEvent, ReactNode } from 'react';
import './ConfirmButton.scss';

type MDBBtnColor = ComponentProps<typeof MDBBtn>['color'];

type ConfirmButtonProps = {
  action: () => void | Promise<void>;
  text: string;
  children?: ReactNode;
  ariaLabel?: string;
  cancelText?: string;
  className?: string;
  color?: MDBBtnColor;
  confirmText?: string;
  modalTitle?: string;
  stopPropagation?: boolean;
  style?: CSSProperties;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
};

export function ConfirmButton({
  action,
  text,
  children,
  ariaLabel,
  cancelText = 'Cancel',
  className,
  color,
  confirmText = 'Confirm',
  modalTitle = 'Confirm action',
  stopPropagation = false,
  style,
  title,
  type = 'button',
}: ConfirmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }

    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleModalClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handleCloseClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleClose();
  };

  const handleConfirmClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    void action();
    setIsOpen(false);
  };

  return (
    <>
      <MDBBtn
        type={type}
        color={color}
        className={className}
        style={style}
        title={title}
        aria-label={ariaLabel}
        onClick={handleOpen}
      >
        {children ?? text}
      </MDBBtn>

      <MDBModal
        open={isOpen}
        onClick={handleModalClick}
        onClose={handleClose}
        tabIndex="-1"
      >
        <MDBModalDialog centered>
          <MDBModalContent
            className="confirm-modal__content"
            onClick={handleModalClick}
          >
            <MDBModalHeader className="confirm-modal__header">
              <MDBModalTitle className="confirm-modal__title">
                {modalTitle}
              </MDBModalTitle>
              <MDBBtn
                className="btn-close confirm-modal__close"
                color="none"
                onClick={handleCloseClick}
              />
            </MDBModalHeader>
            <MDBModalBody className="confirm-modal__body">
              {text}
            </MDBModalBody>
            <MDBModalFooter className="confirm-modal__footer">
              <MDBBtn
                color="none"
                className="confirm-modal__button confirm-modal__button--secondary"
                onClick={handleCloseClick}
              >
                {cancelText}
              </MDBBtn>
              <MDBBtn
                color="none"
                className="confirm-modal__button confirm-modal__button--danger"
                onClick={handleConfirmClick}
              >
                {confirmText}
              </MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </>
  );
}
