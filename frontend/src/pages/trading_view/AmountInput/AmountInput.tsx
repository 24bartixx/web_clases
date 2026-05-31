import { MDBInput, MDBTypography, MDBRow, MDBCol } from 'mdb-react-ui-kit';
import { InputHTMLAttributes } from 'react';

export interface AmountInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  label?: string;
  iconSrc?: string;
}

export const AmountInput = ({
  label = '',
  iconSrc,
  ...rest
}: AmountInputProps) => {
  return (
    <div
      className="rounded-3 p-3"
      style={{
        backgroundColor: 'var(--bs-input-bg)',
      }}
    >
      <div className="d-flex flex-column gap-2">
        <MDBTypography
          tag="p"
          className="m-0 lh-1 opacity-50"
          style={{ fontSize: '16px' }}
        >
          {label}
        </MDBTypography>
        <MDBRow
          className="align-items-center g-2 flex-nowrap"
          style={{ width: '100%' }}
        >
          {iconSrc && (
            <MDBCol size="auto" className="d-flex align-items-center">
              <img
                src={iconSrc}
                style={{ width: '20px', height: '20px', display: 'block' }}
                alt="icon"
              />
            </MDBCol>
          )}
          <MDBCol className="flex-grow-1">
            <input
              {...rest}
              type="number"
              style={{
                border: 'none',
                boxShadow: 'none',
                outline: 'none',
                fontSize: '20px',
                backgroundColor: 'transparent', 
                color: 'var(--bs-white)',
                width: '100%',
                display: 'inline-block',
                padding: 0,
                margin: 0,
              }}
            />
          </MDBCol>
        </MDBRow>
      </div>
    </div>
  );
};
