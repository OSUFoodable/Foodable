// src/pages/Ingredients.jsx

import { useEffect, useState } from 'react';
import IngredientForm from '../components/IngredientForm';
import IngredientList from '../components/IngredientList';
import { listIngredients, addIngredient } from '../services/ingredientsService';

export default function IngredientsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const data = await listIngredients();
      setItems(data.items || []);
    } catch (e) {
      setError(e.message || 'Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(payload) {
    setAdding(true);
    setError('');
    try {
      await addIngredient(payload);
      await refresh();
    } catch (e) {
      setError(e.message || 'Failed to add ingredient');
    } finally {
      setAdding(false);
    }
  }

  async function handleSeed() {
    const demo = [
      { name: 'pasta', qty: 1, unit: 'box' },
      { name: 'tuna', qty: 1, unit: 'can' },
      { name: 'egg', qty: 6, unit: 'count' },
    ];
    for (const ing of demo) {
      await handleAdd(ing);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div style={{ display: 'grid', gap: 16, padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Ingredients</h1>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Backed by {import.meta.env.VITE_API_URL || 'API_URL not set'}
        </div>
      </header>

      {error && <div role="alert" style={{ color: 'crimson' }}>{error}</div>}

      <IngredientForm onAdd={handleAdd} pending={adding} />

      <div>
        <button onClick={handleSeed} disabled={adding}>Add demo ingredients</button>
        <button onClick={refresh} style={{ marginLeft: 8 }}>Refresh</button>
      </div>

      <IngredientList items={items} loading={loading} />
    </div>
  );
}
