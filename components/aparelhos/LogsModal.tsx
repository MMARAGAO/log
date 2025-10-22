"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  ClipboardDocumentListIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatarDataHora } from "@/utils/aparelhos";

export type LogAtividade = {
  id: string;
  tipo: "cadastro" | "venda" | "edicao" | "exclusao" | "erro";
  acao: string;
  detalhes: string;
  cliente?: string;
  usuario?: string;
  timestamp: Date;
  dados?: any;
};

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogAtividade[];
  onClearLogs: () => void;
}

export default function LogsModal({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}: LogsModalProps) {
  const [filtroTipoLog, setFiltroTipoLog] = useState<string>("todos");
  const [filtroDataLog, setFiltroDataLog] = useState<string>("");
  const [filtroClienteLog, setFiltroClienteLog] = useState<string>("");
  const [searchLog, setSearchLog] = useState<string>("");

  const handleClearLogs = () => {
    if (confirm("Deseja realmente limpar todos os logs?")) {
      onClearLogs();
      toast.success("Logs limpos com sucesso!");
    }
  };

  const filteredLogs = logs.filter((log) => {
    // Filtro por tipo
    if (filtroTipoLog !== "todos" && log.tipo !== filtroTipoLog) return false;

    // Filtro por data
    if (filtroDataLog) {
      const logDate = new Date(log.timestamp).toISOString().split("T")[0];
      if (logDate !== filtroDataLog) return false;
    }

    // Filtro por cliente
    if (
      filtroClienteLog &&
      !log.cliente?.toLowerCase().includes(filtroClienteLog.toLowerCase())
    ) {
      return false;
    }

    // Busca em detalhes
    if (
      searchLog &&
      !log.detalhes.toLowerCase().includes(searchLog.toLowerCase()) &&
      !log.acao.toLowerCase().includes(searchLog.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const getLogColor = (tipo: LogAtividade["tipo"]) => {
    switch (tipo) {
      case "venda":
        return "#10b981";
      case "cadastro":
        return "#3b82f6";
      case "edicao":
        return "#f59e0b";
      case "exclusao":
        return "#ef4444";
      case "erro":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getChipColor = (tipo: LogAtividade["tipo"]) => {
    switch (tipo) {
      case "venda":
        return "success";
      case "cadastro":
        return "primary";
      case "edicao":
        return "warning";
      case "exclusao":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-6 h-6" />
            <span>Histórico de Atividades</span>
          </div>
          <p className="text-sm font-normal text-gray-500">
            {logs.length} registro(s) encontrado(s)
          </p>
        </ModalHeader>
        <ModalBody>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
            <Select
              label="Tipo de Ação"
              placeholder="Todos"
              selectedKeys={filtroTipoLog === "todos" ? [] : [filtroTipoLog]}
              onChange={(e) => setFiltroTipoLog(e.target.value || "todos")}
              startContent={<FunnelIcon className="w-4 h-4" />}
            >
              <SelectItem key="todos">Todos</SelectItem>
              <SelectItem key="cadastro">Cadastros</SelectItem>
              <SelectItem key="venda">Vendas</SelectItem>
              <SelectItem key="edicao">Edições</SelectItem>
              <SelectItem key="exclusao">Exclusões</SelectItem>
              <SelectItem key="erro">Erros</SelectItem>
            </Select>

            <Input
              label="Data"
              type="date"
              value={filtroDataLog}
              onChange={(e) => setFiltroDataLog(e.target.value)}
            />

            <Input
              label="Cliente"
              placeholder="Filtrar por cliente..."
              value={filtroClienteLog}
              onChange={(e) => setFiltroClienteLog(e.target.value)}
            />

            <Input
              label="Buscar"
              placeholder="Buscar em detalhes..."
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
            />
          </div>

          {/* Lista de Logs */}
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <Card
                key={log.id}
                className="border-l-4"
                style={{
                  borderLeftColor: getLogColor(log.tipo),
                }}
              >
                <CardBody className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Chip size="sm" color={getChipColor(log.tipo)}>
                          {log.tipo.toUpperCase()}
                        </Chip>
                        <span className="font-semibold">{log.acao}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {log.detalhes}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>
                          📅 {formatarDataHora(log.timestamp.toISOString())}
                        </span>
                        {log.cliente && <span>👤 Cliente: {log.cliente}</span>}
                        {log.usuario && <span>👨‍💼 Usuário: {log.usuario}</span>}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <ClipboardDocumentListIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">Nenhum log encontrado</p>
                <p className="text-sm">
                  Ajuste os filtros ou realize ações no sistema
                </p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={handleClearLogs}
            isDisabled={logs.length === 0}
          >
            Limpar Logs
          </Button>
          <Button color="primary" onPress={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
