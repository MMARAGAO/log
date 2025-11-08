# Permissão: Ver Preço de Custo

## 📋 Resumo

Nova permissão criada para controlar quem pode visualizar os **preços de custo/compra** dos produtos no sistema de estoque.

---

## 🎯 Objetivo

Permitir que administradores controlem o acesso às informações financeiras sensíveis, ocultando os preços de compra e margens de lucro para usuários que não precisam dessa informação (como vendedores, por exemplo).

---

## 🔑 Permissão Criada

### Localização

**Seção:** `estoque`  
**Chave:** `ver_preco_custo`  
**Tipo:** Boolean  
**Padrão:** `false`

---

## 🛠️ Implementação

### 1. Interface de Permissões

Arquivos modificados:

- `store/authZustand.tsx` - Adicionado `ver_preco_custo: boolean` na interface `PermissoesAcessos`
- `app/sistema/usuarios/page.tsx` - Adicionado `ver_preco_custo: false` no `defaultPermissoes`

### 2. Página de Estoque

**Arquivo:** `app/sistema/estoque/page.tsx`

**Verificação de permissão:**

```typescript
const canVerPrecoCusto = !!permEstoque?.ver_preco_custo;
```

**Áreas afetadas:**

#### a) Visualização em Cards (Grid)

- Oculta o campo "Preço Compra" quando permissão = false
- Oculta a margem de lucro (%) quando permissão = false
- Ajusta o layout do grid de 2 colunas para 1 quando apenas o preço de venda é exibido

#### b) Visualização em Lista (Tabela)

- Remove a coluna "Compra" quando permissão = false
- Remove a coluna "Lucro" quando permissão = false
- Mantém apenas colunas: Foto, Descrição, Marca, Modelo, Quantidade, Venda, Ações

#### c) Formulário de Cadastro/Edição

- Oculta o campo "Preço de Compra" quando permissão = false
- Ajusta o layout do formulário de 2 colunas para 1 quando apenas o preço de venda é exibido

#### d) Filtros Avançados

- Oculta os campos de filtro "Preço de Compra (Min/Max)" quando permissão = false
- Mantém apenas os filtros de Quantidade e Preço de Venda

### 3. Componente EstoqueCard

**Arquivo:** `components/estoque/EstoqueCard.tsx`

**Props adicionada:**

```typescript
interface EstoqueCardProps {
  // ... outras props
  canVerPrecoCusto?: boolean; // default: true
}
```

**Comportamento:**

- Quando `canVerPrecoCusto = false`:
  - Oculta o campo "Preço Compra"
  - Oculta a margem de lucro
  - Ajusta grid de 2 colunas para 1 coluna

### 4. Componente EstoqueStats

**Arquivo:** `components/estoque/EstoqueStats.tsx`

**Props adicionada:**

```typescript
interface EstoqueStatsProps {
  produtos: EstoqueItem[];
  canVerPrecoCusto?: boolean; // default: true
}
```

**Cards ocultados quando `canVerPrecoCusto = false`:**

1. ❌ "Valor em Estoque (Compra)" - Custo total
2. ❌ "Margem Média" - Lucro sobre custo

**Cards sempre visíveis:**

1. ✅ "Total de Produtos"
2. ✅ "Total de Itens"
3. ✅ "Valor em Estoque (Venda)"
4. ✅ "Abaixo do Mínimo"
5. ✅ "Sem Estoque"

---

## 📊 Impacto Visual

### COM Permissão (`ver_preco_custo: true`)

```
┌─────────────────────────────────┐
│  Card do Produto                │
│  ┌────────┬────────┐            │
│  │ Compra │  Venda │            │
│  │ R$100  │ R$150  │            │
│  └────────┴────────┘            │
│  💰 Margem: 50%                 │
└─────────────────────────────────┘

Cards de Estatísticas:
- Valor em Estoque (Compra): R$ 10.000
- Valor em Estoque (Venda): R$ 15.000
- Margem Média: 50%
```

### SEM Permissão (`ver_preco_custo: false`)

```
┌─────────────────────────────────┐
│  Card do Produto                │
│  ┌──────────────────┐           │
│  │  Preço de Venda  │           │
│  │     R$ 150       │           │
│  └──────────────────┘           │
│  (margem oculta)                │
└─────────────────────────────────┘

Cards de Estatísticas:
- Valor em Estoque (Venda): R$ 15.000
- (custo e margem ocultos)
```

---

## 🎮 Como Usar

### 1. Ativar Permissão para Usuário

1. Acesse **Sistema > Usuários**
2. Clique em **Permissões** no card do usuário desejado
3. Na seção **Estoque**, marque a opção:
   - ✅ **Ver Preço Custo** - Visualizar o preço de custo/compra dos produtos
4. Clique em **Salvar Permissões**

### 2. Perfis Recomendados

**Administrador/Gerente:**

- ✅ Ver Preço Custo: **true**
- Motivo: Precisam acompanhar margens e lucratividade

**Vendedor:**

- ❌ Ver Preço Custo: **false**
- Motivo: Precisam apenas do preço de venda

**Estoquista:**

- ⚠️ Ver Preço Custo: **opcional**
- Motivo: Depende da política da empresa

---

## 🔒 Segurança

### Proteção em Múltiplas Camadas

1. **Interface:** Campos ocultos visualmente
2. **Componentes:** Props controlam renderização
3. **Estado:** Permissão verificada no React state
4. **Backend:** Dados sensíveis devem ter RLS no Supabase (recomendado)

### ⚠️ Importante

Esta permissão controla apenas a **visualização** no frontend. Para segurança completa:

1. Configure RLS (Row Level Security) no Supabase:

```sql
-- Exemplo: ocultar preco_compra na tabela estoque
CREATE POLICY "Ocultar preco_compra para usuarios sem permissão"
ON estoque
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM permissoes
    WHERE acessos->'estoque'->>'ver_preco_custo' = 'true'
  )
);
```

2. Considere criar uma view separada para usuários sem permissão:

```sql
CREATE VIEW estoque_sem_custo AS
SELECT
  id, descricao, modelo, marca, compativel,
  preco_venda, -- exclui preco_compra
  minimo, fotourl, observacoes
FROM estoque;
```

---

## 🧪 Testes

### Cenários de Teste

#### 1. Usuário COM permissão

- [ ] Cards mostram "Preço Compra" e "Preço Venda"
- [ ] Margem de lucro é exibida
- [ ] Tabela mostra colunas "Compra" e "Lucro"
- [ ] Formulário permite editar preço de compra
- [ ] Filtros incluem "Preço de Compra"
- [ ] Stats mostram "Valor em Estoque (Compra)" e "Margem Média"

#### 2. Usuário SEM permissão

- [ ] Cards mostram APENAS "Preço de Venda"
- [ ] Margem de lucro está oculta
- [ ] Tabela NÃO mostra colunas "Compra" e "Lucro"
- [ ] Formulário NÃO mostra campo preço de compra
- [ ] Filtros NÃO incluem "Preço de Compra"
- [ ] Stats NÃO mostram custo e margem

#### 3. Responsividade

- [ ] Layout se ajusta corretamente em mobile/tablet/desktop
- [ ] Grid de 1 coluna funciona bem quando preço de compra está oculto

---

## 📝 Notas Técnicas

### Default Value

A prop `canVerPrecoCusto` tem valor padrão `true` nos componentes para:

1. Retrocompatibilidade com código existente
2. Evitar quebrar outras telas que usam esses componentes
3. Princípio de "aberto por padrão, restrito quando configurado"

### Lógica de Renderização

Utiliza conditional rendering do React:

```typescript
{canVerPrecoCusto && (
  <div>Campo de preço de custo</div>
)}
```

### Spread Operator para Arrays Condicionais

No EstoqueStats, usado para incluir/excluir cards:

```typescript
const statCards = [
  // cards sempre visíveis
  ...(canVerPrecoCusto ? [cardCusto, cardMargem] : []),
  // mais cards
];
```

---

## 🔄 Atualizações Futuras

### Possíveis Melhorias

1. [ ] Adicionar permissão similar para outras telas (transferências, vendas, etc.)
2. [ ] Log de auditoria quando usuário tenta acessar preços sem permissão
3. [ ] Máscara/blur nos valores em vez de ocultar completamente (UX alternativa)
4. [ ] Exportação Excel: respeitar permissão ao gerar relatórios
5. [ ] Criar níveis de acesso (ver custo / editar custo / aprovar alteração de custo)

---

## 📚 Arquivos Relacionados

### Modificados

1. `store/authZustand.tsx`
2. `app/sistema/usuarios/page.tsx`
3. `app/sistema/estoque/page.tsx`
4. `components/estoque/EstoqueCard.tsx`
5. `components/estoque/EstoqueStats.tsx`

### Documentação

- Este arquivo: `PERMISSAO_VER_PRECO_CUSTO.md`

---

## ✅ Checklist de Implementação

- [x] Adicionar permissão na interface TypeScript
- [x] Adicionar valor default nas permissões
- [x] Implementar verificação na página de estoque
- [x] Ocultar campos no formulário
- [x] Ocultar colunas na tabela
- [x] Modificar EstoqueCard para suportar permissão
- [x] Modificar EstoqueStats para suportar permissão
- [x] Ocultar filtros de preço de compra
- [x] Testar em diferentes resoluções
- [x] Documentar implementação
- [ ] Criar testes automatizados (futuro)
- [ ] Implementar RLS no Supabase (recomendado)

---

**Data de Criação:** 08/11/2024  
**Versão:** 1.0  
**Status:** ✅ Implementado
