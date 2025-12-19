// dashboard.js - Script para a seção Dashboard de Minhas Finanças

// Variáveis para controle de filtro e cálculos
let currentFilterMonths = 1; // Padrão: mês selecionado apenas

function initializeDashboard() {
    // Inicializar filtro
    setupFilterButton();

    // Calcular cards iniciais
    calculateDashboardCards();
}

async function setupFilterButton() {
    const filterButton = document.getElementById('filter-button');
    if (!filterButton) return;

    // Criar dropdown para seleção de período
    const filterOptions = [1, 2, 3, 6, 12];
    const dropdown = document.createElement('select');
    dropdown.id = 'filter-select';
    dropdown.innerHTML = filterOptions.map(m => `<option value="${m}">${m === 1 ? 'Mês Selecionado' : `Últimos ${m} meses`}</option>`).join('');
    dropdown.value = currentFilterMonths;

    dropdown.onchange = function() {
        currentFilterMonths = parseInt(this.value);
        calculateDashboardCards();
    };

    // Substituir o botão por um container com label e select
    const container = document.createElement('div');
    container.className = 'filter-container';
    container.innerHTML = '<label for="filter-select">Período:</label>';
    container.appendChild(dropdown);

    filterButton.parentNode.replaceChild(container, filterButton);
}

async function calculateDashboardCards() {
    // Obter o mês selecionado atualmente (usa currentMonthDate de minhas-financas.js)
    const currentMonthId = getCurrentMonthId();
    const [currentYear, currentMonth] = currentMonthId.split('-').map(Number);

    console.log('📅 Mês selecionado:', currentMonthId);

    // Para saldo líquido e patrimônio, sempre calcular acumulado desde o início
    // Gerar lista de todos os meses desde 2020 até o mês atual
    const allMonths = [];
    for (let year = 2020; year <= currentYear; year++) {
        const startMonth = year === 2020 ? 1 : 1;
        const endMonth = year === currentYear ? currentMonth : 12;
        
        for (let month = startMonth; month <= endMonth; month++) {
            const monthId = `${year}-${month.toString().padStart(2, '0')}`;
            allMonths.push(monthId);
        }
    }

    console.log('📆 Todos os meses até agora:', allMonths);

    // Gerar lista de meses baseada no filtro selecionado (para receitas/despesas)
    const filterMonths = [];
    for (let i = 0; i < currentFilterMonths; i++) {
        let targetMonth = currentMonth - i;
        let targetYear = currentYear;
        
        // Ajustar ano se necessário
        while (targetMonth <= 0) {
            targetMonth += 12;
            targetYear -= 1;
        }
        
        const monthId = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;
        filterMonths.unshift(monthId); // Adicionar no início para manter ordem cronológica
    }

    console.log(`📅 Filtro ativo: ${currentFilterMonths} ${currentFilterMonths === 1 ? 'mês' : 'meses'}`);
    console.log('📆 Meses do filtro:', filterMonths);

    let totalReceitasAcumuladas = 0;
    let totalDespesasAcumuladas = 0;
    let receitaFiltrada = 0;
    let despesaFiltrada = 0;
    let financasDataAcumulado = null;

    try {
        // Buscar TODOS os dados financeiros desde o início (para acumulado de Saldo e Patrimônio)
        const response = await fetchAPI('/api/financas/multiplos-meses', {
            method: 'POST',
            body: JSON.stringify({ meses: allMonths })
        });
        
        financasDataAcumulado = await response.json();
        
        // Verificar se é um array
        if (Array.isArray(financasDataAcumulado)) {
            // Somar TODOS os dados financeiros acumulados
            financasDataAcumulado.forEach(mesData => {
                (mesData.receitas || []).forEach(row => {
                    const valorNumerico = parseFloat(row.valor) || 0;
                    totalReceitasAcumuladas += valorNumerico;
                });
                (mesData.despesas || []).forEach(row => {
                    const valorNumerico = parseFloat(row.valor) || 0;
                    totalDespesasAcumuladas += valorNumerico;
                });
            });
        }
        
        // Buscar dados dos meses FILTRADOS para receita/despesa
        const responseFiltrado = await fetchAPI('/api/financas/multiplos-meses', {
            method: 'POST',
            body: JSON.stringify({ meses: filterMonths })
        });
        
        const financasFiltradas = await responseFiltrado.json();
        
        if (Array.isArray(financasFiltradas)) {
            financasFiltradas.forEach(mesData => {
                (mesData.receitas || []).forEach(row => {
                    receitaFiltrada += parseFloat(row.valor) || 0;
                });
                (mesData.despesas || []).forEach(row => {
                    despesaFiltrada += parseFloat(row.valor) || 0;
                });
            });
        }
        
    } catch (error) {
        console.error('❌ Erro ao calcular dashboard:', error);
    }

    console.log('💰 Total Receitas Acumuladas (Saldo):', totalReceitasAcumuladas);
    console.log('💸 Total Despesas Acumuladas (Saldo):', totalDespesasAcumuladas);
    console.log(`📊 Receita Filtrada (${currentFilterMonths} ${currentFilterMonths === 1 ? 'mês' : 'meses'}):`, receitaFiltrada);
    console.log(`📊 Despesa Filtrada (${currentFilterMonths} ${currentFilterMonths === 1 ? 'mês' : 'meses'}):`, despesaFiltrada);

    const saldoLiquidoAcumulado = totalReceitasAcumuladas - totalDespesasAcumuladas;

    // Calcular patrimônio acumulado (usando a mesma lógica de renderMetas)
    let patrimonioAcumulado = 0;
    try {
        const perfilResponse = await fetchAPI('/api/perfil');
        const perfilData = await perfilResponse.json();
        
        // Calcular saldo acumulado para as metas (usando financasDataAcumulado)
        let saldoAcumuladoParaMetas = 0;
        if (Array.isArray(financasDataAcumulado)) {
            financasDataAcumulado.forEach(mesData => {
                let receitas = 0, despesas = 0;
                (mesData.receitas || []).forEach(r => receitas += parseFloat(r.valor) || 0);
                (mesData.despesas || []).forEach(d => despesas += parseFloat(d.valor) || 0);
                saldoAcumuladoParaMetas += (receitas - despesas);
            });
        }
        
        // Aplicar a mesma lógica de redistribuição das metas
        const fundoMeta = parseFloat(perfilData.fundoEmergencia) || 0;
        let fundoProgresso = 0;
        let saldoRestante = saldoAcumuladoParaMetas;
        
        if (fundoMeta > 0) {
            fundoProgresso = Math.min(saldoAcumuladoParaMetas, fundoMeta);
            saldoRestante = Math.max(0, saldoAcumuladoParaMetas - fundoMeta);
        } else {
            saldoRestante = saldoAcumuladoParaMetas;
        }
        
        // Redistribuir para metas
        const curtoMeta = parseFloat(perfilData.metaCurto?.valor) || 0;
        const longoMeta = parseFloat(perfilData.metaLongo?.valor) || 0;
        
        let curtoProgresso = 0;
        let longoProgresso = 0;
        let saldoParaPatrimonio = 0;
        
        if (saldoRestante > 0) {
            const temMetaCurto = curtoMeta > 0;
            const temMetaLongo = longoMeta > 0;
            
            if (temMetaCurto || temMetaLongo) {
                if (temMetaCurto && temMetaLongo) {
                    const valorCurto = saldoRestante * 0.30;
                    const valorLongo = saldoRestante * 0.70;
                    
                    curtoProgresso = Math.min(valorCurto, curtoMeta);
                    longoProgresso = Math.min(valorLongo, longoMeta);
                    
                    const excedenteCurto = Math.max(0, valorCurto - curtoMeta);
                    const excedenteLongo = Math.max(0, valorLongo - longoMeta);
                    saldoParaPatrimonio = excedenteCurto + excedenteLongo;
                    
                } else if (temMetaCurto) {
                    curtoProgresso = Math.min(saldoRestante, curtoMeta);
                    saldoParaPatrimonio = Math.max(0, saldoRestante - curtoMeta);
                    
                } else if (temMetaLongo) {
                    longoProgresso = Math.min(saldoRestante, longoMeta);
                    saldoParaPatrimonio = Math.max(0, saldoRestante - longoMeta);
                }
            } else {
                saldoParaPatrimonio = saldoRestante;
            }
        }
        
        // Calcular patrimônio total acumulado
        const patrimonioBase = perfilData.patrimonio ? 
            Object.values(perfilData.patrimonio).reduce((sum, val) => sum + (parseFloat(val) || 0), 0) : 0;
        
        patrimonioAcumulado = patrimonioBase + curtoProgresso + longoProgresso + saldoParaPatrimonio;
        
        console.log('🏛️ Patrimônio Base:', patrimonioBase);
        console.log('🏛️ Investido em Metas:', curtoProgresso + longoProgresso);
        console.log('🏛️ Saldo Excedente:', saldoParaPatrimonio);
        console.log('🏛️ Patrimônio Total Acumulado:', patrimonioAcumulado);
        
    } catch (error) {
        console.error('Erro ao calcular patrimônio:', error);
    }

    // Atualizar cards no dashboard
    const dashboardPage = document.getElementById('dashboard-page');
    if (dashboardPage) {
        const cards = dashboardPage.querySelectorAll('.card p');
        if (cards.length >= 4) {
            // Formatar valores com separador de milhares
            cards[0].textContent = formatarMoeda(saldoLiquidoAcumulado); // Saldo Líquido ACUMULADO (sempre)
            cards[1].textContent = formatarMoeda(receitaFiltrada); // Receita Total FILTRADA
            cards[2].textContent = formatarMoeda(despesaFiltrada); // Despesa Total FILTRADA
            cards[3].textContent = formatarMoeda(patrimonioAcumulado); // Patrimônio ACUMULADO (sempre)
            
            // Adicionar classe de cor para saldo líquido
            if (saldoLiquidoAcumulado >= 0) {
                cards[0].classList.remove('valor-negativo');
                cards[0].classList.add('valor-positivo');
            } else {
                cards[0].classList.remove('valor-positivo');
                cards[0].classList.add('valor-negativo');
            }
        }
    }
}

// Função auxiliar para extrair valor numérico de string formatada (R$ 1.000,00 -> 1000.00)
function extrairValorNumerico(valor) {
    if (!valor) return 0;
    
    // Se já é um número, retornar
    if (typeof valor === 'number') return valor;
    
    // Remover "R$", espaços, e pontos de milhares, depois substituir vírgula por ponto
    const valorLimpo = valor.toString()
        .replace('R$', '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    
    return parseFloat(valorLimpo) || 0;
}

// Função auxiliar para formatar valores em moeda brasileira
function formatarMoeda(valor) {
    return `R$ ${valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`; 
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
        
        console.log('Dados financeiros para metas:', financasData);
        
        if (Array.isArray(financasData)) {
            financasData.forEach(mesData => {
                let receitas = 0, despesas = 0;
                (mesData.receitas || []).forEach(r => receitas += parseFloat(r.valor) || 0);
                (mesData.despesas || []).forEach(d => despesas += parseFloat(d.valor) || 0);
                saldoAcumulado += (receitas - despesas);
            });
        } else {
            console.warn('Dados financeiros para metas não é array:', financasData);
        }
        
        console.log('💰 Saldo acumulado total:', saldoAcumulado);
        
        // === LÓGICA DE REDISTRIBUIÇÃO DO SALDO ===
        
        // 1. Verificar Fundo de Emergência
        const fundoMeta = parseFloat(perfilData.fundoEmergencia) || 0;
        let fundoProgresso = 0;
        let saldoRestante = saldoAcumulado;
        
        if (fundoMeta > 0) {
            // Direcionar saldo para o fundo de emergência primeiro
            fundoProgresso = Math.min(saldoAcumulado, fundoMeta);
            saldoRestante = Math.max(0, saldoAcumulado - fundoMeta);
            
            console.log('🏦 Fundo de Emergência - Meta:', fundoMeta, '| Progresso:', fundoProgresso, '| Saldo Restante:', saldoRestante);
        } else {
            // Não tem fundo cadastrado, todo saldo está disponível
            saldoRestante = saldoAcumulado;
        }
        
        updateMetaDisplay('fundo', fundoMeta, fundoProgresso);
        
        // 2. Redistribuir saldo restante para metas de curto e longo prazo
        const curtoDesc = perfilData.metaCurto?.descricao || '-';
        const curtoMeta = parseFloat(perfilData.metaCurto?.valor) || 0;
        const longoDesc = perfilData.metaLongo?.descricao || '-';
        const longoMeta = parseFloat(perfilData.metaLongo?.valor) || 0;
        
        let curtoProgresso = 0;
        let longoProgresso = 0;
        let saldoParaPatrimonio = 0;
        
        if (saldoRestante > 0) {
            const temMetaCurto = curtoMeta > 0;
            const temMetaLongo = longoMeta > 0;
            
            if (temMetaCurto || temMetaLongo) {
                // Tem pelo menos uma meta cadastrada
                if (temMetaCurto && temMetaLongo) {
                    // Tem ambas as metas: 30% curto + 70% longo
                    const valorCurto = saldoRestante * 0.30;
                    const valorLongo = saldoRestante * 0.70;
                    
                    curtoProgresso = Math.min(valorCurto, curtoMeta);
                    longoProgresso = Math.min(valorLongo, longoMeta);
                    
                    // Se alguma meta for atingida, o excedente vira patrimônio
                    const excedenteCurto = Math.max(0, valorCurto - curtoMeta);
                    const excedenteLongo = Math.max(0, valorLongo - longoMeta);
                    saldoParaPatrimonio = excedenteCurto + excedenteLongo;
                    
                    console.log('📊 Ambas metas - Curto:', curtoProgresso, '| Longo:', longoProgresso, '| Excedente:', saldoParaPatrimonio);
                    
                } else if (temMetaCurto) {
                    // Só tem meta de curto prazo: 100% para curto
                    curtoProgresso = Math.min(saldoRestante, curtoMeta);
                    saldoParaPatrimonio = Math.max(0, saldoRestante - curtoMeta);
                    
                    console.log('📊 Só meta curto - Progresso:', curtoProgresso, '| Excedente:', saldoParaPatrimonio);
                    
                } else if (temMetaLongo) {
                    // Só tem meta de longo prazo: 100% para longo
                    longoProgresso = Math.min(saldoRestante, longoMeta);
                    saldoParaPatrimonio = Math.max(0, saldoRestante - longoMeta);
                    
                    console.log('📊 Só meta longo - Progresso:', longoProgresso, '| Excedente:', saldoParaPatrimonio);
                }
            } else {
                // Não tem nenhuma meta cadastrada: todo saldo vira patrimônio
                saldoParaPatrimonio = saldoRestante;
                console.log('📊 Sem metas - Todo saldo vira patrimônio:', saldoParaPatrimonio);
            }
        }
        
        // Atualizar displays das metas
        document.getElementById('meta-curto-desc').textContent = curtoDesc;
        updateMetaDisplay('curto', curtoMeta, curtoProgresso);
        
        document.getElementById('meta-longo-desc').textContent = longoDesc;
        updateMetaDisplay('longo', longoMeta, longoProgresso);
        
        // 3. Atualizar patrimônio total nos cards do dashboard
        // Patrimônio = Patrimônio cadastrado + investimentos nas metas + saldo excedente
        const patrimonioBase = perfilData.patrimonio ? 
            Object.values(perfilData.patrimonio).reduce((sum, val) => sum + (parseFloat(val) || 0), 0) : 0;
        
        const patrimonioTotal = patrimonioBase + curtoProgresso + longoProgresso + saldoParaPatrimonio;
        
        console.log('🏛️ Patrimônio Base:', patrimonioBase);
        console.log('🏛️ Investido em Metas:', curtoProgresso + longoProgresso);
        console.log('🏛️ Saldo Excedente:', saldoParaPatrimonio);
        console.log('🏛️ Patrimônio Total:', patrimonioTotal);
        
        // Atualizar card de patrimônio no dashboard
        const dashboardPage = document.getElementById('dashboard-page');
        if (dashboardPage) {
            const cards = dashboardPage.querySelectorAll('.card p');
            if (cards.length >= 4) {
                cards[3].textContent = formatarMoeda(patrimonioTotal); // Patrimônio
            }
        }
        
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