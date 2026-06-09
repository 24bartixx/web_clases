import { Stock, StockDetails } from '../../../types';
import { MDBCol, MDBRow, MDBTypography } from 'mdb-react-ui-kit';

export interface StockItemViewProps {
  ticker: Stock['ticker'];
  companyName: Stock['companyName'];
  sector: Stock['sector'];
  industry: Stock['industry'];
  currency: StockDetails['currency'];
  price: number;
  changePricePercent: number;
  volume: number;
  onClick: (ticker: string) => void;
}

export const StockItemView = ({
  ticker,
  companyName,
  sector,
  industry,
  price,
  volume,
  changePricePercent,
  currency,
  onClick,
  ...rest
}: StockItemViewProps) => {
  return (
    <tr
      {...rest}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(ticker)}
    >
      <th scope="col">
        <MDBRow className="align-items-center g-2">
          <MDBCol size="auto">
            <div
              className="rounded-circle overflow-hidden p-1"
              style={{ width: '40px', height: '40px' }}
            >
              <img
                src={`https://img.logo.dev/ticker/${ticker}?token=${process.env.REACT_APP_LOGO_STOCK_TOKEN}`}
                alt="Stock logo"
                className="w-100 h-100"
              />
            </div>
          </MDBCol>
          <MDBCol>
            <div className="d-flex flex-nowrap align-items-end gap-2">
              <MDBTypography tag="p" className="fs-5 text-white m-0 lh-1">
                {ticker}
              </MDBTypography>
              <MDBTypography tag="p" className="text-white-50 m-0 lh-1">
                {companyName}
              </MDBTypography>
            </div>
          </MDBCol>
        </MDBRow>
      </th>
      <td className="text-white align-middle">
        <MDBTypography tag="p" className={`fs-6 m-0 lh-0`}>
          {price.toFixed(2)} {currency}
        </MDBTypography>
      </td>
      <td className="text-white align-middle ">
        <MDBTypography
          tag="p"
          className={`fs-6 m-0 lh-0 ${changePricePercent >= 0 ? 'text-price-up' : 'text-price-down'}`}
        >
          {changePricePercent.toFixed(2)}%
        </MDBTypography>
      </td>
      <td className="text-white align-middle ">
        <MDBTypography tag="p" className="fs-6 m-0 lh-1">
          {new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short',
          }).format(volume)}
        </MDBTypography>
      </td>
      <td className="text-white align-middle ">
        <MDBTypography tag="p" className={`fs-6 m-0 lh-0`}>
          {industry}
        </MDBTypography>
      </td>
      <td className="text-white align-middle ">
        <MDBTypography tag="p" className={`fs-6 m-0 lh-0`}>
          {sector}
        </MDBTypography>
      </td>
    </tr>
  );
};