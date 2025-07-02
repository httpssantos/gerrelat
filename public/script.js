// =======================================================
// LÓGICA PRINCIPAL DO GERADOR DE RELATÓRIO
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // --- CONFIGURAÇÃO INICIAL DO GERADOR ---
    const botaoGerar = document.getElementById('gerar-btn');
    const botaoGerarTexto = document.getElementById('gerar-btn-text');
    const campoConversa = document.getElementById('conversa');
    const campoResultado = document.getElementById('resultado');
    const botaoCopiar = document.getElementById('copiar-btn');
    const botaoLimpar = document.getElementById('limpar-btn');

    // --- FUNÇÃO PRINCIPAL PARA GERAR O RELATÓRIO ---
    async function gerarRelatorio() {
        const conversa = campoConversa.value;

        if (conversa.trim() === '') {
            alert('Por favor, cole a conversa na primeira caixa de texto.');
            return;
        }
        
        // Efeito visual de "carregando"
        botaoGerar.disabled = true;
        botaoGerarTexto.innerHTML = '<i class="fas fa-circle-notch icon-spin mr-2"></i> Gerando...';

        campoResultado.value = 'Aguarde um instante, a Inteligência Artificial está trabalhando...';

        try {
            // AQUI ESTÁ O PONTO IMPORTANTE: a requisição vai para a sua função serverless Node.js
            const url = '/api/generate'; 
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversa: conversa })
            });

            // Se a resposta HTTP não for OK (status 2xx), lança um erro
            if (!response.ok) {
                // Tenta ler o corpo do erro como JSON, se possível
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    // Se não for JSON, usa o texto puro do erro
                    errorData = { error: await response.text() };
                }
                throw new Error(`Erro do servidor (${response.status}): ${errorData.error || response.statusText}`);
            }
            
            const data = await response.json();
            
            // Verifica se a resposta contém um campo de erro explícito do backend
            if (data && data.error) {
                throw new Error(`Erro da IA: ${data.error}`);
            }
            // Verifica se a resposta contém o campo 'report' e se é uma string
            else if (data && typeof data.report === 'string') {
                campoResultado.value = data.report.trim();
            } else {
                // Caso a estrutura da resposta seja inesperada
                throw new Error(`Estrutura de resposta inesperada da API. Resposta: ${JSON.stringify(data)}`);
            }

        } catch (error) {
            console.error("Ocorreu um erro:", error);
            campoResultado.value = `Ocorreu um erro ao gerar o relatório. Detalhes: ${error.message}`;
            alert('Houve um erro. Verifique o console (F12) para mais detalhes.');
        } finally {
            // Restaura o botão ao estado normal
            botaoGerar.disabled = false;
            botaoGerarTexto.innerHTML = '<i class="fas fa-magic mr-2"></i> Gerar Relatório';
        }
    }

    botaoGerar.addEventListener('click', gerarRelatorio);

    // --- LÓGICA DO BOTÃO LIMPAR ---
    botaoLimpar.addEventListener('click', () => {
        campoConversa.value = '';
        campoResultado.value = '';
        campoConversa.focus();
    });

    // --- LÓGICA DO BOTÃO COPIAR COM EFEITO VISUAL ---
    botaoCopiar.addEventListener('click', () => {
        if (campoResultado.value.trim() === '') {
            alert('Não há nada para copiar ainda.');
            return;
        }
        navigator.clipboard.writeText(campoResultado.value)
            .then(() => {
                const originalText = botaoCopiar.innerHTML;
                botaoCopiar.innerHTML = '<i class="fas fa-check mr-1"></i> Copiado!';
                
                setTimeout(() => {
                    botaoCopiar.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Erro ao copiar o texto: ', err);
            });
    });
});
