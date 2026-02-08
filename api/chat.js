const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const containsHtml = (text) => /<[^>]*>/.test(text);
const containsUrl = (text) => /(https?:\/\/|www\.)/i.test(text);

const parseBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY nao configurada.' });
  }

  const { messages } = parseBody(req) || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Mensagens ausentes.' });
  }

  const sanitized = messages
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      text: normalize(msg.content)
    }))
    .filter((msg) => msg.text.length > 0);

  if (sanitized.length === 0) {
    return res.status(400).json({ error: 'Mensagens vazias.' });
  }

  const tooLong = sanitized.some((msg) => msg.text.length > 800);
  if (tooLong) {
    return res.status(400).json({ error: 'Mensagem muito longa.' });
  }

  const hasHtml = sanitized.some((msg) => containsHtml(msg.text));
  if (hasHtml) {
    return res.status(400).json({ error: 'Nao envie HTML.' });
  }

  const hasUrl = sanitized.some((msg) => containsUrl(msg.text));
  if (hasUrl) {
    return res.status(400).json({ error: 'Nao envie links.' });
  }

  const contents = sanitized.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  const systemInstruction = {
    parts: [
      {
        text:
          'Voce e um consultor digital objetivo. Responda em portugues, com no maximo 3 frases curtas, sem markdown. Se faltar contexto, faca 1 pergunta direta.'
      }
    ]
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY
        },
        body: JSON.stringify({
          contents,
          systemInstruction,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 220
          }
        })
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Falha ao consultar a IA.'
      });
    }

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta.';

    return res.json({ text });
  } catch {
    return res.status(500).json({ error: 'Erro interno ao consultar a IA.' });
  }
};
