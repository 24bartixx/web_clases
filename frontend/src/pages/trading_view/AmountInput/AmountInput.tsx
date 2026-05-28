import { MDBInput, MDBTypography, MDBRow, MDBCol } from 'mdb-react-ui-kit';
import { InputHTMLAttributes } from 'react';

export interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  iconSrc?: string;
}

export const AmountInput = ({ label = "", iconSrc, ...rest }: AmountInputProps) => {
  return (
    <div
      className="rounded-3 p-3"
      style={{
        backgroundColor: 'var(--bs-input-bg)',
      }}
    >
      <div className="d-flex flex-column gap-2">
        <MDBTypography tag="p" className="m-0 lh-1 opacity-50" style={{ fontSize: '14px' }}>
          {label}
        </MDBTypography>
        <MDBRow className="align-items-center g-2">
          {iconSrc && (
            <MDBCol size="auto">
              <img src={iconSrc} style={{ width: '20px', height: '20px' }} alt="icon" />
            </MDBCol>
          )}
          <MDBCol className="flex-grow-1">
            <MDBInput
              {...rest}
              type="number"
              placeholder="0.00"
              style={{
                border: 'none',
                boxShadow: 'none',
                outline: 'none',
                fontSize: '20px',
                caretColor: 'var(--bs-primary)',
                padding: 0, 
              }}
            />
          </MDBCol>
        </MDBRow>
      </div>
    </div>
  );
};