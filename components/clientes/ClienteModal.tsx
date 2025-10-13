/**
 * ClienteModal - Componente modal para adicionar/editar cliente
 * Formulário completo com validação
 */

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Switch,
  Avatar,
} from "@heroui/react";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  AtSymbolIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { cpfCnpjMask, phoneMask } from "@/utils/maskInput";
import type { Cliente, ClienteFormData } from "./types";

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClienteFormData, foto: File | null) => Promise<void>;
  cliente?: Cliente | null;
  editFotos?: string[];
  onRemoveFoto?: (url: string) => void;
}

export default function ClienteModal({
  isOpen,
  onClose,
  onSubmit,
  cliente,
  editFotos = [],
  onRemoveFoto,
}: ClienteModalProps) {
  const [formData, setFormData] = useState<ClienteFormData>({
    nome: "",
    email: "",
    telefone: "",
    doc: "",
    endereco: "",
    instagram: "",
    whatsapp: false,
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Preenche formulário quando cliente for fornecido
  useEffect(() => {
    if (cliente) {
      setFormData({
        nome: cliente.nome || "",
        email: cliente.email || "",
        telefone: cliente.telefone || "",
        doc: cliente.doc || "",
        endereco: cliente.endereco || "",
        instagram: cliente.instagram || "",
        whatsapp: cliente.whatsapp || false,
      });
    } else {
      resetForm();
    }
  }, [cliente]);

  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      doc: "",
      endereco: "",
      instagram: "",
      whatsapp: false,
    });
    setFoto(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(formData, foto);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <h3>{cliente ? "Editar Cliente" : "Adicionar Cliente"}</h3>
          </ModalHeader>
          <ModalBody className="gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome completo"
                placeholder="Digite o nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                startContent={<UserIcon className="w-4 h-4 text-default-400" />}
                isRequired
              />
              <Input
                label="Email"
                type="email"
                placeholder="Digite o email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                startContent={
                  <EnvelopeIcon className="w-4 h-4 text-default-400" />
                }
                isRequired
              />
              <Input
                label="Telefone"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    telefone: phoneMask(e.target.value),
                  })
                }
                startContent={
                  <PhoneIcon className="w-4 h-4 text-default-400" />
                }
                isRequired
              />
              <Input
                label="CPF/CNPJ"
                placeholder="000.000.000-00"
                value={formData.doc}
                onChange={(e) =>
                  setFormData({ ...formData, doc: cpfCnpjMask(e.target.value) })
                }
                startContent={
                  <IdentificationIcon className="w-4 h-4 text-default-400" />
                }
                isRequired
              />
              <Input
                label="Instagram"
                placeholder="@usuario"
                value={formData.instagram}
                onChange={(e) =>
                  setFormData({ ...formData, instagram: e.target.value })
                }
                startContent={
                  <AtSymbolIcon className="w-4 h-4 text-default-400" />
                }
              />
              <div className="flex items-center gap-3">
                <Switch
                  isSelected={formData.whatsapp}
                  onValueChange={(checked) =>
                    setFormData({ ...formData, whatsapp: checked })
                  }
                  color="success"
                >
                  Tem WhatsApp
                </Switch>
              </div>
            </div>

            <Textarea
              label="Endereço"
              placeholder="Digite o endereço completo"
              value={formData.endereco}
              onChange={(e) =>
                setFormData({ ...formData, endereco: e.target.value })
              }
              minRows={2}
              maxRows={4}
            />

            {/* Fotos existentes */}
            {cliente && editFotos.length > 0 && (
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
                        onPress={() => onRemoveFoto?.(url)}
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
              <label className="text-sm font-medium">
                {cliente ? "Nova foto:" : "Foto:"}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" color="primary" isLoading={submitting}>
              {cliente ? "Salvar alterações" : "Adicionar cliente"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
