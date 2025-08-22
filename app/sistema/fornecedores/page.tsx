"use client";
import { useEffect, useState, useMemo } from "react";
import { fetchTable } from "@/lib/fetchTable";
import { insertTable } from "@/lib/insertTable";
import { updateTable } from "@/lib/updateTable";
import { deleteTable } from "@/lib/deleteTable";
import { cpfCnpjMask, phoneMask, cepMask } from "@/utils/maskInput";
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
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  MapPinIcon,
  GlobeAltIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import {
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon as TrashOutline,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import DataHoje from "@/components/data";

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Form fields
  const [nome, setNome] = useState("");
  const [doc, setDoc] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [site, setSite] = useState("");
  const [produtos, setProdutos] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [observacoes, setObservacoes] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editFotos, setEditFotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Busca
  const [busca, setBusca] = useState("");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuthStore();

  // Controle de permissões
  const acessos = user?.permissoes?.acessos;
  const permFornecedores = acessos?.fornecedores;
  const canViewFornecedores = !!permFornecedores?.ver_fornecedores;
  const canCreateFornecedores = !!permFornecedores?.criar_fornecedores;
  const canEditFornecedores = !!permFornecedores?.editar_fornecedores;
  const canDeleteFornecedores = !!permFornecedores?.deletar_fornecedores;

  useEffect(() => {
    async function buscarFornecedores() {
      try {
        const data = await fetchTable("fornecedores");
        setFornecedores(data || []);
      } catch (err: any) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
    }
    buscarFornecedores();
  }, []);

  const fornecedoresFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return fornecedores;
    return fornecedores.filter((f) =>
      [
        f.nome,
        f.doc,
        f.email,
        f.telefone,
        f.site,
        (f.produtos || []).join(", "),
      ]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q))
    );
  }, [busca, fornecedores]);

  function resetForm() {
    setNome("");
    setDoc("");
    setEmail("");
    setTelefone("");
    setCep("");
    setEndereco("");
    setSite("");
    setProdutos("");
    setAtivo(true);
    setObservacoes("");
    setFoto(null);
    setEditId(null);
    setEditFotos([]);
  }

  function handleAdd() {
    resetForm();
    onOpen();
  }

  function handleEdit(f: any) {
    setEditId(f.id);
    setNome(f.nome || "");
    setDoc(f.doc || "");
    setEmail(f.email || "");
    setTelefone(f.telefone || "");
    setCep(f.cep || "");
    setEndereco(f.endereco || "");
    setSite(f.site || "");
    setProdutos(Array.isArray(f.produtos) ? f.produtos.join(", ") : "");
    setAtivo(!!f.ativo);
    setObservacoes(f.observacoes || "");
    setFoto(null);
    setEditFotos(f.fotourl || []);
    onOpen();
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir fornecedor?")) return;
    try {
      await deleteTable("fornecedores", id, "id");
      const data = await fetchTable("fornecedores");
      setFornecedores(data || []);
    } catch (err: any) {
      setErro(err.message);
    }
  }

  async function handleRemoveFoto(url: string) {
    setEditFotos((prev) => prev.filter((f) => f !== url));
  }

  function getTipoDocumento(d: string): "PF" | "PJ" | null {
    if (!d) return null;
    const clean = d.replace(/\D/g, "");
    if (clean.length === 11) return "PF";
    if (clean.length === 14) return "PJ";
    return null;
  }

  function openSite(s: string) {
    if (!s) return;
    const url = s.startsWith("http") ? s : `https://${s}`;
    window.open(url, "_blank");
  }

  // Handlers com verificação de permissão
  function safeHandleAdd() {
    if (!canCreateFornecedores) {
      alert("Você não possui permissão para criar fornecedores.");
      return;
    }
    handleAdd();
  }

  function safeHandleEdit(fornecedor: any) {
    if (!canEditFornecedores) {
      alert("Você não possui permissão para editar fornecedores.");
      return;
    }
    handleEdit(fornecedor);
  }

  async function safeHandleDelete(id: number) {
    if (!canDeleteFornecedores) {
      alert("Você não possui permissão para deletar fornecedores.");
      return;
    }
    await handleDelete(id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Verificação de permissão no submit
    if (editId && !canEditFornecedores) {
      alert("Você não possui permissão para editar fornecedores.");
      return;
    }
    if (!editId && !canCreateFornecedores) {
      alert("Você não possui permissão para criar fornecedores.");
      return;
    }

    setSubmitting(true);
    try {
      const produtosArray = produtos
        ? produtos
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p)
        : [];

      if (editId) {
        await updateTable(
          "fornecedores",
          editId,
          {
            nome,
            doc,
            email,
            telefone,
            cep,
            endereco,
            site,
            produtos: produtosArray,
            ativo,
            observacoes,
          },
          foto ?? undefined,
          editFotos
        );
      } else {
        await insertTable(
          "fornecedores",
          {
            nome,
            doc,
            email,
            telefone,
            cep,
            endereco,
            site,
            produtos: produtosArray,
            ativo,
            observacoes,
          },
          foto ?? undefined
        );
      }
      resetForm();
      onClose();
      const data = await fetchTable("fornecedores");
      setFornecedores(data || []);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Verificação de loading/erro
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Carregando fornecedores..." />
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
  if (!canViewFornecedores) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold">Fornecedores</h1>
            <p>Gerencie seus fornecedores e serviços</p>
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
              Você não possui permissão para visualizar fornecedores.
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
      {/* Cabeçalho */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <p>Gerencie seus fornecedores e serviços</p>
        </div>
        <DataHoje />
      </div>

      {/* Barra de busca + botão */}
      <div className="mt-2 mb-4 flex gap-2">
        <Input
          placeholder="Nome, doc, email, telefone, site, produtos..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          isClearable
          onClear={() => setBusca("")}
          startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
        />
        <div>
          {canCreateFornecedores && (
            <Button
              color="primary"
              startContent={<PlusIcon className="w-5 h-5" />}
              onPress={safeHandleAdd}
              className="min-w-0 w-10 p-0 lg:w-auto lg:min-w-[11rem] lg:px-4 lg:py-3"
            >
              <span className="hidden lg:block">Adicionar Fornecedor</span>
            </Button>
          )}
        </div>
      </div>

      {/* Lista de cards em grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {fornecedoresFiltrados.map((f) => (
          <Card key={f.id} className="w-full">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex gap-4 w-full">
                  <div>
                    <Avatar
                      src={f.fotourl?.[0]}
                      fallback={<BuildingOffice2Icon className="w-6 h-6" />}
                      size="lg"
                    />
                  </div>
                  <div className="w-full">
                    <div className="flex justify-between w-full">
                      <h3 className="text-lg font-semibold truncate max-w-[180px]">
                        {f.nome}
                      </h3>

                      {(canEditFornecedores || canDeleteFornecedores) && (
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
                              {canEditFornecedores ? (
                                <DropdownItem
                                  key={`edit-${f.id}`}
                                  onPress={() => safeHandleEdit(f)}
                                  startContent={
                                    <PencilSquareIcon className="w-5 h-5 text-primary" />
                                  }
                                >
                                  Editar
                                </DropdownItem>
                              ) : null}

                              {canDeleteFornecedores ? (
                                <DropdownItem
                                  key={`delete-${f.id}`}
                                  onPress={() => safeHandleDelete(f.id)}
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
                    {f.site && (
                      <p className="text-small text-default-500 truncate">
                        {f.site}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Chip
                        size="sm"
                        variant="flat"
                        color={f.ativo ? "success" : "danger"}
                        className="capitalize"
                      >
                        {f.ativo ? "Ativo" : "Inativo"}
                      </Chip>
                      {f.site && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color="primary"
                          className="cursor-pointer hover:opacity-80"
                          onClick={() => openSite(f.site)}
                        >
                          Site
                        </Chip>
                      )}
                      {getTipoDocumento(f.doc) && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            getTipoDocumento(f.doc) === "PF"
                              ? "primary"
                              : "secondary"
                          }
                        >
                          {getTipoDocumento(f.doc)}
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Divider className="my-3" />
              <div className="flex flex-wrap gap-2 mb-3">
                {Array.isArray(f.produtos) &&
                  f.produtos.map((p: string, i: number) => (
                    <Chip key={i} size="sm" variant="dot" color="default">
                      {p}
                    </Chip>
                  ))}
              </div>

              <div className="flex flex-col gap-2 text-sm">
                {f.email && (
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="w-4 h-4 text-default-400" />
                    <span className="truncate">{f.email}</span>
                  </div>
                )}
                {f.telefone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="w-4 h-4 text-default-400" />
                    <span className="truncate">{f.telefone}</span>
                  </div>
                )}
                {f.doc && (
                  <div className="flex items-center gap-2">
                    <IdentificationIcon className="w-4 h-4 text-default-400" />
                    <span className="truncate">{f.doc}</span>
                  </div>
                )}
                {f.cep && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-default-400" />
                    <span className="truncate">{f.cep}</span>
                  </div>
                )}
              </div>

              {f.observacoes && (
                <div className="mt-3">
                  <p className="text-xs text-default-500 whitespace-pre-line">
                    <strong>Obs:</strong> {f.observacoes}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        ))}

        {fornecedoresFiltrados.length === 0 && (
          <div className="col-span-full text-center text-sm text-default-500 py-10">
            Nenhum fornecedor encontrado.
          </div>
        )}
      </div>

      {/* Modal - só abre se tiver permissão */}
      {(canCreateFornecedores || canEditFornecedores) && (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
          <ModalContent>
            <form onSubmit={handleSubmit}>
              <ModalHeader>
                <h3>{editId ? "Editar Fornecedor" : "Adicionar Fornecedor"}</h3>
              </ModalHeader>
              <ModalBody className="gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome da empresa"
                    placeholder="Digite o nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    startContent={
                      <BuildingOffice2Icon className="w-4 h-4 text-default-400" />
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
                  />
                  <Input
                    label="Telefone"
                    placeholder="Digite o telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(phoneMask(e.target.value))}
                    startContent={
                      <PhoneIcon className="w-4 h-4 text-default-400" />
                    }
                  />
                  <Input
                    label="CEP"
                    placeholder="Digite o CEP"
                    value={cep}
                    onChange={(e) => setCep(cepMask(e.target.value))}
                    startContent={
                      <MapPinIcon className="w-4 h-4 text-default-400" />
                    }
                  />
                  <Input
                    label="Site"
                    placeholder="Digite o site"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    startContent={
                      <GlobeAltIcon className="w-4 h-4 text-default-400" />
                    }
                  />
                </div>

                <Textarea
                  label="Endereço"
                  placeholder="Digite o endereço completo"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  minRows={2}
                  maxRows={4}
                />

                <Input
                  label="Produtos/Serviços"
                  placeholder="Ex: Móveis, Decoração, Iluminação (separar por vírgula)"
                  value={produtos}
                  onChange={(e) => setProdutos(e.target.value)}
                  description="Separe por vírgula"
                />

                <Textarea
                  label="Observações"
                  placeholder="Observações adicionais"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  minRows={2}
                  maxRows={4}
                />

                <div className="flex items-center gap-3">
                  <Switch
                    isSelected={ativo}
                    onValueChange={setAtivo}
                    color="success"
                  >
                    Fornecedor Ativo
                  </Switch>
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
                  {editId ? "Salvar alterações" : "Adicionar fornecedor"}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
