# api/generate.py
from http.server import BaseHTTPRequestHandler
import json
import os
import requests

# Sua chave de API do OpenRouter será injetada pela Vercel através das variáveis de ambiente
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

# A Vercel preenche a variável VERCEL_URL em tempo de execução para o domínio do seu deploy
YOUR_SITE_URL = os.environ.get("VERCEL_URL", "http://localhost:3000") 
YOUR_SITE_NAME = "Gerador de Relatórios AI"

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Configura o CORS para permitir requisições do seu frontend
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        # Em produção, substitua '*' pelo domínio exato do seu frontend Vercel:
        # por exemplo: 'https://seu-nome-do-projeto.vercel.app'
        self.send_header('Access-Control-Allow-Origin', '*') 
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

        if self.command == 'OPTIONS':
            # Responde a preflight requests do CORS
            return

        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            conversa = data.get('conversa', '')

            if not conversa:
                self.wfile.write(json.dumps({"error": "Nenhuma conversa fornecida."}).encode('utf-8'))
                return

            if not OPENROUTER_API_KEY:
                self.wfile.write(json.dumps({"error": "Chave da API do OpenRouter não configurada."}).encode('utf-8'))
                return

            # Chamada para a API do OpenRouter
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": YOUR_SITE_URL,
                    "X-Title": YOUR_SITE_NAME,
                },
                json={ # Usar 'json' para requests.post é mais prático que 'data=json.dumps'
                    "model": "openrouter/cypher-alpha:free",
                    "messages": [
                        {"role": "system", "content": "Você é um assistente útil que gera relatórios profissionais a partir de transcrições de conversas. O relatório deve ser conciso, objetivo e destacar os pontos principais do atendimento."},
                        {"role": "user", "content": f"Por favor, gere um relatório de atendimento profissional com base na seguinte conversa:\n\n{conversa}"}
                    ],
                    "temperature": 0.7, # Controla a criatividade da IA
                    "max_tokens": 500   # Limita o tamanho da resposta
                }
            )

            response.raise_for_status() # Lança exceção para status de erro (4xx ou 5xx)

            openrouter_response = response.json()
            
            if "choices" in openrouter_response and openrouter_response["choices"]:
                generated_text = openrouter_response["choices"][0]["message"]["content"]
                self.wfile.write(json.dumps({"report": generated_text}).encode('utf-8'))
            else:
                self.wfile.write(json.dumps({"error": "Resposta inesperada da API do OpenRouter.", "details": openrouter_response}).encode('utf-8'))

        except requests.exceptions.RequestException as e:
            self.wfile.write(json.dumps({"error": f"Erro de conexão com o serviço de IA: {e}"}).encode('utf-8'))
        except json.JSONDecodeError:
            self.wfile.write(json.dumps({"error": "Requisição inválida: JSON malformado."}).encode('utf-8'))
        except Exception as e:
            self.wfile.write(json.dumps({"error": f"Ocorreu um erro interno: {e}"}).encode('utf-8'))
