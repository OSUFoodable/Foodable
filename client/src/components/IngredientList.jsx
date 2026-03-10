// src/components/IngredientList.jsx

export default function IngredientList({ items, loading }) {
  if (loading) return <p className="app-muted">Loading ingredients...</p>;
  if (!items?.length) return <p className="app-muted">No ingredients yet. Try adding a few.</p>;

  return (
    <div className="app-table-wrap">
      <table className="app-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Added</th>
          </tr>
        </thead>
        <tbody>
          {items.map((ing) => (
            <tr key={ing.id || `${ing.name}-${ing.addedAt}`}>
              <td>{ing.name}</td>
              <td>{ing.qty}</td>
              <td>{ing.unit}</td>
              <td>{ing.addedAt ? new Date(ing.addedAt).toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
