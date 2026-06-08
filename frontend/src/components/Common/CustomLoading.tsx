import { MDBSpinner } from 'mdb-react-ui-kit';

export function CustomLoading() {
  const spinnerStyle = { color: 'rgb(222, 227, 230)' };

  return (
    <div className="d-flex align-items-center justify-content-center gap-2">
      <MDBSpinner grow className="mb-3" style={spinnerStyle}></MDBSpinner>
      <MDBSpinner grow className="mb-3" style={spinnerStyle}></MDBSpinner>
      <MDBSpinner grow className="mb-3" style={spinnerStyle}></MDBSpinner>
      <MDBSpinner grow className="mb-3" style={spinnerStyle}></MDBSpinner>
    </div>
  );
}
