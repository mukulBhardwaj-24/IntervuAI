export default function ProblemList({ items, selectedId, onSelect }) {
  return (
    <div style={{ display: 'grid', gap: '0.55rem' }}>
      {items.map((problem) => {
        const selected = selectedId === problem.id;

        return (
          <button
            className="btn"
            key={problem.id}
            onClick={() => onSelect(problem)}
            style={{
              textAlign: 'left',
              borderColor: selected ? 'var(--accent)' : 'var(--border)',
              background: selected ? 'rgba(45, 193, 255, 0.08)' : undefined
            }}
            type="button"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem' }}>
              <strong>{problem.title}</strong>
              <span className="mono muted" style={{ fontSize: '0.75rem' }}>
                {problem.difficulty}
              </span>
            </div>
            <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.85rem' }}>
              {problem.tags.join(' | ')}
            </p>
          </button>
        );
      })}
    </div>
  );
}
