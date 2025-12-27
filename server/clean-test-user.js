require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    status: { type: String, enum: ['pendente', 'ativo', 'cancelado', 'expirado'], default: 'pendente' },
    plano: { type: String, enum: ['basico', 'premium', 'empresarial'], required: true },
    validoAte: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);

async function cleanTestUser() {
    try {
        console.log('🔍 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado!\n');
        
        const email = 'tececonsultoria28@gmail.com';
        
        console.log('🔍 Buscando usuário:', email);
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('❌ Usuário não encontrado no banco');
        } else {
            console.log('✅ Usuário encontrado:', user._id);
            
            // Buscar assinatura
            const assinatura = await Subscription.findOne({ userId: user._id });
            if (assinatura) {
                console.log('🗑️ Deletando assinatura...');
                await Subscription.deleteOne({ _id: assinatura._id });
                console.log('✅ Assinatura deletada');
            }
            
            // Deletar usuário
            console.log('🗑️ Deletando usuário...');
            await User.deleteOne({ _id: user._id });
            console.log('✅ Usuário deletado');
        }
        
        console.log('\n✅ Limpeza concluída! Agora você pode testar o cadastro novamente.');
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão fechada');
        process.exit(0);
    }
}

cleanTestUser();
