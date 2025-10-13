/**
 * EstoqueFilters - Componente de filtros e busca de estoque
 * Barra de busca, filtro por loja e botão de adicionar
 */

import { Input, Button, Select, SelectItem } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { Loja } from "./types";

interface EstoqueFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedLoja: number | null;
  onLojaChange: (lojaId: number | null) => void;
  lojas: Loja[];
  onAddClick: () => void;
  canCreate: boolean;
}

export default function EstoqueFilters({
  searchTerm,
  onSearchChange,
  selectedLoja,
  onLojaChange,
  lojas,
  onAddClick,
  canCreate,
}: EstoqueFiltersProps) {
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      <Input
        placeholder="Buscar por descrição, marca, modelo, compatível..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        isClearable
        onClear={() => onSearchChange("")}
        startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
        className="flex-1 min-w-[200px]"
      />
      <Select
        label="Filtrar por Loja"
        placeholder="Todas as lojas"
        className="max-w-xs"
        selectedKeys={selectedLoja ? [selectedLoja.toString()] : []}
        onSelectionChange={(keys) => {
          const key = Array.from(keys)[0]?.toString();
          onLojaChange(key && key !== "all" ? parseInt(key) : null);
        }}
        items={[
          { id: "all", nome: "Todas as lojas" },
          ...lojas.map((loja) => ({ id: loja.id.toString(), nome: loja.nome })),
        ]}
      >
        {(item) => <SelectItem key={item.id}>{item.nome}</SelectItem>}
      </Select>
      {canCreate && (
        <Button
          color="primary"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={onAddClick}
          className="min-w-0 w-10 p-0 lg:w-auto lg:min-w-[9rem] lg:px-4 lg:py-3"
        >
          <span className="hidden lg:block">Adicionar Produto</span>
        </Button>
      )}
    </div>
  );
}
