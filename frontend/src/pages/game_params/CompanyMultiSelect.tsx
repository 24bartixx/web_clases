import React, { useState } from 'react';
import {
  MDBBadge,
  MDBIcon,
  MDBDropdown,
  MDBDropdownMenu,
  MDBDropdownItem,
  MDBDropdownToggle,
  MDBInput,
} from 'mdb-react-ui-kit';
import './dropdown.css';
import { StockMinimal } from '../../types';

interface CompanyMultiSelectProps {
  allCompanies: StockMinimal[];
  selectedIds: number[];
  onSelect: (id: number) => void;
  onRemove: (id: number) => void;
}

export function CompanyMultiSelect({
  allCompanies,
  selectedIds,
  onSelect,
  onRemove,
}: CompanyMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCompanies = allCompanies.filter(
    (company) =>
      company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedIds.includes(company.stockId),
  );

  return (
    <div>
      <div>
        {selectedIds.map((id) => {
          const company = allCompanies.find((c) => c.stockId === id);
          return (
            <MDBBadge
              className="m-2 px-3 selected-stock-badge"
              key={id}
              pill
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={(e: React.MouseEvent<HTMLElement>) => {
                e.stopPropagation();
                onRemove(id);
              }}
            >
              <span>{company?.companyName}</span>
              {company?.ticker && (
                <span className="ms-2 selected-stock-badge__ticker">
                  {company.ticker}
                </span>
              )}
              <MDBIcon fas size="sm" />
            </MDBBadge>
          );
        })}
      </div>
      <MDBDropdown className="mt-2">
        {/* Zamieniamy domyślny <button> na <div> i usuwamy style przycisku */}
        <MDBDropdownToggle
          tag="div"
          className="bg-transparent shadow-none p-0 border-0 hide-dropdown-caret"
          style={{ cursor: 'text' }} // Zmienia kursor, żeby nie wyglądał jak przycisk
        >
          <MDBInput
            label="Wyszukaj firmę..."
            type="text"
            value={searchTerm}
            onChange={(e: {
              target: { value: React.SetStateAction<string> };
            }) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </MDBDropdownToggle>

        <MDBDropdownMenu className="w-110">
          <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <MDBDropdownItem
                  link
                  key={company.stockId}
                  onClick={() => {
                    onSelect(company.stockId);
                    setSearchTerm('');
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center gap-3 w-100">
                    <span>{company.companyName}</span>
                    {company.ticker && (
                      <span className="text-muted small ms-auto">
                        {company.ticker}
                      </span>
                    )}
                  </div>
                </MDBDropdownItem>
              ))
            ) : (
              <div className="text-muted text-center p-2 small">
                Brak pasujących firm
              </div>
            )}
          </div>
        </MDBDropdownMenu>
      </MDBDropdown>
    </div>
  );
}
