// src/pages/Recipes.jsx
// Updated page: fetches and displays a recipe based on current ingredients.

import { useState } from 'react';
import { getRecipes } from '../services/recipesService';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Recipes() {
  const { user } = useContext(AuthContext);
  if (!user) return <p>Loading user information...</p>;

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
    <div style={{ padding: '1.5rem', display: 'grid', gap: 16 }}>
      <h2>Welcome, {user["cognito:username"]}!</h2>
      <h1>Recipes</h1>
      <p>Generate a recipe based on your ingredients.</p>

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Get Recipe'}
      </button>

      {error && <div role="alert" style={{ color: 'crimson' }}>{error}</div>}

      {recipe && (
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: 8, maxWidth: 600 }}>
          <h2>{recipe.title}</h2>
          <h3>Ingredients:</h3>
          <ul>
            {recipe.ingredients.map((ing) => (
              <li key={ing}>{ing}</li>
            ))}
          </ul>
          <h3>Steps:</h3>
          <ol>
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
