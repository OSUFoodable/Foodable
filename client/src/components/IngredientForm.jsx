// src/components/IngredientForm.jsx

import { useState } from 'react';


export default function IngredientForm({ onAdd, pending }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('count');
  const [error, setError] = useState('');

  function validate() {
    if (!name.trim()) return 'Ingredient name is required';
    const n = Number(qty);
    if (Number.isNaN(n) || n < 0) return 'Quantity must be a nonnegative number';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError('');
    await onAdd({ name: name.trim(), qty: Number(qty), unit });
    setName('');
    setQty('');
    setUnit('count');
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
      <label className="app-label">
        Name
        <input
          aria-label="Ingredient name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., pasta"
          className="app-input"
        />
      </label>

      <label className="app-label">
        Quantity
        <input
          aria-label="Quantity"
          type="number"
          step="any"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="e.g., 2"
          className="app-input"
        />
      </label>

      <label className="app-label">
        Unit
        <select aria-label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="app-select">
          <option value="count">count</option>
          <option value="box">box</option>
          <option value="can">can</option>
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="ml">ml</option>
          <option value="l">l</option>
          <option value="cup">cup</option>
          <option value="tbsp">tbsp</option>
          <option value="tsp">tsp</option>
        </select>
      </label>

      {error && <div role="alert" style={{ color: '#ff8a8a', fontSize: 13 }}>{error}</div>}

      <button type="submit" disabled={pending} className="app-btn app-btn-primary">
        {pending ? 'Adding...' : 'Add ingredient'}
      </button>
    </form>
  );
}
