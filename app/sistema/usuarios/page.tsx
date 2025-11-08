"use client";
import { useEffect, useState, useMemo } from "react";
import { fetchTable } from "@/lib/fetchTable";
import { insertTable } from "@/lib/insertTable";
import { updateTable } from "@/lib/updateTable";
import { supabaseService } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authZustand";
import {
  Card,
  CardBody,
  Input,
  Button,
  Avatar,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Divider,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
  Checkbox,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  PlusIcon,
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import {
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon as TrashOutline,
  MagnifyingGlassIcon,
  PhotoIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  TagIcon,
  CreditCardIcon,
  CheckIcon,
  UserGroupIcon,
  ArrowUturnLeftIcon,
  PaperAirplaneIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  UsersIcon,
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { cpfMask, phoneMask } from "@/utils/maskInput";
import DataHoje from "@/components/data";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Lojas
  const [lojas, setLojas] = useState<Array<{ id: number; nome: string }>>([]);
  const [lojaSelecionada, setLojaSelecionada] = useState<
    number | "todas" | null
  >(null);

  // Busca
  const [busca, setBusca] = useState("");

  // Form
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [senha, setSenha] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editFotos, setEditFotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Permissões
  const [permissoesOpen, setPermissoesOpen] = useState(false);
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState(false);
  const [permUserId, setPermUserId] = useState<string | null>(null);
  const [permissoes, setPermissoes] = useState<any>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuthStore();
  // default permissions
  // No arquivo onde você tem o defaultPermissoes do sistema de usuários
  const defaultPermissoes = useMemo(
    () => ({
      acessos: {
        dashboard: {
          ver_dashboard: false,
          ver_relatorios: false,
          exportar_dados: false,
        },
        clientes: {
          criar_clientes: false,
          ver_clientes: false,
          editar_clientes: false,
          deletar_clientes: false,
          processar_creditos: false,
        },
        ordens: {
          criar_ordens: false,
          ver_ordens: false,
          pdf_ordens: false,
          editar_ordens: false,
          deletar_ordens: false,
        },
        estoque: {
          criar_estoque: false,
          ver_estoque: false,
          editar_estoque: false,
          deletar_estoque: false,
          ver_estatisticas_estoque: false,
          ver_preco_custo: false,
        },
        fornecedores: {
          criar_fornecedores: false,
          ver_fornecedores: false,
          editar_fornecedores: false,
          deletar_fornecedores: false,
        },
        usuarios: {
          criar_usuarios: false,
          ver_usuarios: false,
          editar_usuarios: false,
          deletar_usuarios: false,
        },
        vendas: {
          criar_vendas: false,
          ver_vendas: false,
          ver_todas_vendas: false, // NOVO: Permite ver vendas de todos os usuários
          editar_vendas: false,
          editar_vendas_pagas: false, // NOVO: Permite editar vendas mesmo depois de pagas
          deletar_vendas: false,
          processar_pagamentos: false,
          aplicar_desconto: false,
          desconto_maximo: 0,
          ver_estatisticas_faturamento: false, // NOVO: Permite ver cards de estatísticas e faturamento
        },
        logs: {
          ver_logs: false,
          exportar_logs: false,
          filtrar_logs: false,
          ver_detalhes_logs: false,
        },
        lojas: {
          criar_lojas: false,
          ver_lojas: false,
          editar_lojas: false,
          deletar_lojas: false,
        },
        transferencias: {
          criar_transferencias: false,
          ver_transferencias: false,
          editar_transferencias: false,
          deletar_transferencias: false,
          confirmar_transferencias: false,
        },
        devolucoes: {
          criar_devolucoes: false,
          ver_devolucoes: false,
          editar_devolucoes: false,
          deletar_devolucoes: false,
          processar_creditos: false,
          deletar_sem_restricao: false,
        },
        rma: {
          ver_rma: false,
          criar_rma: false,
          editar_rma: false,
          deletar_rma: false,
        },
        rma_clientes: {
          ver_rma_clientes: false,
          criar_rma_clientes: false,
          editar_rma_clientes: false,
          deletar_rma_clientes: false,
        },
        caixa: {
          abrir_caixa: false,
          ver_caixa: false,
          fechar_caixa: false,
        },
      },
    }),
    []
  );

  const acessos = user?.permissoes?.acessos;
  const permUsuarios = acessos?.usuarios;
  const canViewUsuarios = !!permUsuarios?.ver_usuarios;
  const canCreateUsuarios = !!permUsuarios?.criar_usuarios;
  const canEditUsuarios = !!permUsuarios?.editar_usuarios;
  const canDeleteUsuarios = !!permUsuarios?.deletar_usuarios;

  // Opcional: impedir abertura de modal sem permissão
  function safeHandleAdd() {
    if (!canCreateUsuarios) return alert("Sem permissão para criar usuários.");
    handleAdd();
  }
  function safeHandleEdit(u: any) {
    if (!canEditUsuarios) return alert("Sem permissão para editar usuários.");
    handleEdit(u);
  }
  async function safeHandleDelete(id: string) {
    if (!canDeleteUsuarios)
      return alert("Sem permissão para deletar usuários.");
    await handleDelete(id);
  }
  function toggleAllPerms(sec: string, enable: boolean) {
    setPermissoes((prev: any) => {
      const newPerms = { ...prev.acessos[sec] };
      Object.keys(newPerms).forEach((key) => {
        if (key !== "desconto_maximo") {
          // Não alterar o desconto
          newPerms[key] = enable;
        }
      });
      return {
        acessos: {
          ...prev.acessos,
          [sec]: newPerms,
        },
      };
    });
  }
  function updateDescontoMaximo(sec: string, value: number) {
    setPermissoes((prev: any) => ({
      acessos: {
        ...prev.acessos,
        [sec]: {
          ...prev.acessos[sec],
          desconto_maximo: Math.min(Math.max(value, 0), 100), // Entre 0 e 100%
        },
      },
    }));
  }

  // Load initial
  useEffect(() => {
    async function buscarUsuarios() {
      try {
        const data = await fetchTable("usuarios");
        setUsuarios(data);
      } catch (err: any) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
    }
    async function buscarLojas() {
      try {
        const data = await fetchTable("lojas");
        setLojas(data);
      } catch (err: any) {
        console.error("Erro ao buscar lojas:", err);
      }
    }
    if (canViewUsuarios) {
      buscarUsuarios();
      buscarLojas();
    } else {
      setLoading(false);
    }
  }, [canViewUsuarios]);

  // Filtro
  const usuariosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) =>
      [u.nome, u.nickname, u.email, u.telefone, u.cpf, u.cargo]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q))
    );
  }, [busca, usuarios]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await updateTable(
          "usuarios",
          editId,
          { nome, email, nickname, telefone, cpf, cargo },
          foto ?? undefined,
          editFotos
        );
      } else {
        await insertTable(
          "usuarios",
          { nome, email, nickname, telefone, cpf, cargo, senha },
          foto ?? undefined
        );
      }
      resetForm();
      onClose();
      const data = await fetchTable("usuarios");
      setUsuarios(data);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setNome("");
    setEmail("");
    setNickname("");
    setTelefone("");
    setCpf("");
    setCargo("");
    setSenha("");
    setFoto(null);
    setEditId(null);
    setEditFotos([]);
  }

  function handleEdit(usuario: any) {
    setEditId(usuario.uuid);
    setNome(usuario.nome || "");
    setEmail(usuario.email || "");
    setNickname(usuario.nickname || "");
    setTelefone(usuario.telefone || "");
    setCpf(usuario.cpf || "");
    setCargo(usuario.cargo || "");
    setFoto(null);
    setSenha("");
    setEditFotos(usuario.fotourl ?? []);
    onOpen();
  }

  function handleAdd() {
    resetForm();
    onOpen();
  }

  function getFileNameFromUrl(url: string) {
    const parts = url.split("/");
    return parts[parts.length - 1].split("?")[0];
  }

  async function handleRemoveFoto(url: string) {
    try {
      const fileName = getFileNameFromUrl(url);
      await supabaseService.storage.from("usuarios").remove([fileName]);
      setEditFotos((prev) => prev.filter((f) => f !== url));
    } catch (err) {
      console.error("Erro ao remover foto:", err);
    }
  }

  async function handleDelete(uuid: string) {
    if (!confirm("Excluir usuário?")) return;
    try {
      await fetch("/api/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid }),
      });
      const data = await fetchTable("usuarios");
      setUsuarios(data);
    } catch (err: any) {
      setErro(err.message);
    }
  }

  async function abrirPermissoes(u: any) {
    setPermUserId(u.uuid);
    setPermissoes(null);
    setLojaSelecionada(null); // Reset da seleção - sem loja pré-definida
    setPermissoesOpen(true);
    setPermLoading(true);
    try {
      // Tenta buscar com loja_id, mas se falhar, tenta sem
      let data: any = null;
      let error = null;

      try {
        const result = await supabaseService
          .from("permissoes")
          .select("acessos, loja_id")
          .eq("id", u.uuid)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } catch (e: any) {
        // Se falhar com loja_id (coluna não existe), tenta sem
        console.warn("Tentando buscar sem loja_id:", e);
        const result = await supabaseService
          .from("permissoes")
          .select("acessos")
          .eq("id", u.uuid)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      console.log("Dados carregados do banco:", data);

      if (error) {
        console.error("Erro ao buscar permissões:", error);
        throw error;
      }

      // Define a loja selecionada
      if (data?.loja_id) {
        setLojaSelecionada(data.loja_id);
      } else if (data && data.loja_id === null && data.acessos) {
        // Explicitamente definido como "todas as lojas" (null no banco)
        setLojaSelecionada("todas");
      } else {
        // Sem definição ainda
        setLojaSelecionada(null);
      }

      // Merge das permissões existentes com as novas estruturas
      if (data?.acessos) {
        const permissoesExistentes = data.acessos;
        const permissoesMerged = { ...defaultPermissoes.acessos };

        // Para cada seção nas permissões default
        (
          Object.keys(defaultPermissoes.acessos) as Array<
            keyof typeof defaultPermissoes.acessos
          >
        ).forEach((secao) => {
          if (permissoesExistentes[secao]) {
            // Se a seção já existe, merge as permissões
            permissoesMerged[secao] = {
              ...defaultPermissoes.acessos[secao],
              ...permissoesExistentes[secao],
            };
          }
          // Se não existe, mantém os valores default (false)
        });

        console.log("Permissões merged:", permissoesMerged);
        setPermissoes({ acessos: permissoesMerged });
      } else {
        // Usuário sem permissões, usa default
        console.log("Usuário sem permissões, usando default");
        setPermissoes({ acessos: defaultPermissoes.acessos });
      }
    } catch (e) {
      console.warn("Erro carregando permissões:", e);
      setPermissoes({ acessos: defaultPermissoes.acessos });
    } finally {
      setPermLoading(false);
    }
  }

  function togglePerm(sec: string, key: string) {
    setPermissoes((prev: any) => ({
      acessos: {
        ...prev.acessos,
        [sec]: {
          ...prev.acessos[sec],
          [key]: !prev.acessos[sec][key],
        },
      },
    }));
  }

  async function salvarPermissoes() {
    if (!permUserId || !permissoes) return;

    // Validação: loja deve ser selecionada
    if (lojaSelecionada === null) {
      alert("Por favor, selecione uma loja antes de salvar as permissões.");
      return;
    }

    setPermSaving(true);
    try {
      const payload = {
        id: permUserId,
        acessos: permissoes.acessos,
        loja_id: lojaSelecionada === "todas" ? null : lojaSelecionada,
      };
      const { error } = await supabaseService
        .from("permissoes")
        .upsert(payload, { onConflict: "id" });
      if (error) throw error;

      // Atualiza as permissões no store se for do usuário logado
      if (permUserId === user?.id) {
        await useAuthStore.getState().refreshPermissoes();
      }

      setPermissoesOpen(false);
    } catch (e: any) {
      alert("Erro ao salvar permissões: " + (e.message || e));
    } finally {
      setPermSaving(false);
    }
  }

  // Após verificação de loading/erro:
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Carregando usuários..." />
      </div>
    );
  }
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
  if (!canViewUsuarios) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p>Gerencie usuários do sistema</p>
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
              Você não possui permissão para visualizar usuários.
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
      {/* Cabeçalho alinhado às outras telas */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p>Gerencie usuários do sistema</p>
        </div>
        <DataHoje />
      </div>

      {/* Busca + botão */}
      <div className="mt-2 mb-4 flex gap-2">
        <Input
          placeholder="Nome, nickname, email, telefone, CPF, cargo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          isClearable
          onClear={() => setBusca("")}
          startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
        />
        <div>
          {canCreateUsuarios && (
            <Button
              color="primary"
              startContent={<PlusIcon className="w-5 h-5" />}
              onPress={safeHandleAdd}
              className="min-w-0 w-10 p-0 lg:w-auto lg:min-w-[10rem] lg:px-4 lg:py-3"
            >
              <span className="hidden lg:block">Adicionar Usuário</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid de cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {usuariosFiltrados.map((u) => (
          <Card key={u.uuid} className="w-full">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex gap-4 w-full">
                  <div>
                    <Avatar
                      src={u.fotourl?.[0]}
                      fallback={<UserIcon className="w-6 h-6" />}
                      size="lg"
                    />
                  </div>
                  <div className="w-full">
                    <div className="flex justify-between w-full">
                      <h3 className="text-lg font-semibold truncate max-w-[180px]">
                        {u.nome}
                      </h3>

                      {(canEditUsuarios || canDeleteUsuarios) && (
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              startContent={
                                <EllipsisVerticalIcon className="w-5 h-5" />
                              }
                            />
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownSection title="Ações">
                              {canEditUsuarios ? (
                                <DropdownItem
                                  key={`edit-${u.uuid}`}
                                  onPress={() => safeHandleEdit(u)}
                                  startContent={
                                    <PencilSquareIcon className="w-5 h-5 text-primary" />
                                  }
                                >
                                  Editar
                                </DropdownItem>
                              ) : null}

                              {canEditUsuarios ? (
                                <DropdownItem
                                  key={`perms-${u.uuid}`}
                                  onPress={() => abrirPermissoes(u)}
                                  startContent={
                                    <ShieldCheckIcon className="w-5 h-5 text-warning" />
                                  }
                                >
                                  Permissões
                                </DropdownItem>
                              ) : null}

                              {canDeleteUsuarios ? (
                                <DropdownItem
                                  key={`delete-${u.uuid}`}
                                  onPress={() => safeHandleDelete(u.uuid)}
                                  className="text-danger"
                                  startContent={
                                    <TrashOutline className="w-5 h-5 text-danger" />
                                  }
                                >
                                  Deletar
                                </DropdownItem>
                              ) : null}
                            </DropdownSection>
                          </DropdownMenu>
                        </Dropdown>
                      )}
                    </div>
                    <p className="text-small text-default-500 truncate">
                      @{u.nickname}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {u.cargo && (
                        <Chip size="sm" variant="flat" color="primary">
                          {u.cargo}
                        </Chip>
                      )}
                      {Array.isArray(u.fotourl) && u.fotourl.length > 1 && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color="secondary"
                          startContent={<PhotoIcon className="w-3 h-3" />}
                        >
                          {u.fotourl.length} fotos
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Divider className="my-3" />

              <div className="flex flex-col gap-2 text-sm">
                {u.email && (
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="w-4 h-4 text-default-400" />
                    <span className="truncate">{u.email}</span>
                  </div>
                )}
                {u.telefone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="w-4 h-4 text-default-400" />
                    <span className="truncate">{u.telefone}</span>
                  </div>
                )}
                {u.cpf && (
                  <div className="flex items-center gap-2">
                    <IdentificationIcon className="w-4 h-4 text-default-400" />
                    <span className="truncate">{u.cpf}</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ))}

        {usuariosFiltrados.length === 0 && (
          <div className="col-span-full text-center text-sm text-default-500 py-10">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="outside"
      >
        <ModalContent>
          <form
            onSubmit={(e) => {
              if (editId && !canEditUsuarios) {
                e.preventDefault();
                return alert("Sem permissão para editar.");
              }
              if (!editId && !canCreateUsuarios) {
                e.preventDefault();
                return alert("Sem permissão para criar.");
              }
              handleSubmit(e);
            }}
          >
            <ModalHeader>
              <h3>{editId ? "Editar Usuário" : "Adicionar Usuário"}</h3>
            </ModalHeader>
            <ModalBody className="gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome completo"
                  placeholder="Digite o nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  startContent={
                    <UserIcon className="w-4 h-4 text-default-400" />
                  }
                  isRequired
                />
                <Input
                  label="Nickname"
                  placeholder="Digite o nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  startContent={<span className="text-default-400">@</span>}
                  isRequired
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="Digite o email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  startContent={
                    <EnvelopeIcon className="w-4 h-4 text-default-400" />
                  }
                  isRequired
                />
                {!editId && (
                  <Input
                    label="Senha"
                    type="password"
                    placeholder="Digite a senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    isRequired
                  />
                )}
                <Input
                  label="Telefone"
                  placeholder="Digite o telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(phoneMask(e.target.value))}
                  startContent={
                    <PhoneIcon className="w-4 h-4 text-default-400" />
                  }
                  isRequired
                />
                <Input
                  label="CPF"
                  placeholder="Digite o CPF"
                  value={cpf}
                  onChange={(e) => setCpf(cpfMask(e.target.value))}
                  startContent={
                    <IdentificationIcon className="w-4 h-4 text-default-400" />
                  }
                  isRequired
                />
                <Input
                  label="Cargo"
                  placeholder="Digite o cargo"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  startContent={
                    <BriefcaseIcon className="w-4 h-4 text-default-400" />
                  }
                  isRequired
                />
              </div>

              {editId && editFotos.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Fotos atuais:</label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {editFotos.map((url) => (
                      <div key={url} className="relative">
                        <Avatar src={url} size="lg" />
                        <Button
                          isIconOnly
                          size="sm"
                          color="danger"
                          variant="solid"
                          className="absolute -top-2 -right-2"
                          onPress={() => handleRemoveFoto(url)}
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Nova foto:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="flat"
                onPress={() => {
                  resetForm();
                  onClose();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" color="primary" isLoading={submitting}>
                {editId ? "Salvar alterações" : "Adicionar usuário"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {permissoesOpen && canEditUsuarios && (
        <Modal
          isOpen={permissoesOpen}
          onClose={() => setPermissoesOpen(false)}
          size="5xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            <ModalHeader className="flex items-center gap-3 pb-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-t-lg">
              <div className="p-2 bg-primary-100 rounded-full">
                <ShieldCheckIcon className="w-6 h-6 text-primary-700" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Permissões do Usuário</h3>
                <p className="text-sm text-default-500">
                  Configure os acessos e privilégios do sistema
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="gap-6 py-6">
              {permLoading && (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" label="Carregando permissões..." />
                </div>
              )}

              {!permLoading && permissoes && (
                <div className="space-y-6">
                  {/* Seleção de Loja */}
                  <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-secondary-100 rounded-full">
                        <BuildingStorefrontIcon className="w-5 h-5 text-secondary-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-secondary-800">
                          Loja de Operação
                        </h4>
                        <p className="text-sm text-secondary-600">
                          Defina em qual loja o usuário terá acesso
                        </p>
                      </div>
                    </div>

                    <Select
                      label="Loja"
                      placeholder="Selecione a loja"
                      selectedKeys={
                        lojaSelecionada === null
                          ? []
                          : lojaSelecionada === "todas"
                            ? ["todas"]
                            : [lojaSelecionada.toString()]
                      }
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        if (!value) {
                          setLojaSelecionada(null);
                        } else if (value === "todas") {
                          setLojaSelecionada("todas");
                        } else {
                          setLojaSelecionada(Number(value));
                        }
                      }}
                      className="max-w-full"
                      variant="bordered"
                      startContent={
                        <BuildingStorefrontIcon className="w-4 h-4 text-secondary-500" />
                      }
                      isRequired
                    >
                      {
                        [
                          <SelectItem key="todas">Todas as Lojas</SelectItem>,
                          ...lojas.map((loja) => (
                            <SelectItem key={loja.id.toString()}>
                              {loja.nome}
                            </SelectItem>
                          )),
                        ] as any
                      }
                    </Select>

                    {lojaSelecionada === "todas" && (
                      <div className="mt-3 p-3 bg-warning-50 rounded-lg border border-warning-200">
                        <p className="text-xs text-warning-700 flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          Este usuário terá acesso a todas as lojas do sistema
                        </p>
                      </div>
                    )}

                    {lojaSelecionada !== null &&
                      lojaSelecionada !== "todas" && (
                        <div className="mt-3 p-3 bg-success-50 rounded-lg border border-success-200">
                          <p className="text-xs text-success-700 flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4" />
                            Acesso restrito à loja:{" "}
                            <strong>
                              {
                                lojas.find((l) => l.id === lojaSelecionada)
                                  ?.nome
                              }
                            </strong>
                          </p>
                        </div>
                      )}

                    {lojaSelecionada === null && (
                      <div className="mt-3 p-3 bg-default-100 rounded-lg border border-default-200">
                        <p className="text-xs text-default-600 flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          Nenhuma loja selecionada - o usuário não terá acesso
                          ao sistema
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Contador geral de permissões */}
                  <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-primary-800">
                          Resumo das Permissões
                        </h4>
                        <p className="text-sm text-primary-600">
                          {Object.values(permissoes.acessos).reduce(
                            (total: number, perms: any) => {
                              return (
                                total +
                                Object.values(perms).filter(
                                  (v, i, arr) =>
                                    typeof v === "boolean" && v === true
                                ).length
                              );
                            },
                            0
                          )}{" "}
                          permissões ativas
                        </p>
                      </div>
                      <Chip color="primary" variant="flat" size="lg">
                        {Object.keys(permissoes.acessos).length} módulos
                      </Chip>
                    </div>
                  </div>

                  {Object.entries(permissoes.acessos).map(
                    ([sec, perms]: any) => {
                      const booleanPerms = Object.entries(perms).filter(
                        ([k, v]) => typeof v === "boolean"
                      );
                      const numericPerms = Object.entries(perms).filter(
                        ([k, v]) => typeof v === "number"
                      );
                      const permCount = booleanPerms.filter(
                        ([k, v]) => v === true
                      ).length;
                      const totalPerms = booleanPerms.length;

                      // Função para obter o ícone correto
                      const getSectionIcon = (section: string) => {
                        switch (section) {
                          case "dashboard":
                            return <ChartBarIcon className="w-5 h-5" />;
                          case "vendas":
                            return <CurrencyDollarIcon className="w-5 h-5" />;
                          case "estoque":
                            return <ArchiveBoxIcon className="w-5 h-5" />;
                          case "usuarios":
                            return <UsersIcon className="w-5 h-5" />;
                          case "clientes":
                            return <UserIcon className="w-5 h-5" />;
                          case "rma":
                            return <ArrowPathIcon className="w-5 h-5" />;
                          case "logs":
                            return <DocumentTextIcon className="w-5 h-5" />;
                          case "lojas":
                            return (
                              <BuildingStorefrontIcon className="w-5 h-5" />
                            );
                          case "ordens":
                            return (
                              <ClipboardDocumentListIcon className="w-5 h-5" />
                            );
                          case "fornecedores":
                            return <BuildingOfficeIcon className="w-5 h-5" />;
                          case "transferencias":
                            return <PaperAirplaneIcon className="w-5 h-5" />;
                          case "devolucoes":
                            return <ArrowUturnLeftIcon className="w-5 h-5" />;
                          default:
                            return <UserGroupIcon className="w-5 h-5" />;
                        }
                      };

                      return (
                        <div
                          key={sec}
                          className="border border-divider rounded-xl p-6 bg-content1 shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Header da seção com controles */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${
                                  sec === "dashboard"
                                    ? "bg-blue-100 text-blue-700"
                                    : sec === "vendas"
                                      ? "bg-green-100 text-green-700"
                                      : sec === "estoque"
                                        ? "bg-purple-100 text-purple-700"
                                        : sec === "usuarios"
                                          ? "bg-orange-100 text-orange-700"
                                          : sec === "clientes"
                                            ? "bg-cyan-100 text-cyan-700"
                                            : sec === "rma"
                                              ? "bg-red-100 text-red-700"
                                              : sec === "logs"
                                                ? "bg-gray-100 text-gray-700"
                                                : sec === "lojas"
                                                  ? "bg-pink-100 text-pink-700"
                                                  : sec === "ordens"
                                                    ? "bg-indigo-100 text-indigo-700"
                                                    : sec === "fornecedores"
                                                      ? "bg-yellow-100 text-yellow-700"
                                                      : sec === "transferencias"
                                                        ? "bg-teal-100 text-teal-700"
                                                        : sec === "devolucoes"
                                                          ? "bg-rose-100 text-rose-700"
                                                          : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {getSectionIcon(sec)}
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold capitalize">
                                  {sec.replace(/_/g, " ")}
                                </h4>
                                <p className="text-xs text-default-500">
                                  {permCount} de {totalPerms} permissões ativas
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Chip
                                size="md"
                                variant="flat"
                                color={permCount > 0 ? "success" : "default"}
                              >
                                {permCount}/{totalPerms}
                              </Chip>

                              {/* Botões de ação rápida */}
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="flat"
                                  color="success"
                                  onPress={() => toggleAllPerms(sec, true)}
                                  title="Ativar todas"
                                  startContent={
                                    <CheckIcon className="w-3 h-3" />
                                  }
                                >
                                  Todas
                                </Button>
                                <Button
                                  size="sm"
                                  variant="flat"
                                  color="danger"
                                  onPress={() => toggleAllPerms(sec, false)}
                                  title="Desativar todas"
                                  startContent={
                                    <XMarkIcon className="w-3 h-3" />
                                  }
                                >
                                  Nenhuma
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Grid de permissões booleanas */}
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                            {booleanPerms.map(([k, v]: [string, any]) => (
                              <div
                                key={k}
                                className={`p-3 rounded-lg border transition-colors ${
                                  v
                                    ? "bg-success-50 border-success-200"
                                    : "bg-default-50 border-default-200"
                                }`}
                              >
                                <Checkbox
                                  isSelected={v}
                                  onChange={() => togglePerm(sec, k)}
                                  size="sm"
                                  classNames={{
                                    label: "text-sm font-medium",
                                  }}
                                >
                                  <span className="capitalize">
                                    {k.replace(/_/g, " ")}
                                  </span>
                                </Checkbox>
                              </div>
                            ))}
                          </div>

                          {/* Controles especiais (como desconto para vendas) */}
                          {sec === "vendas" && numericPerms.length > 0 && (
                            <div className="mt-4 p-4 bg-warning-50 rounded-lg border border-warning-200">
                              <h5 className="font-semibold text-warning-800 mb-3 flex items-center gap-2">
                                <CreditCardIcon className="w-5 h-5" />
                                Configurações Especiais de Vendas
                              </h5>
                              {numericPerms.map(([k, v]: [string, any]) => (
                                <div key={k} className="space-y-2">
                                  {k === "desconto_maximo" && (
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-warning-700 flex items-center gap-2">
                                          <TagIcon className="w-4 h-4" />
                                          Desconto Máximo Permitido
                                        </label>
                                        <Chip
                                          size="sm"
                                          color="warning"
                                          variant="flat"
                                        >
                                          {v}%
                                        </Chip>
                                      </div>
                                      <div className="flex gap-3 items-center">
                                        <Input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={v.toString()}
                                          onChange={(e) =>
                                            updateDescontoMaximo(
                                              sec,
                                              Number(e.target.value)
                                            )
                                          }
                                          endContent="%"
                                          size="sm"
                                          className="w-24"
                                          variant="bordered"
                                        />
                                        <div className="flex-1 text-xs text-warning-600">
                                          Define o percentual máximo de desconto
                                          que este usuário pode aplicar nas
                                          vendas
                                        </div>
                                      </div>
                                      {/* Barra visual do desconto */}
                                      <div className="mt-2">
                                        <div className="w-full bg-default-200 rounded-full h-2">
                                          <div
                                            className="bg-warning-500 h-2 rounded-full transition-all"
                                            style={{ width: `${v}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </ModalBody>

            <ModalFooter className="border-t border-divider pt-4 bg-default-50 rounded-b-lg">
              <div className="flex justify-between items-center w-full">
                <div className="text-sm text-default-500 flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-success" />
                  As permissões entram em vigor imediatamente após salvar
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="light"
                    onPress={() => setPermissoesOpen(false)}
                    isDisabled={permSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    color="primary"
                    onPress={salvarPermissoes}
                    isLoading={permSaving}
                    isDisabled={permLoading}
                    className="px-6"
                  >
                    {permSaving ? "Salvando..." : "Salvar Permissões"}
                  </Button>
                </div>
              </div>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
