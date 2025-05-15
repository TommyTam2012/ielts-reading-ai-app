<thead>
  <tr>
    <th>Email</th>
    <th>Timestamp (UTC)</th>
    <th>🗑️ Delete</th>
  </tr>
</thead>
<tbody>
  {logs.map((log, i) => (
    <tr key={i}>
      <td>{log.email}</td>
      <td>{new Date(log.timestamp).toLocaleString('en-HK', {
        timeZone: 'Asia/Hong_Kong',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}</td>
      <td>
        <button className="delete-btn" onClick={() => handleDelete(log.key)}>
          Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>
