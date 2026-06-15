import { MDBRow, MDBCol } from 'mdb-react-ui-kit';
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
        <span 
          className="m-0 text-xs font-medium text-white/40 uppercase tracking-wider leading-none"
        >
          {label}
        </span>
        
        <MDBRow
          className="align-items-center g-2 flex-nowrap"
          style={{ width: '100%' }}
        >
          {iconSrc && (
            <MDBCol size="auto" className="d-flex align-items-center">
              <img
                src={iconSrc}
                style={{ width: '18px', height: '18px', display: 'block', opacity: 0.7 }}
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