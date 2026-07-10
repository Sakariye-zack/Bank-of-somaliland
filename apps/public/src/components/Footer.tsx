export function Footer() {
  return (
    <footer className="site">
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <img
          src="/logo.jpg"
          alt="Bank of Somaliland emblem"
          style={{ width: 44, height: 44, objectFit: 'contain', background: '#fff', borderRadius: '50%', flexShrink: 0 }}
        />
        <div>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} Bank of Somaliland. All rights reserved.</p>
          <p style={{ marginTop: 8, opacity: 0.8 }}>
            Official exchange rates and licensed institution data are published by the Bank of Somaliland only.
          </p>
        </div>
      </div>
    </footer>
  );
}
