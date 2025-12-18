// perfil.js - Script para a página de Perfil

let dividas = [];
let perfilData = {};
let hasUnsavedChanges = false;

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar eventos
    setupPatrimonioCalculation();
    setupModalEvents();
    setupSaveButton();
    loadPerfilData();
    loadDividas();
});

// Calcular total do patrimônio
function setupPatrimonioCalculation() {
    const patrimonioInputs = document.querySelectorAll('.patrimonio-input');
    
    patrimonioInputs.forEach(input => {
        input.addEventListener('input', calculatePatrimonioTotal);
    });
}

function calculatePatrimonioTotal() {
    const inputs = document.querySelectorAll('.patrimonio-input');
    let total = 0;
    
    inputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        total += value;
    });
    
    document.getElementById('patrimonio-total-valor').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Modal de dívidas
function setupModalEvents() {
    const modal = document.getElementById('modal-divida');
    const btnAdd = document.getElementById('btn-add-divida');
    const btnClose = document.getElementById('modal-close');
    const btnCancel = document.getElementById('btn-cancel-divida');
    const btnConfirm = document.getElementById('btn-confirm-divida');
    
    btnAdd.addEventListener('click', openModal);
    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    btnConfirm.addEventListener('click', addDivida);
    
    // Fechar ao clicar fora do modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function openModal() {
    const modal = document.getElementById('modal-divida');
    modal.classList.add('active');
    clearModalForm();
}

function closeModal() {
    const modal = document.getElementById('modal-divida');
    modal.classList.remove('active');
}

function clearModalForm() {
    document.getElementById('divida-nome').value = '';
    document.getElementById('divida-tipo').value = '';
    document.getElementById('divida-valor').value = '';
    document.getElementById('divida-parcelas').value = '';
    document.getElementById('divida-data-fim').value = '';
}

function addDivida() {
    const nome = document.getElementById('divida-nome').value.trim();
    const tipo = document.getElementById('divida-tipo').value;
    const valor = parseFloat(document.getElementById('divida-valor').value);
    const parcelas = parseInt(document.getElementById('divida-parcelas').value);
    const dataFim = document.getElementById('divida-data-fim').value;
    
    // Validação
    if (!nome || !tipo || !valor || !parcelas || !dataFim) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    if (valor <= 0 || parcelas <= 0) {
        alert('Valor e número de parcelas devem ser maiores que zero.');
        return;
    }
    
    // Salvar dívida no backend
    saveDividaToBackend(nome, tipo, valor, parcelas, dataFim);
}

async function saveDividaToBackend(nome, tipo, valorTotal, numParcelas, dataFim) {
    try {
        const response = await fetchAPI('/api/dividas', {
            method: 'POST',
            body: JSON.stringify({
                nome,
                tipo,
                valorTotal,
                numParcelas,
                dataFim
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao salvar dívida');
        }
        
        const result = await response.json();
        alert('Dívida adicionada com sucesso!');
        closeModal();
        loadDividas(); // Recarregar lista de dívidas
    } catch (error) {
        console.error('Erro ao adicionar dívida:', error);
        alert('Erro ao adicionar dívida. Tente novamente.');
    }
}

async function loadDividas() {
    try {
        const response = await fetchAPI('/api/dividas');
        const dividasData = await response.json();
        
        dividas = dividasData.map(divida => ({
            id: divida._id,
            nome: divida.nome,
            tipo: divida.tipo,
            valor: divida.valorTotal,
            parcelas: divida.numParcelas,
            dataFim: divida.dataFim,
            valorParcela: divida.valorTotal / divida.numParcelas,
            parcelasDetalhadas: divida.parcelas.map(p => ({
                numero: p.numero,
                valor: p.valor,
                data: new Date(p.data).toLocaleDateString('pt-BR'),
                pago: p.pago,
                _id: p._id
            }))
        }));
        
        renderDividas();
    } catch (error) {
        console.error('Erro ao carregar dívidas:', error);
    }
}

function calcularParcelas(valorTotal, numParcelas, dataFim) {
    const parcelas = [];
    const valorParcela = valorTotal / numParcelas;
    const dataFinal = new Date(dataFim);
    
    // Calcular data de início baseada no número de parcelas
    const dataInicio = new Date(dataFinal);
    dataInicio.setMonth(dataInicio.getMonth() - (numParcelas - 1));
    
    for (let i = 0; i < numParcelas; i++) {
        const dataParcela = new Date(dataInicio);
        dataParcela.setMonth(dataParcela.getMonth() + i);
        
        parcelas.push({
            numero: i + 1,
            valor: valorParcela,
            data: dataParcela.toLocaleDateString('pt-BR'),
            pago: false
        });
    }
    
    return parcelas;
}

async function toggleParcelaPaga(dividaId, parcelaIndex) {
    const divida = dividas.find(d => d.id === dividaId);
    if (divida && divida.parcelasDetalhadas[parcelaIndex]) {
        const parcela = divida.parcelasDetalhadas[parcelaIndex];
        const novoPago = !parcela.pago;
        
        try {
            const response = await fetchAPI(`/api/dividas/${dividaId}/parcela/${parcela._id}`, {
                method: 'PATCH',
                body: JSON.stringify({ paga: novoPago })
            });
            
            if (!response.ok) {
                throw new Error('Erro ao atualizar parcela');
            }
            
            // Atualizar localmente
            parcela.pago = novoPago;
            renderDividas();
        } catch (error) {
            console.error('Erro ao atualizar parcela:', error);
            alert('Erro ao marcar parcela. Tente novamente.');
        }
    }
}

function renderDividas() {
    const container = document.getElementById('dividas-list');
    
    if (dividas.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma dívida cadastrada. Clique em "Adicionar Dívida" para começar.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    dividas.forEach(divida => {
        const card = createDividaCard(divida);
        container.appendChild(card);
    });
}

function createDividaCard(divida) {
    const card = document.createElement('div');
    card.className = 'divida-card';
    card.dataset.id = divida.id;
    
    const tipoMap = {
        'cartao': 'Cartão de Crédito',
        'emprestimo': 'Empréstimo Pessoal',
        'financiamento': 'Financiamento',
        'cheque': 'Cheque Especial',
        'outros': 'Outros'
    };
    
    card.innerHTML = `
        <div class="divida-header">
            <span class="divida-nome">${divida.nome}</span>
            <span class="divida-tipo">${tipoMap[divida.tipo] || divida.tipo}</span>
        </div>
        <div class="divida-info">
            <span>Valor Total: R$ ${divida.valor.toFixed(2).replace('.', ',')}</span>
            <span>Parcelas: ${divida.parcelas}x de R$ ${divida.valorParcela.toFixed(2).replace('.', ',')}</span>
            <span>Fim: ${new Date(divida.dataFim).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="divida-parcelas">
            <h4>Parcelas</h4>
            ${divida.parcelasDetalhadas.map((parcela, index) => `
                <div class="parcela-item ${parcela.pago ? 'paga' : ''}" data-parcela-index="${index}">
                    <div class="parcela-info">
                        <span>Parcela ${parcela.numero}/${divida.parcelas}</span>
                        <span>${parcela.data}</span>
                        <span>R$ ${parcela.valor.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button class="btn-toggle-paga" data-parcela-index="${index}">
                        <i class="fas ${parcela.pago ? 'fa-check-circle' : 'fa-circle'}"></i>
                        ${parcela.pago ? 'Paga' : 'Marcar como Paga'}
                    </button>
                </div>
            `).join('')}
        </div>
    `;
    
    // Evento de clique para expandir/recolher
    card.addEventListener('click', function(e) {
        // Não expandir se clicou em um botão de parcela
        if (e.target.closest('.btn-toggle-paga')) {
            return;
        }
        this.classList.toggle('expanded');
    });
    
    // Adicionar eventos aos botões de marcar como paga
    const btnsParcela = card.querySelectorAll('.btn-toggle-paga');
    btnsParcela.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const parcelaIndex = parseInt(this.dataset.parcelaIndex);
            toggleParcelaPaga(divida.id, parcelaIndex);
        });
    });
    
    return card;
}

// Salvar perfil
function setupSaveButton() {
    const btnSave = document.getElementById('btn-save-perfil');
    btnSave.addEventListener('click', savePerfilData);
    
    // Monitorar mudanças nos campos
    setupChangeDetection();
    
    // Avisar quando tentar sair sem salvar
    setupUnloadWarning();
}

function setupChangeDetection() {
    const inputs = document.querySelectorAll('.perfil-container input, .perfil-container textarea, .perfil-container select');
    
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            hasUnsavedChanges = true;
        });
        input.addEventListener('change', () => {
            hasUnsavedChanges = true;
        });
    });
}

function setupUnloadWarning() {
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
            return 'Você tem alterações não salvas. Deseja realmente sair?';
        }
    });
}

function savePerfilData() {
    const perfilDataToSave = {
        // Informações Pessoais
        nome: document.getElementById('nome').value,
        idade: document.getElementById('idade').value,
        profissao: document.getElementById('profissao').value,
        cidade: document.getElementById('cidade').value,
        estado: document.getElementById('estado').value,
        sobre: document.getElementById('sobre').value,
        
        // Objetivos Financeiros
        fundoEmergencia: document.getElementById('fundo-emergencia').value,
        prazoFundo: document.getElementById('prazo-fundo').value,
        metaCurto: {
            descricao: document.getElementById('meta-curto-desc').value,
            valor: document.getElementById('meta-curto-valor').value,
            prazo: document.getElementById('meta-curto-prazo').value
        },
        metaLongo: {
            descricao: document.getElementById('meta-longo-desc').value,
            valor: document.getElementById('meta-longo-valor').value,
            prazo: document.getElementById('meta-longo-prazo').value
        },
        
        // Patrimônio
        patrimonio: {},
        
        // Dependentes
        numDependentes: document.getElementById('num-dependentes').value,
        unicaRenda: document.getElementById('unica-renda').value,
        rendaConjugue: document.getElementById('renda-conjugue').value
    };
    
    // Salvar patrimônio
    const patrimonioInputs = document.querySelectorAll('.patrimonio-input');
    patrimonioInputs.forEach(input => {
        const tipo = input.dataset.tipo;
        const valor = parseFloat(input.value) || 0;
        perfilDataToSave.patrimonio[tipo] = valor;
    });
    
    // Enviar para o backend
    fetchAPI('/api/perfil', {
        method: 'POST',
        body: JSON.stringify(perfilDataToSave)
    })
    .then(response => {
        if (response.ok) {
            hasUnsavedChanges = false; // Resetar flag após salvamento bem-sucedido
            alert('Perfil salvo com sucesso!');
        } else {
            throw new Error('Erro ao salvar perfil');
        }
    })
    .catch(error => {
        console.error('Erro ao salvar perfil:', error);
        alert('Erro ao salvar perfil. Tente novamente.');
    });
}

async function loadPerfilData() {
    try {
        const response = await fetchAPI('/api/perfil');
        
        if (response.ok) {
            const perfilData = await response.json();
            
            // Carregar Informações Pessoais
            document.getElementById('nome').value = perfilData.nome || '';
            document.getElementById('idade').value = perfilData.idade || '';
            document.getElementById('profissao').value = perfilData.profissao || '';
            document.getElementById('cidade').value = perfilData.cidade || '';
            document.getElementById('estado').value = perfilData.estado || '';
            document.getElementById('sobre').value = perfilData.sobre || '';
            
            // Carregar Objetivos Financeiros
            document.getElementById('fundo-emergencia').value = perfilData.fundoEmergencia || '';
            document.getElementById('prazo-fundo').value = perfilData.prazoFundo || '';
            document.getElementById('meta-curto-desc').value = perfilData.metaCurto?.descricao || '';
            document.getElementById('meta-curto-valor').value = perfilData.metaCurto?.valor || '';
            document.getElementById('meta-curto-prazo').value = perfilData.metaCurto?.prazo || '';
            document.getElementById('meta-longo-desc').value = perfilData.metaLongo?.descricao || '';
            document.getElementById('meta-longo-valor').value = perfilData.metaLongo?.valor || '';
            document.getElementById('meta-longo-prazo').value = perfilData.metaLongo?.prazo || '';
            
            // Carregar Patrimônio
            if (perfilData.patrimonio) {
                Object.keys(perfilData.patrimonio).forEach(tipo => {
                    const input = document.querySelector(`.patrimonio-input[data-tipo="${tipo}"]`);
                    if (input) {
                        input.value = perfilData.patrimonio[tipo];
                    }
                });
                calculatePatrimonioTotal();
            }
            
            // Carregar Dependentes
            document.getElementById('num-dependentes').value = perfilData.numDependentes || '';
            document.getElementById('unica-renda').value = perfilData.unicaRenda || '';
            document.getElementById('renda-conjugue').value = perfilData.rendaConjugue || '';
            
            // Resetar flag de mudanças não salvas após carregar dados
            hasUnsavedChanges = false;
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

