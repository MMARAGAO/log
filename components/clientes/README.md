# Componentes de Clientes

Sistema modular para gerenciamento de clientes.

## 📦 Componentes

### ClienteStats

Estatísticas e métricas da base de clientes.

**Props:**

- `clientes: Cliente[]` - Array de clientes para calcular estatísticas

**Métricas exibidas:**

- Total de clientes
- Pessoas físicas (CPF)
- Pessoas jurídicas (CNPJ)
- Clientes com WhatsApp
- Clientes com Instagram
- Crédito total disponível

### ClienteFilters

Barra de busca e botão de adicionar cliente.

**Props:**

- `busca: string` - Valor da busca
- `onBuscaChange: (value: string) => void` - Callback de mudança
- `onAddClick: () => void` - Callback do botão adicionar
- `canCreate: boolean` - Permissão para criar clientes

**Funcionalidades:**

- Busca por nome, email, telefone, CPF/CNPJ, Instagram
- Campo clearable
- Botão responsivo (ícone no mobile, texto no desktop)

### ClienteCard

Card individual de cliente com informações e ações.

**Props:**

- `cliente: Cliente` - Dados do cliente
- `onEdit: (cliente: Cliente) => void` - Callback de edição
- `onDelete: (id: number) => void` - Callback de exclusão
- `canEdit: boolean` - Permissão para editar
- `canDelete: boolean` - Permissão para deletar

**Recursos:**

- Avatar com fallback
- Nome resumido (primeiro + último)
- Chips: WhatsApp, Instagram, PF/PJ
- Links diretos para WhatsApp e Instagram
- Exibição de crédito disponível
- Dropdown menu com ações

### ClienteModal

Modal para adicionar ou editar cliente.

**Props:**

- `isOpen: boolean` - Controla visibilidade
- `onClose: () => void` - Callback de fechamento
- `onSubmit: (data: ClienteFormData, foto: File | null) => Promise<void>` - Callback de submit
- `cliente?: Cliente | null` - Cliente para edição (opcional)
- `editFotos?: string[]` - URLs das fotos existentes
- `onRemoveFoto?: (url: string) => void` - Callback para remover foto

**Campos:**

- Nome completo\* (obrigatório)
- Email\* (obrigatório)
- Telefone\* (obrigatório, com máscara)
- CPF/CNPJ\* (obrigatório, com máscara)
- Instagram (opcional)
- WhatsApp (switch)
- Endereço (textarea)
- Upload de foto

## 🎯 Uso

```tsx
import {
  ClienteStats,
  ClienteFilters,
  ClienteCard,
  ClienteModal,
  type Cliente,
  type ClienteFormData,
} from "@/components/clientes";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Estatísticas
  <ClienteStats clientes={clientes} />

  // Filtros
  <ClienteFilters
    busca={busca}
    onBuscaChange={setBusca}
    onAddClick={onOpen}
    canCreate={canCreateClientes}
  />

  // Grid de cards
  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {clientesFiltrados.map((cliente) => (
      <ClienteCard
        key={cliente.id}
        cliente={cliente}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canEditClientes}
        canDelete={canDeleteClientes}
      />
    ))}
  </div>

  // Modal
  <ClienteModal
    isOpen={isOpen}
    onClose={onClose}
    onSubmit={handleSubmit}
    cliente={editingCliente}
    editFotos={editFotos}
    onRemoveFoto={handleRemoveFoto}
  />
}
```

## 🔒 Permissões

O sistema respeita as seguintes permissões:

- `ver_clientes` - Visualizar lista de clientes
- `criar_clientes` - Adicionar novos clientes
- `editar_clientes` - Editar clientes existentes
- `deletar_clientes` - Excluir clientes

## 📋 Tipos

```typescript
interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  doc: string;
  endereco?: string;
  instagram?: string;
  whatsapp: boolean;
  fotourl?: string[];
  credito?: number;
}

interface ClienteFormData {
  nome: string;
  email: string;
  telefone: string;
  doc: string;
  endereco: string;
  instagram: string;
  whatsapp: boolean;
}
```

## 🎨 Funcionalidades

1. **Detecção de Tipo de Documento**

   - CPF (11 dígitos) → Chip "PF" azul
   - CNPJ (14 dígitos) → Chip "PJ" roxo

2. **Integração WhatsApp**

   - Click no chip abre conversa: `https://wa.me/55{telefone}`

3. **Integração Instagram**

   - Click no chip abre perfil: `https://instagram.com/{username}`

4. **Máscaras de Input**

   - Telefone: `(00) 00000-0000`
   - CPF: `000.000.000-00`
   - CNPJ: `00.000.000/0000-00`

5. **Upload de Fotos**
   - Suporta múltiplas fotos
   - Preview com Avatar
   - Remoção individual de fotos

## 🚀 Melhorias Futuras

- [ ] Filtro avançado (PF/PJ, com/sem WhatsApp)
- [ ] Ordenação (nome, data cadastro, crédito)
- [ ] Exportação para CSV/Excel
- [ ] Histórico de compras por cliente
- [ ] Visualização detalhada em modal separado
- [ ] Sistema de tags/categorias
- [ ] Integração com CRM
