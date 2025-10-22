"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
  Chip,
} from "@heroui/react";
import {
  CameraIcon,
  PhotoIcon,
  DocumentTextIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import type {
  EstoqueAparelho,
  VendaAparelho,
  Cliente,
  Loja,
  FormaPagamento,
} from "@/types/aparelhos";
import {
  formatarIMEI,
  formatarMoeda,
  calcularValorFinal,
} from "@/utils/aparelhos";

interface CadastroVendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalType:
    | "cadastro"
    | "venda"
    | "detalhes"
    | "detalhes-venda"
    | "editar-venda";
  selectedAparelho: EstoqueAparelho | null;
  selectedVenda: VendaAparelho | null;
  formCadastro: Partial<EstoqueAparelho>;
  setFormCadastro: (form: Partial<EstoqueAparelho>) => void;
  formVenda: Partial<VendaAparelho>;
  setFormVenda: (form: Partial<VendaAparelho>) => void;
  clientes: Cliente[];
  lojas: Loja[];
  loading: boolean;
  onCadastrar: () => void;
  onVender: () => void;
  onSalvarEdicaoVenda: () => void;
  onAbrirCameraIMEI: () => void;
  onUploadFotos: (
    files: FileList,
    tipo: "aparelho" | "termo" | "checklist"
  ) => Promise<string[]>;
  uploadingPhotos: boolean;
  modalCarouselIndex: number;
  setModalCarouselIndex: (index: number) => void;
  formFotosCarouselIndex: number;
  setFormFotosCarouselIndex: (index: number) => void;
  checklistFotosCarouselIndex: number;
  setChecklistFotosCarouselIndex: (index: number) => void;
  vendaFotosCarouselIndex: number;
  setVendaFotosCarouselIndex: (index: number) => void;
  onOpenEditarVenda: (venda: VendaAparelho) => void;
  getStatusColor: (status: string) => any;
  getStatusLabel: (status: string) => string;
}

export default function CadastroVendaModal({
  isOpen,
  onClose,
  modalType,
  selectedAparelho,
  selectedVenda,
  formCadastro,
  setFormCadastro,
  formVenda,
  setFormVenda,
  clientes,
  lojas,
  loading,
  onCadastrar,
  onVender,
  onSalvarEdicaoVenda,
  onAbrirCameraIMEI,
  onUploadFotos,
  uploadingPhotos,
  modalCarouselIndex,
  setModalCarouselIndex,
  formFotosCarouselIndex,
  setFormFotosCarouselIndex,
  checklistFotosCarouselIndex,
  setChecklistFotosCarouselIndex,
  vendaFotosCarouselIndex,
  setVendaFotosCarouselIndex,
  onOpenEditarVenda,
  getStatusColor,
  getStatusLabel,
}: CadastroVendaModalProps) {
  const handlePrevModalPhoto = (totalFotos: number) => {
    setModalCarouselIndex((modalCarouselIndex - 1 + totalFotos) % totalFotos);
  };

  const handleNextModalPhoto = (totalFotos: number) => {
    setModalCarouselIndex((modalCarouselIndex + 1) % totalFotos);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        {(onCloseModal) => (
          <>
            <ModalHeader className="flex items-center justify-between">
              <div>
                {modalType === "cadastro" &&
                  (selectedAparelho ? "Editar Aparelho" : "Novo Aparelho")}
                {modalType === "venda" && "Realizar Venda"}
                {modalType === "detalhes" && "Detalhes do Aparelho"}
                {modalType === "detalhes-venda" && "Detalhes da Venda"}
                {modalType === "editar-venda" && "Editar Venda"}
              </div>
            </ModalHeader>
            <ModalBody>
              {/* FORMULÁRIO DE CADASTRO */}
              {modalType === "cadastro" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Marca *"
                    placeholder="Ex: Apple, Samsung, Xiaomi"
                    value={formCadastro.marca}
                    onChange={(e) =>
                      setFormCadastro({
                        ...formCadastro,
                        marca: e.target.value,
                      })
                    }
                    isRequired
                  />
                  <Input
                    label="Modelo *"
                    placeholder="Ex: iPhone 13, Galaxy S21"
                    value={formCadastro.modelo}
                    onChange={(e) =>
                      setFormCadastro({
                        ...formCadastro,
                        modelo: e.target.value,
                      })
                    }
                    isRequired
                  />
                  <div className="flex gap-2 items-end">
                    <Input
                      label="IMEI"
                      placeholder="000000000000000"
                      value={formCadastro.imei}
                      onChange={(e) =>
                        setFormCadastro({
                          ...formCadastro,
                          imei: e.target.value,
                        })
                      }
                      description="15 dígitos"
                      className="flex-1"
                    />
                    <Button
                      isIconOnly
                      color="primary"
                      variant="flat"
                      onPress={onAbrirCameraIMEI}
                      className="mb-6"
                      title="Ler IMEI com câmera (requer HTTPS)"
                    >
                      <CameraIcon className="w-5 h-5" />
                    </Button>
                  </div>
                  <Input
                    label="Serial"
                    placeholder="Número de série"
                    value={formCadastro.serial}
                    onChange={(e) =>
                      setFormCadastro({
                        ...formCadastro,
                        serial: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Cor"
                    placeholder="Ex: Preto, Branco, Azul"
                    value={formCadastro.cor}
                    onChange={(e) =>
                      setFormCadastro({
                        ...formCadastro,
                        cor: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Capacidade"
                    placeholder="Ex: 128GB, 256GB"
                    value={formCadastro.capacidade}
                    onChange={(e) =>
                      setFormCadastro({
                        ...formCadastro,
                        capacidade: e.target.value,
                      })
                    }
                  />
                  <Select
                    label="Estado *"
                    selectedKeys={[formCadastro.estado || "usado"]}
                    onChange={(e) =>
                      setFormCadastro({
                        ...formCadastro,
                        estado: e.target.value as any,
                      })
                    }
                    isRequired
                  >
                    <SelectItem key="novo">Novo</SelectItem>
                    <SelectItem key="seminovo">Seminovo</SelectItem>
                    <SelectItem key="usado">Usado</SelectItem>
                  </Select>
                  <Select
                    label="Status *"
                    selectedKeys={[formCadastro.status || "disponivel"]}
                    onChange={(e) =>
                      setFormCadastro({
                        ...formCadastro,
                        status: e.target.value as any,
                      })
                    }
                    isRequired
                  >
                    <SelectItem key="disponivel">Disponível</SelectItem>
                    <SelectItem key="reservado">Reservado</SelectItem>
                    <SelectItem key="em_reparo">Em Reparo</SelectItem>
                    <SelectItem key="defeito">Defeito</SelectItem>
                  </Select>
                  <Input
                    label="Bateria (%)"
                    type="number"
                    min="0"
                    max="100"
                    value={formCadastro.bateria?.toString()}
                    onChange={(e) =>
                      setFormCadastro({
                        ...formCadastro,
                        bateria: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    label="Preço de Compra"
                    type="number"
                    startContent={<span>R$</span>}
                    value={formCadastro.preco_compra?.toString()}
                    onChange={(e) =>
                      setFormCadastro({
                        ...formCadastro,
                        preco_compra: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    label="Preço de Venda *"
                    type="number"
                    startContent={<span>R$</span>}
                    value={formCadastro.preco_venda?.toString()}
                    onChange={(e) =>
                      setFormCadastro({
                        ...formCadastro,
                        preco_venda: parseFloat(e.target.value) || 0,
                      })
                    }
                    isRequired
                  />
                  <Select
                    label="Loja"
                    selectedKeys={
                      formCadastro.loja_id
                        ? [formCadastro.loja_id.toString()]
                        : []
                    }
                    onChange={(e) =>
                      setFormCadastro({
                        ...formCadastro,
                        loja_id: parseInt(e.target.value),
                      })
                    }
                  >
                    {lojas.map((loja) => (
                      <SelectItem key={loja.id}>{loja.nome}</SelectItem>
                    ))}
                  </Select>
                  <div className="md:col-span-2">
                    <Textarea
                      label="Observações"
                      placeholder="Informações adicionais sobre o aparelho"
                      value={formCadastro.observacoes}
                      onChange={(e) =>
                        setFormCadastro({
                          ...formCadastro,
                          observacoes: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Upload de Fotos */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Fotos do Aparelho
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        color="primary"
                        variant="flat"
                        startContent={<PhotoIcon className="w-5 h-5" />}
                        onPress={() =>
                          document
                            .getElementById("upload-fotos-aparelho")
                            ?.click()
                        }
                        isLoading={uploadingPhotos}
                      >
                        Selecionar Fotos
                      </Button>
                      <span className="text-sm text-gray-500">
                        {formCadastro.fotos && formCadastro.fotos.length > 0
                          ? `${formCadastro.fotos.length} foto(s) selecionada(s)`
                          : "Nenhuma foto selecionada"}
                      </span>
                    </div>
                    <input
                      id="upload-fotos-aparelho"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files) {
                          const urls = await onUploadFotos(
                            e.target.files,
                            "aparelho"
                          );
                          setFormCadastro({
                            ...formCadastro,
                            fotos: [...(formCadastro.fotos || []), ...urls],
                          });
                        }
                      }}
                      className="hidden"
                    />

                    {/* Carrossel de Fotos */}
                    {formCadastro.fotos && formCadastro.fotos.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">
                          Fotos Selecionadas ({formCadastro.fotos.length})
                        </p>
                        <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                          <div className="relative w-full h-80 flex items-center justify-center">
                            <img
                              src={formCadastro.fotos[formFotosCarouselIndex]}
                              alt={`Foto ${formFotosCarouselIndex + 1}`}
                              className="max-w-full max-h-full object-contain"
                            />

                            <Button
                              isIconOnly
                              size="sm"
                              color="danger"
                              className="absolute top-4 right-4"
                              onPress={() => {
                                const newFotos = formCadastro.fotos?.filter(
                                  (_, i) => i !== formFotosCarouselIndex
                                );
                                setFormCadastro({
                                  ...formCadastro,
                                  fotos: newFotos,
                                });
                                if (
                                  formFotosCarouselIndex >=
                                  (newFotos?.length || 0)
                                ) {
                                  setFormFotosCarouselIndex(
                                    Math.max(0, (newFotos?.length || 1) - 1)
                                  );
                                }
                              }}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>

                            {formCadastro.fotos.length > 1 && (
                              <>
                                <Button
                                  isIconOnly
                                  size="lg"
                                  variant="flat"
                                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white hover:bg-black/90"
                                  onPress={() =>
                                    setFormFotosCarouselIndex(
                                      (formFotosCarouselIndex -
                                        1 +
                                        formCadastro.fotos!.length) %
                                        formCadastro.fotos!.length
                                    )
                                  }
                                >
                                  <ChevronLeftIcon className="w-6 h-6" />
                                </Button>

                                <Button
                                  isIconOnly
                                  size="lg"
                                  variant="flat"
                                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white hover:bg-black/90"
                                  onPress={() =>
                                    setFormFotosCarouselIndex(
                                      (formFotosCarouselIndex + 1) %
                                        formCadastro.fotos!.length
                                    )
                                  }
                                >
                                  <ChevronRightIcon className="w-6 h-6" />
                                </Button>

                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                  {formFotosCarouselIndex + 1} /{" "}
                                  {formCadastro.fotos.length}
                                </div>
                              </>
                            )}
                          </div>

                          {formCadastro.fotos.length > 1 && (
                            <div className="flex gap-2 p-4 overflow-x-auto bg-gray-200">
                              {formCadastro.fotos.map((url, idx) => (
                                <button
                                  key={idx}
                                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                    idx === formFotosCarouselIndex
                                      ? "border-primary scale-110"
                                      : "border-gray-300 opacity-60 hover:opacity-100"
                                  }`}
                                  onClick={() => setFormFotosCarouselIndex(idx)}
                                >
                                  <img
                                    src={url}
                                    alt={`Miniatura ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FORMULÁRIO DE VENDA */}
              {modalType === "venda" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 p-4 bg-gray-100 rounded-lg">
                    <h3 className="font-semibold mb-2">Aparelho Selecionado</h3>
                    <p>
                      <strong>Marca:</strong> {formVenda.aparelho_marca}
                    </p>
                    <p>
                      <strong>Modelo:</strong> {formVenda.aparelho_modelo}
                    </p>
                    <p>
                      <strong>IMEI:</strong>{" "}
                      {formVenda.aparelho_imei
                        ? formatarIMEI(formVenda.aparelho_imei)
                        : "-"}
                    </p>
                    <p>
                      <strong>Valor:</strong>{" "}
                      {formatarMoeda(formVenda.valor_aparelho || 0)}
                    </p>
                  </div>

                  <Autocomplete
                    label="Cliente *"
                    placeholder="Buscar cliente..."
                    onSelectionChange={(key) => {
                      const cliente = clientes.find(
                        (c) => c.id.toString() === key
                      );
                      if (cliente) {
                        setFormVenda({
                          ...formVenda,
                          cliente_id: cliente.id,
                          cliente_nome: cliente.nome,
                          cliente_cpf: cliente.doc,
                          cliente_telefone: cliente.telefone,
                          cliente_email: cliente.email,
                        });
                      }
                    }}
                    isRequired
                  >
                    {clientes.map((cliente) => (
                      <AutocompleteItem key={cliente.id}>
                        {cliente.nome}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  <Input
                    label="Telefone"
                    value={formVenda.cliente_telefone}
                    onChange={(e) =>
                      setFormVenda({
                        ...formVenda,
                        cliente_telefone: e.target.value,
                      })
                    }
                  />

                  <Input
                    label="E-mail"
                    type="email"
                    value={formVenda.cliente_email}
                    onChange={(e) =>
                      setFormVenda({
                        ...formVenda,
                        cliente_email: e.target.value,
                      })
                    }
                  />

                  <Input
                    label="Valor do Aparelho *"
                    type="number"
                    startContent={<span>R$</span>}
                    value={formVenda.valor_aparelho?.toString()}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0;
                      setFormVenda({
                        ...formVenda,
                        valor_aparelho: valor,
                        valor_final: calcularValorFinal(
                          valor,
                          formVenda.desconto || 0
                        ),
                      });
                    }}
                    isRequired
                  />

                  <Input
                    label="Desconto"
                    type="number"
                    startContent={<span>R$</span>}
                    value={formVenda.desconto?.toString()}
                    onChange={(e) => {
                      const desconto = parseFloat(e.target.value) || 0;
                      setFormVenda({
                        ...formVenda,
                        desconto,
                        valor_final: calcularValorFinal(
                          formVenda.valor_aparelho || 0,
                          desconto
                        ),
                      });
                    }}
                  />

                  <Input
                    label="Valor Final"
                    type="number"
                    startContent={<span>R$</span>}
                    value={formVenda.valor_final?.toString()}
                    isReadOnly
                    className="font-bold"
                  />

                  <Select
                    label="Forma de Pagamento *"
                    selectedKeys={[formVenda.forma_pagamento || "pix"]}
                    onChange={(e) =>
                      setFormVenda({
                        ...formVenda,
                        forma_pagamento: e.target.value as FormaPagamento,
                      })
                    }
                    isRequired
                  >
                    <SelectItem key="dinheiro">Dinheiro</SelectItem>
                    <SelectItem key="pix">PIX</SelectItem>
                    <SelectItem key="debito">Débito</SelectItem>
                    <SelectItem key="credito">Crédito</SelectItem>
                    <SelectItem key="carteira_digital">
                      Carteira Digital
                    </SelectItem>
                    <SelectItem key="misto">Misto</SelectItem>
                  </Select>

                  <Input
                    label="Parcelas"
                    type="number"
                    min="1"
                    value={formVenda.parcelas?.toString()}
                    onChange={(e) =>
                      setFormVenda({
                        ...formVenda,
                        parcelas: parseInt(e.target.value) || 1,
                      })
                    }
                  />

                  <Input
                    label="Garantia (meses)"
                    type="number"
                    min="0"
                    value={formVenda.garantia_meses?.toString()}
                    onChange={(e) =>
                      setFormVenda({
                        ...formVenda,
                        garantia_meses: parseInt(e.target.value) || 3,
                      })
                    }
                  />

                  <Select
                    label="Loja"
                    selectedKeys={
                      formVenda.loja_id ? [formVenda.loja_id.toString()] : []
                    }
                    onChange={(e) =>
                      setFormVenda({
                        ...formVenda,
                        loja_id: parseInt(e.target.value),
                      })
                    }
                  >
                    {lojas.map((loja) => (
                      <SelectItem key={loja.id}>{loja.nome}</SelectItem>
                    ))}
                  </Select>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Termo de Venda (PDF/Imagem)
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        color="secondary"
                        variant="flat"
                        startContent={<DocumentTextIcon className="w-5 h-5" />}
                        onPress={() =>
                          document.getElementById("upload-termo-venda")?.click()
                        }
                      >
                        Selecionar Termo
                      </Button>
                      <span className="text-sm text-gray-500">
                        {formVenda.termo_venda_url
                          ? "✓ Termo anexado"
                          : "Nenhum termo anexado"}
                      </span>
                    </div>
                    <input
                      id="upload-termo-venda"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        if (e.target.files) {
                          const urls = await onUploadFotos(
                            e.target.files,
                            "termo"
                          );
                          setFormVenda({
                            ...formVenda,
                            termo_venda_url: urls[0],
                          });
                        }
                      }}
                      className="hidden"
                    />
                  </div>

                  {/* Fotos do Checklist */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Fotos do Checklist
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        color="success"
                        variant="flat"
                        startContent={<PhotoIcon className="w-5 h-5" />}
                        onPress={() =>
                          document
                            .getElementById("upload-checklist-fotos")
                            ?.click()
                        }
                        isLoading={uploadingPhotos}
                      >
                        Selecionar Fotos
                      </Button>
                      <span className="text-sm text-gray-500">
                        {formVenda.checklist_fotos &&
                        formVenda.checklist_fotos.length > 0
                          ? `${formVenda.checklist_fotos.length} foto(s) selecionada(s)`
                          : "Nenhuma foto selecionada"}
                      </span>
                    </div>
                    <input
                      id="upload-checklist-fotos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files) {
                          const urls = await onUploadFotos(
                            e.target.files,
                            "checklist"
                          );
                          setFormVenda({
                            ...formVenda,
                            checklist_fotos: [
                              ...(formVenda.checklist_fotos || []),
                              ...urls,
                            ],
                          });
                        }
                      }}
                      className="hidden"
                    />

                    {/* Carrossel de Fotos do Checklist */}
                    {formVenda.checklist_fotos &&
                      formVenda.checklist_fotos.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">
                            Fotos do Checklist (
                            {formVenda.checklist_fotos.length})
                          </p>
                          <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                            <div className="relative w-full h-80 flex items-center justify-center">
                              <img
                                src={
                                  formVenda.checklist_fotos[
                                    checklistFotosCarouselIndex
                                  ]
                                }
                                alt={`Checklist ${checklistFotosCarouselIndex + 1}`}
                                className="max-w-full max-h-full object-contain"
                              />

                              <Button
                                isIconOnly
                                size="sm"
                                color="danger"
                                className="absolute top-4 right-4"
                                onPress={() => {
                                  const newFotos =
                                    formVenda.checklist_fotos?.filter(
                                      (_, i) =>
                                        i !== checklistFotosCarouselIndex
                                    );
                                  setFormVenda({
                                    ...formVenda,
                                    checklist_fotos: newFotos,
                                  });
                                  if (
                                    checklistFotosCarouselIndex >=
                                    (newFotos?.length || 0)
                                  ) {
                                    setChecklistFotosCarouselIndex(
                                      Math.max(0, (newFotos?.length || 1) - 1)
                                    );
                                  }
                                }}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>

                              {formVenda.checklist_fotos.length > 1 && (
                                <>
                                  <Button
                                    isIconOnly
                                    size="lg"
                                    variant="flat"
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white hover:bg-black/90"
                                    onPress={() =>
                                      setChecklistFotosCarouselIndex(
                                        (checklistFotosCarouselIndex -
                                          1 +
                                          formVenda.checklist_fotos!.length) %
                                          formVenda.checklist_fotos!.length
                                      )
                                    }
                                  >
                                    <ChevronLeftIcon className="w-6 h-6" />
                                  </Button>

                                  <Button
                                    isIconOnly
                                    size="lg"
                                    variant="flat"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white hover:bg-black/90"
                                    onPress={() =>
                                      setChecklistFotosCarouselIndex(
                                        (checklistFotosCarouselIndex + 1) %
                                          formVenda.checklist_fotos!.length
                                      )
                                    }
                                  >
                                    <ChevronRightIcon className="w-6 h-6" />
                                  </Button>

                                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                    {checklistFotosCarouselIndex + 1} /{" "}
                                    {formVenda.checklist_fotos.length}
                                  </div>
                                </>
                              )}
                            </div>

                            {formVenda.checklist_fotos.length > 1 && (
                              <div className="flex gap-2 p-4 overflow-x-auto bg-gray-200">
                                {formVenda.checklist_fotos.map((url, idx) => (
                                  <button
                                    key={idx}
                                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                      idx === checklistFotosCarouselIndex
                                        ? "border-primary scale-110"
                                        : "border-gray-300 opacity-60 hover:opacity-100"
                                    }`}
                                    onClick={() =>
                                      setChecklistFotosCarouselIndex(idx)
                                    }
                                  >
                                    <img
                                      src={url}
                                      alt={`Miniatura ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="md:col-span-2">
                    <Textarea
                      label="Observações"
                      placeholder="Informações adicionais sobre a venda"
                      value={formVenda.aparelho_observacoes}
                      onChange={(e) =>
                        setFormVenda({
                          ...formVenda,
                          aparelho_observacoes: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* DETALHES DO APARELHO */}
              {modalType === "detalhes" && selectedAparelho && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Marca</p>
                      <p className="font-semibold">{selectedAparelho.marca}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Modelo</p>
                      <p className="font-semibold">{selectedAparelho.modelo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">IMEI</p>
                      <p className="font-mono">
                        {selectedAparelho.imei
                          ? formatarIMEI(selectedAparelho.imei)
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Serial</p>
                      <p className="font-mono">
                        {selectedAparelho.serial || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cor</p>
                      <p>{selectedAparelho.cor || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Capacidade</p>
                      <p>{selectedAparelho.capacidade || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estado</p>
                      <Chip size="sm">
                        {selectedAparelho.estado?.toUpperCase()}
                      </Chip>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Chip
                        color={getStatusColor(selectedAparelho.status || "")}
                        size="sm"
                      >
                        {getStatusLabel(selectedAparelho.status || "")}
                      </Chip>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Preço de Venda</p>
                      <p className="font-semibold text-lg">
                        {formatarMoeda(selectedAparelho.preco_venda)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bateria</p>
                      <p>
                        {selectedAparelho.bateria
                          ? `${selectedAparelho.bateria}%`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {selectedAparelho.observacoes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Observações</p>
                      <p className="p-3 bg-gray-100 rounded">
                        {selectedAparelho.observacoes}
                      </p>
                    </div>
                  )}

                  {selectedAparelho.fotos &&
                    selectedAparelho.fotos.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Fotos do Aparelho ({selectedAparelho.fotos.length})
                        </p>
                        <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                          <div className="relative w-full h-96 flex items-center justify-center">
                            <img
                              src={selectedAparelho.fotos[modalCarouselIndex]}
                              alt={`Foto ${modalCarouselIndex + 1}`}
                              className="max-w-full max-h-full object-contain"
                            />

                            {selectedAparelho.fotos.length > 1 && (
                              <>
                                <Button
                                  isIconOnly
                                  size="lg"
                                  variant="flat"
                                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white hover:bg-black/90"
                                  onPress={() =>
                                    handlePrevModalPhoto(
                                      selectedAparelho.fotos!.length
                                    )
                                  }
                                >
                                  <ChevronLeftIcon className="w-6 h-6" />
                                </Button>

                                <Button
                                  isIconOnly
                                  size="lg"
                                  variant="flat"
                                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white hover:bg-black/90"
                                  onPress={() =>
                                    handleNextModalPhoto(
                                      selectedAparelho.fotos!.length
                                    )
                                  }
                                >
                                  <ChevronRightIcon className="w-6 h-6" />
                                </Button>

                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full">
                                  {modalCarouselIndex + 1} /{" "}
                                  {selectedAparelho.fotos.length}
                                </div>
                              </>
                            )}
                          </div>

                          {selectedAparelho.fotos.length > 1 && (
                            <div className="flex gap-2 p-4 overflow-x-auto bg-gray-200">
                              {selectedAparelho.fotos.map((url, idx) => (
                                <button
                                  key={idx}
                                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                    idx === modalCarouselIndex
                                      ? "border-primary scale-110"
                                      : "border-gray-300 opacity-60 hover:opacity-100"
                                  }`}
                                  onClick={() => setModalCarouselIndex(idx)}
                                >
                                  <img
                                    src={url}
                                    alt={`Miniatura ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onCloseModal}>
                Cancelar
              </Button>
              {modalType === "cadastro" && (
                <Button
                  color="primary"
                  onPress={onCadastrar}
                  isLoading={loading}
                >
                  {selectedAparelho ? "Atualizar" : "Cadastrar"}
                </Button>
              )}
              {modalType === "venda" && (
                <Button color="success" onPress={onVender} isLoading={loading}>
                  Finalizar Venda
                </Button>
              )}
              {modalType === "editar-venda" && (
                <Button
                  color="success"
                  onPress={onSalvarEdicaoVenda}
                  isLoading={loading}
                >
                  Salvar Alterações
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
