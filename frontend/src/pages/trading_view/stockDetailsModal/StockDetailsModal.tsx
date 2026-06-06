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
import { Stock, StockDetails } from '../../../types';

export interface StockDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: Stock
  price: number;
  change: number;
  changePercent: number;
  stockDetails: StockDetails;
}

export const StockDetailsModal = ({
  isOpen,
  onClose,
  stock,
  price,
  change,
  changePercent,
  stockDetails,
}: StockDetailsModalProps) => {
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
                      {stock.ticker}
                    </MDBTypography>
                  </MDBCol>
                  <MDBCol size="auto">
                    <MDBTypography tag="h5" className="opacity-50 m-0">
                      {stock.companyName}
                    </MDBTypography>
                  </MDBCol>
                </MDBRow>
                <MDBTypography tag="p" className="fs-6 opacity-50 m-0">
                  {stock.sector} / {stock.industry}
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
                Description
              </MDBTypography>
              <p>{stockDetails.description || 'None'}</p>
            </div>
            <hr />
            <MDBRow className="align-items-center justify-content-start g-3">
              <MDBCol size="6" lg="4">
                <MDBTypography tag="h6" className="fw-bold opacity-50">
                  Shares outstanding
                </MDBTypography>
                <p className="fs-5">{stockDetails.sharesOutstanding || '-'}</p>
              </MDBCol>
              <MDBCol size="6" lg="4">
                <MDBTypography tag="h6" className="fw-bold opacity-50">
                  Float shares
                </MDBTypography>
                <p className="fs-5">{stockDetails.floatShares|| '-'}</p>
              </MDBCol>
            </MDBRow>

            <MDBRow className="">
              <MDBCol size="6" lg="4">
                <MDBTypography tag="h6" className="fw-bold opacity-50">
                  Country
                </MDBTypography>
                <p>{stockDetails.country || '–'}</p>
              </MDBCol>
              <MDBCol size="6" lg="4">
                <MDBTypography tag="h6" className="fw-bold opacity-50">
                  Currency
                </MDBTypography>
                <p>{stockDetails.currency}</p>
              </MDBCol>
              <MDBCol size="6" lg="4">
                <MDBTypography tag="h6" className="fw-bold opacity-50">
                  Website
                </MDBTypography>
                <a
                  href={stockDetails.website || '#'}
                  target="_blank"
                  rel="noreferrer"
                >
                  {stockDetails.website}
                </a>
              </MDBCol>
            </MDBRow>

            <hr />

            <MDBRow className="g-3">
              <MDBCol size="6">
                <MDBTypography tag="h6" className="fw-bold opacity-50">
                  Current price
                </MDBTypography>
                <p className="fs-5 fw-bold">
                  {price} {stockDetails.currency}
                </p>
              </MDBCol>
              <MDBCol size="6">
                <MDBTypography tag="h6" className="fw-bold opacity-50">
                  Change
                </MDBTypography>
                <MDBTypography
                  tag="p"
                  className={`fs-5 ${change >= 0 ? 'text-price-up' : 'text-price-down'}`}
                >
                  {change >= 0 ? '+' : ''}
                  {change.toFixed(2)} (
                  {changePercent.toFixed(2)}%)
                </MDBTypography>
              </MDBCol>
            </MDBRow>
          </MDBModalBody>
        </MDBModalContent>
      </MDBModalDialog>
    </MDBModal>
  );
};
