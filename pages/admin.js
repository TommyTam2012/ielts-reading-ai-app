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

  function handleDelete(key) {
    if (!confirm(`Delete log: ${key}?`)) return;

    fetch('/api/delete-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    })
      .then((res) => res.json())
      .then(() => {
        setLogs((prev) => prev.filter((log) => log.key !== key));
      });
  }

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
    <th style={styles.th}>🗝️ Key</th>
    <th style={styles.th}>📧 Email</th>
    <th style={styles.th}>📄 Action</th>
    <th style={styles.th}>🕒 Time (HKT)</th>
    <th style={styles.th}>🗑️ Delete</th>
  </tr>
</thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i}>
                <td>{log.key}</td>
                <td>{log.email || '-'}</td>
                <td>{log.action || '-'}</td>
                <td>
                  {new Date(Number(log.timestamp)).toLocaleString('en-HK', {
                    timeZone: 'Asia/Hong_Kong',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </td>
                <td>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDelete(log.key)}
                  >
                    Delete
                  </button>
                </td>
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
  deleteBtn: {
    padding: '4px 10px',
    color: 'white',
    background: '#cc0000',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};
