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

export interface Company {
  id: string;
  name: string;
}

interface CompanyMultiSelectProps {
  allCompanies: Company[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
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
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedIds.includes(company.id),
  );

  return (
    <div>
      {selectedIds.map((id) => {
        const company = allCompanies.find((c) => c.id === id);
        return (
          <MDBBadge
            className="m-2 px-3"
            key={id}
            pill
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              onRemove(id);
            }}
          >
            {company?.name}
            <MDBIcon fas size="sm" />
          </MDBBadge>
        );
      })}
      <MDBDropdown>
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
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </MDBDropdownToggle>

        <MDBDropdownMenu className="w-110">
          <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <MDBDropdownItem
                  link
                  key={company.id}
                  onClick={() => {
                    onSelect(company.id);
                    setSearchTerm('');
                  }}
                >
                  {company.name}
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
