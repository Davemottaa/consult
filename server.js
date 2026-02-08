import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const normalize = (value) =>
  String(value || '').replace(/\s+/g, ' ').trim();

const containsHtml = (text) => /<[^>]*>/.test(text);
const containsUrl = (text) => /(https?:\/\/|www\.)/i.test(text);

app.post('/api/chat', chatLimiter, async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY nao configurada.' });
  }

  const { messages } = req.body || {};
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

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Falha ao consultar a IA.'
      });
    }

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta.';

    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao consultar a IA.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
