import React from 'react';
import { MDBBtn } from 'mdb-react-ui-kit';
import { useGame } from '../../contexts/GameContext';

export function PortfolioPage() {
  return (
    <>
      <MDBBtn rounded>Primary</MDBBtn>
      <MDBBtn rounded className="mx-2" color="secondary">
        Secondary
      </MDBBtn>
      <MDBBtn rounded color="success">
        Success
      </MDBBtn>
      <MDBBtn rounded className="mx-2" color="danger">
        Danger
      </MDBBtn>
      <MDBBtn rounded color="warning">
        Warning
      </MDBBtn>
      <MDBBtn rounded className="mx-2" color="info">
        Info
      </MDBBtn>
      <MDBBtn rounded className="text-dark" color="light">
        Light
      </MDBBtn>
      <MDBBtn rounded className="mx-2" color="dark">
        Dark
      </MDBBtn>
      <MDBBtn rounded color="link">
        Link
      </MDBBtn>
    </>
  );
}
