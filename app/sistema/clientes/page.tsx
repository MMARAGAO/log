"use client";
import { useEffect, useState, useMemo } from "react";
import { fetchTable } from "@/lib/fetchTable";
import { insertTable } from "@/lib/insertTable";
import { updateTable } from "@/lib/updateTable";
import { deleteTable } from "@/lib/deleteTable";
import { supabaseService } from "@/lib/supabaseClient";
import { cpfCnpjMask, phoneMask } from "@/utils/maskInput";
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
  Switch,
  Textarea,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@heroui/react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  MapPinIcon,
  AtSymbolIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import DataHoje from "@/components/data";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [doc, setDoc] = useState("");
  const [endereco, setEndereco] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editFotos, setEditFotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [busca, setBusca] = useState("");

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
    buscarClientes();
  }, []);

  // Handlers com verificação de permissão
  function safeHandleAdd() {
    if (!canCreateClientes) {
      alert("Você não possui permissão para criar clientes.");
      return;
    }
    handleAdd();
  }

  function safeHandleEdit(cliente: any) {
    if (!canEditClientes) {
      alert("Você não possui permissão para editar clientes.");
      return;
    }
    handleEdit(cliente);
  }

  async function safeHandleDelete(id: number) {
    if (!canDeleteClientes) {
      alert("Você não possui permissão para deletar clientes.");
      return;
    }
    await handleDelete(id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Verificação de permissão no submit
    if (editId && !canEditClientes) {
      alert("Você não possui permissão para editar clientes.");
      return;
    }
    if (!editId && !canCreateClientes) {
      alert("Você não possui permissão para criar clientes.");
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        await updateTable(
          "clientes",
          editId,
          { nome, email, telefone, doc, endereco, instagram, whatsapp },
          foto ?? undefined,
          editFotos
        );
      } else {
        await insertTable(
          "clientes",
          { nome, email, telefone, doc, endereco, instagram, whatsapp },
          foto ?? undefined
        );
      }

      resetForm();
      onClose();
      const data = await fetchTable("clientes");
      setClientes(data);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setNome("");
    setEmail("");
    setTelefone("");
    setDoc("");
    setEndereco("");
    setInstagram("");
    setWhatsapp(false);
    setFoto(null);
    setEditId(null);
    setEditFotos([]);
  }

  function handleEdit(cliente: any) {
    setEditId(cliente.id);
    setNome(cliente.nome);
    setEmail(cliente.email);
    setTelefone(cliente.telefone);
    setDoc(cliente.doc);
    setEndereco(cliente.endereco);
    setInstagram(cliente.instagram);
    setWhatsapp(cliente.whatsapp);
    setFoto(null);
    setEditFotos(cliente.fotourl ?? []);
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
    setEditFotos((prev) => prev.filter((f) => f !== url));
  }

  async function handleDelete(id: number) {
    try {
      await deleteTable("clientes", id, "id");
      const data = await fetchTable("clientes");
      setClientes(data);
    } catch (err: any) {
      setErro(err.message);
    }
  }

  // Função para detectar se é CPF (PF) ou CNPJ (PJ)
  function getTipoDocumento(doc: string): "PF" | "PJ" | null {
    if (!doc) return null;
    const cleanDoc = doc.replace(/\D/g, "");

    if (cleanDoc.length === 11) return "PF"; // CPF
    if (cleanDoc.length === 14) return "PJ"; // CNPJ
    return null;
  }

  // Função para abrir WhatsApp
  function openWhatsApp(telefone: string) {
    const cleanPhone = telefone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/55${cleanPhone}`;
    window.open(whatsappUrl, "_blank");
  }

  // Função para abrir Instagram
  function openInstagram(username: string) {
    const cleanUsername = username.replace("@", "");
    const instagramUrl = `https://instagram.com/${cleanUsername}`;
    window.open(instagramUrl, "_blank");
  }

  const clientesFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) =>
      [c.nome, c.email, c.telefone, c.doc, c.instagram]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q))
    );
  }, [busca, clientes]);

  // Verificação de loading/erro
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Carregando clientes..." />
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
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p>Gerencie seus clientes e histórico de atendimentos</p>
        </div>
        <DataHoje />
      </div>

      <div className="mt-2 mb-4 flex gap-2">
        <Input
          placeholder="Nome, email, telefone, doc, Instagram..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          isClearable
          onClear={() => setBusca("")}
          startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
        />
        <div>
          {canCreateClientes && (
            <Button
              color="primary"
              startContent={<PlusIcon className="w-5 h-5" />}
              onPress={safeHandleAdd}
              className="min-w-0 w-10 p-0 lg:w-auto lg:min-w-[9rem] lg:px-4 lg:py-3"
            >
              <h1 className="hidden lg:block">Adicionar Cliente</h1>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {clientesFiltrados.map((cliente) => (
          <Card key={cliente.id} className="w-full">
            <CardBody>
              <div className="flex items-center justify-between ">
                <div className="flex  gap-4 w-full">
                  <div className="">
                    <Avatar
                      src={cliente.fotourl?.[0]}
                      fallback={<UserIcon className="w-6 h-6" />}
                      size="lg"
                    />
                  </div>
                  <div className="w-full">
                    <div className=" w-full flex justify-between">
                      <h3 className="text-lg font-semibold">
                        {(() => {
                          const parts = (cliente.nome || "")
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean);
                          if (parts.length <= 1) return parts[0] || "";
                          return `${parts[0]} ${parts[parts.length - 1]}`;
                        })()}
                      </h3>

                      {(canEditClientes || canDeleteClientes) && (
                        <div className="flex gap-2">
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
                                {canEditClientes ? (
                                  <DropdownItem
                                    key={`edit-${cliente.id}`}
                                    onPress={() => safeHandleEdit(cliente)}
                                    startContent={
                                      <PencilSquareIcon className="w-5 h-5 text-primary" />
                                    }
                                  >
                                    Editar
                                  </DropdownItem>
                                ) : null}

                                {canDeleteClientes ? (
                                  <DropdownItem
                                    key={`delete-${cliente.id}`}
                                    onPress={() => safeHandleDelete(cliente.id)}
                                    className="text-danger"
                                    startContent={
                                      <TrashIcon className="w-5 h-5 text-danger" />
                                    }
                                  >
                                    Deletar
                                  </DropdownItem>
                                ) : null}
                              </DropdownSection>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      )}
                    </div>

                    {cliente.instagram && (
                      <p className="text-small text-default-500">
                        @{cliente.instagram}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {cliente.whatsapp && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color="success"
                          className="cursor-pointer hover:opacity-80"
                          onClick={() => openWhatsApp(cliente.telefone)}
                        >
                          WhatsApp
                        </Chip>
                      )}
                      {cliente.instagram && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color="warning"
                          className="cursor-pointer hover:opacity-80"
                          onClick={() => openInstagram(cliente.instagram)}
                        >
                          Instagram
                        </Chip>
                      )}
                      {getTipoDocumento(cliente.doc) && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            getTipoDocumento(cliente.doc) === "PF"
                              ? "primary"
                              : "secondary"
                          }
                        >
                          {getTipoDocumento(cliente.doc)}
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Divider className="my-3" />

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="w-4 h-4 text-default-400" />
                  <span>{cliente.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 text-default-400" />
                  <span>{cliente.telefone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IdentificationIcon className="w-4 h-4 text-default-400" />
                  <span>{cliente.doc}</span>
                </div>
                {cliente.endereco && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-default-400" />
                    <span className="truncate">{cliente.endereco}</span>
                  </div>
                )}
              </div>
              {/* Adicione esta linha para mostrar o crédito */}
              {typeof cliente.credito !== "undefined" && (
                <p className="text-sm text-success font-semibold mt-1">
                  Crédito: R${" "}
                  {Number(cliente.credito)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                    .replace(",", ".")}
                </p>
              )}
            </CardBody>
          </Card>
        ))}

        {clientesFiltrados.length === 0 && (
          <div className="col-span-full text-center text-sm text-default-500 py-10">
            Nenhum cliente encontrado.
          </div>
        )}
      </div>

      {/* Modal - só abre se tiver permissão */}
      {(canCreateClientes || canEditClientes) && (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
          <ModalContent>
            <form onSubmit={handleSubmit}>
              <ModalHeader>
                <h3>{editId ? "Editar Cliente" : "Adicionar Cliente"}</h3>
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
                    label="CPF/CNPJ"
                    placeholder="Digite o CPF ou CNPJ"
                    value={doc}
                    onChange={(e) => setDoc(cpfCnpjMask(e.target.value))}
                    startContent={
                      <IdentificationIcon className="w-4 h-4 text-default-400" />
                    }
                    isRequired
                  />
                  <Input
                    label="Instagram"
                    placeholder="Digite o usuário do Instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    startContent={
                      <AtSymbolIcon className="w-4 h-4 text-default-400" />
                    }
                  />
                  <div className="flex items-center gap-3">
                    <Switch
                      isSelected={whatsapp}
                      onValueChange={setWhatsapp}
                      color="success"
                    >
                      Tem WhatsApp
                    </Switch>
                  </div>
                </div>

                <Textarea
                  label="Endereço"
                  placeholder="Digite o endereço completo"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  minRows={2}
                  maxRows={4}
                />

                {/* Fotos existentes */}
                {editId && editFotos.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Fotos atuais:</label>
                    <div className="flex gap-2 mt-2">
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

                {/* Upload de nova foto */}
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
                  {editId ? "Salvar alterações" : "Adicionar cliente"}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
