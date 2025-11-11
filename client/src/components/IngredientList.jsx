// src/components/IngredientList.jsx

export default function IngredientList({ items, loading }) {
  if (loading) return <p>Loading ingredients...</p>;
  if (!items?.length) return <p>No ingredients yet. Try adding a few.</p>;

  return (
    <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', minWidth: 360 }}>
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
  );
}
