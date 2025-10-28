/**
 * ClienteCard - Componente de card individual de cliente
 * Exibe informações do cliente com opções de editar/deletar
 */

import {
  Card,
  CardBody,
  Avatar,
  Chip,
  Divider,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@heroui/react";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  MapPinIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/solid";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { cpfCnpjMask, phoneMask } from "@/utils/maskInput";
import type { Cliente, TipoDocumento } from "./types";

interface ClienteCardProps {
  cliente: Cliente;
  onEdit: (cliente: Cliente) => void;
  onDelete: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export default function ClienteCard({
  cliente,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: ClienteCardProps) {
  // Função para obter nome resumido (primeiro e último)
  const getNomeResumido = (nomeCompleto: string) => {
    const parts = (nomeCompleto || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return parts[0] || "";
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  // Função para detectar tipo de documento
  const getTipoDocumento = (doc: string): TipoDocumento => {
    if (!doc) return null;
    const cleanDoc = doc.replace(/\D/g, "");
    if (cleanDoc.length === 11) return "PF"; // CPF
    if (cleanDoc.length === 14) return "PJ"; // CNPJ
    return null;
  };

  // Função para abrir WhatsApp
  const openWhatsApp = (telefone: string) => {
    const cleanPhone = telefone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/55${cleanPhone}`;
    window.open(whatsappUrl, "_blank");
  };

  // Função para abrir Instagram
  const openInstagram = (username: string) => {
    const cleanUsername = username.replace("@", "");
    const instagramUrl = `https://instagram.com/${cleanUsername}`;
    window.open(instagramUrl, "_blank");
  };

  const tipoDoc = getTipoDocumento(cliente.doc);

  return (
    <Card className="w-full">
      <CardBody>
        <div className="flex items-center justify-between">
          <div className="flex gap-4 w-full">
            <div>
              <Avatar
                src={cliente.fotourl?.[0]}
                fallback={<UserIcon className="w-6 h-6" />}
                size="lg"
              />
            </div>
            <div className="w-full">
              <div className="w-full flex justify-between">
                <h3 className="text-lg font-semibold">
                  {getNomeResumido(cliente.nome)}
                </h3>

                {(canEdit || canDelete) && (
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
                        {canEdit ? (
                          <DropdownItem
                            key="edit"
                            onPress={() => onEdit(cliente)}
                            startContent={
                              <PencilSquareIcon className="w-5 h-5 text-primary" />
                            }
                          >
                            Editar
                          </DropdownItem>
                        ) : null}
                        {canDelete ? (
                          <DropdownItem
                            key="delete"
                            onPress={() => onDelete(cliente.id)}
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
                )}
              </div>

              {cliente.instagram && (
                <p className="text-small text-default-500">
                  @{cliente.instagram}
                </p>
              )}

              <div className="flex gap-2 mt-2 flex-wrap">
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
                    onClick={() =>
                      cliente.instagram && openInstagram(cliente.instagram)
                    }
                  >
                    Instagram
                  </Chip>
                )}
                {tipoDoc && (
                  <Chip
                    size="sm"
                    variant="flat"
                    color={tipoDoc === "PF" ? "primary" : "secondary"}
                  >
                    {tipoDoc}
                  </Chip>
                )}
              </div>
            </div>
          </div>
        </div>

        <Divider className="my-3" />

        <div className="flex flex-col gap-2 text-sm">
          {cliente.email && (
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="w-4 h-4 text-default-400 flex-shrink-0" />
              <span className="truncate">{cliente.email}</span>
            </div>
          )}
          {cliente.telefone && (
            <div className="flex items-center gap-2">
              <PhoneIcon className="w-4 h-4 text-default-400 flex-shrink-0" />
              <span>{phoneMask(cliente.telefone)}</span>
            </div>
          )}
          {cliente.doc && (
            <div className="flex items-center gap-2">
              <IdentificationIcon className="w-4 h-4 text-default-400 flex-shrink-0" />
              <span>{cpfCnpjMask(cliente.doc)}</span>
            </div>
          )}
          {cliente.endereco && (
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-default-400 flex-shrink-0" />
              <span className="truncate">{cliente.endereco}</span>
            </div>
          )}
        </div>

        {typeof cliente.credito !== "undefined" && cliente.credito > 0 && (
          <div className="mt-3 pt-3 border-t border-default-200">
            <p className="text-sm font-semibold text-success">
              Crédito disponível: R${" "}
              {Number(cliente.credito).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
