"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authZustand";
import { fetchTable } from "@/lib/fetchTable";
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Switch,
  Pagination,
  Tooltip,
  Spinner,
  Code,
  ScrollShadow,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  TableCellsIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

// Tipos baseados no schema
interface Log {
  id: number;
  usuario_id: string | null;
  acao: string;
  tabela: string | null;
  registro_id: string | null;
  dados_anteriores: any;
  dados_novos: any;
  ip: string | null;
  user_agent: string | null;
  criado_em: string;
}

interface Usuario {
  uuid: string;
  nome: string | null;
  email?: string | null;
  cargo?: string | null;
  fotourl?: string[] | null;
}

const ACOES_OPCOES = [
  { key: "criar", label: "Criar", color: "success", icon: PlusIcon },
  { key: "editar", label: "Editar", color: "warning", icon: PencilIcon },
  { key: "deletar", label: "Deletar", color: "danger", icon: TrashIcon },
  {
    key: "arquivar",
    label: "Arquivar",
    color: "default",
    icon: ArchiveBoxIcon,
  },
] as const;

const TABELAS_OPCOES = [
  { key: "clientes", label: "Clientes", icon: UserIcon },
  { key: "vendas", label: "Vendas", icon: DocumentTextIcon },
  { key: "estoque", label: "Estoque", icon: ArchiveBoxIcon },
  { key: "usuarios", label: "Usuários", icon: UserIcon },
  { key: "fornecedores", label: "Fornecedores", icon: UserIcon },
  { key: "ordens", label: "Ordens", icon: DocumentTextIcon },
] as const;

const ORDER_FIELDS = [
  { key: "criado_em", label: "Data/Hora" },
  { key: "acao", label: "Ação" },
  { key: "tabela", label: "Tabela" },
  { key: "usuario_id", label: "Usuário" },
  { key: "ip", label: "IP" },
];

interface FilterState {
  search: string;
  acao: string;
  tabela: string;
  usuario: string;
  orderBy: string;
  direction: "asc" | "desc";
  inicio: string;
  fim: string;
  ip: string;
}

const PAGE_SIZE = 20;

export default function LogsPage() {
  // Auth
  const { user } = useAuthStore();

  // Verificação de permissões específicas de logs
  const permLogs = user?.permissoes?.acessos?.logs;
  const canViewLogs = !!permLogs?.ver_logs;
  const canExportLogs = !!permLogs?.exportar_logs;
  const canFilterLogs = !!permLogs?.filtrar_logs;
  const canViewDetails = !!permLogs?.ver_detalhes_logs;

  // Fallback para admins/gerentes (retrocompatibilidade)
  const isAdmin = user?.cargo === "Admin" || user?.cargo === "Gerente";
  const hasAccess = canViewLogs || isAdmin;

  console.log("🔍 Debug permissões logs:", {
    user: user?.nome,
    cargo: user?.cargo,
    permLogs,
    canViewLogs,
    isAdmin,
    hasAccess,
  });

  // Dados
  const [logs, setLogs] = useState<Log[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    acao: "",
    tabela: "",
    usuario: "",
    orderBy: "criado_em",
    direction: "desc",
    inicio: "",
    fim: "",
    ip: "",
  });

  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Modal detalhes
  const viewModal = useDisclosure();
  const [targetLog, setTargetLog] = useState<Log | null>(null);

  // Carregar dados iniciais
  async function loadAll() {
    setLoading(true);
    try {
      const [logsData, usuariosData] = await Promise.all([
        fetchTable("logs"),
        fetchTable("usuarios"),
      ]);
      setLogs(logsData || []);
      setUsuarios(usuariosData || []);
    } catch (e) {
      console.error("Erro ao carregar logs:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hasAccess) {
      loadAll();
    }
  }, [hasAccess]);

  // Helpers
  function fmtDateTime(d?: string | null) {
    if (!d) return "-";
    return new Date(d).toLocaleString("pt-BR");
  }

  function fmtDate(d?: string | null) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("pt-BR");
  }

  function getUsuarioNome(userId: string | null) {
    if (!userId) return "Sistema";
    const usuario = usuarios.find((u) => u.uuid === userId);
    return usuario?.nome || usuario?.email || "Usuário desconhecido";
  }

  function getAcaoInfo(acao: string) {
    const tipo = acao.split("_")[0]; // ex: "criar", "editar", "deletar"
    return ACOES_OPCOES.find((a) => a.key === tipo) || ACOES_OPCOES[0];
  }

  function getTabelaInfo(tabela: string | null) {
    if (!tabela) return null;
    return TABELAS_OPCOES.find((t) => t.key === tabela);
  }

  function formatAcao(acao: string) {
    const partes = acao.split("_");
    if (partes.length >= 2) {
      const verbo = partes[0];
      const objeto = partes.slice(1).join("_");
      return `${verbo.charAt(0).toUpperCase() + verbo.slice(1)} ${objeto}`;
    }
    return acao;
  }

  function getDeviceInfo(userAgent: string | null) {
    if (!userAgent) return "Desconhecido";

    // Detecta browser simples
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";

    // Detecta mobile
    if (userAgent.includes("Mobile")) return "Mobile";

    return "Desktop";
  }

  // Filtros / ordenação
  const filtered = useMemo(() => {
    return logs
      .filter((log) => {
        // Busca geral
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchText = [
            log.acao,
            log.tabela,
            log.registro_id,
            getUsuarioNome(log.usuario_id),
            log.ip,
          ].some((field) => field?.toLowerCase().includes(searchLower));
          if (!matchText) return false;
        }

        // Filtro por ação
        if (filters.acao && !log.acao.startsWith(filters.acao)) return false;

        // Filtro por tabela
        if (filters.tabela && log.tabela !== filters.tabela) return false;

        // Filtro por usuário
        if (filters.usuario && log.usuario_id !== filters.usuario) return false;

        // Filtro por IP
        if (filters.ip && log.ip !== filters.ip) return false;

        // Filtro por data início
        if (filters.inicio && log.criado_em < filters.inicio + "T00:00:00")
          return false;

        // Filtro por data fim
        if (filters.fim && log.criado_em > filters.fim + "T23:59:59")
          return false;

        return true;
      })
      .sort((a, b) => {
        const dir = filters.direction === "asc" ? 1 : -1;
        let av: any = a[filters.orderBy as keyof Log];
        let bv: any = b[filters.orderBy as keyof Log];

        if (filters.orderBy === "criado_em") {
          av = av ? new Date(av).getTime() : 0;
          bv = bv ? new Date(bv).getTime() : 0;
        }

        if (typeof av === "string") av = av.toLowerCase();
        if (typeof bv === "string") bv = bv.toLowerCase();

        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
  }, [logs, filters, usuarios]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = logs.length;
    const hoje = new Date().toISOString().split("T")[0];
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const hojeLogs = logs.filter((l) => l.criado_em.startsWith(hoje)).length;
    const ontemLogs = logs.filter((l) => l.criado_em.startsWith(ontem)).length;

    const criacoes = logs.filter((l) => l.acao.startsWith("criar")).length;
    const edicoes = logs.filter((l) => l.acao.startsWith("editar")).length;
    const exclusoes = logs.filter((l) => l.acao.startsWith("deletar")).length;

    const usuariosAtivos = new Set(
      logs.filter((l) => l.usuario_id).map((l) => l.usuario_id)
    ).size;

    return {
      total,
      hojeLogs,
      ontemLogs,
      criacoes,
      edicoes,
      exclusoes,
      usuariosAtivos,
    };
  }, [logs]);

  // Abrir detalhes
  function openView(log: Log) {
    if (!canViewDetails && !isAdmin) {
      alert("Você não tem permissão para ver detalhes dos logs.");
      return;
    }
    setTargetLog(log);
    viewModal.onOpen();
  }

  // Verificação de permissão
  if (!hasAccess) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <DocumentTextIcon className="w-6 h-6" />
              Logs do Sistema
            </h1>
            <p className="text-sm text-default-500">
              Histórico de ações e auditoria
            </p>
          </div>
        </div>

        <Card className="border-danger-200">
          <CardBody className="text-center py-12">
            <div className="mb-4">
              <ExclamationTriangleIcon className="w-16 h-16 text-danger mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-danger text-sm mb-4">
              Você não possui permissão para visualizar os logs do sistema.
            </p>
            <p className="text-default-500 text-xs">
              Entre em contato com o administrador para solicitar acesso.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Verificação de loading
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Carregando logs..." />
      </div>
    );
  }

  // UI
  return (
    <div className="container mx-auto p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6" />
            Logs do Sistema
          </h1>
          <p className="text-sm text-default-500">
            Histórico de ações e auditoria
          </p>
        </div>
        <div className="flex gap-2">
          {(canFilterLogs || isAdmin) && (
            <Button
              variant={showFilters ? "solid" : "flat"}
              startContent={<FunnelIcon className="w-4 h-4" />}
              onPress={() => setShowFilters((v) => !v)}
            >
              Filtros
            </Button>
          )}
          {(canExportLogs || isAdmin) && (
            <Button
              variant="flat"
              startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
              onPress={() => {
                console.log("Implementar exportação");
              }}
            >
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-default-500">Total de Logs</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
            <p className="text-xs text-default-400">Hoje: {stats.hojeLogs}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-default-500">Ações por Tipo</p>
            <div className="flex gap-2 mt-1">
              <Chip size="sm" color="success" variant="flat">
                {stats.criacoes} criações
              </Chip>
              <Chip size="sm" color="warning" variant="flat">
                {stats.edicoes} edições
              </Chip>
            </div>
            <p className="text-xs text-default-400 mt-1">
              {stats.exclusoes} exclusões
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-default-500">Usuários Ativos</p>
            <p className="text-2xl font-semibold">{stats.usuariosAtivos}</p>
            <p className="text-xs text-default-400">Com atividade registrada</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-default-500">Atividade</p>
            <p className="text-xl font-semibold">
              {stats.hojeLogs > stats.ontemLogs ? "📈" : "📉"}
            </p>
            <p className="text-xs text-default-400">
              Ontem: {stats.ontemLogs} logs
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Barra de busca */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
          placeholder="Buscar por ação, tabela, usuário, IP..."
          value={filters.search}
          onChange={(e) =>
            setFilters((p) => ({ ...p, search: e.target.value }))
          }
          className="flex-1"
        />
        <Select
          size="sm"
          label="Ordenar"
          selectedKeys={[filters.orderBy]}
          onSelectionChange={(k) =>
            setFilters((p) => ({
              ...p,
              orderBy: Array.from(k)[0] as string,
            }))
          }
          className="max-w-xs"
        >
          {ORDER_FIELDS.map((o) => (
            <SelectItem key={o.key}>{o.label}</SelectItem>
          ))}
        </Select>
        <Button
          isIconOnly
          variant="flat"
          onPress={() =>
            setFilters((p) => ({
              ...p,
              direction: p.direction === "asc" ? "desc" : "asc",
            }))
          }
        >
          {filters.direction === "asc" ? (
            <ArrowUpIcon className="w-4 h-4" />
          ) : (
            <ArrowDownIcon className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="flat"
          onPress={() =>
            setFilters({
              search: "",
              acao: "",
              tabela: "",
              usuario: "",
              orderBy: "criado_em",
              direction: "desc",
              inicio: "",
              fim: "",
              ip: "",
            })
          }
        >
          Limpar
        </Button>
      </div>

      {/* Painel de filtros avançados */}
      {showFilters && (canFilterLogs || isAdmin) && (
        <Card>
          <CardBody className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Select
              label="Tipo de Ação"
              size="sm"
              selectedKeys={filters.acao ? [filters.acao] : []}
              onSelectionChange={(k) =>
                setFilters((p) => ({
                  ...p,
                  acao: (Array.from(k)[0] as string) || "",
                }))
              }
              placeholder="Todas"
            >
              {ACOES_OPCOES.map((a) => (
                <SelectItem key={a.key}>{a.label}</SelectItem>
              ))}
            </Select>

            <Select
              label="Tabela"
              size="sm"
              selectedKeys={filters.tabela ? [filters.tabela] : []}
              onSelectionChange={(k) =>
                setFilters((p) => ({
                  ...p,
                  tabela: (Array.from(k)[0] as string) || "",
                }))
              }
              placeholder="Todas"
            >
              {TABELAS_OPCOES.map((t) => (
                <SelectItem key={t.key}>{t.label}</SelectItem>
              ))}
            </Select>

            <Select
              label="Usuário"
              size="sm"
              selectedKeys={filters.usuario ? [filters.usuario] : []}
              onSelectionChange={(k) =>
                setFilters((p) => ({
                  ...p,
                  usuario: (Array.from(k)[0] as string) || "",
                }))
              }
              placeholder="Todos"
            >
              {usuarios.map((u) => (
                <SelectItem key={u.uuid}>
                  {u.nome || u.email || "Usuário"}
                </SelectItem>
              ))}
            </Select>

            <Input
              size="sm"
              type="date"
              label="Data Início"
              value={filters.inicio}
              onChange={(e) =>
                setFilters((p) => ({ ...p, inicio: e.target.value }))
              }
            />

            <Input
              size="sm"
              type="date"
              label="Data Fim"
              value={filters.fim}
              onChange={(e) =>
                setFilters((p) => ({ ...p, fim: e.target.value }))
              }
            />

            <Select
              label="Endereço IP"
              size="sm"
              selectedKeys={filters.ip ? [filters.ip] : []}
              onSelectionChange={(k) =>
                setFilters((p) => ({
                  ...p,
                  ip: (Array.from(k)[0] as string) || "",
                }))
              }
              placeholder="Todos"
            >
              {Array.from(new Set(logs.map((l) => l.ip).filter(Boolean))).map(
                (ip) => (
                  <SelectItem key={ip as string}>{ip as string}</SelectItem>
                )
              )}
            </Select>
          </CardBody>
        </Card>
      )}

      {/* Tabela */}
      <Card>
        <CardBody className="p-0">
          <Table removeWrapper aria-label="Tabela de logs">
            <TableHeader>
              <TableColumn>Data/Hora</TableColumn>
              <TableColumn>Ação</TableColumn>
              <TableColumn>Tabela</TableColumn>
              <TableColumn>Registro</TableColumn>
              <TableColumn>Usuário</TableColumn>
              <TableColumn>IP / Device</TableColumn>
              <TableColumn>Ações</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Nenhum log encontrado">
              {pageItems.map((log) => {
                const acaoInfo = getAcaoInfo(log.acao);
                const tabelaInfo = getTabelaInfo(log.tabela);
                const AcaoIcon = acaoInfo.icon;
                const TabelaIcon = tabelaInfo?.icon || TableCellsIcon;

                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-default-400" />
                        <div>
                          <p className="text-xs font-medium">
                            {fmtDate(log.criado_em)}
                          </p>
                          <p className="text-[10px] text-default-500">
                            {new Date(log.criado_em).toLocaleTimeString(
                              "pt-BR"
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AcaoIcon className="w-4 h-4" />
                        <div>
                          <Chip size="sm" color={acaoInfo.color} variant="flat">
                            {formatAcao(log.acao)}
                          </Chip>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {log.tabela ? (
                        <div className="flex items-center gap-2">
                          <TabelaIcon className="w-4 h-4 text-default-500" />
                          <span className="text-sm capitalize">
                            {log.tabela}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="max-w-[100px]">
                        {log.registro_id ? (
                          <Code size="sm" className="text-xs">
                            {log.registro_id.length > 8
                              ? `${log.registro_id.slice(0, 8)}...`
                              : log.registro_id}
                          </Code>
                        ) : (
                          "-"
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-default-400" />
                        <span className="text-xs max-w-[120px] truncate">
                          {getUsuarioNome(log.usuario_id)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {log.ip && (
                          <div className="flex items-center gap-1">
                            <GlobeAltIcon className="w-3 h-3 text-default-400" />
                            <span className="text-[10px] text-default-600">
                              {log.ip}
                            </span>
                          </div>
                        )}
                        {log.user_agent && (
                          <div className="flex items-center gap-1">
                            <ComputerDesktopIcon className="w-3 h-3 text-default-400" />
                            <span className="text-[10px] text-default-500">
                              {getDeviceInfo(log.user_agent)}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Tooltip content="Ver detalhes">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openView(log)}
                          isDisabled={!canViewDetails && !isAdmin}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <div className="flex justify-between items-center">
        <span className="text-xs text-default-500">
          {filtered.length} log(s) encontrado(s)
        </span>
        {totalPages > 1 && (
          <Pagination
            page={page}
            total={totalPages}
            onChange={setPage}
            showControls
            size="sm"
          />
        )}
      </div>

      {/* Modal Detalhes */}
      <Modal
        isOpen={viewModal.isOpen}
        onOpenChange={viewModal.onOpenChange}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5" />
            Detalhes do Log #{targetLog?.id}
          </ModalHeader>
          <ModalBody className="space-y-4">
            {targetLog && (
              <>
                {/* Informações básicas */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-default-500 text-xs mb-1">Data/Hora</p>
                    <p className="font-medium">
                      {fmtDateTime(targetLog.criado_em)}
                    </p>
                  </div>
                  <div>
                    <p className="text-default-500 text-xs mb-1">Ação</p>
                    <Chip
                      size="sm"
                      color={getAcaoInfo(targetLog.acao).color}
                      variant="flat"
                    >
                      {formatAcao(targetLog.acao)}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-default-500 text-xs mb-1">Tabela</p>
                    <p className="font-medium">{targetLog.tabela || "-"}</p>
                  </div>
                  <div>
                    <p className="text-default-500 text-xs mb-1">Registro ID</p>
                    <Code size="sm">{targetLog.registro_id || "-"}</Code>
                  </div>
                  <div>
                    <p className="text-default-500 text-xs mb-1">Usuário</p>
                    <p className="font-medium">
                      {getUsuarioNome(targetLog.usuario_id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-default-500 text-xs mb-1">IP</p>
                    <p className="font-medium">{targetLog.ip || "-"}</p>
                  </div>
                </div>

                {/* User Agent */}
                {targetLog.user_agent && (
                  <div>
                    <p className="text-default-500 text-xs mb-1">User Agent</p>
                    <Code size="sm" className="text-xs break-all">
                      {targetLog.user_agent}
                    </Code>
                  </div>
                )}

                {/* Dados anteriores */}
                {targetLog.dados_anteriores && (
                  <div>
                    <p className="text-default-500 text-xs mb-2">
                      Dados Anteriores
                    </p>
                    <ScrollShadow className="max-h-48">
                      <Code
                        size="sm"
                        className="whitespace-pre text-xs block p-3"
                      >
                        {JSON.stringify(targetLog.dados_anteriores, null, 2)}
                      </Code>
                    </ScrollShadow>
                  </div>
                )}

                {/* Dados novos */}
                {targetLog.dados_novos && (
                  <div>
                    <p className="text-default-500 text-xs mb-2">Dados Novos</p>
                    <ScrollShadow className="max-h-48">
                      <Code
                        size="sm"
                        className="whitespace-pre text-xs block p-3"
                      >
                        {JSON.stringify(targetLog.dados_novos, null, 2)}
                      </Code>
                    </ScrollShadow>
                  </div>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={viewModal.onClose}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
