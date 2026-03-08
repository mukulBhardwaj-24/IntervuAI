import { useMemo, useState } from 'react';

const starterByLanguage = {
  javascript: 'function solve(input) {\n  // write logic\n  return input;\n}',
  python: 'def solve(input_data):\n    # write logic\n    return input_data',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main(){\n  return 0;\n}',
  java: 'class Main {\n  public static void main(String[] args) {\n    // write logic\n  }\n}'
};

export default function CodeEditorPanel() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(starterByLanguage.javascript);
  const [output, setOutput] = useState('Run output will appear here');

  const executionTime = useMemo(() => {
    // Use deterministic hashing to keep render pure and output stable.
    const base = `${language}:${code.length}:${output}`;
    let hash = 0;

    for (let index = 0; index < base.length; index += 1) {
      hash = (hash * 31 + base.charCodeAt(index)) % 100000;
    }

    const runtime = 0.01 + (hash % 70) / 1000;
    return `${runtime.toFixed(3)} s`;
  }, [code.length, language, output]);

  function switchLanguage(newLanguage) {
    setLanguage(newLanguage);
    setCode(starterByLanguage[newLanguage]);
    setOutput(`Switched to ${newLanguage}.`);
  }

  function handleRun() {
    setOutput('Accepted on sample tests (MVP mock execution).');
  }

  function handleSubmit() {
    setOutput('Submitted. 7/7 sample cases passed (MVP mock submission).');
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
          <button className="btn" onClick={handleRun} type="button">
            Run
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} type="button">
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

      <div className="card" style={{ marginTop: '0.7rem', padding: '0.65rem', borderRadius: '12px' }}>
        <p className="mono" style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)' }}>
          Runtime: {executionTime}
        </p>
        <p className="mono" style={{ margin: '0.38rem 0 0', fontSize: '0.85rem' }}>
          {output}
        </p>
      </div>
    </section>
  );
}
