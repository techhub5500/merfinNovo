const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.AGENT_PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Histórico de conversas por sessão (em produção, usar Redis ou DB)
const conversationHistory = new Map();

// Sistema de prompts para o assistente financeiro
const SYSTEM_PROMPT = `Você é Merfin, um assistente de finanças pessoais inteligente e amigável. Suas características:

- Você ajuda usuários a gerenciar suas finanças, investimentos e orçamento
- Você é educado, profissional, mas também acessível e empático
- Você fornece conselhos financeiros práticos e personalizados
- Você usa linguagem clara e evita jargões desnecessários
- Quando apropriado, você faz perguntas para entender melhor a situação financeira do usuário
- Você celebra conquistas financeiras e motiva nos momentos difíceis
- Você é responsável e sempre lembra que suas dicas não substituem consultoria financeira profissional certificada

Mantenha suas respostas concisas mas informativas. Use emojis ocasionalmente para tornar a conversa mais amigável.`;

// Rota de health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Merfin Agent' });
});

// Rota principal do chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ 
                error: 'Mensagem inválida' 
            });
        }

        // Obter ou criar histórico da conversa
        if (!conversationHistory.has(sessionId)) {
            conversationHistory.set(sessionId, [
                { role: 'system', content: SYSTEM_PROMPT }
            ]);
        }

        const history = conversationHistory.get(sessionId);
        
        // Adicionar mensagem do usuário
        history.push({ role: 'user', content: message });

        // Limitar histórico a últimas 20 mensagens + system prompt
        if (history.length > 21) {
            history.splice(1, history.length - 21);
        }

        // Chamar API do ChatGPT
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: history,
                max_tokens: 500,
                temperature: 0.7,
                presence_penalty: 0.6,
                frequency_penalty: 0.3
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiMessage = response.data.choices[0].message.content;
        
        // Adicionar resposta da IA ao histórico
        history.push({ role: 'assistant', content: aiMessage });

        res.json({
            success: true,
            response: aiMessage,
            sessionId
        });

    } catch (error) {
        console.error('Erro no chat:', error.response?.data || error.message);
        
        // Tratar erros específicos da API
        if (error.response?.status === 429) {
            return res.status(429).json({
                error: 'Muitas requisições. Por favor, aguarde um momento.'
            });
        }

        if (error.response?.status === 401) {
            return res.status(500).json({
                error: 'Erro de configuração do servidor.'
            });
        }

        res.status(500).json({
            error: 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.'
        });
    }
});

// Rota para limpar histórico de uma sessão
app.delete('/api/chat/history/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    
    if (conversationHistory.has(sessionId)) {
        conversationHistory.delete(sessionId);
        res.json({ success: true, message: 'Histórico limpo' });
    } else {
        res.status(404).json({ error: 'Sessão não encontrada' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🤖 Servidor Merfin Agent rodando na porta ${PORT}`);
    console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✓ Configurada' : '✗ Não configurada'}`);
});
