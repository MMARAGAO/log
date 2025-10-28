"use client";
import { useEffect, useState, useMemo } from "react";
import { fetchTable } from "@/lib/fetchTable";
import { insertTable } from "@/lib/insertTable";
import { updateTable } from "@/lib/updateTable";
import { deleteTable } from "@/lib/deleteTable";
import { useAuthStore } from "@/store/authZustand";
import { cpfCnpjMask, phoneMask } from "@/utils/maskInput";
import {
  Card,
  CardBody,
  Spinner,
  useDisclosure,
  Pagination,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tooltip,
} from "@heroui/react";
import {
  ExclamationTriangleIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import DataHoje from "@/components/data";
import {
  ClienteStats,
  ClienteFilters,
  ClienteCard,
  ClienteModal,
  type Cliente,
  type ClienteFormData,
} from "@/components/clientes";

const ITEMS_PER_PAGE = 12;

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [editFotos, setEditFotos] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuthStore();

  // Controle de permissões
  const acessos = user?.permissoes?.acessos;
  const permClientes = acessos?.clientes;
  const canViewClientes = !!permClientes?.ver_clientes;
  const canCreateClientes = !!permClientes?.criar_clientes;
  const canEditClientes = !!permClientes?.editar_clientes;
  const canDeleteClientes = !!permClientes?.deletar_clientes;

  useEffect(() => {
    buscarClientes();
  }, []);

  async function buscarClientes() {
    try {
      const data = await fetchTable("clientes");
      setClientes(data);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Função para calcular o score de completude do cadastro
  function calcularScoreCompletude(cliente: Cliente): number {
    let score = 0;
    if (cliente.nome) score += 10;
    if (cliente.email) score += 15;
    if (cliente.telefone) score += 15;
    if (cliente.doc) score += 20;
    if (cliente.endereco) score += 10;
    if (cliente.instagram) score += 10;
    if (cliente.fotourl && cliente.fotourl.length > 0) score += 20;
    return score;
  }

  // Filtro de busca e ordenação por completude
  const clientesFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    let filtered = clientes;

    if (q) {
      filtered = clientes.filter((c) =>
        [c.nome, c.email, c.telefone, c.doc, c.instagram]
          .filter((v): v is string => Boolean(v))
          .some((v) => v.toLowerCase().includes(q))
      );
    }

    // Ordenar por completude (maior para menor)
    return filtered.sort((a, b) => {
      const scoreA = calcularScoreCompletude(a);
      const scoreB = calcularScoreCompletude(b);
      return scoreB - scoreA;
    });
  }, [busca, clientes]);

  // Paginação
  const totalPages = Math.ceil(clientesFiltrados.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = clientesFiltrados.slice(startIndex, endIndex);

  // Reset página ao mudar busca
  useEffect(() => {
    setCurrentPage(1);
  }, [busca]);

  // Handler para adicionar novo cliente
  function handleAdd() {
    if (!canCreateClientes) {
      alert("Você não possui permissão para criar clientes.");
      return;
    }
    setEditingCliente(null);
    setEditFotos([]);
    onOpen();
  }

  // Handler para editar cliente
  function handleEdit(cliente: Cliente) {
    if (!canEditClientes) {
      alert("Você não possui permissão para editar clientes.");
      return;
    }
    setEditingCliente(cliente);
    setEditFotos(cliente.fotourl ?? []);
    onOpen();
  }

  // Handler para deletar cliente
  async function handleDelete(id: number) {
    if (!canDeleteClientes) {
      alert("Você não possui permissão para deletar clientes.");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este cliente?")) {
      return;
    }

    try {
      await deleteTable("clientes", id, "id");
      await buscarClientes();
    } catch (err: any) {
      setErro(err.message);
      alert(`Erro ao deletar cliente: ${err.message}`);
    }
  }

  // Handler para submit do formulário
  async function handleSubmit(data: ClienteFormData, foto: File | null) {
    // Verificação de permissão
    if (editingCliente && !canEditClientes) {
      alert("Você não possui permissão para editar clientes.");
      return;
    }
    if (!editingCliente && !canCreateClientes) {
      alert("Você não possui permissão para criar clientes.");
      return;
    }

    try {
      // ✅ Converte campos vazios para null
      const cleanedData = {
        ...data,
        email: data.email?.trim() || null,
        telefone: data.telefone?.trim() || null,
        doc: data.doc?.trim() || null,
        endereco: data.endereco?.trim() || null,
        instagram: data.instagram?.trim() || null,
      };

      if (editingCliente) {
        // Atualizar cliente existente
        await updateTable(
          "clientes",
          editingCliente.id,
          cleanedData,
          foto ?? undefined,
          editFotos
        );
      } else {
        // Criar novo cliente
        await insertTable("clientes", cleanedData, foto ?? undefined);
      }

      await buscarClientes();
      onClose();
      setEditingCliente(null);
      setEditFotos([]);
    } catch (err: any) {
      setErro(err.message);
      alert(`Erro ao salvar cliente: ${err.message}`);
      throw err; // Re-throw para o modal tratar
    }
  }

  // Handler para remover foto
  function handleRemoveFoto(url: string) {
    setEditFotos((prev) => prev.filter((f) => f !== url));
  }

  // Verificação de loading
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Carregando clientes..." />
      </div>
    );
  }

  // Verificação de erro
  if (erro) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="max-w-md">
          <CardBody className="text-center">
            <p className="text-danger">Erro: {erro}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Bloqueio de visualização
  if (!canViewClientes) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p>Gerencie seus clientes e histórico de atendimentos</p>
          </div>
          <DataHoje />
        </div>

        <Card className="border-danger-200">
          <CardBody className="text-center py-12">
            <div className="mb-4">
              <ExclamationTriangleIcon className="w-16 h-16 text-danger mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-danger text-sm mb-4">
              Você não possui permissão para visualizar clientes.
            </p>
            <p className="text-default-500 text-xs">
              Entre em contato com o administrador para solicitar acesso.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p>Gerencie seus clientes e histórico de atendimentos</p>
        </div>
        <DataHoje />
      </div>

      {/* Estatísticas */}
      <ClienteStats clientes={clientes} />

      {/* Filtros e busca */}
      <ClienteFilters
        busca={busca}
        onBuscaChange={setBusca}
        onAddClick={handleAdd}
        canCreate={canCreateClientes}
      />

      {/* Controles de visualização e paginação */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-default-500">
          Mostrando {startIndex + 1} a{" "}
          {Math.min(endIndex, clientesFiltrados.length)} de{" "}
          {clientesFiltrados.length} clientes
        </p>

        <div className="flex gap-2 items-center">
          {/* Botões de visualização */}
          <Button
            isIconOnly
            size="sm"
            variant={viewMode === "grid" ? "solid" : "flat"}
            color={viewMode === "grid" ? "primary" : "default"}
            onPress={() => setViewMode("grid")}
          >
            <Squares2X2Icon className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant={viewMode === "list" ? "solid" : "flat"}
            color={viewMode === "list" ? "primary" : "default"}
            onPress={() => setViewMode("list")}
          >
            <ListBulletIcon className="w-4 h-4" />
          </Button>

          {/* Paginação */}
          {totalPages > 1 && (
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={setCurrentPage}
              showControls
              size="sm"
              classNames={{
                wrapper: "gap-0 overflow-visible h-8",
                item: "w-8 h-8 text-small rounded-none",
                cursor: "bg-primary-500 text-white font-bold",
              }}
            />
          )}
        </div>
      </div>

      {/* Grid ou Lista de clientes */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {currentItems.map((cliente) => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              onEdit={handleEdit}
              onDelete={handleDelete}
              canEdit={canEditClientes}
              canDelete={canDeleteClientes}
            />
          ))}

          {clientesFiltrados.length === 0 && (
            <div className="col-span-full text-center text-sm text-default-500 py-10">
              {busca
                ? "Nenhum cliente encontrado com os filtros aplicados."
                : "Nenhum cliente cadastrado. Clique em 'Adicionar Cliente' para começar."}
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table aria-label="Tabela de clientes">
            <TableHeader>
              <TableColumn>NOME</TableColumn>
              <TableColumn>CONTATO</TableColumn>
              <TableColumn>DOCUMENTO</TableColumn>
              <TableColumn>ENDEREÇO</TableColumn>
              <TableColumn>COMPLETUDE</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Nenhum cliente encontrado">
              {currentItems.map((cliente) => {
                const score = calcularScoreCompletude(cliente);
                const porcentagem = Math.round(score);

                return (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{cliente.nome}</span>
                        {cliente.instagram && (
                          <span className="text-xs text-default-500">
                            @{cliente.instagram}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        {cliente.telefone && (
                          <span>{phoneMask(cliente.telefone)}</span>
                        )}
                        {cliente.email && (
                          <span className="text-xs text-default-500">
                            {cliente.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {cliente.doc ? cpfCnpjMask(cliente.doc) : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm max-w-xs truncate block">
                        {cliente.endereco || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={
                          porcentagem >= 80
                            ? "success"
                            : porcentagem >= 50
                              ? "warning"
                              : "danger"
                        }
                        variant="flat"
                      >
                        {porcentagem}%
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {canEditClientes && (
                          <Tooltip content="Editar">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => handleEdit(cliente)}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        )}
                        {canDeleteClientes && (
                          <Tooltip content="Excluir" color="danger">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => handleDelete(cliente.id)}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginação inferior */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
            size="sm"
            classNames={{
              wrapper: "gap-0 overflow-visible h-8",
              item: "w-8 h-8 text-small rounded-none",
              cursor: "bg-primary-500 text-white font-bold",
            }}
          />
        </div>
      )}

      {/* Modal de adicionar/editar */}
      {(canCreateClientes || canEditClientes) && (
        <ClienteModal
          isOpen={isOpen}
          onClose={onClose}
          onSubmit={handleSubmit}
          cliente={editingCliente}
          editFotos={editFotos}
          onRemoveFoto={handleRemoveFoto}
        />
      )}
    </div>
  );
}
