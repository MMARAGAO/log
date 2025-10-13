/**
 * ClienteFilters - Componente de filtros e busca
 * Barra de busca e botão de adicionar cliente
 */

import { Input, Button } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface ClienteFiltersProps {
  busca: string;
  onBuscaChange: (value: string) => void;
  onAddClick: () => void;
  canCreate: boolean;
}

export default function ClienteFilters({
  busca,
  onBuscaChange,
  onAddClick,
  canCreate,
}: ClienteFiltersProps) {
  return (
    <div className="flex gap-2 mb-4">
      <Input
        placeholder="Nome, email, telefone, CPF/CNPJ, Instagram..."
        value={busca}
        onChange={(e) => onBuscaChange(e.target.value)}
        isClearable
        onClear={() => onBuscaChange("")}
        startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
        className="flex-1"
      />
      {canCreate && (
        <Button
          color="primary"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={onAddClick}
          className="min-w-0 w-10 p-0 lg:w-auto lg:min-w-[9rem] lg:px-4 lg:py-3"
        >
          <span className="hidden lg:block">Adicionar Cliente</span>
        </Button>
      )}
    </div>
  );
}
