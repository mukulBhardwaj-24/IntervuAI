import fetch from 'node-fetch';
import OpenAI from 'openai';
import rateLimit from 'express-rate-limit';

let openai = null;

function getOpenaiClient() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
  }
  return openai;
}

export const aiChatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again in 15 minutes.'
  }
});

function mockHint(problemId, code) {
  return `Hint for ${problemId || 'this problem'}: Try simplifying the problem, consider edge cases, and check input constraints. (mock)`;
}

export async function getHint(req, res, next) {
  try {
    const { problemId, code } = req.body || {};

    if (!process.env.OPENAI_KEY) {
      return res.json({ hint: mockHint(problemId, code), model: 'mock' });
    }

    const prompt = `You are a friendly coding assistant. Provide a concise hint (2-4 sentences) to help solve the problem ${problemId || ''} given the user's code:\n\n${code || ''}`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.2
      }),
      timeout: 15000
    });

    const body = await resp.json();

    const hint = body?.choices?.[0]?.message?.content || mockHint(problemId, code);

    return res.json({ hint, model: body?.model || process.env.OPENAI_MODEL || 'unknown' });
  } catch (error) {
    return next(error);
  }
}

export async function getReview(req, res, next) {
  try {
    const { problemId, code } = req.body || {};

    function mockReview() {
      return `Code review (mock):\n- Consider renaming ambiguous variables for readability.\n- Check edge cases for empty input and large inputs.\n- Add small helper functions to reduce nesting.`;
    }

    if (!process.env.OPENAI_KEY) {
      return res.json({ review: mockReview(), model: 'mock' });
    }

    const prompt = `You are a senior engineer. Provide a concise code review for problem ${problemId || ''}. Focus on readability, correctness, complexity, and edge-cases. Return short bullet points. Code:\n\n${code || ''}`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: 'You are a helpful senior engineer.' }, { role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.2
      }),
      timeout: 20000
    });

    const body = await resp.json();
    const review = body?.choices?.[0]?.message?.content || mockReview();

    return res.json({ review, model: body?.model || process.env.OPENAI_MODEL || 'unknown' });
  } catch (error) {
    return next(error);
  }
}

export async function postAiChat(req, res, next) {
  try {
    const { roomId, code, userMessage } = req.body || {};

    if (!roomId || typeof roomId !== 'string') {
      return res.status(400).json({ success: false, message: 'roomId is required' });
    }

    if (typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'code must be a string' });
    }

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ success: false, message: 'userMessage is required' });
    }

    const completion = await getOpenaiClient().chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        {
          role: 'system',
          content:
            'You are a supportive technical interviewer. Review the provided code, respond to the user\'s question, and keep the tone constructive, concise, and interview-focused.'
        },
        {
          role: 'user',
          content: `Room ID: ${roomId}\n\nCode:\n${code}\n\nUser message:\n${userMessage}`
        }
      ]
    });

    const aiResponse = completion?.choices?.[0]?.message?.content?.trim() || '';

    return res.json({ success: true, aiResponse });
  } catch (error) {
    return next(error);
  }
}
