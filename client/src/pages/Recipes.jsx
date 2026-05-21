// src/pages/Recipes.jsx
import { useState, useContext } from 'react';
import { generateRecipe } from '../services/recipesService';
import { saveRecipe } from '../services/savedRecipesService';
import { AuthContext } from '../context/AuthContext.jsx';
import { getDisplayName } from '../utils/authHelpers';

export default function Recipes() {
  const { user } = useContext(AuthContext);

  const [recipe, setRecipe] = useState(null);
  const [savedRecipe, setSavedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!user) return <p className="app-muted" style={{ padding: 24 }}>Loading user information...</p>;

  const userEmail = user.email || user["cognito:username"] || user.username;

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setSavedRecipe(null);
    try {
      const data = await generateRecipe();
      setRecipe(data);
    } catch (e) {
      setError(e.message || 'Failed to get recipe');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveRecipe() {
    if (!recipe || !userEmail) return;

    setSaving(true);
    setError('');

    try {
      const saved = await saveRecipe({
        userEmail,
        recipeId: recipe._id || recipe.id || null,
        name: recipe.title || recipe.name || 'Untitled Recipe',
        ingredients: recipe.ingredients || [],
        instructions: Array.isArray(recipe.steps)
          ? recipe.steps.join('\n')
          : recipe.instructions || '',
        nutrition: recipe.nutrition || {},
      });

      setSavedRecipe(saved);
    } catch (e) {
      setError(e.message || 'Failed to save recipe');
    } finally {
      setSaving(false);
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
            <div className="app-flex-between" style={{ gap: 12, alignItems: "flex-start" }}>
              <h2 style={{ margin: '0 0 14px', fontSize: 20, fontWeight: 800 }}>
                {recipe.title}
              </h2>

              <button
                onClick={handleSaveRecipe}
                disabled={saving || !!savedRecipe}
                className="app-btn"
                style={{ whiteSpace: "nowrap" }}
              >
                {savedRecipe ? 'Saved' : saving ? 'Saving…' : 'Favorite'}
              </button>
            </div>

            {/* Nutrition Section */}
            {recipe.nutrition && (
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, opacity: 0.82 }}>
                  Nutrition
                </h3>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 14 }}>
                  <div><strong>Calories:</strong> {recipe.nutrition.calories ?? '-'}</div>
                  <div><strong>Protein:</strong> {recipe.nutrition.protein ?? '-'}g</div>
                  <div><strong>Carbs:</strong> {recipe.nutrition.carbs ?? '-'}g</div>
                  <div><strong>Fat:</strong> {recipe.nutrition.fat ?? '-'}g</div>
                </div>
              </div>
            )}

            <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, opacity: 0.82 }}>
              Ingredients
            </h3>
            <ul style={{ margin: '0 0 16px', paddingLeft: 18 }}>
              {recipe.ingredients.map((ing) => (
                <li key={ing} style={{ marginBottom: 4, fontSize: 14 }}>
                  {ing}
                </li>
              ))}
            </ul>

            <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, opacity: 0.82 }}>
              Steps
            </h3>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {recipe.steps.map((step, i) => (
                <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}