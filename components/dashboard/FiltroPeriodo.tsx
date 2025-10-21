import { Button, Input } from "@heroui/react";
import { CalendarIcon, FunnelIcon } from "@heroicons/react/24/outline";

interface FiltroPeriodoProps {
  dateStart: string;
  dateEnd: string;
  onDateStartChange: (value: string) => void;
  onDateEndChange: (value: string) => void;
  selectedPeriod: string;
  onPeriodChange: (days: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function FiltroPeriodo({
  dateStart,
  dateEnd,
  onDateStartChange,
  onDateEndChange,
  selectedPeriod,
  onPeriodChange,
  showFilters,
  onToggleFilters,
}: FiltroPeriodoProps) {
  const periods = [
    { label: "Desde o início", value: "all" },
    { label: "7 dias", value: "7" },
    { label: "15 dias", value: "15" },
    { label: "30 dias", value: "30" },
    { label: "60 dias", value: "60" },
    { label: "90 dias", value: "90" },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Período de Análise</h3>
        </div>
        <Button
          size="sm"
          variant="flat"
          onPress={onToggleFilters}
          startContent={<CalendarIcon className="w-4 h-4" />}
        >
          {showFilters ? "Ocultar" : "Personalizar"} Filtros
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {periods.map((period) => (
          <Button
            key={period.value}
            size="sm"
            variant={selectedPeriod === period.value ? "solid" : "flat"}
            color={selectedPeriod === period.value ? "primary" : "default"}
            onPress={() => {
              onPeriodChange(period.value);
              if (period.value === "all") {
                onDateStartChange("");
                onDateEndChange("");
              }
            }}
          >
            {period.label}
          </Button>
        ))}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-default-100 rounded-lg">
          <Input
            type="date"
            label="Data Início"
            value={dateStart}
            onChange={(e) => onDateStartChange(e.target.value)}
            variant="bordered"
            startContent={<CalendarIcon className="w-4 h-4" />}
          />
          <Input
            type="date"
            label="Data Fim"
            value={dateEnd}
            onChange={(e) => onDateEndChange(e.target.value)}
            variant="bordered"
            startContent={<CalendarIcon className="w-4 h-4" />}
          />
        </div>
      )}
    </div>
  );
}
