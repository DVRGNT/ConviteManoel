const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido.' });
  }

  // Desestruturar os novos campos
  const { nome, telefone, email, possuiFilhos, quantidadeFilhos } = req.body;

  if (!nome || !telefone || !email || !possuiFilhos) { // 'quantidadeFilhos' é opcional dependendo de 'possuiFilhos'
    return res.status(400).json({ success: false, message: 'Nome, telefone, e-mail e "Possui filhos?" são obrigatórios.' });
  }

  try {
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    // AJUSTE AQUI: O range agora precisa cobrir todas as colunas (Nome, Telefone, Email, Possui Filhos?, Quantidade Filhos, Data/Hora)
    // Se você tiver 6 colunas, será A:F
    const range = 'Página1!A:F'; // <--- VERIFIQUE E AJUSTE ESTE RANGE CONFORME SUAS COLUNAS NA PLANILHA

    // Adicionar os novos campos aos valores que serão inseridos na planilha
    // O valor de 'quantidadeFilhos' pode ser null/vazio se "Não" for selecionado
    const finalQuantidadeFilhos = (possuiFilhos === 'Sim') ? quantidadeFilhos : ''; // Envia vazio se não tiver filhos

    const values = [[
      nome,
      telefone,
      email,
      possuiFilhos,        // Novo campo
      finalQuantidadeFilhos, // Novo campo
      new Date().toLocaleString('pt-BR')
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values,
      },
    });

    res.status(200).json({ success: true, message: 'Dados salvos na planilha com sucesso!' });

  } catch (error) {
    console.error('Erro ao salvar na planilha:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor ao salvar os dados.' });
  }
};