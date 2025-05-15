// pages/admin.js
import { useEffect, useState } from 'react';

export default function AdminLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/viewer')
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>📖 Admin Log Viewer</h1>
      {loading ? (
        <p>Loading logs...</p>
      ) : logs.length === 0 ? (
        <p>No logs found.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>🗝️ Key</th>
              <th>📧 Email</th>
              <th>📄 Action</th>
              <th>🕒 Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i}>
                <td>{log.key}</td>
                <td>{log.email || '-'}</td>
                <td>{log.action || '-'}</td>
                <td>{new Date(Number(log.timestamp)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'sans-serif',
    padding: '40px',
    maxWidth: '960px',
    margin: '0 auto',
  },
  header: {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#003366',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fefefe',
    boxShadow: '0 0 8px rgba(0,0,0,0.05)',
  },
  th: {
    background: '#003366',
    color: 'white',
    padding: '10px',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid #ccc',
  },
};
