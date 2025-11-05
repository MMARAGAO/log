# 🔍 Investigação: Vendas Sumindo Após Devolução

## 📝 Problema Relatado

**Cenário:**
- Dia 01: Fez uma venda de R$ 100,00
- Dia 05: Fez uma devolução que gerou crédito
- **Resultado**: A venda do dia 01 desapareceu/sumiu

## 🔎 Análise do Código

### O que acontece quando uma devolução é processada

Arquivo: `app/sistema/devolucoes/page.tsx` (linhas 1007-1065)

```typescript
await updateTable("vendas", vendaSelecionada.id, {
  status_pagamento: "devolvido",
  updated_at: new Date().toISOString(),
});
```

**O que o código FAZ:**
✅ Atualiza o `status_pagamento` da venda para `"devolvido"`
✅ Mantém a venda no banco de dados (NÃO deleta)
✅ Cria um registro na tabela `devolucoes`
✅ Devolve os produtos ao estoque
✅ Gera crédito para o cliente

**O que o código NÃO FAZ:**
❌ NÃO deleta a venda
❌ NÃO esconde a venda

### Como as vendas são filtradas

Arquivo: `app/sistema/vendas/page.tsx` (linhas 977-1080)

O filtro de vendas **NÃO exclui** vendas com status "devolvido". Todas as vendas são mostradas, incluindo as devolvidas.

```typescript
const filtered = useMemo(() => {
  const resultado = vendas
    .map((v) => ({ ...v, status_calc: computeStatus(v) }))
    .filter((v) => {
      // Vários filtros aplicados, mas NENHUM exclui status "devolvido" por padrão
      if (filters.status && v.status_calc !== filters.status) return false;
      // ... outros filtros
      return true;
    })
```

**Filtro de Status Padrão:** `""` (vazio) - mostra TODAS as vendas

## 🐛 Possíveis Causas do Problema

### 1. **Filtro de Status Ativo** ⚠️
Se você aplicou um filtro de status na tela de vendas (ex: "Pago", "Pendente"), as vendas com status "Devolvido" não aparecem.

**Como verificar:**
- Na tela de Vendas, procure por um dropdown ou campo de filtro "Status"
- Se estiver selecionado algo diferente de "Todos" ou vazio, limpe o filtro

### 2. **Filtro de Data** 📅
Se você tem um filtro de data ativo mostrando apenas vendas de um período específico, vendas antigas não aparecem.

**Como verificar:**
- Verifique se há filtros de "Data Início" e "Data Fim"
- Limpe esses filtros para ver todas as vendas

### 3. **Filtro de Loja** 🏪
Se o usuário tem permissão apenas para uma loja específica, só vê vendas daquela loja.

**Como verificar:**
- Verifique se o usuário tem `permissoes.loja_id` definido
- Admin vê todas as vendas, usuários normais veem apenas da sua loja

### 4. **Problema de Permissão** 🔒
Se o usuário não tem permissão `ver_todas_vendas`, só vê suas próprias vendas.

**Como verificar:**
```typescript
if (!canViewTodasVendas && v.id_usuario !== user?.id) {
  return false;
}
```

### 5. **Filtro "Ver Apenas Minhas Vendas"** 👤
Pode haver um toggle ou checkbox ativo que filtra apenas vendas do usuário logado.

## ✅ Como Verificar se a Venda Ainda Existe

### Opção 1: Verificar no Supabase
1. Acesse o Supabase Dashboard
2. Vá em **Table Editor**
3. Abra a tabela `vendas`
4. Procure pela venda do dia 01
5. Verifique o campo `status_pagamento` - deve estar como `"devolvido"`

### Opção 2: Verificar no Console do Navegador
1. Abra o console (F12)
2. Vá para a aba de Vendas
3. Digite no console:
```javascript
// Ver todas as vendas carregadas
console.table(JSON.parse(localStorage.getItem('vendas') || '[]'));

// Ou inspecione o estado
// (se estiver usando React DevTools)
```

### Opção 3: Limpar TODOS os Filtros
1. Na tela de Vendas, procure por um botão "Limpar Filtros" ou similar
2. Limpe todos os campos de busca e filtros
3. Verifique se a venda aparece

## 🔧 Solução Proposta

### 1. **Adicionar Indicador Visual para Vendas Devolvidas**

As vendas devolvidas devem ser VISÍVEIS mas com indicação clara:

```tsx
// Em vez de esconder, mostrar com badge "DEVOLVIDA"
{status === "devolvido" && (
  <Chip color="danger" variant="flat" size="sm">
    DEVOLVIDA
  </Chip>
)}
```

### 2. **Adicionar Filtro Específico para Ver/Ocultar Devoluções**

Permitir que o usuário escolha se quer ver ou não as vendas devolvidas:

```typescript
const [filters, setFilters] = useState<FilterState>({
  // ... outros filtros
  incluirDevolvidas: true, // Por padrão, mostra as devolvidas
});

// No filtro:
.filter((v) => {
  // Se não quiser incluir devolvidas, filtrar
  if (!filters.incluirDevolvidas && v.status_calc === "devolvido") {
    return false;
  }
  // ... resto dos filtros
})
```

### 3. **Melhorar o Card/Linha da Venda Devolvida**

```tsx
<Card
  className={`
    ${venda.status_pagamento === "devolvido" 
      ? "opacity-60 border-2 border-danger" 
      : ""
    }
  `}
>
  {/* Conteúdo do card */}
  {venda.status_pagamento === "devolvido" && (
    <div className="absolute top-2 right-2">
      <Chip color="danger" size="sm">DEVOLVIDA</Chip>
    </div>
  )}
</Card>
```

### 4. **Adicionar Link para a Devolução**

Na visualização da venda, mostrar link para a devolução correspondente:

```tsx
{venda.status_pagamento === "devolvido" && (
  <div className="mt-4 p-4 bg-danger-50 rounded-lg">
    <p className="text-sm font-semibold text-danger">
      ⚠️ Esta venda foi devolvida
    </p>
    <Button
      size="sm"
      color="danger"
      variant="light"
      onPress={() => {
        // Navegar para a tela de devoluções
        // Filtrar pela venda
        router.push(`/sistema/devolucoes?venda_id=${venda.id}`);
      }}
    >
      Ver Devolução
    </Button>
  </div>
)}
```

## 📊 Estatísticas Recomendadas

Na tela de vendas, adicionar cards de resumo:

```tsx
<div className="grid grid-cols-4 gap-4 mb-6">
  <Card>
    <CardBody>
      <p className="text-sm text-default-500">Total de Vendas</p>
      <p className="text-2xl font-bold">{vendas.length}</p>
    </CardBody>
  </Card>

  <Card>
    <CardBody>
      <p className="text-sm text-default-500">Vendas Devolvidas</p>
      <p className="text-2xl font-bold text-danger">
        {vendas.filter(v => v.status_pagamento === "devolvido").length}
      </p>
    </CardBody>
  </Card>

  {/* ... outros cards */}
</div>
```

## 🎯 Próximos Passos

1. **Verificar no Supabase** se a venda realmente existe
2. **Limpar todos os filtros** na tela de vendas
3. **Verificar permissões** do usuário logado
4. **Implementar as melhorias** sugeridas acima

## 🔍 Debug Rápido

Adicione isso temporariamente no `app/sistema/vendas/page.tsx` após carregar as vendas:

```typescript
useEffect(() => {
  console.log("📊 VENDAS DEBUG:", {
    total: vendas.length,
    devolvidas: vendas.filter(v => v.status_pagamento === "devolvido").length,
    filtradas: filtered.length,
    filtros: filters,
  });
}, [vendas, filtered, filters]);
```

Depois, abra o console (F12) e veja o que está sendo filtrado!
