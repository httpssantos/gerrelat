// =======================================================
// LÓGICA PRINCIPAL DO GERADOR DE RELATÓRIO
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    // ... (restante do seu código DOMContentLoaded) ...

    async function gerarRelatorio() {
        const conversa = campoConversa.value;

        if (conversa.trim() === '') {
            alert('Por favor, cole a conversa na primeira caixa de texto.');
            return;
        }
        
        botaoGerar.disabled = true;
        botaoGerarTexto.innerHTML = '<i class="fas fa-circle-notch icon-spin mr-2"></i> Gerando...';
        campoResultado.value = 'Aguarde um instante, a Inteligência Artificial está trabalhando...';

        try {
            const url = '/api/generate'; 
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversa: conversa })
            });

            // --- LEIA O CORPO DA RESPOSTA APENAS UMA VEZ AQUI ---
            let responseBody;
            try {
                // Tenta parsear como JSON. Isso funciona tanto para sucesso quanto para erros que retornam JSON.
                responseBody = await response.json(); 
            } catch (e) {
                // Se falhar (ex: resposta não é JSON, ou corpo vazio), tenta ler como texto puro para depuração.
                responseBody = { error: await response.text() || 'Resposta vazia ou não JSON.' };
            }
            // --- FIM DA LEITURA ÚNICA ---

            // Agora, verifique o status HTTP da resposta
            if (!response.ok) {
                // Se o status HTTP indica erro (ex: 400, 500)
                // Usamos responseBody.error se ele existir, ou uma mensagem genérica
                throw new Error(`Erro do servidor (${response.status}): ${responseBody.error || response.statusText || 'Resposta inesperada do servidor.'}`);
            }
            
            // Se chegamos aqui, a resposta HTTP foi OK (status 2xx).
            // 'responseBody' agora contém os dados de sucesso.
            const data = responseBody; // 'data' já está populado com o JSON da única leitura.

            // Verifica se a resposta contém um campo 'error' vindo do backend (mesmo com status 200 OK)
            if (data && data.error) {
                throw new Error(`Erro da IA: ${data.error}`);
            }
            // Verifica se a resposta contém o campo 'report' e se é uma string (resposta de sucesso esperada)
            else if (data && typeof data.report === 'string') {
                campoResultado.value = data.report.trim();
            } else {
                // Caso a estrutura da resposta de sucesso seja inesperada
                throw new Error(`Estrutura de resposta inesperada da API. Resposta: ${JSON.stringify(data)}`);
            }

        } catch (error) {
            console.error("Ocorreu um erro:", error);
            campoResultado.value = `Ocorreu um erro ao gerar o relatório. Detalhes: ${error.message}`;
            alert('Houve um erro. Verifique o console (F12) para mais detalhes.');
        } finally {
            botaoGerar.disabled = false;
            botaoGerarTexto.innerHTML = '<i class="fas fa-magic mr-2"></i> Gerar Relatório';
        }
    }

    // ... (restante do seu código DOMContentLoaded) ...
});
