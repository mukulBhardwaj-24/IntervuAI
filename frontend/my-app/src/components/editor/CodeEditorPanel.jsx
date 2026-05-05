import { useMemo, useState } from 'react';
import { runCode } from '../../services/runService.js';
import { requestHint, requestReview } from '../../services/aiService';

const starterByLanguage = {
  javascript: 'function solve(input) {\n  // write logic\n  return input;\n}',
  python: 'def solve(input_data):\n    # write logic\n    return input_data',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main(){\n  return 0;\n}',
  java: 'class Main {\n  public static void main(String[] args) {\n    // write logic\n  }\n}'
};

export default function CodeEditorPanel({ problemId = null } = {}) {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(starterByLanguage.javascript);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hint, setHint] = useState(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [review, setReview] = useState(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);

  const executionTime = useMemo(() => {
    if (!result?.result?.time) {
      return '—';
    }
    return `${result.result.time} s`;
  }, [result]);

  function switchLanguage(newLanguage) {
    setLanguage(newLanguage);
    setCode(starterByLanguage[newLanguage]);
    setError(null);
    setResult(null);
  }

  async function handleRun() {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await runCode(language, code, '', problemId);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to run code');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleHint() {
    setIsHintLoading(true);
    setHint(null);
    setError(null);

    try {
      const res = await requestHint(problemId, code);
      setHint(res.hint || res?.hint?.trim());
    } catch (err) {
      setError(err.message || 'Could not fetch hint');
    } finally {
      setIsHintLoading(false);
    }
  }

  async function handleReview() {
    setIsReviewLoading(true);
    setReview(null);
    setError(null);

    try {
      const res = await requestReview(problemId, code);
      setReview(res.review || res?.review?.trim());
    } catch (err) {
      setError(err.message || 'Could not fetch review');
    } finally {
      setIsReviewLoading(false);
    }
  }

  function handleSubmit() {
    setError('Submit feature coming soon');
  }

  return (
    <section className="card" style={{ padding: '0.9rem', height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {Object.keys(starterByLanguage).map((lang) => (
            <button
              className="btn"
              key={lang}
              onClick={() => switchLanguage(lang)}
              style={{ borderColor: language === lang ? 'var(--accent)' : undefined }}
              type="button"
            >
              {lang}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.45rem' }}>
          <button 
            className="btn" 
            onClick={handleRun} 
            disabled={isLoading}
            type="button"
            style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            {isLoading ? '⏳ Running...' : '▶ Run'}
          </button>
          <button 
            className="btn" 
            onClick={handleHint} 
            disabled={isHintLoading}
            type="button"
            style={{ opacity: isHintLoading ? 0.6 : 1, cursor: isHintLoading ? 'not-allowed' : 'pointer' }}
          >
            {isHintLoading ? '💡 Thinking...' : '💡 Hint'}
          </button>
          <button 
            className="btn" 
            onClick={handleReview} 
            disabled={isReviewLoading}
            type="button"
            style={{ opacity: isReviewLoading ? 0.6 : 1, cursor: isReviewLoading ? 'not-allowed' : 'pointer' }}
          >
            {isReviewLoading ? '📝 Reviewing...' : '📝 Review'}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit} 
            disabled={isLoading}
            type="button"
            style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            Submit
          </button>
        </div>
      </div>

      <textarea
        className="mono"
        onChange={(event) => setCode(event.target.value)}
        style={{
          marginTop: '0.65rem',
          width: '100%',
          background: '#060d19',
          color: '#b9ddff',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '0.8rem',
          minHeight: '290px',
          resize: 'vertical'
        }}
        value={code}
      />

      <div className="card" style={{ marginTop: '0.7rem', padding: '0.65rem', borderRadius: '12px', display: 'grid', gridTemplateRows: 'auto 1fr', gap: '0.5rem', maxHeight: '120px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="mono" style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            Runtime: {executionTime}
          </p>
          {result?.result?.status && (
            <span className="mono" style={{ 
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: result.result.status.id === 3 ? '#4ade80' : result.result.status.id === 4 ? '#ef4444' : '#fbbf24',
              textTransform: 'uppercase'
            }}>
              {result.result.status.description}
            </span>
          )}
        </div>

        <div style={{ overflow: 'auto', minHeight: '2.5rem' }}>
          {hint && (
            <div style={{ marginBottom: '0.45rem' }}>
              <p className="mono" style={{ margin: 0, fontSize: '0.85rem', color: '#f8e9a1' }}>Hint</p>
              <p className="mono" style={{ margin: '0.2rem 0 0', whiteSpace: 'pre-wrap' }}>{hint}</p>
            </div>
          )}
          {review && (
            <div style={{ marginBottom: '0.45rem' }}>
              <p className="mono" style={{ margin: 0, fontSize: '0.85rem', color: '#c7f9d8' }}>Code Review</p>
              <p className="mono" style={{ margin: '0.2rem 0 0', whiteSpace: 'pre-wrap' }}>{review}</p>
            </div>
          )}
          {error && (
            <p className="mono" style={{ margin: 0, fontSize: '0.82rem', color: '#ef4444', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              ❌ {error}
            </p>
          )}
          {result?.result?.stdout && (
            <p className="mono" style={{ margin: 0, fontSize: '0.82rem', color: '#b9ddff', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {result.result.stdout}
            </p>
          )}
          {result?.result?.stderr && (
            <p className="mono" style={{ margin: 0, fontSize: '0.82rem', color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {result.result.stderr}
            </p>
          )}
          {!error && !result && (
            <p className="mono muted" style={{ margin: 0, fontSize: '0.82rem' }}>
              Run output will appear here
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
