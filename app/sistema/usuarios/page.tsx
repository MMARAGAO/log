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
} from "@heroicons/react/24/outline";
import { cpfMask, phoneMask } from "@/utils/maskInput";
import DataHoje from "@/components/data";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

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
          editar_vendas: false,
          deletar_vendas: false,
          processar_pagamentos: false,
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
    if (canViewUsuarios) {
      buscarUsuarios();
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
    setPermissoesOpen(true);
    setPermLoading(true);
    try {
      const { data, error } = await supabaseService
        .from("permissoes")
        .select("acessos")
        .eq("id", u.uuid)
        .maybeSingle();
      if (error) throw error;

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

        setPermissoes({ acessos: permissoesMerged });
      } else {
        // Usuário sem permissões, usa default
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
    setPermSaving(true);
    try {
      const payload = { id: permUserId, acessos: permissoes.acessos };
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

      {/* Modal Permissões */}
      {permissoesOpen && canEditUsuarios && (
        <Modal
          isOpen={permissoesOpen}
          onClose={() => setPermissoesOpen(false)}
          size="4xl"
          scrollBehavior="outside"
        >
          <ModalContent>
            <ModalHeader className="flex items-center gap-3 pb-4">
              <ShieldCheckIcon className="w-6 h-6 text-primary" />
              <div>
                <h3 className="text-xl font-semibold">Permissões do Usuário</h3>
                <p className="text-sm text-default-500">
                  Configure os acessos do sistema
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="gap-6">
              {permLoading && (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" label="Carregando permissões..." />
                </div>
              )}

              {!permLoading && permissoes && (
                <div className="space-y-6">
                  {Object.entries(permissoes.acessos).map(
                    ([sec, perms]: any) => {
                      const permCount =
                        Object.values(perms).filter(Boolean).length;
                      const totalPerms = Object.keys(perms).length;

                      return (
                        <div
                          key={sec}
                          className="border border-divider rounded-lg p-4 bg-content1/50"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-medium capitalize">
                              {sec.replace(/_/g, " ")}
                            </h4>
                            <Chip
                              size="sm"
                              variant="flat"
                              color={permCount > 0 ? "primary" : "default"}
                            >
                              {permCount}/{totalPerms}
                            </Chip>
                          </div>

                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(perms).map(
                              ([k, v]: [string, any]) => (
                                <Checkbox
                                  key={k}
                                  isSelected={v}
                                  onChange={() => togglePerm(sec, k)}
                                  size="sm"
                                  classNames={{
                                    label: "text-sm",
                                  }}
                                >
                                  {k.replace(/_/g, " ")}
                                </Checkbox>
                              )
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </ModalBody>

            <ModalFooter className="border-t border-divider pt-4">
              <Button
                variant="flat"
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
              >
                Salvar Permissões
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
