import { useState } from 'react';

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'system', text: 'AI: Try explaining your approach before coding.' },
    { id: 2, role: 'peer', text: 'Interviewer: Start with brute-force approach first.' }
  ]);
  const [draft, setDraft] = useState('');

  function sendMessage(event) {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    setMessages((prev) => [...prev, { id: Date.now(), role: 'you', text: draft.trim() }]);
    setDraft('');
  }

  return (
    <section className="card" style={{ padding: '0.8rem', height: '100%', display: 'grid', gridTemplateRows: '1fr auto', gap: '0.55rem' }}>
      <div style={{ overflowY: 'auto', maxHeight: '310px', display: 'grid', gap: '0.4rem' }}>
        {messages.map((item) => (
          <div
            key={item.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '0.5rem',
              background: item.role === 'you' ? 'rgba(20, 224, 160, 0.08)' : 'rgba(45, 193, 255, 0.08)'
            }}
          >
            <p className="mono" style={{ margin: 0, fontSize: '0.8rem' }}>
              {item.text}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.45rem' }}>
        <input
          className="input"
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask AI or send message"
          value={draft}
        />
        <button className="btn btn-primary" type="submit">
          Send
        </button>
      </form>
    </section>
  );
}
