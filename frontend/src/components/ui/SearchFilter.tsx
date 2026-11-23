
import { Search } from "lucide-react";
import Input from "./Input";
import Select from "./Select";

interface SearchFilterOption {
  value: string;
  label: string;
}

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;

  filter: string;
  onFilterChange: (value: string) => void;
  filterOptions: SearchFilterOption[];
  filterPlaceholder?: string;
  filterLabel?: string;

  className?: string;
}

export default function SearchFilter({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  searchLabel = "Buscar",
  filter,
  onFilterChange,
  filterOptions,
  filterPlaceholder = "Selecione uma opção",
  filterLabel = "",
  className = "",
}: SearchFilterProps) {
  return (
    <div
      className={`mb-8 flex items-center justify-between gap-4 ${className}`}
    >
      <div className="w-full">
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          iconLeft={Search}
          aria-label={searchLabel}
          className="min-w-[200px]"
        />
      </div>

      <div className="w-full max-w-1/4 min-w-[150px]">
        <Select
          label={filterLabel}
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          <option value="">{filterPlaceholder}</option>

          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
