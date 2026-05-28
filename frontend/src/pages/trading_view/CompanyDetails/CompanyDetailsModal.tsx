import React from 'react';
import {
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalBody,
  MDBRow,
  MDBCol,
  MDBTypography,
  MDBIcon,
} from 'mdb-react-ui-kit';

export type CompanyDetails = {
  name: string;
  ticker: string;
  sector: string | null;
  industry: string | null;
  description: string | null;
  country: string | null;
  website: string | null;
  currency: string | null;
  sharesOutstanding: number | null;
  floatShares: number | null;
  price: number;
  change: number;
  changePercent: number;
};

export interface CompanyDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyDetails;
}

export const CompanyDetailsModal = ({
  isOpen,
  onClose,
  company,
}: CompanyDetailsProps) => {
  return (
    <MDBModal open={isOpen} onClose={onClose} tabIndex="-1">
      <MDBModalDialog size="lg">
        <MDBModalContent className="shadow-sm">
          <MDBModalHeader>
            <MDBRow className="w-100 align-items-center justify-content-between">
              <MDBCol size="auto">
                <MDBRow className="align-items-end g-2">
                  <MDBCol size="auto">
                    <MDBTypography tag="h2" className="fw-bold m-0">
                      {company.ticker}
                    </MDBTypography>
                  </MDBCol>
                  <MDBCol size="auto">
                    <MDBTypography tag="h5" className="opacity-50 m-0">
                      {company.name}
                    </MDBTypography>
                  </MDBCol>
                </MDBRow>
                <MDBTypography tag="p" className="fs-6 opacity-50 m-0">
                  {company.sector} / {company.industry}
                </MDBTypography>
              </MDBCol>

              <MDBCol size="auto">
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  aria-label="Close"
                ></button>
              </MDBCol>
            </MDBRow>
          </MDBModalHeader>

          <MDBModalBody className="d-flex flex-column gap-4">
            <div className="">
              <MDBTypography tag="h6" className="fw-bold opacity-50">
                Opis
              </MDBTypography>
              <p>{company.description || 'Brak'}</p>
            </div>
            <hr />
            <MDBRow className="align-items-center justify-content-start g-3">
              <MDBCol size="6" lg="4">
                <MDBTypography tag="h6" className="fw-bold opacity-50">
                  Łączna liczba akcji
                </MDBTypography>
                <p className="fs-5">{company.sharesOutstanding || '-'}</p>
              </MDBCol>
              <MDBCol size="6" lg="4">
                <MDBTypography tag="h6" className="fw-bold opacity-50">
                  Akcje w obrocie (Float)
                </MDBTypography>
                <p className="fs-5">{company.floatShares|| '-'}</p>
              </MDBCol>
            </MDBRow>

            <MDBRow className="">
              <MDBCol size="6" lg="4">
                <MDBTypography tag="h6" className="fw-bold opacity-50">
                  Kraj
                </MDBTypography>
                <p>{company.country || '–'}</p>
              </MDBCol>
              <MDBCol size="6" lg="4">
                <MDBTypography tag="h6" className="fw-bold opacity-50">
                  Waluta
                </MDBTypography>
                <p>{company.currency}</p>
              </MDBCol>
              <MDBCol size="6" lg="4">
                <MDBTypography tag="h6" className="fw-bold opacity-50">
                  Strona www
                </MDBTypography>
                <a
                  href={company.website || '#'}
                  target="_blank"
                  rel="noreferrer"
                >
                  {company.website ? 'Przejdź' : '–'}
                </a>
              </MDBCol>
            </MDBRow>

            <hr />

            <MDBRow className="g-3">
              <MDBCol size="6">
                <MDBTypography tag="h6" className="fw-bold opacity-50">
                  Aktualna cena
                </MDBTypography>
                <p className="fs-5 fw-bold">
                  {company.price} {company.currency}
                </p>
              </MDBCol>
              <MDBCol size="6">
                <MDBTypography tag="h6" className="fw-bold opacity-50">
                  Zmiana
                </MDBTypography>
                <MDBTypography
                  tag="p"
                  className={`fs-5 ${company.change >= 0 ? 'text-price-up' : 'text-price-down'}`}
                >
                  {company.change >= 0 ? '+' : ''}
                  {company.change.toFixed(2)} (
                  {company.changePercent.toFixed(2)}%)
                </MDBTypography>
              </MDBCol>
            </MDBRow>
          </MDBModalBody>
        </MDBModalContent>
      </MDBModalDialog>
    </MDBModal>
  );
};
