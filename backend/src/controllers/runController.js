import Submission from '../models/Submission.js';
import fetch from 'node-fetch';

function makeMockResult(source) {
  return {
    stdout: `Mock output for code length ${source.length}`,
    stderr: null,
    status: { id: 3, description: 'Accepted (mock)' },
    time: '0.01'
  };
}

export async function runCode(req, res, next) {
  try {
    const { language, source, stdin, problemId } = req.body || {};

    if (!language || !source) {
      return res.status(400).json({ error: 'language and source are required' });
    }

    let judgeResult = null;

    const judgeUrl = process.env.JUDGE0_URL;

    if (judgeUrl) {
      const endpoint = judgeUrl.replace(/\/$/, '') + '/submissions?base64_encoded=false&wait=true';
      const payload = {
        source_code: source,
        stdin: stdin || '',
        // allow caller to pass language_id if needed, otherwise send language as-is
        language: language
      };

      const headers = { 'Content-Type': 'application/json' };
      if (process.env.JUDGE0_AUTH_TOKEN) {
        headers.Authorization = `Bearer ${process.env.JUDGE0_AUTH_TOKEN}`;
      } else if (process.env.JUDGE0_KEY) {
        headers['X-Auth-Token'] = process.env.JUDGE0_KEY;
      }
      if (process.env.JUDGE0_RAPIDAPI_KEY) {
        headers['X-RapidAPI-Key'] = process.env.JUDGE0_RAPIDAPI_KEY;
      }
      if (process.env.JUDGE0_RAPIDAPI_HOST) {
        headers['X-RapidAPI-Host'] = process.env.JUDGE0_RAPIDAPI_HOST;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      judgeResult = await resp.json();
    } else {
      judgeResult = makeMockResult(source);
    }

    const submission = new Submission({
      userId: req.user?.id || req.body.userId || null,
      language,
      source,
      stdin,
      problemId,
      result: judgeResult
    });

    await submission.save();

    return res.json({ submissionId: submission._id, result: judgeResult });
  } catch (error) {
    return next(error);
  }
}
