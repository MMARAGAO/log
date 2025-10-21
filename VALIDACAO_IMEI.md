# 📱 Validação de IMEI - Documentação

## 🔍 O que foi implementado

### 1. **Validação Local (Algoritmo Luhn)**

✅ **Sempre ativa** - não precisa de internet
✅ **Instantânea** - valida em milissegundos
✅ **Confiável** - algoritmo padrão da indústria

**Verifica:**

- ✓ Exatamente 15 dígitos
- ✓ Apenas números
- ✓ TAC não é 00000000
- ✓ Dígito verificador correto (Luhn)

### 2. **Consulta Online (API IMEI.info)**

✅ **Opcional** - só se tiver internet
✅ **Automática** - após detectar IMEI válido
✅ **Inteligente** - preenche marca e modelo automaticamente

**Retorna:**

- 📱 Marca do aparelho
- 📱 Modelo do aparelho
- ✓ Confirmação adicional de validade

## 🎯 Como funciona

### Fluxo de Validação:

1. **Captura da imagem** com OCR
2. **Extrai todos os números** detectados
3. **Busca sequências de 15 dígitos**
4. **Valida cada uma localmente** (algoritmo Luhn)
5. **Filtra apenas IMEIs válidos**
6. **Consulta online** o primeiro válido encontrado
7. **Preenche marca/modelo** automaticamente (se disponível)
8. **Fecha o modal** e insere no formulário

### Exemplo Prático:

**Foto contém:**

```
Serial: 1234567890
IMEI: 352066101234567
Barcode: 7891234567890
```

**Sistema faz:**

1. Detecta: "1234567890352066101234567789123456789"
2. Extrai candidatos: ["123456789035206", "352066101234567", "789123456789"]
3. Valida Luhn: apenas "352066101234567" é válido ✓
4. Consulta API: Retorna "Apple iPhone 12 Pro"
5. Preenche automaticamente:
   - IMEI: 35 206610 123456 7
   - Marca: Apple
   - Modelo: iPhone 12 Pro

## 🌐 APIs Públicas de Validação de IMEI

### 1. **IMEI.info** (Implementada) ⭐

- **URL**: `https://imei.info/api/check?imei={imei}`
- **Grátis**: Sim (limitado)
- **Retorna**: Marca, Modelo, TAC
- **Limitações**: ~100 consultas/dia

### 2. **Outras Opções**

#### **IMEI24.com API**

```javascript
fetch(`https://api.imei24.com/v1/check/${imei}`, {
  headers: { "X-API-KEY": "sua_chave" },
});
```

- Grátis: 500 consultas/mês
- Requer registro

#### **NumVerify (Apilayer)**

```javascript
fetch(`https://apilayer.net/api/validate?access_key=KEY&number=${imei}`);
```

- Grátis: 250 consultas/mês
- Requer API key

#### **CheckIMEI.com**

```javascript
fetch(`https://www.checkimei.com/api/v1/${imei}`);
```

- Grátis: 100 consultas/dia
- Sem necessidade de chave

## 🔧 Como trocar de API

Se quiser usar outra API, edite `utils/aparelhos.ts`:

```typescript
export async function consultarIMEI(imei: string): Promise<{
  valido: boolean;
  marca?: string;
  modelo?: string;
  erro?: string;
}> {
  try {
    const limpo = imei.replace(/\D/g, "");

    if (!validarIMEI(limpo)) {
      return { valido: false, erro: "IMEI inválido" };
    }

    // TROCAR AQUI - Exemplo com IMEI24
    const response = await fetch(`https://api.imei24.com/v1/check/${limpo}`, {
      headers: {
        "X-API-KEY": "SUA_CHAVE_AQUI",
      },
    });

    const data = await response.json();

    return {
      valido: true,
      marca: data.device?.brand,
      modelo: data.device?.model,
    };
  } catch (error) {
    return {
      valido: validarIMEI(imei),
      erro: "Erro ao consultar API",
    };
  }
}
```

## ⚠️ Importante

### Limitações:

- APIs gratuitas têm limites de requisições
- Nem todos os IMEIs estão nas bases de dados
- Modelos muito novos podem não estar cadastrados
- Aparelhos de marcas menores podem não retornar dados

### Fallback:

Se a API falhar ou não retornar dados:

- ✅ IMEI ainda é validado localmente (Luhn)
- ✅ Campo IMEI é preenchido normalmente
- ℹ️ Marca/Modelo devem ser preenchidos manualmente

## 🎯 Validação Offline vs Online

### Offline (Luhn) ✅

- **Vantagens:**
  - ✓ Funciona sem internet
  - ✓ Instantâneo
  - ✓ 100% confiável para formato
  - ✓ Sem limites de uso
- **Limitações:**
  - ✗ Não verifica se é roubado
  - ✗ Não retorna marca/modelo
  - ✗ Não verifica blacklist

### Online (API) 🌐

- **Vantagens:**
  - ✓ Retorna marca e modelo
  - ✓ Verifica base de dados mundial
  - ✓ Pode detectar IMEIs clonados
  - ✓ Preenche campos automaticamente
- **Limitações:**
  - ✗ Precisa de internet
  - ✗ Limitado por quotas
  - ✗ Pode ser lento (300-1000ms)
  - ✗ APIs podem sair do ar

## 📊 Logs e Debug

O sistema loga todas as etapas:

```javascript
console.log("🔢 Números extraídos:", numeros);
console.log("🎯 IMEI candidatos encontrados:", candidatos);
console.log("✓ IMEI válidos:", validos);
console.log("📱 IMEI selecionado:", imeiDetectado);
console.log("📡 Informações do IMEI:", infoIMEI);
```

Abra o console (F12) para ver o processo completo!

## 🚀 Melhorias Futuras

### Possíveis adições:

1. **Cache local** de consultas anteriores
2. **Múltiplas APIs** com fallback automático
3. **Blacklist check** para IMEIs roubados
4. **Histórico de IMEIs** consultados
5. **Exportar relatório** de validações

### Banco de dados offline:

- Download de TAC database (~50MB)
- Validação 100% offline com marca/modelo
- Atualização mensal via script

---

**Pronto para usar!** 🎉
