/**
 * MERFIN RICH MARKUP (MRM) PARSER
 * 
 * Parser principal que processa texto com markdown e componentes especiais
 * Sintaxe: @componente[atributos]conteúdo@/componente
 * 
 * @author Merfin.IA
 * @version 1.0.0
 */

class MRMParser {
    constructor() {
        this.components = new Map();
        this.cache = new Map();
        this.loadedLibraries = new Set();
        
        console.log('🎨 MRMParser inicializado');
    }
    
    /**
     * Registra um componente customizado
     * @param {string} name - Nome do componente
     * @param {Object} component - Objeto do componente com método render()
     */
    registerComponent(name, component) {
        this.components.set(name, component);
        console.log(`✅ Componente registrado: ${name}`);
    }
    
    /**
     * Parser principal - converte texto MRM em HTML
     * @param {string} text - Texto com markdown e componentes MRM
     * @returns {string} HTML renderizado
     */
    parse(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        console.log('🔍 MRM Parser iniciando...');
        console.log('📝 Texto recebido (primeiros 200 chars):', text.substring(0, 200));
        
        // Verificar cache
        const hash = this.generateHash(text);
        if (this.cache.has(hash)) {
            console.log('📦 Usando versão em cache');
            return this.cache.get(hash);
        }
        
        try {
            // 1. Extrair blocos (markdown + componentes)
            const blocks = this.extractBlocks(text);
            
            console.log(`📦 ${blocks.length} blocos extraídos:`, blocks);
            
            // 2. Processar cada bloco
            const processedBlocks = blocks.map((block, index) => {
                console.log(`🔨 Processando bloco ${index + 1}/${blocks.length}:`, block.type);
                
                if (block.type === 'markdown') {
                    // Processar markdown padrão
                    return this.renderMarkdown(block.content);
                } else {
                    // Processar componente customizado
                    const result = this.renderComponent(block);
                    console.log(`✅ Componente ${block.type} renderizado`);
                    return result;
                }
            });
            
            // 3. Combinar blocos
            const result = `<div class="mrm-content">${processedBlocks.join('')}</div>`;
            
            console.log('✅ MRM parsing completo');
            
            // 4. Salvar no cache
            this.cache.set(hash, result);
            
            return result;
            
        } catch (error) {
            console.error('❌ Erro ao processar MRM:', error);
            console.error('Stack:', error.stack);
            // Fallback: retornar markdown simples
            return this.renderMarkdown(text);
        }
    }
    
    /**
     * Extrai blocos de texto (markdown ou componentes)
     * @param {string} text - Texto completo
     * @returns {Array} Array de blocos
     */
    extractBlocks(text) {
        const blocks = [];
        
        // Regex para detectar @componente[atributos]...@/componente
        const regex = /@(\w+)\[([^\]]*)\]([\s\S]*?)@\/\1/g;
        
        let lastIndex = 0;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            // Adicionar texto markdown antes do componente
            if (match.index > lastIndex) {
                const markdownText = text.substring(lastIndex, match.index).trim();
                if (markdownText) {
                    blocks.push({
                        type: 'markdown',
                        content: markdownText
                    });
                }
            }
            
            // Adicionar componente
            blocks.push({
                type: match[1],           // nome do componente
                attributes: match[2],     // atributos [key=value,...]
                content: match[3].trim()  // conteúdo interno
            });
            
            lastIndex = regex.lastIndex;
        }
        
        // Adicionar texto restante como markdown
        if (lastIndex < text.length) {
            const remainingText = text.substring(lastIndex).trim();
            if (remainingText) {
                blocks.push({
                    type: 'markdown',
                    content: remainingText
                });
            }
        }
        
        // Se não encontrou nenhum componente, retornar todo como markdown
        if (blocks.length === 0) {
            blocks.push({
                type: 'markdown',
                content: text
            });
        }
        
        return blocks;
    }
    
    /**
     * Renderiza um bloco de markdown
     * @param {string} content - Conteúdo markdown
     * @returns {string} HTML
     */
    renderMarkdown(content) {
        if (typeof marked === 'undefined') {
            console.warn('⚠️ Marked.js não carregado, retornando texto plano');
            return `<div class="markdown-content">${this.escapeHtml(content)}</div>`;
        }
        
        try {
            const html = marked.parse(content);
            return `<div class="markdown-content">${html}</div>`;
        } catch (error) {
            console.error('❌ Erro ao renderizar markdown:', error);
            return `<div class="markdown-content">${this.escapeHtml(content)}</div>`;
        }
    }
    
    /**
     * Renderiza um componente customizado
     * @param {Object} block - Bloco do componente
     * @returns {string} HTML
     */
    renderComponent(block) {
        const component = this.components.get(block.type);
        
        if (!component) {
            console.warn(`⚠️ Componente não registrado: ${block.type}`);
            // Fallback: renderizar como markdown
            return this.renderMarkdown(block.content);
        }
        
        try {
            // Parsear atributos
            const attributes = this.parseAttributes(block.attributes);
            
            // Renderizar componente
            const html = component.render({
                ...block,
                attributes
            });
            
            return html;
            
        } catch (error) {
            console.error(`❌ Erro ao renderizar componente ${block.type}:`, error);
            return `<div class="mrm-error">Erro ao renderizar componente: ${block.type}</div>`;
        }
    }
    
    /**
     * Parseia atributos de um componente
     * @param {string} attrString - String de atributos "key=value,key2=value2"
     * @returns {Object} Objeto com atributos
     */
    parseAttributes(attrString) {
        const attributes = {};
        
        if (!attrString || attrString.trim() === '') {
            return attributes;
        }
        
        // Split por vírgula, mas não dentro de strings
        const pairs = attrString.match(/\w+=[^,]+/g) || [];
        
        pairs.forEach(pair => {
            const [key, ...valueParts] = pair.split('=');
            const value = valueParts.join('=').trim();
            
            // Tentar converter para tipos nativos
            if (value === 'true') {
                attributes[key.trim()] = true;
            } else if (value === 'false') {
                attributes[key.trim()] = false;
            } else if (!isNaN(value) && value !== '') {
                attributes[key.trim()] = parseFloat(value);
            } else {
                attributes[key.trim()] = value;
            }
        });
        
        return attributes;
    }
    
    /**
     * Gera hash para cache
     * @param {string} text - Texto
     * @returns {string} Hash
     */
    generateHash(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }
    
    /**
     * Escapa HTML para segurança
     * @param {string} text - Texto
     * @returns {string} Texto escapado
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Carrega biblioteca externa dinamicamente
     * @param {string} name - Nome da biblioteca
     * @param {string} url - URL do CDN
     * @returns {Promise}
     */
    async loadLibrary(name, url) {
        if (this.loadedLibraries.has(name)) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => {
                this.loadedLibraries.add(name);
                console.log(`✅ Biblioteca carregada: ${name}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`❌ Erro ao carregar ${name}`);
                reject(new Error(`Failed to load ${name}`));
            };
            document.head.appendChild(script);
        });
    }
    
    /**
     * Limpa cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache limpo');
    }
}

// Exportar instância global
if (typeof window !== 'undefined') {
    window.MRMParser = MRMParser;
    console.log('✅ MRMParser disponível globalmente');
}
