# CadastroVendaModal

Componente modal unificado para cadastro, venda, visualização e edição de aparelhos celulares.

## Funcionalidades

- ✅ **Cadastro de Aparelhos**: Formulário completo com upload de fotos
- ✅ **Registro de Vendas**: Processo de venda com seleção de cliente e formas de pagamento
- ✅ **Visualização de Detalhes**: Exibição de informações completas do aparelho
- ✅ **Edição de Vendas**: Alteração de dados de vendas já realizadas
- ✅ **Upload de Fotos**: Carrossel interativo para múltiplas fotos
- ✅ **Scanner IMEI**: Integração com câmera para leitura automática

## Propriedades

```typescript
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
```

## Exemplo de Uso

```tsx
import { CadastroVendaModal } from "@/components/aparelhos";

function AparelhosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"cadastro" | "venda" | "detalhes">(
    "cadastro"
  );
  const [formCadastro, setFormCadastro] = useState<Partial<EstoqueAparelho>>({
    marca: "",
    modelo: "",
    imei: "",
    // ... outros campos
  });

  const handleCadastrar = async () => {
    // Lógica de cadastro
  };

  const handleUploadFotos = async (files: FileList, tipo: string) => {
    // Lógica de upload
    return urls;
  };

  return (
    <>
      <Button
        onPress={() => {
          setModalType("cadastro");
          setIsModalOpen(true);
        }}
      >
        Novo Aparelho
      </Button>

      <CadastroVendaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalType={modalType}
        selectedAparelho={null}
        selectedVenda={null}
        formCadastro={formCadastro}
        setFormCadastro={setFormCadastro}
        formVenda={formVenda}
        setFormVenda={setFormVenda}
        clientes={clientes}
        lojas={lojas}
        loading={loading}
        onCadastrar={handleCadastrar}
        onVender={handleVender}
        onSalvarEdicaoVenda={handleSalvarEdicaoVenda}
        onAbrirCameraIMEI={abrirCameraIMEI}
        onUploadFotos={handleUploadFotos}
        uploadingPhotos={uploadingPhotos}
        modalCarouselIndex={modalCarouselIndex}
        setModalCarouselIndex={setModalCarouselIndex}
        formFotosCarouselIndex={formFotosCarouselIndex}
        setFormFotosCarouselIndex={setFormFotosCarouselIndex}
        checklistFotosCarouselIndex={checklistFotosCarouselIndex}
        setChecklistFotosCarouselIndex={setChecklistFotosCarouselIndex}
        vendaFotosCarouselIndex={vendaFotosCarouselIndex}
        setVendaFotosCarouselIndex={setVendaFotosCarouselIndex}
        onOpenEditarVenda={handleOpenEditarVenda}
        getStatusColor={getStatusColor}
        getStatusLabel={getStatusLabel}
      />
    </>
  );
}
```

## Modos do Modal

### 1. Modo Cadastro (`modalType="cadastro"`)

- Formulário completo de cadastro de aparelho
- Upload múltiplo de fotos com carrossel
- Botão de scanner IMEI integrado
- Seleção de loja, estado, status
- Validação de campos obrigatórios

### 2. Modo Venda (`modalType="venda"`)

- Exibição do aparelho selecionado
- Autocomplete para seleção de cliente
- Cálculo automático de valores com desconto
- Formas de pagamento e parcelamento
- Upload de termo de venda e fotos do checklist

### 3. Modo Detalhes (`modalType="detalhes"`)

- Visualização completa dos dados do aparelho
- Carrossel de fotos em alta resolução
- Status, preços, bateria, observações
- Somente leitura

### 4. Modo Detalhes Venda (`modalType="detalhes-venda"`)

- Informações completas da venda
- Dados do cliente e aparelho
- Valores, pagamento, parcelas
- Botão para editar venda

### 5. Modo Editar Venda (`modalType="editar-venda"`)

- Formulário de edição de venda existente
- Atualização de valores e status
- Alteração de dados do cliente
- Mudança de forma de pagamento

## Carrosséis de Fotos

O componente possui 4 carrosséis independentes:

1. **formFotosCarouselIndex**: Fotos do cadastro de aparelho
2. **checklistFotosCarouselIndex**: Fotos do checklist de venda
3. **modalCarouselIndex**: Fotos na visualização de detalhes
4. **vendaFotosCarouselIndex**: Fotos do aparelho na venda

Cada carrossel possui:

- Navegação por setas
- Miniaturas clicáveis
- Indicador de posição (X/Total)
- Botão para deletar foto (em modo edição)
- Zoom ao clicar na imagem

## Integrações

### Scanner IMEI

```tsx
<Button
  isIconOnly
  color="primary"
  variant="flat"
  onPress={onAbrirCameraIMEI}
  title="Ler IMEI com câmera (requer HTTPS)"
>
  <CameraIcon className="w-5 h-5" />
</Button>
```

### Upload de Fotos

```tsx
const handleUploadFotos = async (files: FileList, tipo: string) => {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Upload para Supabase Storage
    const { data } = await supabase.storage
      .from("vendas-aparelhos")
      .upload(filePath, file);
    urls.push(publicUrl);
  }
  return urls;
};
```

## Validações

### Campos Obrigatórios - Cadastro

- ✅ Marca
- ✅ Modelo
- ✅ Preço de Venda
- ✅ Estado
- ✅ Status

### Campos Obrigatórios - Venda

- ✅ Cliente
- ✅ Valor do Aparelho
- ✅ Forma de Pagamento

## Dependências

```json
{
  "@heroui/react": "^2.0.0",
  "@heroicons/react": "^2.0.0",
  "react": "^18.0.0",
  "react-hot-toast": "^2.0.0"
}
```

## Tipos Utilizados

```typescript
import type {
  EstoqueAparelho,
  VendaAparelho,
  Cliente,
  Loja,
  FormaPagamento,
} from "@/types/aparelhos";
```

## Utilitários

```typescript
import {
  formatarIMEI,
  formatarMoeda,
  calcularValorFinal,
} from "@/utils/aparelhos";
```

## Estilização

O componente utiliza:

- **TailwindCSS** para estilização
- **HeroUI** para componentes base
- **HeroIcons** para ícones
- Classes responsivas (`md:col-span-2`, `lg:grid-cols-2`)
- Estados de loading e disabled

## Notas Técnicas

1. **Performance**: O upload de fotos é feito em paralelo usando `Promise.all()`
2. **UX**: Loading states em todos os botões de ação
3. **Acessibilidade**: Labels descritivas e placeholders informativos
4. **Responsividade**: Grid adaptativo para mobile/desktop
5. **Estado**: Gerenciamento de estado via props (controlled component)

## Próximas Melhorias

- [ ] Adicionar validação visual de campos obrigatórios
- [ ] Implementar preview de PDF para termo de venda
- [ ] Adicionar confirmação antes de deletar fotos
- [ ] Suporte a drag & drop para upload de fotos
- [ ] Compressão automática de imagens
- [ ] Cache de clientes e lojas
- [ ] Modo offline com sincronização

## Suporte

Para dúvidas ou problemas, consulte a documentação dos tipos em `@/types/aparelhos.ts` e utilitários em `@/utils/aparelhos.ts`.
