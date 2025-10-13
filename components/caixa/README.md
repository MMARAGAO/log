# 📦 Componentes de Caixa - Documentação

## 🎯 Componentes Criados

### 1. **CaixaAbertoCard.tsx**

Card que exibe um caixa aberto com informações resumidas.

**Props:**

- `caixa`: CaixaAberto
- `loja`: Loja
- `resumo`: ResumoVendas
- `canCloseCaixa`: boolean
- `onVerDetalhes`: () => void
- `onFecharCaixa`: () => void
- `onVerHistorico`: () => void

**Características:**

- ✅ Mostra valor inicial, vendas do dia e dinheiro no caixa
- ✅ Calcula tempo aberto automaticamente
- ✅ Botões de ação: Detalhes, Fechar, Histórico
- ✅ Visual verde indicando caixa ativo

---

### 2. **LojaFechadaCard.tsx**

Card que exibe uma loja com caixa fechado.

**Props:**

- `loja`: Loja
- `canOpenCaixa`: boolean
- `onAbrirCaixa`: () => void
- `onVerHistorico`: () => void

**Características:**

- ✅ Visual cinza indicando caixa fechado
- ✅ Botão para abrir novo caixa
- ✅ Botão para ver histórico da loja
- ✅ Exibe endereço da loja

---

### 3. **AbrirCaixaModal.tsx**

Modal para abrir um novo caixa.

**Props:**

- `isOpen`: boolean
- `onClose`: () => void
- `lojas`: Loja[]
- `formData`: FormAbrir
- `onFormChange`: (field, value) => void
- `onSubmit`: () => void
- `loading`: boolean

**Características:**

- ✅ Seletor de loja
- ✅ Input de valor inicial com máscara de moeda
- ✅ Campo de observações opcional
- ✅ Aviso informativo
- ✅ Validação de campos obrigatórios

---

### 4. **FecharCaixaModal.tsx**

Modal para fechar um caixa existente.

**Props:**

- `isOpen`: boolean
- `onClose`: () => void
- `caixa`: CaixaAberto
- `loja`: Loja
- `resumo`: ResumoVendas
- `formData`: FormFechar
- `onFormChange`: (field, value) => void
- `onSubmit`: () => void
- `loading`: boolean

**Características:**

- ✅ Resumo do caixa (valor inicial, vendas em dinheiro, valor esperado)
- ✅ Input de valor final com máscara de moeda
- ✅ Cálculo automático de diferença (sobra/falta)
- ✅ Indicador visual da diferença com cores
- ✅ Campo de observações opcional
- ✅ Aviso de bloqueio de vendas após fechamento

---

### 5. **DetalhesCaixaModal.tsx**

Modal com informações completas do caixa.

**Props:**

- `isOpen`: boolean
- `onClose`: () => void
- `caixa`: CaixaAberto
- `loja`: Loja
- `resumo`: ResumoVendas

**Características:**

- ✅ Informações completas do caixa (valor inicial, horário, tempo aberto)
- ✅ 4 cards com métricas principais (total vendas, valor total, ticket médio, dinheiro no caixa)
- ✅ Detalhamento completo das 8 formas de pagamento
- ✅ Cada forma de pagamento com cor exclusiva
- ✅ Grid responsivo
- ✅ Exibe observações de abertura se houver

---

### 6. **HistoricoCaixaModal.tsx**

Modal com histórico de todos os caixas de uma loja.

**Props:**

- `isOpen`: boolean
- `onClose`: () => void
- `historico`: CaixaAberto[]
- `loja`: Loja

**Características:**

- ✅ Lista todos os caixas (abertos e fechados)
- ✅ Ordenação por data (mais recente primeiro)
- ✅ Cards individuais para cada registro
- ✅ Mostra datas de abertura e fechamento
- ✅ Calcula tempo de operação
- ✅ Exibe diferença (sobra/falta) com código de cores
- ✅ Mostra observações de abertura e fechamento
- ✅ Estado vazio quando não há registros

---

### 7. **types.ts**

Arquivo com todos os tipos TypeScript compartilhados.

**Tipos Definidos:**

- `CaixaAberto`
- `Venda`
- `Loja`
- `ResumoVendas`
- `FormAbrir`
- `FormFechar`

---

## 📁 Estrutura de Arquivos

```
components/
└── caixa/
    ├── CaixaAbertoCard.tsx
    ├── LojaFechadaCard.tsx
    ├── AbrirCaixaModal.tsx
    ├── FecharCaixaModal.tsx
    ├── DetalhesCaixaModal.tsx
    ├── HistoricoCaixaModal.tsx
    └── types.ts
```

---

## 🚀 Como Usar no Arquivo Principal

### Importações:

```typescript
import CaixaAbertoCard from "@/components/caixa/CaixaAbertoCard";
import LojaFechadaCard from "@/components/caixa/LojaFechadaCard";
import AbrirCaixaModal from "@/components/caixa/AbrirCaixaModal";
import FecharCaixaModal from "@/components/caixa/FecharCaixaModal";
import DetalhesCaixaModal from "@/components/caixa/DetalhesCaixaModal";
import HistoricoCaixaModal from "@/components/caixa/HistoricoCaixaModal";
import type {
  CaixaAberto,
  Venda,
  Loja,
  ResumoVendas,
} from "@/components/caixa/types";
```

### Exemplo de Uso - Card de Caixa Aberto:

```typescript
<CaixaAbertoCard
  caixa={caixa}
  loja={lojas.find(l => l.id === caixa.loja_id)}
  resumo={getResumoVendas(caixa.loja_id)}
  canCloseCaixa={canCloseCaixa}
  onVerDetalhes={() => {
    setCaixaSelecionado(caixa);
    setModalDetalhes(true);
  }}
  onFecharCaixa={() => {
    setCaixaSelecionado(caixa);
    setModalFechar(true);
  }}
  onVerHistorico={() => {
    loadHistoricoCaixa(caixa.loja_id);
    setModalHistorico(true);
  }}
/>
```

### Exemplo de Uso - Modal de Detalhes:

```typescript
<DetalhesCaixaModal
  isOpen={modalDetalhes}
  onClose={() => {
    setModalDetalhes(false);
    setCaixaSelecionado(null);
  }}
  caixa={caixaSelecionado}
  loja={lojas.find(l => l.id === caixaSelecionado?.loja_id)}
  resumo={caixaSelecionado ? getResumoVendas(caixaSelecionado.loja_id) : null}
/>
```

---

## ✨ Benefícios da Componentização

### 1. **Manutenibilidade**

- ✅ Código organizado e fácil de encontrar
- ✅ Cada componente tem responsabilidade única
- ✅ Alterações isoladas não afetam outros componentes

### 2. **Reusabilidade**

- ✅ Componentes podem ser reutilizados em outras páginas
- ✅ Fácil criar variações (ex: CaixaCard para relatórios)
- ✅ Lógica compartilhada em um único lugar

### 3. **Testabilidade**

- ✅ Componentes pequenos são mais fáceis de testar
- ✅ Props claramente definidas
- ✅ Comportamento previsível

### 4. **Performance**

- ✅ Componentes renderizam apenas quando suas props mudam
- ✅ Otimização mais fácil com React.memo
- ✅ Bundle splitting automático

### 5. **Colaboração**

- ✅ Múltiplos desenvolvedores podem trabalhar simultaneamente
- ✅ Código auto-documentado através das props
- ✅ TypeScript fornece intellisense completo

---

## 🎨 Padrões de Design Utilizados

### 1. **Composition Over Inheritance**

Componentes são compostos, não herdados.

### 2. **Single Responsibility**

Cada componente tem uma única responsabilidade.

### 3. **Props Drilling Prevention**

Estados gerenciados no componente pai, passados como props.

### 4. **Controlled Components**

Formulários controlados com estado no componente pai.

---

## 🔄 Fluxo de Dados

```
Page (app/sistema/caixa/page.tsx)
  ↓ (estados e funções)
  ├── CaixaAbertoCard (exibe dados)
  │   └── onClick → atualiza estado do pai
  ├── AbrirCaixaModal (formulário)
  │   └── onSubmit → função do pai
  └── DetalhesCaixaModal (exibe dados completos)
      └── dados calculados no pai
```

---

## 📝 Próximos Passos

1. **Atualizar o arquivo principal** (`app/sistema/caixa/page.tsx`)

   - Importar todos os componentes
   - Remover código duplicado
   - Usar componentes criados

2. **Adicionar testes** (opcional)

   - Criar testes unitários para cada componente
   - Testar props e comportamentos

3. **Melhorias futuras**
   - Adicionar animações (framer-motion)
   - Implementar skeleton loading
   - Adicionar gráficos (recharts)

---

**Status:** ✅ Todos os componentes criados e prontos para uso!
**Data:** 12 de outubro de 2025
