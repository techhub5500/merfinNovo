// dashboard.js - Script para a seção Dashboard de Minhas Finanças

// Referência aos dados de monthData (importado de minhas-financas.js ou compartilhado)
let currentFilterMonths = 1; // Padrão: último mês

function initializeDashboard() {
    // Inicializar filtro
    setupFilterButton();

    // Calcular cards iniciais
    calculateDashboardCards();
}

async function setupFilterButton() {
    const filterButton = document.getElementById('filter-button');
    if (!filterButton) return;

    // Criar dropdown ou modal para seleção
    const filterOptions = [1, 2, 3, 6, 12];
    const dropdown = document.createElement('select');
    dropdown.id = 'filter-select';
    dropdown.innerHTML = filterOptions.map(m => `<option value="${m}">Últimos ${m} ${m === 1 ? 'mês' : 'meses'}</option>`).join('');
    dropdown.value = currentFilterMonths;

    dropdown.onchange = function() {
        currentFilterMonths = parseInt(this.value);
        calculateDashboardCards();
    };

    // Substituir o botão por um container com label e select
    const container = document.createElement('div');
    container.className = 'filter-container';
    container.innerHTML = '<label for="filter-select">Filtro:</label>';
    container.appendChild(dropdown);

    filterButton.parentNode.replaceChild(container, filterButton);
}

async function calculateDashboardCards() {
    const currentMonthId = getCurrentMonthId(); // Função de minhas-financas.js
    const [currentYear, currentMonth] = currentMonthId.split('-').map(Number);

    // Calcular meses no período do filtro
    const periodMonths = [];
    for (let i = 0; i < currentFilterMonths; i++) {
        const date = new Date(currentYear, currentMonth - 1 - i, 1);
        const monthId = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        periodMonths.push(monthId);
    }

    let totalReceitas = 0;
    let totalDespesas = 0;

    try {
        // Buscar dados de múltiplos meses do backend
        const response = await fetchAPI('/api/financas/multiplos-meses', {
            method: 'POST',
            body: JSON.stringify({ meses: periodMonths })
        });
        
        const financasData = await response.json();
        
        // Somar dados dos meses no período
        financasData.forEach(mesData => {
            mesData.receitas.forEach(row => {
                totalReceitas += parseFloat(row.valor) || 0;
            });
            mesData.despesas.forEach(row => {
                totalDespesas += parseFloat(row.valor) || 0;
            });
        });
    } catch (error) {
        console.error('Erro ao calcular dashboard:', error);
    }

    const saldoLiquido = totalReceitas - totalDespesas;

    // Buscar patrimônio do perfil
    let patrimonio = 0;
    try {
        const perfilResponse = await fetchAPI('/api/perfil');
        const perfilData = await perfilResponse.json();
        
        if (perfilData.patrimonio) {
            patrimonio = Object.values(perfilData.patrimonio).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        }
    } catch (error) {
        console.error('Erro ao buscar patrimônio:', error);
    }

    // Atualizar cards no dashboard
    const dashboardPage = document.getElementById('dashboard-page');
    if (dashboardPage) {
        const cards = dashboardPage.querySelectorAll('.card p');
        if (cards.length >= 4) {
            cards[0].textContent = `R$ ${saldoLiquido.toFixed(2).replace('.', ',')}`; // Saldo Líquido
            cards[1].textContent = `R$ ${totalReceitas.toFixed(2).replace('.', ',')}`; // Receita Total
            cards[2].textContent = `R$ ${totalDespesas.toFixed(2).replace('.', ',')}`; // Despesa Total
            cards[3].textContent = `R$ ${patrimonio.toFixed(2).replace('.', ',')}`; // Patrimônio
        }
    }
}

// Função para ser chamada quando o mês muda ou dados são salvos
async function updateDashboard() {
    await calculateDashboardCards();
    await renderPrincipaisGastos();
    await renderPrincipaisReceitas();
    await renderMetas();
}

async function renderMetas() {
    try {
        const response = await fetchAPI('/api/perfil');
        const perfilData = await response.json();
        
        const currentMonthId = getCurrentMonthId();
        const [currentYear, currentMonth] = currentMonthId.split('-').map(Number);
        
        // Calcular saldo acumulado até o mês atual
        let saldoAcumulado = 0;
        const meses = [];
        
        // Gerar lista de todos os meses desde 2020 até agora
        for (let year = 2020; year <= currentYear; year++) {
            const startMonth = year === 2020 ? 1 : 1;
            const endMonth = year === currentYear ? currentMonth : 12;
            
            for (let month = startMonth; month <= endMonth; month++) {
                const monthId = `${year}-${month.toString().padStart(2, '0')}`;
                meses.push(monthId);
            }
        }
        
        // Buscar todos os dados financeiros
        const financasResponse = await fetchAPI('/api/financas/multiplos-meses', {
            method: 'POST',
            body: JSON.stringify({ meses })
        });
        
        const financasData = await financasResponse.json();
        
        financasData.forEach(mesData => {
            let receitas = 0, despesas = 0;
            mesData.receitas.forEach(r => receitas += parseFloat(r.valor) || 0);
            mesData.despesas.forEach(d => despesas += parseFloat(d.valor) || 0);
            saldoAcumulado += (receitas - despesas);
        });
        
        // Fundo de Emergência
        const fundoMeta = parseFloat(perfilData.fundoEmergencia) || 0;
        updateMetaDisplay('fundo', fundoMeta, saldoAcumulado);
        
        // Meta de Curto Prazo
        const curtoDesc = perfilData.metaCurto?.descricao || '-';
        const curtoMeta = parseFloat(perfilData.metaCurto?.valor) || 0;
        document.getElementById('meta-curto-desc').textContent = curtoDesc;
        updateMetaDisplay('curto', curtoMeta, saldoAcumulado);
        
        // Meta de Longo Prazo
        const longoDesc = perfilData.metaLongo?.descricao || '-';
        const longoMeta = parseFloat(perfilData.metaLongo?.valor) || 0;
        document.getElementById('meta-longo-desc').textContent = longoDesc;
        updateMetaDisplay('longo', longoMeta, saldoAcumulado);
    } catch (error) {
        console.error('Erro ao renderizar metas:', error);
    }
}

function updateMetaDisplay(tipo, meta, progresso) {
    const valorEl = document.getElementById(`meta-${tipo}-valor`);
    const progressoEl = document.getElementById(`meta-${tipo}-progresso`);
    const barEl = document.getElementById(`meta-${tipo}-bar`);
    const percentEl = document.getElementById(`meta-${tipo}-percent`);
    
    if (!valorEl || !progressoEl || !barEl || !percentEl) return;
    
    valorEl.textContent = `R$ ${meta.toFixed(2).replace('.', ',')}`;
    progressoEl.textContent = `R$ ${progresso.toFixed(2).replace('.', ',')}`;
    
    const percent = meta > 0 ? Math.min((progresso / meta) * 100, 100) : 0;
    barEl.style.width = `${percent}%`;
    percentEl.textContent = `${percent.toFixed(1)}%`;
    
    // Cores baseadas no progresso
    if (percent >= 100) {
        barEl.style.background = '#00c864';
    } else if (percent >= 50) {
        barEl.style.background = 'var(--color-primary)';
    } else {
        barEl.style.background = '#ffa500';
    }
}

// Sistema de Notas
let notas = [];
let notaAtualIndex = 0;

function initializeNotas() {
    loadNotas();
    
    document.getElementById('btn-add-nota').addEventListener('click', adicionarNota);
    document.getElementById('btn-save-nota').addEventListener('click', salvarNotas);
    document.querySelector('.nota-prev').addEventListener('click', () => navegarNota(-1));
    document.querySelector('.nota-next').addEventListener('click', () => navegarNota(1));
    
    // Auto-save ao digitar (com debounce)
    let timeout;
    document.getElementById('nota-atual').addEventListener('input', function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (notas[notaAtualIndex]) {
                notas[notaAtualIndex].conteudo = this.value;
                salvarNotas();
            }
        }, 1000);
    });
}

async function loadNotas() {
    try {
        const response = await fetchAPI('/api/notas');
        const notasData = await response.json();
        
        if (notasData.length > 0) {
            notas = notasData.map(nota => ({
                id: nota._id,
                pagina: nota.pagina,
                conteudo: nota.conteudo
            }));
        } else {
            notas = [{ id: null, pagina: 1, conteudo: '' }];
        }
        
        renderNota();
    } catch (error) {
        console.error('Erro ao carregar notas:', error);
        notas = [{ id: null, pagina: 1, conteudo: '' }];
        renderNota();
    }
}

function renderNota() {
    if (notas.length === 0) return;
    
    const textarea = document.getElementById('nota-atual');
    const numeroAtual = document.getElementById('nota-numero-atual');
    const total = document.getElementById('nota-total');
    
    textarea.value = notas[notaAtualIndex].conteudo;
    numeroAtual.textContent = notaAtualIndex + 1;
    total.textContent = notas.length;
    
    // Atualizar estado dos botões de navegação
    document.querySelector('.nota-prev').disabled = notaAtualIndex === 0;
    document.querySelector('.nota-next').disabled = notaAtualIndex === notas.length - 1;
}

function navegarNota(direcao) {
    const novoIndex = notaAtualIndex + direcao;
    if (novoIndex >= 0 && novoIndex < notas.length) {
        // Salvar conteúdo atual antes de navegar
        notas[notaAtualIndex].conteudo = document.getElementById('nota-atual').value;
        notaAtualIndex = novoIndex;
        renderNota();
    }
}

function adicionarNota() {
    const novaPagina = notas.length > 0 ? Math.max(...notas.map(n => n.pagina)) + 1 : 1;
    notas.push({ id: null, pagina: novaPagina, conteudo: '' });
    notaAtualIndex = notas.length - 1;
    renderNota();
    salvarNotas();
}

async function salvarNotas() {
    // Salvar conteúdo atual
    if (notas[notaAtualIndex]) {
        notas[notaAtualIndex].conteudo = document.getElementById('nota-atual').value;
        
        try {
            const nota = notas[notaAtualIndex];
            await fetchAPI(`/api/notas/${nota.pagina}`, {
                method: 'POST',
                body: JSON.stringify({ conteudo: nota.conteudo })
            });
        } catch (error) {
            console.error('Erro ao salvar nota:', error);
        }
    }
}

async function renderPrincipaisGastos() {
    const monthId = getCurrentMonthId();
    const container = document.getElementById('principais-gastos');
    
    if (!container) return;
    
    try {
        const response = await fetchAPI(`/api/financas/${monthId}`);
        const data = await response.json();
        
        // Agrupar despesas por categoria
        const categorias = {};
        (data.despesas || []).forEach(despesa => {
            const categoria = despesa.categoria || 'Sem Categoria';
            const subcategoria = despesa.subcategoria || 'Sem Subcategoria';
            const valor = parseFloat(despesa.valor) || 0;
            
            if (!categorias[categoria]) {
                categorias[categoria] = {
                    total: 0,
                    subcategorias: {}
                };
            }
            
            categorias[categoria].total += valor;
            
            if (!categorias[categoria].subcategorias[subcategoria]) {
                categorias[categoria].subcategorias[subcategoria] = 0;
            }
            categorias[categoria].subcategorias[subcategoria] += valor;
        });
        
        // Ordenar por maior valor
        const categoriasOrdenadas = Object.entries(categorias)
            .sort((a, b) => b[1].total - a[1].total);
        
        if (categoriasOrdenadas.length === 0) {
            container.innerHTML = '<p class="empty-message">Sem dados para o mês selecionado.</p>';
            return;
        }
        
        container.innerHTML = '';
        categoriasOrdenadas.forEach(([nome, dados]) => {
            const card = createCategoriaCard(nome, dados, 'gasto');
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao renderizar principais gastos:', error);
        container.innerHTML = '<p class="empty-message">Erro ao carregar dados.</p>';
    }
}

async function renderPrincipaisReceitas() {
    const monthId = getCurrentMonthId();
    const container = document.getElementById('principais-receitas');
    
    if (!container) return;
    
    try {
        const response = await fetchAPI(`/api/financas/${monthId}`);
        const data = await response.json();
        
        // Agrupar receitas por categoria
        const categorias = {};
        (data.receitas || []).forEach(receita => {
            const categoria = receita.categoria || 'Sem Categoria';
            const subcategoria = receita.subcategoria || 'Sem Subcategoria';
            const valor = parseFloat(receita.valor) || 0;
            
            if (!categorias[categoria]) {
                categorias[categoria] = {
                    total: 0,
                    subcategorias: {}
                };
            }
            
            categorias[categoria].total += valor;
            
            if (!categorias[categoria].subcategorias[subcategoria]) {
                categorias[categoria].subcategorias[subcategoria] = 0;
            }
            categorias[categoria].subcategorias[subcategoria] += valor;
        });
        
        // Ordenar por maior valor
        const categoriasOrdenadas = Object.entries(categorias)
            .sort((a, b) => b[1].total - a[1].total);
        
        if (categoriasOrdenadas.length === 0) {
            container.innerHTML = '<p class="empty-message">Sem dados para o mês selecionado.</p>';
            return;
        }
        
        container.innerHTML = '';
        categoriasOrdenadas.forEach(([nome, dados]) => {
            const card = createCategoriaCard(nome, dados, 'receita');
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao renderizar principais receitas:', error);
        container.innerHTML = '<p class="empty-message">Erro ao carregar dados.</p>';
    }
}

function createCategoriaCard(nome, dados, tipo) {
    const card = document.createElement('div');
    card.className = 'categoria-card';
    
    const subcategoriasOrdenadas = Object.entries(dados.subcategorias)
        .sort((a, b) => b[1] - a[1]);
    
    card.innerHTML = `
        <div class="categoria-header">
            <span class="categoria-nome">${nome}</span>
            <span class="categoria-valor">R$ ${dados.total.toFixed(2).replace('.', ',')}</span>
        </div>
        <div class="categoria-subcategorias">
            ${subcategoriasOrdenadas.map(([sub, valor]) => `
                <div class="subcategoria-item">
                    <span class="subcategoria-nome">${sub}</span>
                    <span class="subcategoria-valor">R$ ${valor.toFixed(2).replace('.', ',')}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    // Evento de clique para expandir/recolher
    card.addEventListener('click', function() {
        this.classList.toggle('expanded');
    });
    
    return card;
}

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    initializeNotas();
});