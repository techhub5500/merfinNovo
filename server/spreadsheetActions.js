const axios = require('axios');

// ========== FUNÇÕES DE MANIPULAÇÃO DE PLANILHAS ==========

/**
 * Busca dados financeiros de um mês específico
 */
async function getMonthData(userToken, operationalServerUrl, monthId) {
    try {
        const response = await axios.get(
            `${operationalServerUrl}/api/financas/${monthId}`,
            { headers: { 'Authorization': `Bearer ${userToken}` } }
        );
        return response.data;
    } catch (error) {
        console.error('   ❌ Erro ao buscar dados do mês:', error.message);
        return { receitas: [], despesas: [] };
    }
}

/**
 * Salva dados financeiros de um mês
 */
async function saveMonthData(userToken, operationalServerUrl, monthId, data) {
    try {
        const response = await axios.post(
            `${operationalServerUrl}/api/financas/${monthId}`,
            data,
            { headers: { 'Authorization': `Bearer ${userToken}` } }
        );
        return { success: true, data: response.data };
    } catch (error) {
        console.error('   ❌ Erro ao salvar dados:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Adiciona uma receita
 */
async function addIncome(userToken, operationalServerUrl, monthId, incomeData) {
    console.log('\n💰 AÇÃO: Adicionar Receita');
    console.log('   📅 Mês:', monthId);
    console.log('   📊 Dados:', JSON.stringify(incomeData, null, 2));
    
    // Buscar dados atuais
    const currentData = await getMonthData(userToken, operationalServerUrl, monthId);
    
    // Criar objeto de receita
    const novaReceita = {
        data: incomeData.date || new Date().toISOString().split('T')[0],
        descricao: incomeData.description || '',
        categoria: incomeData.category || '',
        subcategoria: incomeData.subcategory || '',
        valor: incomeData.amount || 0,
        status: incomeData.status || 'A receber'
    };
    
    console.log('   📝 Receita a ser adicionada:', JSON.stringify(novaReceita, null, 2));
    
    // Adicionar nova receita
    currentData.receitas.push(novaReceita);
    
    // Salvar
    const result = await saveMonthData(userToken, operationalServerUrl, monthId, currentData);
    
    if (result.success) {
        console.log('   ✅ Receita adicionada com sucesso!');
        console.log(`   💵 Valor: R$ ${incomeData.amount}`);
        console.log(`   📝 Descrição: ${incomeData.description}`);
        console.log(`   📂 Categoria: ${incomeData.category || 'Não informada'}`);
        console.log(`   📁 Subcategoria: ${incomeData.subcategory || 'Não informada'}`);
        return {
            success: true,
            message: `Receita de R$ ${incomeData.amount} (${incomeData.description}) adicionada com sucesso! Categoria: ${incomeData.category || 'N/A'}, Subcategoria: ${incomeData.subcategory || 'N/A'}`,
            data: currentData
        };
    } else {
        console.log('   ❌ Falha ao adicionar receita');
        return {
            success: false,
            message: 'Não consegui adicionar a receita. Tente novamente.',
            error: result.error
        };
    }
}

/**
 * Adiciona uma despesa
 */
async function addExpense(userToken, operationalServerUrl, monthId, expenseData) {
    console.log('\n💸 AÇÃO: Adicionar Despesa');
    console.log('   📅 Mês:', monthId);
    console.log('   📊 Dados:', JSON.stringify(expenseData, null, 2));
    
    // Buscar dados atuais
    const currentData = await getMonthData(userToken, operationalServerUrl, monthId);
    
    // Criar objeto de despesa
    const novaDespesa = {
        data: expenseData.date || new Date().toISOString().split('T')[0],
        descricao: expenseData.description || '',
        categoria: expenseData.category || '',
        subcategoria: expenseData.subcategory || '',
        valor: expenseData.amount || 0,
        formaPagamento: expenseData.paymentMethod || 'Dinheiro',
        status: expenseData.status || 'A pagar'
    };
    
    console.log('   📝 Despesa a ser adicionada:', JSON.stringify(novaDespesa, null, 2));
    
    // Adicionar nova despesa
    currentData.despesas.push(novaDespesa);
    
    // Salvar
    const result = await saveMonthData(userToken, operationalServerUrl, monthId, currentData);
    
    if (result.success) {
        console.log('   ✅ Despesa adicionada com sucesso!');
        console.log(`   💵 Valor: R$ ${expenseData.amount}`);
        console.log(`   📝 Descrição: ${expenseData.description}`);
        console.log(`   📂 Categoria: ${expenseData.category || 'Não informada'}`);
        console.log(`   📁 Subcategoria: ${expenseData.subcategory || 'Não informada'}`);
        return {
            success: true,
            message: `Despesa de R$ ${expenseData.amount} (${expenseData.description}) adicionada com sucesso! Categoria: ${expenseData.category || 'N/A'}, Subcategoria: ${expenseData.subcategory || 'N/A'}`,
            data: currentData
        };
    } else {
        console.log('   ❌ Falha ao adicionar despesa');
        return {
            success: false,
            message: 'Não consegui adicionar a despesa. Tente novamente.',
            error: result.error
        };
    }
}

/**
 * Edita uma receita completa
 */
async function editIncome(userToken, operationalServerUrl, monthId, identifier, newData) {
    console.log('\n✏️ AÇÃO: Editar Receita');
    console.log('   📅 Mês:', monthId);
    console.log('   🔍 Identificador:', identifier);
    console.log('   📊 Novos dados:', JSON.stringify(newData, null, 2));
    
    const currentData = await getMonthData(userToken, operationalServerUrl, monthId);
    
    // Encontrar a receita pelo identificador
    let index = -1;
    
    if (!identifier || identifier === 'undefined' || identifier === '') {
        console.log('   🤔 Identificador vazio - usando contexto inteligente');
        if (currentData.receitas.length === 1) {
            index = 0;
            console.log('   ✅ Encontrada 1 receita no mês - usando essa');
        } else if (currentData.receitas.length > 1) {
            index = currentData.receitas.length - 1;
            console.log(`   ✅ Usando última receita adicionada (${currentData.receitas[index].descricao})`);
        }
    } else {
        index = findItemIndex(currentData.receitas, identifier);
    }
    
    if (index === -1) {
        console.log('   ❌ Receita não encontrada');
        return {
            success: false,
            message: `Não encontrei a receita "${identifier}". Pode ser mais específico?`
        };
    }
    
    // Atualizar receita
    currentData.receitas[index] = {
        ...currentData.receitas[index],
        ...newData,
        data: newData.date || currentData.receitas[index].data,
        descricao: newData.description !== undefined ? newData.description : currentData.receitas[index].descricao,
        categoria: newData.category !== undefined ? newData.category : currentData.receitas[index].categoria,
        subcategoria: newData.subcategory !== undefined ? newData.subcategory : currentData.receitas[index].subcategoria,
        valor: newData.amount !== undefined ? newData.amount : currentData.receitas[index].valor,
        status: newData.status !== undefined ? newData.status : currentData.receitas[index].status
    };
    
    // Salvar
    const result = await saveMonthData(userToken, operationalServerUrl, monthId, currentData);
    
    if (result.success) {
        console.log('   ✅ Receita editada com sucesso!');
        return {
            success: true,
            message: `Receita "${identifier}" atualizada com sucesso!`,
            data: currentData.receitas[index]
        };
    } else {
        console.log('   ❌ Falha ao editar receita');
        return {
            success: false,
            message: 'Não consegui editar a receita. Tente novamente.',
            error: result.error
        };
    }
}

/**
 * Edita uma despesa completa
 */
async function editExpense(userToken, operationalServerUrl, monthId, identifier, newData) {
    console.log('\n✏️ AÇÃO: Editar Despesa');
    console.log('   📅 Mês:', monthId);
    console.log('   🔍 Identificador:', identifier);
    console.log('   📊 Novos dados:', JSON.stringify(newData, null, 2));
    
    const currentData = await getMonthData(userToken, operationalServerUrl, monthId);
    
    let index = -1;
    
    if (!identifier || identifier === 'undefined' || identifier === '') {
        console.log('   🤔 Identificador vazio - usando contexto inteligente');
        if (currentData.despesas.length === 1) {
            index = 0;
            console.log('   ✅ Encontrada 1 despesa no mês - usando essa');
        } else if (currentData.despesas.length > 1) {
            index = currentData.despesas.length - 1;
            console.log(`   ✅ Usando última despesa adicionada (${currentData.despesas[index].descricao})`);
        }
    } else {
        index = findItemIndex(currentData.despesas, identifier);
    }
    
    if (index === -1) {
        console.log('   ❌ Despesa não encontrada');
        return {
            success: false,
            message: `Não encontrei a despesa "${identifier}". Pode ser mais específico?`
        };
    }
    
    // Atualizar despesa
    currentData.despesas[index] = {
        ...currentData.despesas[index],
        ...newData,
        data: newData.date || currentData.despesas[index].data,
        descricao: newData.description !== undefined ? newData.description : currentData.despesas[index].descricao,
        categoria: newData.category !== undefined ? newData.category : currentData.despesas[index].categoria,
        subcategoria: newData.subcategory !== undefined ? newData.subcategory : currentData.despesas[index].subcategoria,
        valor: newData.amount !== undefined ? newData.amount : currentData.despesas[index].valor,
        formaPagamento: newData.paymentMethod !== undefined ? newData.paymentMethod : currentData.despesas[index].formaPagamento,
        status: newData.status !== undefined ? newData.status : currentData.despesas[index].status
    };
    
    // Salvar
    const result = await saveMonthData(userToken, operationalServerUrl, monthId, currentData);
    
    if (result.success) {
        console.log('   ✅ Despesa editada com sucesso!');
        return {
            success: true,
            message: `Despesa "${identifier}" atualizada com sucesso!`,
            data: currentData.despesas[index]
        };
    } else {
        console.log('   ❌ Falha ao editar despesa');
        return {
            success: false,
            message: 'Não consegui editar a despesa. Tente novamente.',
            error: result.error
        };
    }
}

/**
 * Atualiza apenas um campo de uma receita
 */
async function updateIncomeField(userToken, operationalServerUrl, monthId, identifier, field, newValue) {
    console.log('\n🔄 AÇÃO: Atualizar Campo de Receita');
    console.log('   📅 Mês:', monthId);
    console.log('   🔍 Identificador:', identifier);
    console.log('   📝 Campo:', field);
    console.log('   ✨ Novo valor:', newValue);
    
    const currentData = await getMonthData(userToken, operationalServerUrl, monthId);
    
    // Se não há identificador, tentar usar contexto inteligente
    let index = -1;
    
    if (!identifier || identifier === 'undefined' || identifier === '') {
        console.log('   🤔 Identificador vazio - usando contexto inteligente');
        
        // Se há apenas 1 receita no mês, usar essa
        if (currentData.receitas.length === 1) {
            index = 0;
            console.log('   ✅ Encontrada 1 receita no mês - usando essa');
        } 
        // Se há várias, usar a última adicionada (mais recente no array)
        else if (currentData.receitas.length > 1) {
            index = currentData.receitas.length - 1;
            console.log(`   ✅ Usando última receita adicionada (${currentData.receitas[index].descricao})`);
        }
        else {
            console.log('   ❌ Nenhuma receita encontrada no mês');
            return {
                success: false,
                message: `Não encontrei nenhuma receita no mês ${monthId}.`
            };
        }
    } else {
        index = findItemIndex(currentData.receitas, identifier);
    }
    
    if (index === -1) {
        console.log('   ❌ Receita não encontrada');
        return {
            success: false,
            message: `Não encontrei a receita "${identifier}".`
        };
    }
    
    // Mapear nomes de campos
    const fieldMap = {
        'data': 'data',
        'date': 'data',
        'descrição': 'descricao',
        'descricao': 'descricao',
        'description': 'descricao',
        'categoria': 'categoria',
        'category': 'categoria',
        'subcategoria': 'subcategoria',
        'subcategory': 'subcategoria',
        'valor': 'valor',
        'amount': 'valor',
        'value': 'valor',
        'status': 'status'
    };
    
    const actualField = fieldMap[field.toLowerCase()] || field;
    
    if (!currentData.receitas[index].hasOwnProperty(actualField)) {
        console.log('   ❌ Campo inválido');
        return {
            success: false,
            message: `O campo "${field}" não existe nas receitas.`
        };
    }
    
    // Atualizar campo
    currentData.receitas[index][actualField] = newValue;
    
    // Salvar
    const result = await saveMonthData(userToken, operationalServerUrl, monthId, currentData);
    
    if (result.success) {
        console.log('   ✅ Campo atualizado com sucesso!');
        return {
            success: true,
            message: `Campo "${field}" da receita atualizado para "${newValue}"!`,
            data: currentData.receitas[index]
        };
    } else {
        console.log('   ❌ Falha ao atualizar campo');
        return {
            success: false,
            message: 'Não consegui atualizar o campo. Tente novamente.',
            error: result.error
        };
    }
}

/**
 * Atualiza apenas um campo de uma despesa
 */
async function updateExpenseField(userToken, operationalServerUrl, monthId, identifier, field, newValue) {
    console.log('\n🔄 AÇÃO: Atualizar Campo de Despesa');
    console.log('   📅 Mês:', monthId);
    console.log('   🔍 Identificador:', identifier);
    console.log('   📝 Campo:', field);
    console.log('   ✨ Novo valor:', newValue);
    
    const currentData = await getMonthData(userToken, operationalServerUrl, monthId);
    
    // Se não há identificador, tentar usar contexto inteligente
    let index = -1;
    
    if (!identifier || identifier === 'undefined' || identifier === '') {
        console.log('   🤔 Identificador vazio - usando contexto inteligente');
        
        // Se há apenas 1 despesa no mês, usar essa
        if (currentData.despesas.length === 1) {
            index = 0;
            console.log('   ✅ Encontrada 1 despesa no mês - usando essa');
        } 
        // Se há várias, usar a última adicionada (mais recente no array)
        else if (currentData.despesas.length > 1) {
            index = currentData.despesas.length - 1;
            console.log(`   ✅ Usando última despesa adicionada (${currentData.despesas[index].descricao})`);
        }
        else {
            console.log('   ❌ Nenhuma despesa encontrada no mês');
            return {
                success: false,
                message: `Não encontrei nenhuma despesa no mês ${monthId}.`
            };
        }
    } else {
        index = findItemIndex(currentData.despesas, identifier);
    }
    
    if (index === -1) {
        console.log('   ❌ Despesa não encontrada');
        return {
            success: false,
            message: `Não encontrei a despesa "${identifier}".`
        };
    }
    
    // Mapear nomes de campos
    const fieldMap = {
        'data': 'data',
        'date': 'data',
        'descrição': 'descricao',
        'descricao': 'descricao',
        'description': 'descricao',
        'categoria': 'categoria',
        'category': 'categoria',
        'subcategoria': 'subcategoria',
        'subcategory': 'subcategoria',
        'valor': 'valor',
        'amount': 'valor',
        'value': 'valor',
        'formaPagamento': 'formaPagamento',
        'forma de pagamento': 'formaPagamento',
        'paymentmethod': 'formaPagamento',
        'pagamento': 'formaPagamento',
        'status': 'status'
    };
    
    const actualField = fieldMap[field.toLowerCase()] || field;
    
    if (!currentData.despesas[index].hasOwnProperty(actualField)) {
        console.log('   ❌ Campo inválido');
        return {
            success: false,
            message: `O campo "${field}" não existe nas despesas.`
        };
    }
    
    // Atualizar campo
    currentData.despesas[index][actualField] = newValue;
    
    // Salvar
    const result = await saveMonthData(userToken, operationalServerUrl, monthId, currentData);
    
    if (result.success) {
        console.log('   ✅ Campo atualizado com sucesso!');
        return {
            success: true,
            message: `Campo "${field}" da despesa atualizado para "${newValue}"!`,
            data: currentData.despesas[index]
        };
    } else {
        console.log('   ❌ Falha ao atualizar campo');
        return {
            success: false,
            message: 'Não consegui atualizar o campo. Tente novamente.',
            error: result.error
        };
    }
}

/**
 * Deleta uma receita
 */
async function deleteIncome(userToken, operationalServerUrl, monthId, identifier) {
    console.log('\n🗑️ AÇÃO: Deletar Receita');
    console.log('   📅 Mês:', monthId);
    console.log('   🔍 Identificador:', identifier);
    
    const currentData = await getMonthData(userToken, operationalServerUrl, monthId);
    const index = findItemIndex(currentData.receitas, identifier);
    
    if (index === -1) {
        console.log('   ❌ Receita não encontrada');
        return {
            success: false,
            message: `Não encontrei a receita "${identifier}".`
        };
    }
    
    const deletedItem = currentData.receitas[index];
    
    // Remover receita
    currentData.receitas.splice(index, 1);
    
    // Salvar
    const result = await saveMonthData(userToken, operationalServerUrl, monthId, currentData);
    
    if (result.success) {
        console.log('   ✅ Receita deletada com sucesso!');
        console.log(`   📝 Receita removida: ${deletedItem.descricao} - R$ ${deletedItem.valor}`);
        return {
            success: true,
            message: `Receita "${deletedItem.descricao}" (R$ ${deletedItem.valor}) deletada com sucesso!`,
            deletedItem
        };
    } else {
        console.log('   ❌ Falha ao deletar receita');
        return {
            success: false,
            message: 'Não consegui deletar a receita. Tente novamente.',
            error: result.error
        };
    }
}

/**
 * Deleta uma despesa
 */
async function deleteExpense(userToken, operationalServerUrl, monthId, identifier) {
    console.log('\n🗑️ AÇÃO: Deletar Despesa');
    console.log('   📅 Mês:', monthId);
    console.log('   🔍 Identificador:', identifier);
    
    const currentData = await getMonthData(userToken, operationalServerUrl, monthId);
    const index = findItemIndex(currentData.despesas, identifier);
    
    if (index === -1) {
        console.log('   ❌ Despesa não encontrada');
        return {
            success: false,
            message: `Não encontrei a despesa "${identifier}".`
        };
    }
    
    const deletedItem = currentData.despesas[index];
    
    // Remover despesa
    currentData.despesas.splice(index, 1);
    
    // Salvar
    const result = await saveMonthData(userToken, operationalServerUrl, monthId, currentData);
    
    if (result.success) {
        console.log('   ✅ Despesa deletada com sucesso!');
        console.log(`   📝 Despesa removida: ${deletedItem.descricao} - R$ ${deletedItem.valor}`);
        return {
            success: true,
            message: `Despesa "${deletedItem.descricao}" (R$ ${deletedItem.valor}) deletada com sucesso!`,
            deletedItem
        };
    } else {
        console.log('   ❌ Falha ao deletar despesa');
        return {
            success: false,
            message: 'Não consegui deletar a despesa. Tente novamente.',
            error: result.error
        };
    }
}

/**
 * Função auxiliar para encontrar índice de um item
 */
function findItemIndex(items, identifier) {
    // Tentar encontrar por descrição exata
    let index = items.findIndex(item => 
        item.descricao.toLowerCase().includes(identifier.toLowerCase())
    );
    
    if (index !== -1) return index;
    
    // Tentar encontrar por categoria
    index = items.findIndex(item => 
        item.categoria.toLowerCase().includes(identifier.toLowerCase())
    );
    
    if (index !== -1) return index;
    
    // Tentar encontrar por data
    index = items.findIndex(item => 
        item.data === identifier
    );
    
    if (index !== -1) return index;
    
    // Tentar encontrar por índice numérico (1-based)
    const numericIndex = parseInt(identifier);
    if (!isNaN(numericIndex) && numericIndex > 0 && numericIndex <= items.length) {
        return numericIndex - 1; // Converter para 0-based
    }
    
    return -1;
}

/**
 * Lista receitas
 */
async function listIncomes(userToken, operationalServerUrl, monthId) {
    console.log('\n📋 AÇÃO: Listar Receitas');
    console.log('   📅 Mês:', monthId);
    
    const currentData = await getMonthData(userToken, operationalServerUrl, monthId);
    
    console.log(`   ✅ ${currentData.receitas.length} receitas encontradas`);
    
    return {
        success: true,
        count: currentData.receitas.length,
        items: currentData.receitas
    };
}

/**
 * Lista despesas
 */
async function listExpenses(userToken, operationalServerUrl, monthId) {
    console.log('\n📋 AÇÃO: Listar Despesas');
    console.log('   📅 Mês:', monthId);
    
    const currentData = await getMonthData(userToken, operationalServerUrl, monthId);
    
    console.log(`   ✅ ${currentData.despesas.length} despesas encontradas`);
    
    return {
        success: true,
        count: currentData.despesas.length,
        items: currentData.despesas
    };
}

/**
 * Limpa todas as receitas de um mês
 */
async function clearAllIncomes(userToken, operationalServerUrl, monthId) {
    console.log('\n🗑️ AÇÃO: Limpar Todas as Receitas');
    console.log('   📅 Mês:', monthId);
    
    const currentData = await getMonthData(userToken, operationalServerUrl, monthId);
    const quantidadeAntes = currentData.receitas.length;
    
    if (quantidadeAntes === 0) {
        console.log('   ℹ️ Nenhuma receita para deletar');
        return {
            success: false,
            message: `Não há receitas registradas em ${monthId} para deletar.`
        };
    }
    
    // Limpar todas as receitas
    currentData.receitas = [];
    
    // Salvar
    const result = await saveMonthData(userToken, operationalServerUrl, monthId, currentData);
    
    if (result.success) {
        console.log(`   ✅ ${quantidadeAntes} receita(s) deletada(s) com sucesso!`);
        return {
            success: true,
            message: `${quantidadeAntes} receita(s) de ${monthId} deletada(s) com sucesso!`,
            count: quantidadeAntes
        };
    } else {
        console.log('   ❌ Falha ao limpar receitas');
        return {
            success: false,
            message: 'Não consegui limpar as receitas. Tente novamente.',
            error: result.error
        };
    }
}

/**
 * Limpa todas as despesas de um mês
 */
async function clearAllExpenses(userToken, operationalServerUrl, monthId) {
    console.log('\n🗑️ AÇÃO: Limpar Todas as Despesas');
    console.log('   📅 Mês:', monthId);
    
    const currentData = await getMonthData(userToken, operationalServerUrl, monthId);
    const quantidadeAntes = currentData.despesas.length;
    
    if (quantidadeAntes === 0) {
        console.log('   ℹ️ Nenhuma despesa para deletar');
        return {
            success: false,
            message: `Não há despesas registradas em ${monthId} para deletar.`
        };
    }
    
    // Limpar todas as despesas
    currentData.despesas = [];
    
    // Salvar
    const result = await saveMonthData(userToken, operationalServerUrl, monthId, currentData);
    
    if (result.success) {
        console.log(`   ✅ ${quantidadeAntes} despesa(s) deletada(s) com sucesso!`);
        return {
            success: true,
            message: `${quantidadeAntes} despesa(s) de ${monthId} deletada(s) com sucesso!`,
            count: quantidadeAntes
        };
    } else {
        console.log('   ❌ Falha ao limpar despesas');
        return {
            success: false,
            message: 'Não consegui limpar as despesas. Tente novamente.',
            error: result.error
        };
    }
}

module.exports = {
    addIncome,
    addExpense,
    editIncome,
    editExpense,
    updateIncomeField,
    updateExpenseField,
    deleteIncome,
    deleteExpense,
    listIncomes,
    listExpenses,
    clearAllIncomes,
    clearAllExpenses
};
