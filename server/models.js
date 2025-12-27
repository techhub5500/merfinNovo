const mongoose = require('mongoose');

// ========== SCHEMA DE ASSINATURA ==========
const subscriptionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true // Um usuário só pode ter uma assinatura ativa
    },
    stripeCustomerId: { 
        type: String, 
        required: true 
    },
    stripeSubscriptionId: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pendente', 'ativo', 'cancelado', 'expirado'],
        default: 'pendente'
    },
    plano: {
        type: String,
        enum: ['basico', 'premium', 'empresarial'],
        required: true
    },
    validoAte: { 
        type: Date, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Índice para busca rápida
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

// Exportar os models que já existem no serverOperacional
// Você vai precisar importar os models existentes ou movê-los para cá
module.exports = {
    Subscription,
    // User e outros models serão importados do serverOperacional
};
