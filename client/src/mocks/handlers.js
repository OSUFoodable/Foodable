// src/mocks/handlers.js
// Mock endpoints for ingredients + recipe to simulate backend behavior with MSW.

import { http, HttpResponse } from 'msw';

let store = []; // in-memory mock data for ingredients

// --- helpers for recipe selection ---
function norm(s) {
  return String(s || '').trim().toLowerCase();
}
function hasName(name) {
  const n = norm(name);
  return store.some((x) => norm(x.name) === n);
}
function anyOf(names) {
  return names.some((n) => hasName(n));
}

function pickRecipeFromStore() {
  // Simple deterministic rules for v0.0.2
  if (hasName('pasta') && hasName('tuna')) {
    return {
      title: 'Tuna Pasta',
      ingredients: ['pasta', 'tuna', 'olive oil', 'garlic', 'salt'],
      steps: [
        'Boil pasta until al dente.',
        'Warm tuna with olive oil and garlic.',
        'Toss together, season, and serve.',
      ],
    };
  }
  if (hasName('eggs') || hasName('egg')) {
    const vegs = ['spinach', 'onion', 'bell pepper', 'tomato', 'mushroom'];
    if (anyOf(vegs)) {
      return {
        title: 'Veggie Omelet',
        ingredients: ['eggs', 'mixed veggies', 'salt', 'pepper'],
        steps: [
          'Whisk eggs with salt and pepper.',
          'Sauté chopped veggies until tender.',
          'Pour eggs, cook, fold, and serve.',
        ],
      };
    }
  }
  if (hasName('rice') && hasName('chicken')) {
    return {
      title: 'Chicken Rice Bowl',
      ingredients: ['rice', 'chicken', 'soy sauce', 'scallions'],
      steps: [
        'Cook rice.',
        'Sear chicken pieces until done.',
        'Combine with soy sauce and scallions over rice.',
      ],
    };
  }
  // default
  return {
    title: 'Pantry Pasta',
    ingredients: ['pasta', 'olive oil', 'garlic', 'chili flakes', 'parsley'],
    steps: [
      'Boil pasta until al dente.',
      'Sauté garlic in olive oil.',
      'Toss pasta with oil, add chili flakes and parsley.',
    ],
  };
}

export const handlers = [
  // ---- Ingredients ----
  http.get(`${import.meta.env.VITE_API_URL}/ingredients`, async () => {
    return HttpResponse.json({ items: store });
  }),

  http.post(`${import.meta.env.VITE_API_URL}/ingredients`, async ({ request }) => {
    const body = await request.json();
    const item = {
      id: crypto.randomUUID(),
      name: String(body.name || '').trim(),
      qty: Number(body.qty || 0),
      unit: String(body.unit || 'count'),
      addedAt: new Date().toISOString(),
    };
    store.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  // ---- Recipe (based on current mock store) ----
  http.get(`${import.meta.env.VITE_API_URL}/recipe`, async () => {
    const recipe = pickRecipeFromStore();
    return HttpResponse.json(recipe);
  }),
];
