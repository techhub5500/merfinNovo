# 💬 EXEMPLOS DE RESPOSTAS COM MRM

Exemplos práticos de como a IA deve formatar respostas usando o Merfin Rich Markup.

---

## CENÁRIO 1: Consulta de Saldo

### Pergunta do Usuário:
> "Qual meu saldo total do ano?"

### ❌ Resposta ANTIGA (só texto):
```
Seu saldo total de 2025 foi:

- Total de Receitas: R$ 72.000,00
- Total de Despesas: R$ 45.000,00
- Saldo Líquido: R$ 27.000,00

Você teve um bom controle financeiro!
```

### ✅ Resposta NOVA (com MRM):
```markdown
## 📊 Seu Saldo Total de 2025

@chart[tipo=bar,titulo=Receitas vs Despesas 2025,formato=moeda]
{
  "labels": ["Receitas", "Despesas", "Saldo"],
  "datasets": [{
    "data": [72000, 45000, 27000],
    "backgroundColor": ["#4a9eff", "#ff6b9d", "#27ae60"]
  }]
}
@/chart

@card[tipo=sucesso,icone=✓]
**Saldo Positivo de R$ 27.000!**
Você economizou 37,5% de tudo que ganhou. Excelente controle!
@/card
```

---

## CENÁRIO 2: Progresso de Meta

### Pergunta do Usuário:
> "Como está minha meta de juntar R$ 15.000 para o fundo de emergência?"

### ❌ Resposta ANTIGA:
```
Você já juntou R$ 11.250 de R$ 15.000.
Isso representa 75% da meta.
Faltam R$ 3.750 para completar.
```

### ✅ Resposta NOVA (com MRM):
```markdown
## Fundo de Emergência

@progress[valor=11250,meta=15000,label=Fundo de Emergência]

@card[tipo=info,icone=📊]
**Você está quase lá!**
Já acumulou **R$ 11.250** de R$ 15.000 (75% da meta)
@/card

### 💡 Quanto Falta?

Faltam **R$ 3.750** para completar sua meta.

Se você mantiver a média de R$ 750/mês, vai atingir em **5 meses** (Junho 2026).

Quer ajustar o valor mensal para acelerar?
```

---

## CENÁRIO 3: Análise de Gastos por Categoria

### Pergunta do Usuário:
> "Quanto gastei em cada categoria este mês?"

### ❌ Resposta ANTIGA:
```
Seus gastos de Janeiro 2026:

- Alimentação: R$ 1.440,00
- Transporte: R$ 650,00
- Lazer: R$ 420,00
- Saúde: R$ 280,00
- Outros: R$ 610,00

Total: R$ 3.400,00
```

### ✅ Resposta NOVA (com MRM):
```markdown
## 💸 Despesas de Janeiro 2026

@chart[tipo=pie,titulo=Distribuição de Gastos,formato=moeda]
{
  "labels": ["Alimentação", "Transporte", "Lazer", "Saúde", "Outros"],
  "datasets": [{
    "data": [1440, 650, 420, 280, 610],
    "backgroundColor": [
      "#ff6b9d",
      "#4a9eff",
      "#f39c12",
      "#27ae60",
      "#95a5a6"
    ]
  }]
}
@/chart

### Resumo

| Categoria | Valor | % do Total |
|-----------|-------|------------|
| 🍔 Alimentação | R$ 1.440 | 42% |
| 🚗 Transporte | R$ 650 | 19% |
| 🎮 Lazer | R$ 420 | 12% |
| 💊 Saúde | R$ 280 | 8% |
| 📦 Outros | R$ 610 | 18% |
| **TOTAL** | **R$ 3.400** | **100%** |

@card[tipo=alerta,icone=⚠️]
**Atenção!**
*Alimentação* representa 42% dos seus gastos. Considere revisar esse orçamento.
@/card
```

---

## CENÁRIO 4: Comparação Mensal

### Pergunta do Usuário:
> "Compare meus gastos de dezembro e janeiro"

### ❌ Resposta ANTIGA:
```
Comparação Dezembro 2025 vs Janeiro 2026:

Dezembro:
- Receitas: R$ 6.000
- Despesas: R$ 3.500
- Saldo: +R$ 2.500

Janeiro:
- Receitas: R$ 6.200
- Despesas: R$ 3.400
- Saldo: +R$ 2.800

Você melhorou! Suas receitas aumentaram 3,3% e despesas diminuíram 2,9%.
```

### ✅ Resposta NOVA (com MRM):
```markdown
## 📊 Comparação: Dezembro vs Janeiro

@chart[tipo=bar,titulo=Evolução Financeira,formato=moeda]
{
  "labels": ["Receitas", "Despesas", "Saldo"],
  "datasets": [
    {
      "label": "Dezembro",
      "data": [6000, 3500, 2500],
      "backgroundColor": "rgba(149, 165, 166, 0.6)"
    },
    {
      "label": "Janeiro",
      "data": [6200, 3400, 2800],
      "backgroundColor": "#4a9eff"
    }
  ]
}
@/chart

### Análise

@card[tipo=sucesso,icone=📈]
**Você melhorou em Janeiro!**

- ✅ Receitas: +R$ 200 (↑ 3,3%)
- ✅ Despesas: -R$ 100 (↓ 2,9%)
- ✅ Saldo: +R$ 300 (↑ 12%)
@/card

**Principais Mudanças:**
- Alimentação: R$ 1.500 → R$ 1.440 (↓ 4%)
- Lazer: R$ 520 → R$ 420 (↓ 19%) 👏
- Transporte: R$ 600 → R$ 650 (↑ 8%)

Continue assim! Janeiro foi melhor que dezembro.
```

---

## CENÁRIO 5: Planejamento de Meta

### Pergunta do Usuário:
> "Quero juntar R$ 50.000 para dar entrada num apartamento. Quanto preciso guardar por mês?"

### ❌ Resposta ANTIGA:
```
Para juntar R$ 50.000:

- Em 12 meses: R$ 4.167/mês
- Em 24 meses: R$ 2.083/mês
- Em 36 meses: R$ 1.389/mês

Você já tem R$ 8.200 guardados, então:
- Em 12 meses: R$ 3.483/mês
- Em 24 meses: R$ 1.742/mês
- Em 36 meses: R$ 1.161/mês
```

### ✅ Resposta NOVA (com MRM):
```markdown
## 🏠 Planejamento: Entrada do Apartamento

### Situação Atual

@progress[valor=8200,meta=50000,label=Meta: Entrada do Apartamento]

Você já tem **R$ 8.200** guardados.  
Faltam **R$ 41.800** para completar.

### Simulações de Prazos

@chart[tipo=bar,titulo=Valor Mensal por Prazo,formato=moeda]
{
  "labels": ["12 meses", "24 meses", "36 meses"],
  "datasets": [{
    "label": "Valor Mensal",
    "data": [3483, 1742, 1161],
    "backgroundColor": ["#e74c3c", "#f39c12", "#27ae60"]
  }]
}
@/chart

| Prazo | Valor/Mês | Viável? |
|-------|-----------|---------|
| 🔴 12 meses | R$ 3.483 | Difícil (58% da renda) |
| 🟡 24 meses | R$ 1.742 | Apertado (29% da renda) |
| 🟢 36 meses | R$ 1.161 | Ideal (19% da renda) |

@card[tipo=sucesso,icone=✓]
**Recomendação: 36 meses**

Guardando **R$ 1.161/mês**, você atinge a meta em **Fevereiro de 2029**.

Isso representa 19% da sua renda atual (R$ 6.000), deixando espaço para emergências e lazer.
@/card

### 💡 Dica Extra

Se você conseguir guardar R$ 1.500/mês:
- Atinge a meta em **28 meses** (Junho 2028)
- Economiza 8 meses!

Quer que eu crie um planejamento mensal detalhado?
```

---

## CENÁRIO 6: Alerta de Despesa Alta

### Pergunta do Usuário:
> "Por que meus gastos subiram tanto?"

### ❌ Resposta ANTIGA:
```
Seus gastos subiram de R$ 3.200 para R$ 3.800 (aumento de 18,75%).

Categorias que mais aumentaram:
- Alimentação: +R$ 300
- Transporte: +R$ 200
- Lazer: +R$ 100
```

### ✅ Resposta NOVA (com MRM):
```markdown
## 🔍 Análise: Aumento de Despesas

@chart[tipo=line,titulo=Evolução dos Gastos (3 meses),formato=moeda]
{
  "labels": ["Novembro", "Dezembro", "Janeiro"],
  "datasets": [{
    "label": "Despesas Totais",
    "data": [3200, 3200, 3800],
    "borderColor": "#ff6b9d",
    "backgroundColor": "rgba(255, 107, 157, 0.1)",
    "tension": 0.4
  }]
}
@/chart

@card[tipo=alerta,icone=📊]
**Aumento de 18,75%**
Seus gastos subiram de R$ 3.200 para R$ 3.800 (+R$ 600)
@/card

### O que mudou?

@chart[tipo=bar,titulo=Maiores Aumentos por Categoria,formato=moeda]
{
  "labels": ["Alimentação", "Transporte", "Lazer"],
  "datasets": [{
    "label": "Aumento",
    "data": [300, 200, 100],
    "backgroundColor": "#e74c3c"
  }]
}
@/chart

**Principais Vilões:**
1. 🍔 **Alimentação:** +R$ 300 (R$ 1.100 → R$ 1.400)
   - Provável causa: Mais pedidos de delivery
2. 🚗 **Transporte:** +R$ 200 (R$ 550 → R$ 750)
   - Provável causa: Aumento do combustível ou mais corridas
3. 🎮 **Lazer:** +R$ 100 (R$ 380 → R$ 480)

### 💡 Recomendações

@card[tipo=info,icone=💡]
**Como voltar ao normal:**

1. **Alimentação:** Cozinhe mais em casa (economize R$ 150-200/mês)
2. **Transporte:** Use transporte público 2x/semana (economize R$ 80/mês)
3. **Lazer:** Defina limite de R$ 400/mês

Com essas mudanças, você volta para R$ 3.200-3.300/mês.
@/card

Quer ajuda para criar um plano de redução de gastos?
```

---

## CENÁRIO 7: Resposta Simples (sem componentes)

### Pergunta do Usuário:
> "Oi, tudo bem?"

### ✅ Resposta (markdown simples):
```markdown
Oi! Tudo ótimo por aqui. Como posso te ajudar hoje? 😊

Posso te mostrar:
- Seu saldo atual
- Progresso das suas metas
- Análise de gastos
- Planejamento futuro

O que você gostaria de ver?
```

**IMPORTANTE:** Nem toda resposta precisa de componentes MRM! Use apenas quando agregar valor.

---

## BOAS PRÁTICAS

### ✅ QUANDO USAR COMPONENTES:

1. **Gráficos:**
   - Comparações numéricas (mês a mês, categoria a categoria)
   - Evolução temporal (tendências)
   - Distribuições (pie/doughnut para percentuais)

2. **Cards:**
   - Destaques importantes (metas alcançadas, alertas)
   - Resumos executivos
   - Recomendações principais

3. **Progress Bars:**
   - Visualizar progresso de metas
   - Mostrar percentuais de forma visual

### ❌ QUANDO NÃO USAR:

- Perguntas simples de "oi", "obrigado", "tchau"
- Dados únicos (ex: "qual meu saldo?" → só texto)
- Informações que não são numéricas
- Quando o usuário pede texto simples

---

## REGRA DE OURO

**80% das respostas:** Markdown simples + 1 componente (se relevante)  
**20% das respostas:** Markdown + múltiplos componentes (análises complexas)

**Sempre priorize:**
1. Clareza
2. Objetividade
3. Relevância

**Componentes devem COMPLEMENTAR, não SUBSTITUIR o texto explicativo!**

---

## CHECKLIST PARA A IA

Antes de usar um componente, pergunte:

- [ ] Esse dado é numérico?
- [ ] A visualização ajuda a entender melhor?
- [ ] O componente adiciona valor real?
- [ ] A resposta ficaria confusa só com texto?
- [ ] Tenho dados suficientes (mínimo 2-3 pontos)?

Se respondeu "sim" para 3+, use o componente! 🎯

---

**Fim dos Exemplos** ✅
