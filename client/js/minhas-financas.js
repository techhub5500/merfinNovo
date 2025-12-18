// minhas-financas.js - Script específico para a página Minhas Finanças

// Dados das categorias e subcategorias (carregados do arquivo JSON)
let receitasCategorias = {};
let despesasCategorias = {};

// Função para carregar categorias do JSON
async function loadCategories() {
    try {
        const response = await fetch('/js/categories.json');
        const data = await response.json();
        receitasCategorias = data.receitasCategorias;
        despesasCategorias = data.despesasCategorias;
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        // Fallback vazio se não conseguir carregar
        receitasCategorias = {};
        despesasCategorias = {};
    }
}

// Armazenamento de dados por mês (formato YYYY-MM)
let monthData = {};
let currentMonthDate = new Date();

document.addEventListener('DOMContentLoaded', async function() {
    // Carregar categorias primeiro
    await loadCategories();

    // Inicializar navegação por abas
    initializeTabs();

    // Inicializar seletores de mês
    initializeMonthSelectors();

    // Carregar dados do mês atual
    loadMonthData();

    // Adicionar botões para adicionar linhas
    addAddRowButton('receitas-table', ['data', 'descricao', 'categoria', 'subcategoria', 'valor', 'status']);
    addAddRowButton('despesas-table', ['data', 'descricao', 'categoria', 'subcategoria', 'valor', 'formaPagamento', 'status']);
    
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

        // Garantir que sempre tenha pelo menos 3 linhas (preenchidas ou vazias)
        const receitasRows = document.querySelectorAll('#receitas-table tbody tr');
        const despesasRows = document.querySelectorAll('#despesas-table tbody tr');

        // Contar linhas preenchidas (que têm pelo menos data, descrição ou valor)
        let receitasPreenchidas = 0;
        receitasRows.forEach(row => {
            const inputs = row.querySelectorAll('input, select');
            const rowData = {};
            inputs.forEach((input, index) => {
                const col = ['data', 'descricao', 'categoria', 'subcategoria', 'valor', 'status'][index];
                rowData[col] = input.value;
            });
            if (rowData.data || rowData.descricao || rowData.valor) {
                receitasPreenchidas++;
            }
        });

        let despesasPreenchidas = 0;
        despesasRows.forEach(row => {
            const inputs = row.querySelectorAll('input, select');
            const rowData = {};
            inputs.forEach((input, index) => {
                const col = ['data', 'descricao', 'categoria', 'subcategoria', 'valor', 'formaPagamento', 'status'][index];
                rowData[col] = input.value;
            });
            if (rowData.data || rowData.descricao || rowData.valor) {
                despesasPreenchidas++;
            }
        });

        // Adicionar linhas vazias se necessário para chegar a pelo menos 3
        const linhasReceitasNecessarias = Math.max(0, 3 - receitasPreenchidas);
        const linhasDespesasNecessarias = Math.max(0, 3 - despesasPreenchidas);

        for (let i = 0; i < linhasReceitasNecessarias; i++) {
            addEmptyRow('receitas-table', ['data', 'descricao', 'categoria', 'subcategoria', 'valor', 'status']);
        }
        for (let i = 0; i < linhasDespesasNecessarias; i++) {
            addEmptyRow('despesas-table', ['data', 'descricao', 'categoria', 'subcategoria', 'valor', 'formaPagamento', 'status']);
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

    const columns = tableId.includes('receitas') ? ['data', 'descricao', 'categoria', 'subcategoria', 'valor', 'status'] : ['data', 'descricao', 'categoria', 'subcategoria', 'valor', 'formaPagamento', 'status'];

    columns.forEach(col => {
        const cell = document.createElement('td');
        const input = createInputForColumn(col, tableId);
        if (rowData[col]) {
            if (input.type === 'date') {
                // Garantir que a data esteja no formato YYYY-MM-DD
                let dateValue = rowData[col];
                if (dateValue instanceof Date) {
                    const year = dateValue.getFullYear();
                    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
                    const day = String(dateValue.getDate()).padStart(2, '0');
                    dateValue = `${year}-${month}-${day}`;
                } else if (typeof dateValue === 'string' && dateValue.includes('T')) {
                    // Se for uma string ISO, converter para YYYY-MM-DD
                    dateValue = dateValue.split('T')[0];
                }
                input.value = dateValue;
            } else if (col === 'valor') {
                // Formatar valor como moeda brasileira
                if (rowData[col]) {
                    const valorNumerico = parseFloat(rowData[col]).toFixed(2);
                    const valorFormatado = valorNumerico.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                    input.value = 'R$ ' + valorFormatado;
                }
            } else if (input.tagName === 'SELECT') {
                input.value = rowData[col];
            } else {
                input.value = rowData[col];
            }
        }
        cell.appendChild(input);
        row.appendChild(cell);
    });

    // Após adicionar todos os inputs, atualizar subcategorias se houver categoria selecionada
    const categoriaInput = row.querySelector('.category-select');
    const subcategoriaInput = row.querySelector('.subcategory-select');
    if (categoriaInput && categoriaInput.value && subcategoriaInput) {
        updateSubcategories(row, categoriaInput.value, tableId.includes('receitas'));
        // Re-selecionar a subcategoria após popular as opções
        if (rowData.subcategoria) {
            subcategoriaInput.value = rowData.subcategoria;
        }
    }

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
            const col = ['data', 'descricao', 'categoria', 'subcategoria', 'valor', 'status'][index];
            if (col === 'valor' && input.value) {
                // Desformatar valor monetário para número
                const valorDesformatado = input.value.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
                rowData[col] = parseFloat(valorDesformatado) || 0;
            } else {
                rowData[col] = input.value;
            }
        });
        // Só salvar se tiver algum valor preenchido
        if (rowData.data || rowData.descricao || rowData.valor) {
            data.receitas.push(rowData);
        }
    });

    // Salvar despesas
    const despesasRows = document.querySelectorAll('#despesas-table tbody tr');
    despesasRows.forEach(row => {
        const rowData = {};
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach((input, index) => {
            const col = ['data', 'descricao', 'categoria', 'subcategoria', 'valor', 'formaPagamento', 'status'][index];
            if (col === 'valor' && input.value) {
                // Desformatar valor monetário para número
                const valorDesformatado = input.value.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
                rowData[col] = parseFloat(valorDesformatado) || 0;
            } else {
                rowData[col] = input.value;
            }
        });
        // Só salvar se tiver algum valor preenchido
        if (rowData.data || rowData.descricao || rowData.valor) {
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
        case 'data':
            input = document.createElement('input');
            input.type = 'date';
            // Definir data atual como padrão
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            input.value = `${year}-${month}-${day}`;
            break;
        case 'valor':
            input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'R$ 0,00';
            input.className = 'valor-input';
            
            // Função para formatar valor como moeda brasileira
            function formatarMoeda(valor) {
                // Remove tudo que não é dígito
                valor = valor.replace(/\D/g, '');
                
                // Converte para número e divide por 100 para considerar centavos
                valor = (parseFloat(valor) / 100).toFixed(2);
                
                // Formata como moeda brasileira
                valor = valor.replace('.', ',');
                valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                
                return 'R$ ' + valor;
            }
            
            // Evento de foco - permite edição
            input.addEventListener('focus', function() {
                if (this.value === '') {
                    this.value = '';
                }
                // Mantém o valor formatado para edição
            });
            
            // Evento de blur - garante formatação final
            input.addEventListener('blur', function() {
                if (this.value && !this.value.includes('R$')) {
                    // Converte para número e divide por 100 para considerar centavos
                    let valor = (parseFloat(this.value) / 100).toFixed(2);
                    
                    // Formata como moeda brasileira
                    valor = valor.replace('.', ',');
                    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                    
                    this.value = 'R$ ' + valor;
                } else if (!this.value) {
                    this.value = '';
                }
            });
            
            // Evento de input - permite apenas números e formata em tempo real
            input.addEventListener('input', function(e) {
                // Remove caracteres não numéricos
                let valor = this.value.replace(/\D/g, '');
                
                if (valor) {
                    // Converte para número e divide por 100 para considerar centavos
                    valor = (parseFloat(valor) / 100).toFixed(2);
                    
                    // Formata como moeda brasileira
                    valor = valor.replace('.', ',');
                    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                    
                    this.value = 'R$ ' + valor;
                } else {
                    this.value = '';
                }
            });
            
            break;
        case 'categoria':
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
        case 'subcategoria':
            input = document.createElement('select');
            input.className = 'subcategory-select';
            const defaultSubOption = document.createElement('option');
            defaultSubOption.value = '';
            defaultSubOption.textContent = 'Selecione uma subcategoria';
            input.appendChild(defaultSubOption);
            break;
        case 'descricao':
            input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Descrição';
            break;
        case 'status':
            input = document.createElement('select');
            // Opções específicas por tipo de tabela
            const isReceita = tableId.includes('receitas');
            const statusOptions = isReceita ? ['Recebido', 'A receber'] : ['Pago', 'A pagar'];
            statusOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                input.appendChild(option);
            });
            break;
        case 'formaPagamento':
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