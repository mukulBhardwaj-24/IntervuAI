import { useEffect, useMemo, useState } from 'react';
import CodeEditorPanel from '../components/editor/CodeEditorPanel';
import ProblemList from '../components/problems/ProblemList';
import { getProblems } from '../services/problemService';

export default function Practice() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProblems() {
      const data = await getProblems(query);

      if (!mounted) {
        return;
      }

      setItems(data.problems);
      setSelected((prev) => prev || data.problems[0] || null);
    }

    fetchProblems();

    return () => {
      mounted = false;
    };
  }, [query]);

  const selectedMeta = useMemo(() => {
    if (!selected) {
      return null;
    }

    return `${selected.difficulty} | ${selected.tags.join(', ')}`;
  }, [selected]);

  return (
    <section
      className="fade-up"
      style={{
        marginTop: '1rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '1rem'
      }}
    >
      <aside className="card" style={{ padding: '0.9rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Problem Bank</h2>
        <input
          className="input"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title/tag/difficulty"
          value={query}
        />
        <div style={{ marginTop: '0.7rem' }}>
          <ProblemList items={items} onSelect={setSelected} selectedId={selected?.id} />
        </div>
      </aside>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <section className="card" style={{ padding: '0.9rem' }}>
          <h3 style={{ marginTop: 0 }}>{selected?.title || 'Pick a problem'}</h3>
          <p className="mono muted" style={{ marginTop: 0 }}>{selectedMeta || ''}</p>
          <p className="muted" style={{ lineHeight: 1.65 }}>{selected?.statement || 'No problem selected yet.'}</p>
          {selected && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.7rem' }}>
              <div className="card" style={{ padding: '0.6rem', borderRadius: '10px' }}>
                <p className="mono muted" style={{ margin: 0 }}>Sample Input</p>
                <p className="mono" style={{ margin: '0.35rem 0 0' }}>{selected.sampleInput}</p>
              </div>
              <div className="card" style={{ padding: '0.6rem', borderRadius: '10px' }}>
                <p className="mono muted" style={{ margin: 0 }}>Sample Output</p>
                <p className="mono" style={{ margin: '0.35rem 0 0' }}>{selected.sampleOutput}</p>
              </div>
            </div>
          )}
        </section>

        <CodeEditorPanel />
      </div>
    </section>
  );
}
