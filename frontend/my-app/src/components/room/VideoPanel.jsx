export default function VideoPanel({
  localVideoRef,
  remoteVideoRef,
  peerState,
  isVideoStarted,
  isMicEnabled,
  isCamEnabled,
  onStartVideo,
  onToggleMic,
  onToggleCam
  ,onShareScreen, isScreenSharing
}) {
  return (
    <section className="card" style={{ padding: '0.7rem', display: 'grid', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <p className="mono muted" style={{ margin: 0, fontSize: '0.76rem' }}>Video Room</p>
        <span className="mono muted" style={{ fontSize: '0.72rem' }}>{peerState}</span>
      </div>

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <div
          style={{
            background: 'linear-gradient(145deg, #142139, #08101f)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            minHeight: '95px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <video
            autoPlay
            playsInline
            ref={remoteVideoRef}
            style={{ width: '100%', height: '95px', objectFit: 'cover', display: 'block' }}
          />
          <span className="muted" style={{ fontSize: '0.82rem', position: 'absolute', left: '0.55rem', bottom: '0.4rem' }}>
            Peer Feed
          </span>
        </div>
        <div
          style={{
            background: 'linear-gradient(145deg, #142139, #08101f)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            minHeight: '95px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <video
            autoPlay
            muted
            playsInline
            ref={localVideoRef}
            style={{ width: '100%', height: '95px', objectFit: 'cover', display: 'block' }}
          />
          <span className="muted" style={{ fontSize: '0.82rem', position: 'absolute', left: '0.55rem', bottom: '0.4rem' }}>
            Your Feed
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem' }}>
        <button className="btn" onClick={onStartVideo} style={{ padding: '0.42rem' }} type="button">
          {isVideoStarted ? 'Live' : 'Start'}
        </button>
        <button className="btn" onClick={onToggleMic} style={{ padding: '0.42rem' }} type="button">
          {isMicEnabled ? 'Mic On' : 'Mic Off'}
        </button>
        <button className="btn" onClick={onToggleCam} style={{ padding: '0.42rem' }} type="button">
          {isCamEnabled ? 'Cam On' : 'Cam Off'}
        </button>
        <button className="btn" onClick={onShareScreen} style={{ padding: '0.42rem' }} type="button">
          {isScreenSharing ? 'Stop Share' : 'Share Screen'}
        </button>
        <button className="btn" style={{ padding: '0.42rem' }} type="button">Record</button>
      </div>
    </section>
  );
}
