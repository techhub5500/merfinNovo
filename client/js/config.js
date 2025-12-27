// ========== CONFIGURAÇÃO DE AMBIENTE ==========
// Este arquivo centraliza as URLs da API para facilitar a migração para produção

/**
 * Detecta automaticamente se está em desenvolvimento ou produção
 * e retorna a URL base da API correspondente
 */
const getAPIUrl = () => {
    // Se estiver em localhost, usa URL local
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    
    // Em produção, usa o domínio real
    // ⚠️ ALTERE ESTA URL QUANDO FOR PARA PRODUÇÃO
    return 'https://seudominio.com';
};

/**
 * URL base da API
 * Use esta constante em todas as requisições fetch()
 */
const API_URL = getAPIUrl();

/**
 * Função auxiliar para fazer requisições à API
 * @param {string} endpoint - Endpoint da API (ex: '/api/auth/login')
 * @param {object} options - Opções do fetch (method, headers, body, etc)
 * @returns {Promise<Response>}
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };
    
    // Adicionar token JWT se existir
    const token = localStorage.getItem('merfin_token');
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, config);
        return response;
    } catch (error) {
        console.error(`❌ Erro na requisição para ${url}:`, error);
        throw error;
    }
}

/**
 * Exemplo de uso:
 * 
 * // Login
 * const response = await apiRequest('/api/auth/login', {
 *     method: 'POST',
 *     body: JSON.stringify({ email, senha })
 * });
 * 
 * // Buscar perfil (com autenticação automática)
 * const response = await apiRequest('/api/perfil');
 * 
 * // Criar dívida
 * const response = await apiRequest('/api/dividas', {
 *     method: 'POST',
 *     body: JSON.stringify(dividaData)
 * });
 */

// Exportar para uso global
window.API_URL = API_URL;
window.apiRequest = apiRequest;

console.log(`🌐 API configurada para: ${API_URL}`);
