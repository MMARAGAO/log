"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardBody,
  Button,
  Spinner,
  Chip,
  Select,
  SelectItem,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
} from "@heroui/react";
import {
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { fetchTable } from "@/lib/fetchTable";
import { useAuthStore } from "@/store/authZustand";
import toast, { Toaster } from "react-hot-toast";

interface Log {
  id: number;
  usuario_id: string | null;
  tipo_operacao: "INSERT" | "UPDATE" | "DELETE";
  acao: string;
  tabela: string;
  modulo: string;
  registro_id: string;
  descricao: string;
  dados_anteriores: any;
  dados_novos: any;
  criado_em: string;
}

interface Usuario {
  uuid: string;
  nome: string;
  email: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;
  const [filtroModulo, setFiltroModulo] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroBusca, setFiltroBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [logSelecionado, setLogSelecionado] = useState<Log | null>(null);

  const { user } = useAuthStore();
  const acessos = user?.permissoes?.acessos as any;
  const permLogs = acessos?.logs;
  const canViewLogs = !!permLogs?.ver_logs;

  const modulos = [
    "Vendas",
    "Estoque",
    "Clientes",
    "Fornecedores",
    "Ordens de Serviço",
    "RMA",
    "RMA Clientes",
    "Caixa",
    "Transferências",
    "Lojas",
    "Usuários",
    "Sistema",
  ];

  useEffect(() => {
    if (canViewLogs) {
      loadData();
    }
  }, [canViewLogs]);

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([loadLogs(), loadUsuarios()]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs() {
    try {
      const data = await fetchTable("logs");
      if (data) {
        const logsOrdenados = data.sort(
          (a: any, b: any) =>
            new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
        );
        setLogs(logsOrdenados);
      }
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      throw error;
    }
  }

  async function loadUsuarios() {
    try {
      const data = await fetchTable("usuarios");
      if (data) {
        setUsuarios(data);
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  }

  function getUserName(usuarioId: string | null): string {
    if (!usuarioId) return "Sistema";
    const usuario = usuarios.find((u) => u.uuid === usuarioId);
    return usuario?.nome || "Desconhecido";
  }

  function getUserEmail(usuarioId: string | null): string | null {
    if (!usuarioId) return null;
    const usuario = usuarios.find((u) => u.uuid === usuarioId);
    return usuario?.email || null;
  }

  const logsFiltrados = useMemo(() => {
    return logs.filter((log) => {
      if (filtroModulo && log.modulo !== filtroModulo) return false;
      if (filtroTipo && log.tipo_operacao !== filtroTipo) return false;

      if (filtroBusca) {
        const busca = filtroBusca.toLowerCase();
        const matchDescricao = log.descricao?.toLowerCase().includes(busca);
        const matchUsuario = getUserName(log.usuario_id)
          .toLowerCase()
          .includes(busca);
        const matchRegistro = log.registro_id?.toLowerCase().includes(busca);
        const matchTabela = log.tabela?.toLowerCase().includes(busca);
        if (!matchDescricao && !matchUsuario && !matchRegistro && !matchTabela)
          return false;
      }

      if (dataInicio) {
        const logDate = new Date(log.criado_em).toISOString().split("T")[0];
        if (logDate < dataInicio) return false;
      }
      if (dataFim) {
        const logDate = new Date(log.criado_em).toISOString().split("T")[0];
        if (logDate > dataFim) return false;
      }

      return true;
    });
  }, [
    logs,
    filtroModulo,
    filtroTipo,
    filtroBusca,
    dataInicio,
    dataFim,
    usuarios,
  ]);

  const pages = Math.ceil(logsFiltrados.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return logsFiltrados.slice(start, end);
  }, [page, logsFiltrados]);

  const estatisticas = useMemo(() => {
    return {
      total: logsFiltrados.length,
      inserts: logsFiltrados.filter((l) => l.tipo_operacao === "INSERT").length,
      updates: logsFiltrados.filter((l) => l.tipo_operacao === "UPDATE").length,
      deletes: logsFiltrados.filter((l) => l.tipo_operacao === "DELETE").length,
    };
  }, [logsFiltrados]);

  function getCorTipo(
    tipo: string
  ): "success" | "primary" | "danger" | "default" {
    switch (tipo) {
      case "INSERT":
        return "success";
      case "UPDATE":
        return "primary";
      case "DELETE":
        return "danger";
      default:
        return "default";
    }
  }

  function getIconeTipo(tipo: string) {
    switch (tipo) {
      case "INSERT":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "UPDATE":
        return <PencilIcon className="w-4 h-4" />;
      case "DELETE":
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  }

  function getLabelTipo(tipo: string) {
    switch (tipo) {
      case "INSERT":
        return "Criação";
      case "UPDATE":
        return "Atualização";
      case "DELETE":
        return "Exclusão";
      default:
        return tipo;
    }
  }

  function limparFiltros() {
    setFiltroModulo("");
    setFiltroTipo("");
    setFiltroBusca("");
    setDataInicio("");
    setDataFim("");
    setPage(1);
  }

  function setFiltroRapido(tipo: "hoje" | "ontem" | "semana" | "mes") {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split("T")[0];

    switch (tipo) {
      case "hoje":
        setDataInicio(hojeStr);
        setDataFim(hojeStr);
        break;
      case "ontem":
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        setDataInicio(ontem.toISOString().split("T")[0]);
        setDataFim(ontem.toISOString().split("T")[0]);
        break;
      case "semana":
        const seteDias = new Date(hoje);
        seteDias.setDate(seteDias.getDate() - 7);
        setDataInicio(seteDias.toISOString().split("T")[0]);
        setDataFim(hojeStr);
        break;
      case "mes":
        const trintaDias = new Date(hoje);
        trintaDias.setDate(trintaDias.getDate() - 30);
        setDataInicio(trintaDias.toISOString().split("T")[0]);
        setDataFim(hojeStr);
        break;
    }
    setPage(1);
  }

  function formatarDiferenca(dadosAnteriores: any, dadosNovos: any): string[] {
    if (!dadosAnteriores || !dadosNovos) return [];

    const diferencas: string[] = [];
    const keys = new Set([
      ...Object.keys(dadosAnteriores),
      ...Object.keys(dadosNovos),
    ]);

    keys.forEach((key) => {
      if (
        ["updatedat", "updated_at", "createdat", "created_at"].includes(
          key.toLowerCase()
        )
      )
        return;

      const valorAntigo = dadosAnteriores[key];
      const valorNovo = dadosNovos[key];

      if (JSON.stringify(valorAntigo) !== JSON.stringify(valorNovo)) {
        const formatAntigo = formatValue(valorAntigo);
        const formatNovo = formatValue(valorNovo);
        diferencas.push(`${key}: ${formatAntigo} → ${formatNovo}`);
      }
    });

    return diferencas;
  }

  function formatValue(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  if (!canViewLogs) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-danger-200">
          <CardBody className="text-center py-12">
            <ExclamationTriangleIcon className="w-16 h-16 text-danger mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-danger text-sm">
              Você não possui permissão para visualizar os Logs do sistema.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col justify-center items-center h-96">
          <Spinner size="lg" />
          <p className="mt-4 text-default-500">Carregando logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Toaster position="top-right" />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DocumentTextIcon className="w-8 h-8 text-primary" />
            Sistema de Logs
          </h1>
          <p className="text-default-500 mt-1">
            Auditoria e rastreamento de todas as operações do sistema
          </p>
        </div>

        <Button
          color="primary"
          variant="shadow"
          startContent={<ArrowPathIcon className="w-5 h-5" />}
          onPress={() => {
            loadData();
            toast.success("Logs atualizados!");
          }}
        >
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 border-2">
          <CardBody className="text-center py-6">
            <ChartBarIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-primary-700">
              {estatisticas.total}
            </p>
            <p className="text-sm text-primary-600 font-medium">Total</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-success-50 to-success-100 border-success-200 border-2">
          <CardBody className="text-center py-6">
            <CheckCircleIcon className="w-8 h-8 text-success-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-success-700">
              {estatisticas.inserts}
            </p>
            <p className="text-sm text-success-600 font-medium">Criações</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 border-2">
          <CardBody className="text-center py-6">
            <PencilIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-blue-700">
              {estatisticas.updates}
            </p>
            <p className="text-sm text-blue-600 font-medium">Atualizações</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-danger-50 to-danger-100 border-danger-200 border-2">
          <CardBody className="text-center py-6">
            <XCircleIcon className="w-8 h-8 text-danger-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-danger-700">
              {estatisticas.deletes}
            </p>
            <p className="text-sm text-danger-600 font-medium">Exclusões</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">Filtros</h3>
              {(filtroModulo ||
                filtroTipo ||
                filtroBusca ||
                dataInicio ||
                dataFim) && (
                <Chip size="sm" color="primary" variant="flat">
                  {logsFiltrados.length} de {logs.length}
                </Chip>
              )}
            </div>

            <div className="hidden lg:flex gap-2">
              <Button
                size="sm"
                variant="flat"
                startContent={<CalendarIcon className="w-4 h-4" />}
                onPress={() => setFiltroRapido("hoje")}
              >
                Hoje
              </Button>
              <Button
                size="sm"
                variant="flat"
                startContent={<CalendarIcon className="w-4 h-4" />}
                onPress={() => setFiltroRapido("ontem")}
              >
                Ontem
              </Button>
              <Button
                size="sm"
                variant="flat"
                startContent={<CalendarIcon className="w-4 h-4" />}
                onPress={() => setFiltroRapido("semana")}
              >
                7 dias
              </Button>
              <Button
                size="sm"
                variant="flat"
                startContent={<CalendarIcon className="w-4 h-4" />}
                onPress={() => setFiltroRapido("mes")}
              >
                30 dias
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Buscar"
              placeholder="Descrição, usuário, ID..."
              value={filtroBusca}
              onChange={(e) => {
                setFiltroBusca(e.target.value);
                setPage(1);
              }}
              startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
              variant="bordered"
              isClearable
              onClear={() => {
                setFiltroBusca("");
                setPage(1);
              }}
            />

            <Select
              label="Módulo"
              placeholder="Todos"
              selectedKeys={filtroModulo ? [filtroModulo] : []}
              onChange={(e) => {
                setFiltroModulo(e.target.value);
                setPage(1);
              }}
              variant="bordered"
            >
              {modulos.map((modulo) => (
                <SelectItem key={modulo}>{modulo}</SelectItem>
              ))}
            </Select>

            <Select
              label="Tipo"
              placeholder="Todos"
              selectedKeys={filtroTipo ? [filtroTipo] : []}
              onChange={(e) => {
                setFiltroTipo(e.target.value);
                setPage(1);
              }}
              variant="bordered"
            >
              <SelectItem key="INSERT">Criação</SelectItem>
              <SelectItem key="UPDATE">Atualização</SelectItem>
              <SelectItem key="DELETE">Exclusão</SelectItem>
            </Select>

            <Button
              color="default"
              variant="flat"
              onPress={limparFiltros}
              fullWidth
              className="h-14"
            >
              Limpar Filtros
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              type="date"
              label="Data Início"
              value={dataInicio}
              onChange={(e) => {
                setDataInicio(e.target.value);
                setPage(1);
              }}
              variant="bordered"
              startContent={<CalendarIcon className="w-4 h-4" />}
            />

            <Input
              type="date"
              label="Data Fim"
              value={dataFim}
              onChange={(e) => {
                setDataFim(e.target.value);
                setPage(1);
              }}
              variant="bordered"
              startContent={<CalendarIcon className="w-4 h-4" />}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <Table
            aria-label="Tabela de logs"
            bottomContent={
              pages > 1 && (
                <div className="flex w-full justify-center">
                  <Pagination
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={(page) => setPage(page)}
                  />
                </div>
              )
            }
          >
            <TableHeader>
              <TableColumn>TIPO</TableColumn>
              <TableColumn>MÓDULO</TableColumn>
              <TableColumn>DESCRIÇÃO</TableColumn>
              <TableColumn>USUÁRIO</TableColumn>
              <TableColumn>DATA/HORA</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Nenhum log encontrado">
              {items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={getCorTipo(log.tipo_operacao)}
                      variant="flat"
                      startContent={getIconeTipo(log.tipo_operacao)}
                    >
                      {getLabelTipo(log.tipo_operacao)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="dot">
                      {log.modulo || "Não especificado"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-2xl">
                      <p className="text-sm font-medium whitespace-normal break-words">
                        {log.descricao || "Sem descrição"}
                      </p>
                      <p className="text-xs text-default-500 mt-1">
                        {log.tabela || "N/A"} #{log.registro_id || "N/A"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-default-400" />
                      <span className="text-sm">
                        {getUserName(log.usuario_id)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {new Date(log.criado_em).toLocaleString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      color="primary"
                      variant="light"
                      startContent={<EyeIcon className="w-4 h-4" />}
                      onPress={() => {
                        setLogSelecionado(log);
                        setModalDetalhes(true);
                      }}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal
        isOpen={modalDetalhes}
        onClose={() => {
          setModalDetalhes(false);
          setLogSelecionado(null);
        }}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <EyeIcon className="w-5 h-5" />
            Detalhes do Log #{logSelecionado?.id}
          </ModalHeader>
          <ModalBody>
            {logSelecionado && (
              <Tabs aria-label="Detalhes" color="primary" variant="underlined">
                <Tab
                  key="info"
                  title={
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="w-4 h-4" />
                      <span>Informações</span>
                    </div>
                  }
                >
                  <div className="space-y-6 py-4">
                    <div>
                      <p className="text-sm text-default-500 mb-2">
                        Tipo de Operação
                      </p>
                      <Chip
                        size="lg"
                        color={getCorTipo(logSelecionado.tipo_operacao)}
                        variant="flat"
                        startContent={getIconeTipo(
                          logSelecionado.tipo_operacao
                        )}
                      >
                        {getLabelTipo(logSelecionado.tipo_operacao)}
                      </Chip>
                    </div>

                    <div>
                      <p className="text-sm text-default-500 mb-2">Descrição</p>
                      <Card className="bg-default-100">
                        <CardBody>
                          <p className="font-semibold">
                            {logSelecionado.descricao || "Sem descrição"}
                          </p>
                        </CardBody>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-default-500 mb-2">Módulo</p>
                        <Chip variant="flat" color="primary">
                          {logSelecionado.modulo || "Não especificado"}
                        </Chip>
                      </div>

                      <div>
                        <p className="text-sm text-default-500 mb-2">Tabela</p>
                        <Chip variant="flat">
                          {logSelecionado.tabela || "N/A"}
                        </Chip>
                      </div>

                      <div>
                        <p className="text-sm text-default-500 mb-2">
                          Registro ID
                        </p>
                        <Chip variant="flat">
                          #{logSelecionado.registro_id || "N/A"}
                        </Chip>
                      </div>

                      <div>
                        <p className="text-sm text-default-500 mb-2">
                          Data/Hora
                        </p>
                        <Chip
                          variant="flat"
                          startContent={<ClockIcon className="w-4 h-4" />}
                        >
                          {new Date(logSelecionado.criado_em).toLocaleString(
                            "pt-BR",
                            {
                              timeZone: "America/Sao_Paulo",
                            }
                          )}
                        </Chip>
                      </div>

                      <div>
                        <p className="text-sm text-default-500 mb-2">Usuário</p>
                        <Chip
                          variant="flat"
                          startContent={<UserIcon className="w-4 h-4" />}
                        >
                          {getUserName(logSelecionado.usuario_id)}
                        </Chip>
                      </div>

                      {getUserEmail(logSelecionado.usuario_id) && (
                        <div>
                          <p className="text-sm text-default-500 mb-2">Email</p>
                          <Chip variant="flat">
                            {getUserEmail(logSelecionado.usuario_id)}
                          </Chip>
                        </div>
                      )}
                    </div>
                  </div>
                </Tab>

                {logSelecionado.dados_anteriores && (
                  <Tab key="anterior" title="Dados Anteriores">
                    <Card className="mt-4">
                      <CardBody>
                        <pre className="text-xs overflow-auto max-h-96 bg-default-50 p-4 rounded-lg">
                          {JSON.stringify(
                            logSelecionado.dados_anteriores,
                            null,
                            2
                          )}
                        </pre>
                      </CardBody>
                    </Card>
                  </Tab>
                )}

                {logSelecionado.dados_novos && (
                  <Tab key="novo" title="Dados Novos">
                    <Card className="mt-4">
                      <CardBody>
                        <pre className="text-xs overflow-auto max-h-96 bg-default-50 p-4 rounded-lg">
                          {JSON.stringify(logSelecionado.dados_novos, null, 2)}
                        </pre>
                      </CardBody>
                    </Card>
                  </Tab>
                )}

                {logSelecionado.tipo_operacao === "UPDATE" &&
                  logSelecionado.dados_anteriores &&
                  logSelecionado.dados_novos && (
                    <Tab
                      key="diff"
                      title={
                        <div className="flex items-center gap-2">
                          <PencilIcon className="w-4 h-4" />
                          <span>Diferenças</span>
                        </div>
                      }
                    >
                      <div className="space-y-3 py-4 max-h-96 overflow-auto">
                        {formatarDiferenca(
                          logSelecionado.dados_anteriores,
                          logSelecionado.dados_novos
                        ).length === 0 ? (
                          <Card className="bg-default-100">
                            <CardBody className="text-center py-8">
                              <p className="text-default-500">
                                Nenhuma diferença detectada
                              </p>
                            </CardBody>
                          </Card>
                        ) : (
                          formatarDiferenca(
                            logSelecionado.dados_anteriores,
                            logSelecionado.dados_novos
                          ).map((diff, index) => (
                            <Card
                              key={index}
                              className="bg-gradient-to-r from-warning-50 to-warning-100 border-warning-200 border"
                            >
                              <CardBody>
                                <p className="text-sm font-mono font-medium text-warning-800">
                                  {diff}
                                </p>
                              </CardBody>
                            </Card>
                          ))
                        )}
                      </div>
                    </Tab>
                  )}
              </Tabs>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onPress={() => {
                setModalDetalhes(false);
                setLogSelecionado(null);
              }}
            >
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
