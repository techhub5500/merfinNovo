// minhas-financas.js - Script específico para a página Minhas Finanças

// Dados das categorias e subcategorias
const receitasCategorias = {
    "Salário/Renda Principal": ["Salário CLT", "Pró-labore (sócios)", "Aposentadoria/Pensão", "Salário líquido (após descontos)", "13º salário"],
    "Trabalho Extra/Freelance": ["Freelas pontuais", "Consultoria", "Trabalhos aos finais de semana", "Projetos por fora", "Bicos/Extras"],
    "Renda Passiva": ["Aluguel recebido", "Dividendos de investimentos", "Royalties", "Direitos autorais", "Renda de aplicações"],
    "Negócio Próprio": ["Vendas de produtos", "Prestação de serviços", "Comissões", "Lucro da empresa", "Faturamento mensal"],
    "Benefícios Trabalhistas": ["Vale alimentação", "Vale refeição", "Vale transporte", "PLR (Participação nos Lucros)", "Bônus/Gratificações"],
    "Vendas e Revendas": ["Venda de itens usados", "Revenda de produtos", "Marketplace (Mercado Livre, OLX)", "Brechó/Desapego", "Vendas online"],
    "Presentes/Ajuda Financeira": ["Mesada/Pensão alimentícia recebida", "Presente em dinheiro", "Ajuda de familiares", "Doações recebidas", "Empréstimo recebido"],
    "Restituição/Reembolsos": ["Restituição de IR", "Reembolso de despesas", "Cashback", "Devolução de produtos", "Reembolso de plano de saúde"],
    "Rendimentos Extras": ["Prêmios/Sorteios", "Horas extras", "Adicional noturno", "Insalubridade/Periculosidade", "Comissões de vendas"],
    "Outras Receitas": ["Renda não categorizada", "Valores inesperados", "Herança/Doação", "Indenizações", "Receitas eventuais"]
};

const despesasCategorias = {
    "Moradia": ["Aluguel/Financiamento", "Condomínio", "IPTU", "Seguro residencial", "Manutenção/Reparos"],
    "Contas Básicas": ["Energia elétrica", "Água", "Gás", "Internet", "Telefone fixo/celular"],
    "Alimentação": ["Supermercado", "Feira/Hortifrúti", "Açougue/Padaria", "Delivery de comida", "Lanche no trabalho"],
    "Transporte": ["Combustível", "Transporte público", "Aplicativos (Uber/99)", "Manutenção do veículo", "IPVA/Licenciamento/Seguro"],
    "Saúde": ["Plano de saúde", "Medicamentos", "Consultas médicas", "Exames", "Dentista"],
    "Educação": ["Mensalidade escolar/faculdade", "Cursos/Capacitações", "Material didático/Livros", "Transporte escolar", "Uniforme"],
    "Lazer e Entretenimento": ["Streamings (Netflix, Spotify, etc)", "Cinema/Teatro", "Restaurantes/Bares", "Viagens/Passeios", "Hobbies"],
    "Cuidados Pessoais": ["Salão/Barbearia", "Academia", "Produtos de higiene/beleza", "Roupas/Calçados", "Acessórios"],
    "Despesas Financeiras": ["Juros/Multas", "Tarifa bancária", "Anuidade cartão de crédito", "Empréstimos/Financiamentos", "Dívidas parceladas"],
    "Outras Despesas": ["Presentes/Datas comemorativas", "Pet (ração, veterinário)", "Doações/Contribuições", "Imprevistos", "Despesas eventuais"]
};

// Armazenamento de dados por mês (formato YYYY-MM)
let monthData = {};
let currentMonthDate = new Date();

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar navegação por abas
    initializeTabs();

    // Inicializar seletores de mês
    initializeMonthSelectors();

    // Carregar dados do mês atual
    loadMonthData();

    // Adicionar botões para adicionar linhas
    addAddRowButton('receitas-table', ['date', 'description', 'category', 'subcategory', 'value', 'status']);
    addAddRowButton('despesas-table', ['date', 'description', 'category', 'subcategory', 'value', 'payment', 'status']);
    
    // Auto-save ao sair de uma célula
    document.addEventListener('change', function(e) {
        if (e.target.closest('#receitas-table') || e.target.closest('#despesas-table')) {
            saveMonthData();
        }
    });
});

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe active de todos os botões
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adicionar classe active ao botão clicado
            this.classList.add('active');
            
            // Obter o ID da aba
            const tabId = this.getAttribute('data-tab');
            
            // Esconder todos os conteúdos
            document.querySelectorAll('.subpage-content').forEach(content => {
                content.style.display = 'none';
            });
            
            // Mostrar o conteúdo da aba selecionada
            const pageId = tabId === 'planilhas' ? 'planilhas-page' : 'dashboard-page';
            document.getElementById(pageId).style.display = 'block';
            
            // Se for dashboard, atualizar os cards
            if (tabId === 'dashboard') {
                updateDashboard();
            }
        });
    });
}

function initializeMonthSelectors() {
    const now = new Date();
    currentMonthDate = new Date(now.getFullYear(), now.getMonth());
    
    // Inicializar todos os seletores de mês que existirem na página
    const selectors = document.querySelectorAll('.month-selector');
    
    selectors.forEach(selectorElement => {
        const selector = {
            date: new Date(now.getFullYear(), now.getMonth()),
            element: selectorElement
        };
        
        updateMonthDisplay(selector);
        
        // Adicionar event listeners
        const prevBtn = selectorElement.querySelector('.prev-month');
        const nextBtn = selectorElement.querySelector('.next-month');
        
        if (prevBtn) prevBtn.onclick = () => changeMonth(selector, -1);
        if (nextBtn) nextBtn.onclick = () => changeMonth(selector, 1);
    });
}

function changeMonth(selector, delta) {
    selector.date.setMonth(selector.date.getMonth() + delta);
    currentMonthDate = new Date(selector.date);
    
    // Atualizar todos os seletores de mês na página
    const allSelectors = document.querySelectorAll('.month-selector');
    allSelectors.forEach(selectorElement => {
        updateMonthDisplay({
            date: new Date(currentMonthDate),
            element: selectorElement
        });
    });
    
    // Recarregar dados e atualizar dashboard
    loadMonthData();
    updateDashboard();
}

function getCurrentMonthId() {
    const month = currentMonthDate.getMonth() + 1;
    const year = currentMonthDate.getFullYear();
    return `${year}-${month.toString().padStart(2, '0')}`;
}

async function loadMonthData() {
    const monthId = getCurrentMonthId();

    try {
        const response = await fetchAPI(`/api/financas/${monthId}`);
        const data = await response.json();
        
        // Armazenar dados localmente para acesso rápido
        monthData[monthId] = {
            receitas: data.receitas || [],
            despesas: data.despesas || []
        };

        // Limpar tabelas
        document.getElementById('receitas-table').querySelector('tbody').innerHTML = '';
        document.getElementById('despesas-table').querySelector('tbody').innerHTML = '';

        // Carregar dados
        monthData[monthId].receitas.forEach(rowData => addRowToTable('receitas-table', rowData));
        monthData[monthId].despesas.forEach(rowData => addRowToTable('despesas-table', rowData));

        // Se vazio, adicionar 3 linhas vazias
        if (monthData[monthId].receitas.length === 0) {
            for (let i = 0; i < 3; i++) {
                addEmptyRow('receitas-table', ['date', 'description', 'category', 'subcategory', 'value', 'status']);
            }
        }
        if (monthData[monthId].despesas.length === 0) {
            for (let i = 0; i < 3; i++) {
                addEmptyRow('despesas-table', ['date', 'description', 'category', 'subcategory', 'value', 'payment', 'status']);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados do mês:', error);
        alert('Erro ao carregar dados financeiros.');
    }
}

function addRowToTable(tableId, rowData) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const row = document.createElement('tr');

    const columns = tableId.includes('receitas') ? ['date', 'description', 'category', 'subcategory', 'value', 'status'] : ['date', 'description', 'category', 'subcategory', 'value', 'payment', 'status'];

    columns.forEach(col => {
        const cell = document.createElement('td');
        const input = createInputForColumn(col, tableId);
        if (rowData[col]) {
            if (input.type === 'date') {
                input.value = rowData[col];
            } else if (input.tagName === 'SELECT') {
                input.value = rowData[col];
            } else {
                input.value = rowData[col];
            }
        }
        cell.appendChild(input);
        row.appendChild(cell);
    });

    // Adicionar célula com botão de excluir
    const actionCell = document.createElement('td');
    actionCell.className = 'action-cell';
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-row-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = function() {
        row.remove();
        saveMonthData();
    };
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);

    tbody.appendChild(row);
}

function addEmptyRow(tableId, columns) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const row = document.createElement('tr');

    columns.forEach(col => {
        const cell = document.createElement('td');
        const input = createInputForColumn(col, tableId);
        cell.appendChild(input);
        row.appendChild(cell);
    });

    // Adicionar célula com botão de excluir
    const actionCell = document.createElement('td');
    actionCell.className = 'action-cell';
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-row-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = function() {
        row.remove();
        saveMonthData();
    };
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);

    tbody.appendChild(row);
}

async function saveMonthData() {
    const monthId = getCurrentMonthId();
    const data = { receitas: [], despesas: [] };

    // Salvar receitas
    const receitasRows = document.querySelectorAll('#receitas-table tbody tr');
    receitasRows.forEach(row => {
        const rowData = {};
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach((input, index) => {
            const col = ['date', 'description', 'category', 'subcategory', 'value', 'status'][index];
            rowData[col] = input.value;
        });
        // Só salvar se tiver algum valor preenchido
        if (rowData.date || rowData.description || rowData.value) {
            data.receitas.push(rowData);
        }
    });

    // Salvar despesas
    const despesasRows = document.querySelectorAll('#despesas-table tbody tr');
    despesasRows.forEach(row => {
        const rowData = {};
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach((input, index) => {
            const col = ['date', 'description', 'category', 'subcategory', 'value', 'payment', 'status'][index];
            rowData[col] = input.value;
        });
        // Só salvar se tiver algum valor preenchido
        if (rowData.date || rowData.description || rowData.value) {
            data.despesas.push(rowData);
        }
    });

    // Salvar no cache local
    monthData[monthId] = data;

    // Salvar no backend
    try {
        const response = await fetchAPI(`/api/financas/${monthId}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Erro ao salvar dados');
        }
        
        // Atualizar dashboard após salvar
        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        alert('Erro ao salvar dados financeiros.');
    }
}

function updateMonthDisplay(selector) {
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const month = monthNames[selector.date.getMonth()];
    const year = selector.date.getFullYear();
    selector.element.querySelector('.current-month').textContent = `${month} ${year}`;
}

function initializeTable(tableId, columns, numRows) {
    // Removido, agora usa loadMonthData
}

function createInputForColumn(column, tableId) {
    let input;
    switch (column) {
        case 'date':
            input = document.createElement('input');
            input.type = 'date';
            break;
        case 'value':
            input = document.createElement('input');
            input.type = 'number';
            input.step = '0.01';
            input.placeholder = 'R$ 0,00';
            break;
        case 'category':
            input = document.createElement('select');
            input.className = 'category-select';
            const categorias = tableId.includes('receitas') ? Object.keys(receitasCategorias) : Object.keys(despesasCategorias);
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Selecione uma categoria';
            input.appendChild(defaultOption);
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                input.appendChild(option);
            });
            input.onchange = function() {
                updateSubcategories(this.closest('tr'), this.value, tableId.includes('receitas'));
            };
            break;
        case 'subcategory':
            input = document.createElement('select');
            input.className = 'subcategory-select';
            const defaultSubOption = document.createElement('option');
            defaultSubOption.value = '';
            defaultSubOption.textContent = 'Selecione uma subcategoria';
            input.appendChild(defaultSubOption);
            break;
        case 'description':
            input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Descrição';
            break;
        case 'status':
            input = document.createElement('select');
            const options = ['Recebido', 'A receber', 'Pago', 'A pagar'];
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                input.appendChild(option);
            });
            break;
        case 'payment':
            input = document.createElement('select');
            const paymentOptions = ['Dinheiro', 'Débito', 'Crédito', 'PIX'];
            paymentOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                input.appendChild(option);
            });
            break;
        default:
            input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Digite aqui';
    }
    return input;
}

function updateSubcategories(row, categoryValue, isReceita) {
    const subcategorySelect = row.querySelector('.subcategory-select');
    if (!subcategorySelect) return;

    // Limpar opções atuais
    subcategorySelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione uma subcategoria';
    subcategorySelect.appendChild(defaultOption);

    if (categoryValue) {
        const subcategorias = isReceita ? receitasCategorias[categoryValue] : despesasCategorias[categoryValue];
        if (subcategorias) {
            subcategorias.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                option.textContent = sub;
                subcategorySelect.appendChild(option);
            });
        }
    }
}

function addAddRowButton(tableId, columns) {
    const tableContainer = document.getElementById(tableId).parentElement;
    const button = document.createElement('button');
    button.textContent = 'Adicionar Linha';
    button.className = 'add-row-btn';
    button.onclick = function() {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        const row = document.createElement('tr');
        columns.forEach(col => {
            const cell = document.createElement('td');
            const input = createInputForColumn(col, tableId);
            cell.appendChild(input);
            row.appendChild(cell);
        });
        
        // Adicionar célula com botão de excluir
        const actionCell = document.createElement('td');
        actionCell.className = 'action-cell';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-row-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = function() {
            row.remove();
            saveMonthData();
        };
        actionCell.appendChild(deleteBtn);
        row.appendChild(actionCell);
        
        tbody.appendChild(row);
        saveMonthData(); // Salvar após adicionar
    };
    tableContainer.appendChild(button);
}