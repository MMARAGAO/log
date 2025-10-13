/**
 * VendasFilters - Componente de busca e ordenação de vendas
 * Barra de busca, ordenação e botão de adicionar
 */

import { Input, Button, Select, SelectItem } from "@heroui/react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { ORDER_FIELDS } from "./types";

interface VendasFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  orderBy: string;
  onOrderByChange: (value: string) => void;
  direction: "asc" | "desc";
  onDirectionToggle: () => void;
  onClearFilters: () => void;
  showFiltersPanel: boolean;
  onToggleFiltersPanel: () => void;
  onAddClick: () => void;
  canCreate: boolean;
  hasActiveFilters: boolean;
}

export default function VendasFilters({
  searchTerm,
  onSearchChange,
  orderBy,
  onOrderByChange,
  direction,
  onDirectionToggle,
  onClearFilters,
  showFiltersPanel,
  onToggleFiltersPanel,
  onAddClick,
  canCreate,
  hasActiveFilters,
}: VendasFiltersProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <Input
        startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
        placeholder="Buscar por cliente, ID ou forma de pagamento"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        isClearable
        onClear={() => onSearchChange("")}
        className="flex-1"
      />

      <Select
        size="sm"
        label="Ordenar"
        selectedKeys={[orderBy]}
        onSelectionChange={(k) => {
          const key = Array.from(k)[0] as string;
          onOrderByChange(key);
        }}
        className="max-w-xs"
        items={ORDER_FIELDS}
      >
        {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
      </Select>

      <Button
        isIconOnly
        variant="flat"
        onPress={onDirectionToggle}
        title={direction === "asc" ? "Ordem crescente" : "Ordem decrescente"}
      >
        {direction === "asc" ? (
          <ArrowUpIcon className="w-4 h-4" />
        ) : (
          <ArrowDownIcon className="w-4 h-4" />
        )}
      </Button>

      <Button
        variant={showFiltersPanel ? "solid" : "flat"}
        color={showFiltersPanel ? "primary" : "default"}
        startContent={<FunnelIcon className="w-4 h-4" />}
        onPress={onToggleFiltersPanel}
      >
        Filtros
      </Button>

      {hasActiveFilters && (
        <Button variant="flat" color="warning" onPress={onClearFilters}>
          Limpar
        </Button>
      )}

      {canCreate && (
        <Button
          color="primary"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={onAddClick}
          className="min-w-0 w-10 p-0 lg:w-auto lg:min-w-[9rem] lg:px-4 lg:py-3"
        >
          <span className="hidden lg:block">Nova Venda</span>
        </Button>
      )}
    </div>
  );
}
