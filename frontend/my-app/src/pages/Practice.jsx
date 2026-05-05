import { useEffect, useMemo, useState } from 'react';
import CodeEditorPanel from '../components/editor/CodeEditorPanel';
import ProblemList from '../components/problems/ProblemList';
import { getProblems } from '../services/problemService';
import './Practice.css';

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

      // Keep the active problem only if it still exists in filtered results.
      setSelected((prev) => {
        if (!prev) {
          return null;
        }

        return data.problems.some((problem) => problem.id === prev.id) ? prev : null;
      });
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

  const isWorkspaceOpen = Boolean(selected);

  if (!isWorkspaceOpen) {
    return (
      <section className="fade-up" style={{ marginTop: '1rem' }}>
        <aside className="card" style={{ padding: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Problem Bank</h2>
            <p className="mono muted" style={{ margin: 0, fontSize: '0.8rem' }}>
              Select a problem to open Code Arena
            </p>
          </div>

          <input
            className="input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title/tag/difficulty"
            style={{ marginTop: '0.7rem' }}
            value={query}
          />

          <div style={{ marginTop: '0.7rem' }}>
            <ProblemList items={items} onSelect={setSelected} selectedId={selected?.id} />
          </div>
        </aside>
      </section>
    );
  }

  return (
    <section className="fade-up practice-workspace">
      <aside className="card practice-problem-pane" style={{ padding: '0.9rem' }}>
        <button className="btn" onClick={() => setSelected(null)} style={{ marginBottom: '0.7rem' }} type="button">
          {'<- Back to Problem Bank'}
        </button>

        <h3 style={{ marginTop: 0, marginBottom: '0.4rem' }}>{selected.title}</h3>
        <p className="mono muted" style={{ marginTop: 0 }}>{selectedMeta}</p>
        <p className="muted" style={{ lineHeight: 1.65 }}>{selected.statement}</p>

        <div style={{ display: 'grid', gap: '0.7rem' }}>
          <div className="card" style={{ padding: '0.6rem', borderRadius: '10px' }}>
            <p className="mono muted" style={{ margin: 0 }}>Sample Input</p>
            <p className="mono" style={{ margin: '0.35rem 0 0' }}>{selected.sampleInput}</p>
          </div>
          <div className="card" style={{ padding: '0.6rem', borderRadius: '10px' }}>
            <p className="mono muted" style={{ margin: 0 }}>Sample Output</p>
            <p className="mono" style={{ margin: '0.35rem 0 0' }}>{selected.sampleOutput}</p>
          </div>
        </div>
      </aside>

      <div style={{ minWidth: 0 }}>
        <CodeEditorPanel problemId={selected.id} />
      </div>
    </section>
  );
}
