// src/pages/Recipes.jsx
import { useState, useContext } from 'react';
import { getRecipes } from '../services/recipesService';
import { AuthContext } from '../context/AuthContext.jsx';
import { getDisplayName } from '../utils/authHelpers';

export default function Recipes() {
  const { user } = useContext(AuthContext);
  if (!user) return <p className="app-muted" style={{ padding: 24 }}>Loading user information...</p>;

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const data = await getRecipes();
      setRecipe(data);
    } catch (e) {
      setError(e.message || 'Failed to get recipe');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-page">
      <div className="app-shell">
        {/* Header */}
        <div className="app-card-hero" style={{ marginBottom: 16 }}>
          <div className="app-flex-between" style={{ flexWrap: "wrap" }}>
            <div>
              <h1 className="app-title">Recipes</h1>
              <p className="app-subtitle">Generate a recipe based on your ingredients.</p>
            </div>
            <span className="app-muted" style={{ fontSize: 13 }}>{getDisplayName(user)}</span>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="app-btn app-btn-primary"
          style={{ marginBottom: 16 }}
        >
          {loading ? 'Generating…' : 'Get Recipe'}
        </button>

        {error && (
          <div role="alert" className="app-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {recipe && (
          <div className="app-card">
            <h2 style={{ margin: '0 0 14px', fontSize: 20, fontWeight: 800 }}>{recipe.title}</h2>

            <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, opacity: 0.82 }}>Ingredients</h3>
            <ul style={{ margin: '0 0 16px', paddingLeft: 18 }}>
              {recipe.ingredients.map((ing) => (
                <li key={ing} style={{ marginBottom: 4, fontSize: 14 }}>{ing}</li>
              ))}
            </ul>

            <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, opacity: 0.82 }}>Steps</h3>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {recipe.steps.map((step, i) => (
                <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>{step}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
