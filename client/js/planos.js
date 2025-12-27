// URL da API
const API_URL = 'http://localhost:5000';

// Variável para armazenar o plano selecionado
let planoSelecionado = null;

// ========== CARREGAR PLANOS ==========
async function carregarPlanos() {
    try {
        const response = await fetch(`${API_URL}/api/pagamentos/planos`);
        const data = await response.json();

        if (data.success) {
            exibirPlanos(data.planos);
        } else {
            mostrarMensagem('Erro ao carregar planos', 'erro');
        }
    } catch (error) {
        console.error('Erro ao carregar planos:', error);
        mostrarMensagem('Erro ao conectar com o servidor', 'erro');
    }
}

// ========== EXIBIR PLANOS NA TELA ==========
function exibirPlanos(planos) {
    const container = document.getElementById('planos-container');
    container.innerHTML = '';

    Object.entries(planos).forEach(([key, plano], index) => {
        const card = document.createElement('div');
        card.className = 'plano-card';
        
        // Destacar o plano do meio (premium)
        if (index === 1) {
            card.classList.add('destaque');
        }

        card.innerHTML = `
            <div class="plano-header">
                <h2 class="plano-nome">${plano.nome}</h2>
                <div class="plano-preco">${plano.preco}</div>
            </div>
            <ul class="plano-recursos">
                ${plano.recursos.map(recurso => `<li>${recurso}</li>`).join('')}
            </ul>
            <button class="btn btn-primary" onclick="selecionarPlano('${key}', '${plano.nome}', '${plano.link}')">
                Assinar Agora
            </button>
        `;

        container.appendChild(card);
    });
}

// ========== SELECIONAR PLANO ==========
function selecionarPlano(key, nome, link) {
    planoSelecionado = { key, nome, link };
    
    const modal = document.getElementById('modal-confirmacao');
    const modalTexto = document.getElementById('modal-texto');
    
    modalTexto.innerHTML = `
        Você está prestes a assinar o <strong>${nome}</strong>.<br><br>
        Você será redirecionado para a página de pagamento do Stripe.<br>
        Após a confirmação do pagamento, seu acesso será liberado automaticamente.
    `;
    
    modal.style.display = 'flex';
}

// ========== CONFIRMAR E REDIRECIONAR PARA PAGAMENTO ==========
document.getElementById('btn-confirmar')?.addEventListener('click', () => {
    if (planoSelecionado) {
        // Salvar preferência no localStorage
        localStorage.setItem('plano_selecionado', planoSelecionado.key);
        
        // Redirecionar para o link de pagamento do Stripe
        window.location.href = planoSelecionado.link;
    }
});

// ========== CANCELAR MODAL ==========
document.getElementById('btn-cancelar')?.addEventListener('click', () => {
    document.getElementById('modal-confirmacao').style.display = 'none';
    planoSelecionado = null;
});

// ========== VERIFICAR STATUS DA ASSINATURA ==========
async function verificarStatus() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return;
    }

    try {
        // Decodificar o token para pegar o userId
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.userId;

        const response = await fetch(`${API_URL}/api/pagamentos/status/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();

        if (data.success && data.status === 'ativo') {
            mostrarMensagem('Você já possui uma assinatura ativa!', 'sucesso');
        } else if (data.status === 'pendente') {
            mostrarMensagem('Sua assinatura está pendente. Complete o pagamento para liberar o acesso.', 'alerta');
        }
    } catch (error) {
        console.error('Erro ao verificar status:', error);
    }
}

// ========== MOSTRAR MENSAGENS ==========
function mostrarMensagem(texto, tipo = 'info') {
    const mensagem = document.getElementById('mensagem');
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
    mensagem.style.display = 'block';

    setTimeout(() => {
        mensagem.style.display = 'none';
    }, 5000);
}

// ========== INICIALIZAR ==========
document.addEventListener('DOMContentLoaded', () => {
    carregarPlanos();
    verificarStatus();

    // Verificar se voltou do pagamento
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
        mostrarMensagem('Pagamento realizado com sucesso! Seu acesso será liberado em instantes.', 'sucesso');
    } else if (urlParams.get('canceled') === 'true') {
        mostrarMensagem('Pagamento cancelado. Você pode tentar novamente quando quiser.', 'alerta');
    }
});
