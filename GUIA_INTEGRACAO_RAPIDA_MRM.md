# 🚀 GUIA DE INTEGRAÇÃO RÁPIDA - MRM

## Como integrar o MRM no chat atual

### PASSO 1: Adicionar os scripts no chat.html

```html
<!-- Após o <script> do marked.js, adicionar: -->

<!-- MRM System -->
<script src="../js/markdown/mrm-parser.js"></script>
<script src="../js/markdown/components/card.js"></script>
<script src="../js/markdown/components/progress.js"></script>
<script src="../js/markdown/components/chart.js"></script>
<script src="../js/markdown/mrm-init.js"></script>
```

**Localização exata:** Após a linha 98 de [chat.html](client/html/chat.html#L98)

---

### PASSO 2: O sistema substitui automaticamente

O arquivo `mrm-init.js` automaticamente substitui a função `renderMarkdown()` existente.

**NENHUMA mudança necessária no código do chat!** 🎉

A função original é preservada como backup em `renderMarkdownOriginal()`.

---

### PASSO 3: Atualizar o prompt da IA

No arquivo `serverAgent.js`, adicionar as instruções do MRM ao `RESPONSE_PROMPT`:

```javascript
// Localização: serverAgent.js, linha ~833
const RESPONSE_PROMPT = `... (conteúdo existente) ...

=== SISTEMA DE MARCAÇÃO AVANÇADA (MRM) ===

Além do Markdown padrão, você pode usar componentes especiais:

 **GRÁFICOS**:
@chart[tipo=line,titulo=Meu Gráfico,formato=moeda]
{
  "labels": ["Jan", "Fev", "Mar"],
  "datasets": [
    {"label": "Receitas", "data": [5000, 6000, 5500], "borderColor": "#4a9eff"}
  ]
}
@/chart

 **CARDS**:
@card[tipo=sucesso,icone=✓]
**Título**
Conteúdo do card
@/card

 **PROGRESSO**:
@progress[valor=7500,meta=10000,label=Minha Meta]

**QUANDO USAR:**
- Gráficos: comparações numéricas ao longo do tempo
- Cards: destaques importantes (sucesso, alerta, erro, info)
- Progress: visualizar progresso de metas

**REGRA:** Use componentes apenas quando agregam valor. Markdown simples para 80% das respostas.
`;
```

---

### PASSO 4: Testar

1. Abra `test-mrm.html` no navegador
2. Clique nos botões de teste
3. Verifique se os componentes renderizam corretamente

---

## EXEMPLOS DE USO PARA A IA

### Exemplo 1: Resposta sobre saldo com gráfico

**Pergunta do usuário:** "Quanto gastei nos últimos 3 meses?"

**Resposta da IA:**

```markdown
## Seus Gastos - Últimos 3 Meses

@chart[tipo=bar,titulo=Despesas Mensais,formato=moeda]
{
  "labels": ["Novembro", "Dezembro", "Janeiro"],
  "datasets": [{
    "label": "Despesas",
    "data": [3200, 3500, 2800],
    "backgroundColor": "#ff6b9d"
  }]
}
@/chart

@card[tipo=info,icone=📊]
**Total de Despesas: R$ 9.500**
Você economizou R$ 700 em Janeiro comparado a Dezembro!
@/card
```

---

### Exemplo 2: Progresso de meta

**Pergunta do usuário:** "Como está minha meta de fundo de emergência?"

**Resposta da IA:**

```markdown
## Fundo de Emergência

@progress[valor=7500,meta=10000,label=Fundo de Emergência]

@card[tipo=sucesso,icone=✓]
**Você está no caminho certo!**
Já acumulou **75%** da sua meta. Faltam apenas R$ 2.500 para completar.
@/card

💡 **Dica:** Mantendo R$ 500/mês, você atinge a meta em **5 meses**.
```

---

### Exemplo 3: Análise completa com múltiplos componentes

**Pergunta do usuário:** "Me dá um resumo do mês"

**Resposta da IA:**

```markdown
# 📊 Resumo de Janeiro 2026

## Visão Geral

@card[tipo=info,icone=💰]
**Saldo do Mês: +R$ 2.800**
Receitas de R$ 6.200 - Despesas de R$ 3.400
@/card

## Evolução Financeira

@chart[tipo=line,titulo=Receitas vs Despesas,formato=moeda]
{
  "labels": ["Out", "Nov", "Dez", "Jan"],
  "datasets": [
    {
      "label": "Receitas",
      "data": [5500, 5800, 6000, 6200],
      "borderColor": "#4a9eff",
      "tension": 0.4
    },
    {
      "label": "Despesas",
      "data": [3100, 3200, 3500, 3400],
      "borderColor": "#ff6b9d",
      "tension": 0.4
    }
  ]
}
@/chart

## Progresso das Metas

@progress[valor=12500,meta=15000,label=Fundo de Emergência]

@progress[valor=8200,meta=50000,label=Entrada do Apartamento]

## Destaques

@card[tipo=alerta,icone=⚠️]
**Atenção!**
Gastos com *Alimentação* subiram 20% (R$ 1.200 → R$ 1.440)
@/card

---

**Quer detalhes sobre alguma categoria específica?**
```

---

## TIPOS DE COMPONENTES DISPONÍVEIS

### 1. CHART (Gráficos)

**Tipos suportados:**
- `line` - Gráfico de linha
- `bar` - Gráfico de barras
- `pie` - Gráfico de pizza
- `doughnut` - Gráfico de rosca
- `radar` - Gráfico de radar

**Atributos:**
- `tipo` - Tipo do gráfico
- `titulo` - Título opcional
- `formato` - `moeda` para formatar como R$

**Exemplo:**
```markdown
@chart[tipo=bar,titulo=Despesas por Categoria,formato=moeda]
{
  "labels": ["Alimentação", "Transporte", "Lazer"],
  "datasets": [{
    "label": "Gastos",
    "data": [1200, 800, 500],
    "backgroundColor": ["#ff6b9d", "#4a9eff", "#27ae60"]
  }]
}
@/chart
```

---

### 2. CARD (Cartões Informativos)

**Tipos:**
- `sucesso` - Verde (✓)
- `alerta` - Laranja (⚠)
- `erro` - Vermelho (✕)
- `info` - Azul (ℹ)
- `neutro` - Cinza (●)

**Atributos:**
- `tipo` - Tipo do card
- `icone` - Emoji customizado (opcional)

**Exemplo:**
```markdown
@card[tipo=sucesso,icone=🎉]
**Meta Alcançada!**
Você economizou R$ 2.000 este mês!
@/card
```

---

### 3. PROGRESS (Barras de Progresso)

**Atributos:**
- `valor` - Valor atual (número)
- `meta` - Valor da meta (número)
- `label` - Texto descritivo
- `mostrarValores` - `true` ou `false` (padrão: true)

**Exemplo:**
```markdown
@progress[valor=7500,meta=10000,label=Fundo de Emergência]
```

---

## BOAS PRÁTICAS

### ✅ FAÇA:
- Use gráficos para comparações numéricas ao longo do tempo
- Use cards para destacar informações importantes
- Use progress para visualizar metas
- Combine componentes com markdown normal
- Mantenha gráficos simples e legíveis

### ❌ NÃO FAÇA:
- Não use gráficos para dados simples (ex: um único valor)
- Não abuse de cards (máximo 2-3 por resposta)
- Não crie gráficos com mais de 10 pontos de dados
- Não use componentes quando texto simples é suficiente

---

## FALLBACK E SEGURANÇA

O sistema possui fallbacks automáticos:

1. Se um componente falhar → renderiza como markdown
2. Se MRM não carregar → usa `renderMarkdown` original
3. Se JSON inválido → mostra mensagem de erro amigável
4. Se biblioteca externa falhar → degrada graciosamente

**O chat NUNCA quebra por causa do MRM!** 🛡️

---

## PERFORMANCE

- **Cache automático:** Respostas iguais são cacheadas
- **Lazy loading:** Bibliotecas carregam sob demanda
- **Animações otimizadas:** CSS com GPU acceleration
- **Impacto:** ~120KB gzipped (bibliotecas já no projeto)

---

## PRÓXIMOS COMPONENTES (Roadmap)

- [ ] `@table` - Tabelas avançadas (ordenável, filtrável)
- [ ] `@math` - Fórmulas matemáticas (KaTeX)
- [ ] `@button` - Botões de ação
- [ ] `@compare` - Comparações lado a lado
- [ ] `@timeline` - Linha do tempo
- [ ] `@diagram` - Diagramas (Mermaid)

---

## SUPORTE E DEBUG

### Verificar se MRM está funcionando:

```javascript
// No console do navegador:
console.log(window.mrmParser);  // Deve mostrar o objeto
window.testMRM();               // Roda teste completo
```

### Limpar cache:

```javascript
window.mrmParser.clearCache();
```

### Ver componentes registrados:

```javascript
Array.from(window.mrmParser.components.keys());
```

---

## ARQUIVOS CRIADOS

```
client/js/markdown/
├── mrm-parser.js              ✅ Parser principal
├── mrm-init.js                ✅ Inicializador
└── components/
    ├── chart.js               ✅ Componente de gráficos
    ├── card.js                ✅ Componente de cards
    └── progress.js            ✅ Componente de progress

test-mrm.html                  ✅ Página de testes

ANALISE_SISTEMA_MARKDOWN.md   ✅ Documentação completa
GUIA_INTEGRACAO_RAPIDA.md     ✅ Este guia
```

---

## CONCLUSÃO

O sistema MRM está pronto para uso! Basta:

1. Adicionar os `<script>` tags no chat.html
2. Atualizar o prompt da IA no serverAgent.js
3. Testar com `test-mrm.html`

**Tempo estimado de integração:** 15 minutos ⏱️

**Impacto na experiência do usuário:** MASSIVO 🚀

---

**Dúvidas?** Consulte [ANALISE_SISTEMA_MARKDOWN.md](ANALISE_SISTEMA_MARKDOWN.md) para documentação completa.
