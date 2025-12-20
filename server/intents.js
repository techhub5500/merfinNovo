// ========== DEFINIÇÃO DE INTENTS ==========
// Intents são rótulos que definem a ação mental ou prática que o agente deve executar

const INTENTS = {
    // ===== MANIPULAÇÃO DE RECEITAS =====
    ADD_INCOME: "INTENT_ADD_INCOME",                      // Adicionar receita
    EDIT_INCOME: "INTENT_EDIT_INCOME",                    // Editar receita específica
    DELETE_INCOME: "INTENT_DELETE_INCOME",                // Deletar receita
    UPDATE_INCOME_FIELD: "INTENT_UPDATE_INCOME_FIELD",    // Atualizar apenas um campo de receita
    LIST_INCOMES: "INTENT_LIST_INCOMES",                  // Listar receitas
    
    // ===== MANIPULAÇÃO DE DESPESAS =====
    ADD_EXPENSE: "INTENT_ADD_EXPENSE",                    // Adicionar despesa
    EDIT_EXPENSE: "INTENT_EDIT_EXPENSE",                  // Editar despesa específica
    DELETE_EXPENSE: "INTENT_DELETE_EXPENSE",              // Deletar despesa
    UPDATE_EXPENSE_FIELD: "INTENT_UPDATE_EXPENSE_FIELD",  // Atualizar apenas um campo de despesa
    LIST_EXPENSES: "INTENT_LIST_EXPENSES",                // Listar despesas
    
    // ===== MANIPULAÇÃO DE PLANILHAS GERAIS =====
    REPLACE_INCOME: "INTENT_REPLACE_INCOME",              // Substituir receita inteira
    REPLACE_EXPENSE: "INTENT_REPLACE_EXPENSE",            // Substituir despesa inteira
    CLEAR_ALL_INCOMES: "INTENT_CLEAR_ALL_INCOMES",        // Limpar todas as receitas
    CLEAR_ALL_EXPENSES: "INTENT_CLEAR_ALL_EXPENSES",      // Limpar todas as despesas
    
    // ===== CONSULTAS E ANÁLISES =====
    ANALYZE_SPENDING: "INTENT_ANALYZE_SPENDING",          // Analisar gastos
    CALCULATE_BALANCE: "INTENT_CALCULATE_BALANCE",        // Calcular saldo
    COMPARE_MONTHS: "INTENT_COMPARE_MONTHS",              // Comparar meses
    FORECAST_BUDGET: "INTENT_FORECAST_BUDGET",            // Projetar orçamento
    CATEGORY_BREAKDOWN: "INTENT_CATEGORY_BREAKDOWN",      // Breakdown por categoria
    
    // ===== METAS FINANCEIRAS =====
    UPDATE_GOAL: "INTENT_UPDATE_GOAL",                    // Atualizar meta
    CHECK_GOAL_PROGRESS: "INTENT_CHECK_GOAL_PROGRESS",    // Verificar progresso da meta
    CREATE_SAVINGS_PLAN: "INTENT_CREATE_SAVINGS_PLAN",    // Criar plano de economia
    
    // ===== EDUCAÇÃO FINANCEIRA =====
    EXPLAIN_CONCEPT: "INTENT_EXPLAIN_CONCEPT",            // Explicar conceito financeiro
    INVESTMENT_ADVICE: "INTENT_INVESTMENT_ADVICE",        // Conselho de investimento
    DEBT_MANAGEMENT: "INTENT_DEBT_MANAGEMENT",            // Gestão de dívidas
    BUDGETING_TIPS: "INTENT_BUDGETING_TIPS",              // Dicas de orçamento
    FINANCIAL_EDUCATION: "INTENT_FINANCIAL_EDUCATION",    // Educação financeira geral
    
    // ===== CÁLCULOS MATEMÁTICOS =====
    CALCULATE_PERCENTAGE: "INTENT_CALCULATE_PERCENTAGE",  // Calcular porcentagem
    CALCULATE_INTEREST: "INTENT_CALCULATE_INTEREST",      // Calcular juros
    CALCULATE_INSTALLMENT: "INTENT_CALCULATE_INSTALLMENT",// Calcular parcela
    SIMPLE_MATH: "INTENT_SIMPLE_MATH",                    // Matemática simples
    
    // ===== CONVERSAÇÃO E ESCLARECIMENTO =====
    JUST_CHAT: "INTENT_JUST_CHAT",                        // Apenas conversar
    CLARIFY: "INTENT_CLARIFY",                            // Pedir esclarecimento
    GREETING: "INTENT_GREETING",                          // Saudação
    FAREWELL: "INTENT_FAREWELL",                          // Despedida
    THANKS: "INTENT_THANKS",                              // Agradecimento
    
    // ===== AÇÕES DE SISTEMA =====
    HELP: "INTENT_HELP",                                  // Pedir ajuda
    SHOW_SUMMARY: "INTENT_SHOW_SUMMARY",                  // Mostrar resumo financeiro
    EXPORT_DATA: "INTENT_EXPORT_DATA",                    // Exportar dados
    
    // ===== FALLBACK =====
    UNKNOWN: "INTENT_UNKNOWN"                             // Intenção não reconhecida
};

// ========== EXEMPLOS DE MENSAGENS PARA CADA INTENT ==========
const INTENT_EXAMPLES = {
    [INTENTS.ADD_INCOME]: [
        "Recebi meu salário de R$ 5000",
        "Ganhei R$ 200 de freelance",
        "Adiciona uma receita de R$ 1500",
        "Preciso registrar um ganho de R$ 3000",
        "Coloca aí que recebi R$ 800 hoje",
        "Registra um recebimento de R$ 2500",
        "Entrou R$ 1000 na conta"
    ],
    
    [INTENTS.ADD_EXPENSE]: [
        "Paguei R$ 150 no mercado",
        "Gastei R$ 80 no uber",
        "Adiciona uma despesa de R$ 200",
        "Preciso registrar um gasto de R$ 500",
        "Coloca aí que gastei R$ 100 em alimentação",
        "Saiu R$ 300 do cartão",
        "Paguei a conta de luz de R$ 180"
    ],
    
    [INTENTS.EDIT_INCOME]: [
        "Edita a receita de salário para R$ 5500",
        "Corrige o valor da receita do dia 15 para R$ 2000",
        "Altera a receita de freelance para R$ 1500",
        "Preciso mudar o valor da minha renda",
        "Atualiza aquela receita que adicionei ontem"
    ],
    
    [INTENTS.EDIT_EXPENSE]: [
        "Edita a despesa do mercado para R$ 200",
        "Corrige o valor do uber para R$ 50",
        "Altera a despesa de alimentação para R$ 300",
        "Preciso mudar o gasto do dia 20",
        "Atualiza aquele gasto de transporte"
    ],
    
    [INTENTS.DELETE_INCOME]: [
        "Apaga a receita de freelance",
        "Remove a última receita que adicionei",
        "Deleta a receita do dia 15",
        "Exclui aquela renda que registrei errado",
        "Tira a receita de R$ 500"
    ],
    
    [INTENTS.DELETE_EXPENSE]: [
        "Apaga a despesa do mercado",
        "Remove o último gasto",
        "Deleta a despesa do dia 20",
        "Exclui aquele gasto que foi duplicado",
        "Tira a despesa de transporte"
    ],
    
    [INTENTS.UPDATE_INCOME_FIELD]: [
        "Muda a categoria da receita para Salário",
        "Altera a data da receita para dia 25",
        "Atualiza o status da receita para recebido",
        "Corrige a descrição da receita",
        "Muda só a subcategoria dessa renda"
    ],
    
    [INTENTS.UPDATE_EXPENSE_FIELD]: [
        "Muda a categoria da despesa para Alimentação",
        "Altera a data da despesa para dia 10",
        "Atualiza o status para pago",
        "Corrige a descrição do gasto",
        "Muda a forma de pagamento para PIX"
    ],
    
    [INTENTS.LIST_INCOMES]: [
        "Mostra minhas receitas",
        "Lista todas as minhas rendas",
        "Quais são meus ganhos este mês?",
        "Me fala das receitas",
        "Quero ver minhas entradas"
    ],
    
    [INTENTS.LIST_EXPENSES]: [
        "Mostra meus gastos",
        "Lista todas as despesas",
        "Quais foram meus gastos este mês?",
        "Me fala dos gastos",
        "Quero ver minhas saídas"
    ],
    
    [INTENTS.ANALYZE_SPENDING]: [
        "Quanto gastei este mês?",
        "Analisa meus gastos",
        "Como está meu orçamento?",
        "Onde estou gastando mais?",
        "Faz uma análise das minhas despesas"
    ],
    
    [INTENTS.CALCULATE_BALANCE]: [
        "Qual é meu saldo?",
        "Quanto sobrou este mês?",
        "Calcula meu saldo",
        "Quanto tenho disponível?",
        "Diferença entre receitas e despesas"
    ],
    
    [INTENTS.COMPARE_MONTHS]: [
        "Compara este mês com o anterior",
        "Como foi meu desempenho comparado ao mês passado?",
        "Gastei mais ou menos que no último mês?",
        "Compara novembro com dezembro",
        "Evolução dos meus gastos"
    ],
    
    [INTENTS.FORECAST_BUDGET]: [
        "Projeta meu orçamento para o próximo mês",
        "Quanto vou precisar economizar?",
        "Faz uma previsão dos próximos meses",
        "Quanto terei no final do ano?",
        "Projeção de economia"
    ],
    
    [INTENTS.CATEGORY_BREAKDOWN]: [
        "Breakdown por categoria",
        "Quanto gastei em cada categoria?",
        "Distribui meus gastos por tipo",
        "Análise por categoria",
        "Onde está indo meu dinheiro?"
    ],
    
    [INTENTS.UPDATE_GOAL]: [
        "Atualiza minha meta para R$ 50000",
        "Quero mudar minha meta de curto prazo",
        "Altera meu objetivo financeiro",
        "Define uma nova meta",
        "Atualiza o progresso da meta"
    ],
    
    [INTENTS.CHECK_GOAL_PROGRESS]: [
        "Como está minha meta?",
        "Qual o progresso da minha meta?",
        "Falta quanto para atingir meu objetivo?",
        "Estou perto da meta?",
        "Quanto já economizei?"
    ],
    
    [INTENTS.CREATE_SAVINGS_PLAN]: [
        "Cria um plano de economia",
        "Como posso economizar R$ 10000?",
        "Preciso de um plano para juntar dinheiro",
        "Como atingir minha meta?",
        "Estratégia de economia"
    ],
    
    [INTENTS.EXPLAIN_CONCEPT]: [
        "O que é inflação?",
        "Explica o que é CDI",
        "Como funciona o tesouro direto?",
        "O que significa renda fixa?",
        "Me explica juros compostos"
    ],
    
    [INTENTS.INVESTMENT_ADVICE]: [
        "Onde devo investir?",
        "Qual o melhor investimento para mim?",
        "Como diversificar minha carteira?",
        "Vale a pena investir em ações?",
        "Conselho sobre investimentos"
    ],
    
    [INTENTS.DEBT_MANAGEMENT]: [
        "Como organizar minhas dívidas?",
        "Qual dívida pagar primeiro?",
        "Estratégia para sair das dívidas",
        "Como lidar com juros altos?",
        "Ajuda com minhas dívidas"
    ],
    
    [INTENTS.BUDGETING_TIPS]: [
        "Dicas para economizar",
        "Como fazer um orçamento?",
        "Dicas de organização financeira",
        "Como controlar meus gastos?",
        "Ajuda com orçamento"
    ],
    
    [INTENTS.FINANCIAL_EDUCATION]: [
        "Ensina sobre finanças pessoais",
        "Quero aprender a investir",
        "Educação financeira",
        "Como melhorar minha vida financeira?",
        "Princípios de finanças"
    ],
    
    [INTENTS.CALCULATE_PERCENTAGE]: [
        "Quanto é 10% de 500?",
        "Calcula a porcentagem",
        "Qual a taxa de crescimento?",
        "Percentual de economia",
        "Proporção dos gastos"
    ],
    
    [INTENTS.CALCULATE_INTEREST]: [
        "Calcula os juros de R$ 1000 a 5% ao mês",
        "Quanto vou pagar de juros?",
        "Juros compostos de um investimento",
        "Rendimento de R$ 5000 no CDI",
        "Cálculo de juros"
    ],
    
    [INTENTS.CALCULATE_INSTALLMENT]: [
        "Quanto fica cada parcela de R$ 1200 em 12x?",
        "Divide R$ 3000 em 6 vezes",
        "Valor da parcela",
        "Parcelamento de uma compra",
        "Quanto fica por mês?"
    ],
    
    [INTENTS.SIMPLE_MATH]: [
        "Quanto é 150 + 200?",
        "Soma meus gastos",
        "Subtrai 500 de 2000",
        "Multiplica 50 por 12",
        "Divide 1000 por 4"
    ],
    
    [INTENTS.JUST_CHAT]: [
        "Como você está?",
        "Oi, tudo bem?",
        "Você pode me ajudar?",
        "Conversa comigo",
        "Preciso de alguém para conversar"
    ],
    
    [INTENTS.GREETING]: [
        "Olá",
        "Oi",
        "Bom dia",
        "Boa tarde",
        "Boa noite",
        "E aí"
    ],
    
    [INTENTS.FAREWELL]: [
        "Tchau",
        "Até logo",
        "Até mais",
        "Valeu",
        "Falou"
    ],
    
    [INTENTS.THANKS]: [
        "Obrigado",
        "Valeu",
        "Agradeço",
        "Thanks",
        "Muito obrigado pela ajuda"
    ],
    
    [INTENTS.HELP]: [
        "Preciso de ajuda",
        "O que você pode fazer?",
        "Quais são suas funcionalidades?",
        "Como usar?",
        "Me ajuda"
    ],
    
    [INTENTS.SHOW_SUMMARY]: [
        "Mostra um resumo",
        "Visão geral das minhas finanças",
        "Como estão minhas finanças?",
        "Dashboard financeiro",
        "Resumo do mês"
    ]
};

// ========== PROMPT PARA DETECÇÃO DE INTENT ==========
const INTENT_DETECTION_PROMPT = `Você é um classificador de intenções para um assistente financeiro.

SUA TAREFA: Analisar a mensagem do usuário e identificar a INTENÇÃO principal.

INTENTS DISPONÍVEIS:

📊 MANIPULAÇÃO DE RECEITAS:
- INTENT_ADD_INCOME: Adicionar nova receita
- INTENT_EDIT_INCOME: Editar receita completa
- INTENT_DELETE_INCOME: Deletar receita
- INTENT_UPDATE_INCOME_FIELD: Atualizar apenas um campo (categoria, data, status, etc)
- INTENT_LIST_INCOMES: Listar receitas

💸 MANIPULAÇÃO DE DESPESAS:
- INTENT_ADD_EXPENSE: Adicionar nova despesa
- INTENT_EDIT_EXPENSE: Editar despesa completa
- INTENT_DELETE_EXPENSE: Deletar despesa
- INTENT_UPDATE_EXPENSE_FIELD: Atualizar apenas um campo
- INTENT_LIST_EXPENSES: Listar despesas

🔄 MANIPULAÇÃO GERAL:
- INTENT_REPLACE_INCOME: Substituir receita inteira
- INTENT_REPLACE_EXPENSE: Substituir despesa inteira
- INTENT_CLEAR_ALL_INCOMES: Limpar todas receitas
- INTENT_CLEAR_ALL_EXPENSES: Limpar todas despesas

📈 CONSULTAS E ANÁLISES:
- INTENT_ANALYZE_SPENDING: Analisar gastos
- INTENT_CALCULATE_BALANCE: Calcular saldo
- INTENT_COMPARE_MONTHS: Comparar meses
- INTENT_FORECAST_BUDGET: Projetar orçamento
- INTENT_CATEGORY_BREAKDOWN: Breakdown por categoria

🎯 METAS:
- INTENT_UPDATE_GOAL: Atualizar meta
- INTENT_CHECK_GOAL_PROGRESS: Verificar progresso
- INTENT_CREATE_SAVINGS_PLAN: Criar plano de economia

📚 EDUCAÇÃO:
- INTENT_EXPLAIN_CONCEPT: Explicar conceito financeiro
- INTENT_INVESTMENT_ADVICE: Conselho de investimento
- INTENT_DEBT_MANAGEMENT: Gestão de dívidas
- INTENT_BUDGETING_TIPS: Dicas de orçamento
- INTENT_FINANCIAL_EDUCATION: Educação financeira geral

🔢 CÁLCULOS:
- INTENT_CALCULATE_PERCENTAGE: Calcular porcentagem
- INTENT_CALCULATE_INTEREST: Calcular juros
- INTENT_CALCULATE_INSTALLMENT: Calcular parcela
- INTENT_SIMPLE_MATH: Matemática simples

💬 CONVERSAÇÃO:
- INTENT_JUST_CHAT: Apenas conversar
- INTENT_CLARIFY: Pedir esclarecimento
- INTENT_GREETING: Saudação
- INTENT_FAREWELL: Despedida
- INTENT_THANKS: Agradecimento

🛠️ SISTEMA:
- INTENT_HELP: Pedir ajuda
- INTENT_SHOW_SUMMARY: Mostrar resumo financeiro
- INTENT_UNKNOWN: Quando não conseguir identificar

REGRAS IMPORTANTES:
1. Se a mensagem mencionar adicionar/registrar RECEITA/GANHO/RENDA → INTENT_ADD_INCOME
2. Se mencionar adicionar/registrar DESPESA/GASTO/PAGAMENTO → INTENT_ADD_EXPENSE
3. Se mencionar EDITAR/ALTERAR/MUDAR TUDO → use EDIT
4. Se mencionar EDITAR/ALTERAR apenas UM CAMPO → use UPDATE_FIELD
5. Se mencionar APAGAR/DELETAR/REMOVER → use DELETE
6. Se mencionar ANÁLISE/QUANTO GASTEI/RESUMO → use análises apropriadas
7. Se for saudação simples → INTENT_GREETING
8. Se for despedida → INTENT_FAREWELL
9. Se for agradecimento → INTENT_THANKS

RESPONDA APENAS COM JSON NESTE FORMATO:
{
  "intent": "INTENT_XXX",
  "confidence": 0.95,
  "reasoning": "explicação breve",
  "entities": {
    "amount": 1500,
    "category": "Alimentação",
    "date": "2025-12-20",
    "description": "Mercado",
    "field": "categoria",
    "newValue": "Transporte"
  }
}

IMPORTANTE SOBRE ENTITIES:
- Extraia TODOS os dados mencionados pelo usuário
- amount: valor numérico (ex: R$ 150 → 150)
- category: categoria mencionada (OBRIGATÓRIO para ADD_INCOME e ADD_EXPENSE)
- subcategory: subcategoria (OBRIGATÓRIO quando tiver categoria - escolha da lista fornecida)
- month: mês de competência no formato YYYY-MM - REGRAS CRÍTICAS:
  * Se o usuário mencionar mês explicitamente (ex: "em julho", "de outubro") → extraia no formato "2025-07"
  * Se for REFERÊNCIA CONTEXTUAL ("essa receita", "essa despesa") E o contexto menciona um mês específico → extraia esse mês
  * Se não houver menção a mês, deixe como null (será usado mês atual)
  * Exemplos: "julho" → "2025-07", "janeiro" → "2025-01", "dezembro" → "2025-12"
- date: data mencionada ou null - REGRAS DE INTERPRETAÇÃO INTELIGENTE:
  * "hoje" → data atual (fornecida no contexto)
  * "ontem" → data atual - 1 dia
  * "amanhã" → data atual + 1 dia
  * "semana passada" → 7 dias atrás
  * "mês passado" → mês anterior (mesmo dia)
  * "dia X" ou "todo dia X" → dia X do mês atual (ex: "dia 15" = 2025-12-15)
  * "próxima segunda/terça/etc" → calcular próximo dia da semana
  * "último dia útil" → último dia útil do mês atual
  * "primeiro dia útil" → primeiro dia útil do mês atual
  * "quinto dia útil" → calcular o 5º dia útil do mês (pular sábados/domingos)
  * "Xº dia útil" → calcular o dia útil especificado
  * Se não mencionar data específica, use a data atual
- description: descrição mencionada
- paymentMethod: forma de pagamento (Dinheiro, Débito, Crédito, PIX)
- status: status do pagamento/recebimento - REGRAS CRÍTICAS:
  * Para DESPESAS: "Pago" ou "A pagar"
  * Para RECEITAS: "Recebido" ou "A receber"
  * Se o usuário usar VERBO NO PASSADO (paguei, gastei, comprei, recebi, ganhei) → use "Pago" (despesa) ou "Recebido" (receita)
  * Se o usuário usar VERBO NO FUTURO (vou pagar, vou gastar, vou receber) → use "A pagar" (despesa) ou "A receber" (receita)
  * Se o usuário não mencionar tempo verbal, considere o contexto ou use o status padrão baseado no verbo
- field: qual campo atualizar (se for UPDATE_FIELD)
- newValue: novo valor do campo (se for UPDATE_FIELD)
- identifier: identificador da linha (data, descrição, índice) para EDIT/DELETE - REGRAS:
  * Use descrição quando mencionada explicitamente (ex: "receita de salário", "despesa do mercado")
  * Use data quando mencionada (ex: "receita do dia 15", "despesa de ontem")
  * Para REFERÊNCIAS CONTEXTUAIS ("essa receita", "essa despesa", "o último lançamento"):
    - Deixe identifier como null ou vazio ("")
    - O sistema usará contexto inteligente (última adicionada ou única do mês)
  * Exemplos válidos: "Salário", "Mercado", "2025-12-15", "Aluguel"
  * Para DELETE/CLEAR: Sempre extraia o mês mencionado em entities.month se especificado
    - "Apague meu salário de julho" → identifier: "Salário", month: "2025-07"
    - "Apague minhas receitas de julho" → month: "2025-07"
    - "Delete a despesa de outubro" → month: "2025-10"

REGRA CRÍTICA SOBRE SUBCATEGORIA:
- SEMPRE que definir uma "category", DEVE definir também uma "subcategory"
- A subcategoria DEVE ser uma das opções listadas dentro daquela categoria
- Se o usuário mencionar "freelance", use category: "Salário e Rendimentos do Trabalho" e subcategory: "Freelance"
- Se o usuário mencionar "mercado", use category: "Alimentação" e subcategory: "Supermercado"
- NUNCA deixe subcategory vazio ou null quando há uma category

EXEMPLOS:

Entrada: "Recebi meu salário de R$ 5000"
Saída: {"intent": "INTENT_ADD_INCOME", "confidence": 0.98, "reasoning": "Usuário quer adicionar receita de salário", "entities": {"amount": 5000, "category": "Salário e Rendimentos do Trabalho", "subcategory": "Salário fixo", "description": "Salário", "status": "Recebido"}}

Entrada: "Recebi R$ 3000 de freelance"
Saída: {"intent": "INTENT_ADD_INCOME", "confidence": 0.98, "reasoning": "Usuário quer adicionar receita de freelance", "entities": {"amount": 3000, "category": "Salário e Rendimentos do Trabalho", "subcategory": "Freelance", "description": "Freelance", "status": "Recebido"}}

Entrada: "No dia 16 de julho eu recebi 4000 de bônus" (Data atual: 2025-12-20)
Saída: {"intent": "INTENT_ADD_INCOME", "confidence": 0.98, "reasoning": "Usuário recebeu bônus em julho", "entities": {"amount": 4000, "category": "Salário e Rendimentos do Trabalho", "subcategory": "Bônus", "description": "Bônus", "status": "Recebido", "date": "2025-07-16"}}

Entrada: "Vou receber R$ 2000 de bônus"
Saída: {"intent": "INTENT_ADD_INCOME", "confidence": 0.98, "reasoning": "Usuário quer adicionar receita futura", "entities": {"amount": 2000, "category": "Salário e Rendimentos do Trabalho", "subcategory": "Bônus", "description": "Bônus", "status": "A receber"}}

Entrada: "Gastei R$ 150 no mercado"
Saída: {"intent": "INTENT_ADD_EXPENSE", "confidence": 0.98, "reasoning": "Usuário quer adicionar despesa", "entities": {"amount": 150, "description": "Mercado", "category": "Alimentação", "subcategory": "Supermercado", "status": "Pago"}}

Entrada: "Paguei meu aluguel de R$ 1250"
Saída: {"intent": "INTENT_ADD_EXPENSE", "confidence": 0.98, "reasoning": "Usuário pagou aluguel (passado = já pago)", "entities": {"amount": 1250, "description": "Aluguel", "category": "Moradia", "subcategory": "Aluguel", "status": "Pago"}}

Entrada: "Recebi meu salário no quinto dia útil" (Data atual: 2025-12-20)
Saída: {"intent": "INTENT_ADD_INCOME", "confidence": 0.98, "reasoning": "Usuário recebeu salário no 5º dia útil", "entities": {"amount": null, "description": "Salário", "category": "Salário e Rendimentos do Trabalho", "subcategory": "Salário fixo", "status": "Recebido", "date": "2025-12-05"}}

Entrada: "Paguei o aluguel no dia 10" (Data atual: 2025-12-20)
Saída: {"intent": "INTENT_ADD_EXPENSE", "confidence": 0.98, "reasoning": "Usuário pagou aluguel no dia 10 do mês", "entities": {"amount": null, "description": "Aluguel", "category": "Moradia", "subcategory": "Aluguel", "status": "Pago", "date": "2025-12-10"}}

Entrada: "Vou pagar a conta de luz de R$ 180"
Saída: {"intent": "INTENT_ADD_EXPENSE", "confidence": 0.98, "reasoning": "Usuário vai pagar no futuro", "entities": {"amount": 180, "description": "Conta de luz", "category": "Moradia", "subcategory": "Energia elétrica", "status": "A pagar"}}

Entrada: "Altera a categoria da despesa do mercado para Transporte"
Saída: {"intent": "INTENT_UPDATE_EXPENSE_FIELD", "confidence": 0.95, "reasoning": "Usuário quer atualizar apenas o campo categoria", "entities": {"identifier": "Mercado", "field": "categoria", "newValue": "Transporte"}}

Entrada: "Edite o valor dessa receita para 4500" (contexto: usuário acabou de ver receita de Salário)
Saída: {"intent": "INTENT_UPDATE_INCOME_FIELD", "confidence": 0.95, "reasoning": "Usuário quer corrigir valor da receita mencionada no contexto", "entities": {"identifier": "", "field": "valor", "newValue": 4500}}

Entrada: "Mude o valor dessa receita para 1500" (contexto: "O usuário recebeu um bônus de R$ 4.000,00 em julho de 2025")
Saída: {"intent": "INTENT_UPDATE_INCOME_FIELD", "confidence": 0.95, "reasoning": "Usuário quer atualizar valor da receita de julho mencionada no contexto", "entities": {"identifier": "", "field": "valor", "newValue": 1500, "month": "2025-07"}}

Entrada: "Muda a descrição da última despesa para 'Compra supermercado'"
Saída: {"intent": "INTENT_UPDATE_EXPENSE_FIELD", "confidence": 0.95, "reasoning": "Usuário quer atualizar descrição da última despesa", "entities": {"identifier": "", "field": "descricao", "newValue": "Compra supermercado"}}

Entrada: "Apaga a receita de freelance"
Saída: {"intent": "INTENT_DELETE_INCOME", "confidence": 0.97, "reasoning": "Usuário quer deletar receita específica", "entities": {"identifier": "freelance"}}

Entrada: "Apague meu salário de julho" (Data atual: 2025-12-20)
Saída: {"intent": "INTENT_DELETE_INCOME", "confidence": 0.97, "reasoning": "Usuário quer deletar salário de julho", "entities": {"identifier": "Salário", "month": "2025-07"}}

Entrada: "Apague minhas receitas de julho" (Data atual: 2025-12-20)
Saída: {"intent": "INTENT_CLEAR_ALL_INCOMES", "confidence": 0.95, "reasoning": "Usuário quer apagar todas receitas de julho", "entities": {"month": "2025-07"}}

Entrada: "Quanto gastei este mês?"
Saída: {"intent": "INTENT_ANALYZE_SPENDING", "confidence": 0.96, "reasoning": "Usuário quer análise de gastos do mês", "entities": {}}

Entrada: "Bom dia"
Saída: {"intent": "INTENT_GREETING", "confidence": 0.99, "reasoning": "Saudação simples", "entities": {}}`;

module.exports = {
    INTENTS,
    INTENT_EXAMPLES,
    INTENT_DETECTION_PROMPT
};
