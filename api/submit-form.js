const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

// ---- INÍCIO DO CÓDIGO DE DEBUG ----
console.log('✅ Arquivo /api/submit-form.js foi carregado.');

// Print para verificar se as variáveis de ambiente foram carregadas
// ATENÇÃO: A chave privada é muito longa, então vamos imprimir apenas o início e o fim.
console.log('--- Verificando Variáveis de Ambiente ---');
console.log('GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? 'Carregado ✅' : 'NÃO ENCONTRADO ❌');
console.log('GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID ? 'Carregado ✅' : 'NÃO ENCONTRADO ❌');
if (process.env.GOOGLE_PRIVATE_KEY) {
    console.log('GOOGLE_PRIVATE_KEY: Carregada ✅ (Inicia com:', process.env.GOOGLE_PRIVATE_KEY.substring(0, 30), '...)');
} else {
    console.log('GOOGLE_PRIVATE_KEY: NÃO ENCONTRADA ❌');
}
console.log('-------------------------------------\n');
// ---- FIM DO CÓDIGO DE DEBUG ----


module.exports = async (req, res) => {
  // ---- INÍCIO DO CÓDIGO DE DEBUG ----
  console.log(`\n\n--- NOVA REQUISIÇÃO RECEBIDA: ${new Date().toLocaleTimeString()} ---`);
  console.log('Método HTTP:', req.method);
  // ---- FIM DO CÓDIGO DE DEBUG ----

  if (req.method !== 'POST') {
    console.log('❌ Erro: Método não é POST. Retornando 405.');
    return res.status(405).json({ success: false, message: 'Método não permitido.' });
  }

  // ---- INÍCIO DO CÓDIGO DE DEBUG ----
  console.log('➡️ Corpo da Requisição (req.body):', JSON.stringify(req.body, null, 2));
  // ---- FIM DO CÓDIGO DE DEBUG ----

  const { nome, telefone, email, possuiFilhos, quantidadeFilhos } = req.body;

  if (!nome || !telefone || !email || !possuiFilhos) {
    console.log('❌ Erro: Campos obrigatórios faltando.');
    return res.status(400).json({ success: false, message: 'Nome, telefone, e-mail e "Possui filhos?" são obrigatórios.' });
  }

  try {
    console.log('➡️  1. Iniciando autenticação com o Google...');
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    console.log('✅ 1. Autenticação configurada.');

    console.log('➡️  2. Conectando com a API do Google Sheets...');
    const sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ 2. Conexão com a API estabelecida.');

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = 'Página1!A:F';

    const finalQuantidadeFilhos = (possuiFilhos === 'Sim') ? quantidadeFilhos : '';

    const values = [[
      nome,
      telefone,
      email,
      possuiFilhos,
      finalQuantidadeFilhos,
      new Date().toLocaleString('pt-BR')
    ]];

    console.log('➡️  3. Preparando para enviar os seguintes dados para a planilha:', values);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values,
      },
    });
    console.log('✅ 3. Dados enviados para a planilha com sucesso!');

    console.log('➡️  4. Enviando resposta de sucesso (200) para o navegador.');
    res.status(200).json({ success: true, message: 'Dados salvos na planilha com sucesso!' });

  } catch (error) {
    // ---- INÍCIO DO CÓDIGO DE DEBUG ----
    console.error('\n\n🚨🚨🚨 ERRO CRÍTICO NO BLOCO CATCH 🚨🚨🚨');
    console.error('Ocorreu um erro ao tentar se comunicar com a API do Google.');
    console.error('Mensagem do Erro:', error.message);
    console.error('--- Detalhes completos do Erro ---');
    console.error(error);
    console.error('🚨🚨🚨 FIM DO ERRO 🚨🚨🚨\n');
    // ---- FIM DO CÓDIGO DE DEBUG ----

    res.status(500).json({ success: false, message: 'Erro interno do servidor ao salvar os dados.' });
  }
};