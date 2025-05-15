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
    <div className="admin-container">
      <h1 className="admin-header">📖 Admin Log Viewer</h1>
      {loading ? (
        <p>Loading logs...</p>
      ) : logs.length === 0 ? (
        <p>No logs found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>🗝️ Key</th>
              <th>📧 Email</th>
              <th>📄 Action</th>
              <th>🕒 Time (HKT)</th>
              <th>🗑️ Delete</th>
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
                  <button className="delete-btn" onClick={() => handleDelete(log.key)}>
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
