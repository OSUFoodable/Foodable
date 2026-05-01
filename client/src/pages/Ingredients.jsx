// src/pages/Ingredients.jsx

import { useEffect, useMemo, useRef, useState, useContext } from "react";
import {
  listIngredients,
  addIngredient,
  updateIngredient,
  deleteIngredient,
} from "../services/ingredientsService";
import { AuthContext } from "../context/AuthContext";

/* -----------------------
   Utilities
------------------------ */
function normalizeString(v) {
  return (v ?? "").toString().trim();
}
function safeLower(v) {
  return normalizeString(v).toLowerCase();
}
function getRowId(item) {
  return item?._id || item?.id || null;
}
function stableKeyForIngredient(item) {
  const id = getRowId(item);
  if (id) return `id:${id}`;
  return `name:${safeLower(item?.name)}`;
}
function parseQty(v) {
  const s = normalizeString(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : s;
}
function clampList(list, max) {
  return list.slice(0, Math.max(0, max));
}
function uniqByLower(list) {
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const v = normalizeString(raw);
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}
function stop(e) {
  e.preventDefault();
  e.stopPropagation();
}

/* -----------------------
   Local storage keys
------------------------ */
const LS = {
  packs: "foodable_ing_packs_v1",
  staples: "foodable_ing_staples_v1",
  staplesState: "foodable_ing_staples_state_v1", // { [nameLower]: true|false }
  favorites: "foodable_ing_favorites_v1", // array of stable keys
  recent: "foodable_ing_recent_v1", // array of names
};

/* -----------------------
   Defaults
------------------------ */
const DEFAULT_PACKS = [
  {
    id: "default_breakfast",
    name: "Breakfast Basics",
    items: ["eggs", "oats", "milk", "banana", "yogurt", "peanut butter"],
    isDefault: true,
  },
  {
    id: "default_italian",
    name: "Italian Pantry",
    items: ["pasta", "olive oil", "garlic", "onion", "parmesan", "tomato sauce"],
    isDefault: true,
  },
  {
    id: "default_mealprep",
    name: "Meal Prep Protein",
    items: ["chicken breast", "rice", "broccoli", "beans", "greek yogurt"],
    isDefault: true,
  },
];

const DEFAULT_STAPLES = [
  "salt",
  "black pepper",
  "olive oil",
  "garlic",
  "onion",
  "rice",
  "pasta",
  "canned tomatoes",
];

/* -----------------------
   Storage helpers
------------------------ */
function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function makeId() {
  return `u_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

/* -----------------------
   Main Component
------------------------ */
export default function IngredientsPage() {
  const { user } = useContext(AuthContext);

  if (!user) return <p>Loading user information...</p>;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Add bar
  const [addName, setAddName] = useState("");
  const [addDetailsOpen, setAddDetailsOpen] = useState(false);
  const [addQty, setAddQty] = useState("");
  const [addUnit, setAddUnit] = useState("");

  // Controls
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [unitFilter, setUnitFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");

  // Selection
  const [selected, setSelected] = useState(() => new Set());

  // Menus
  const [moreOpen, setMoreOpen] = useState(false);

  // Modals: edit ingredient
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editUnit, setEditUnit] = useState("");

  // Modals: delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);

  // Sidebar state: packs, staples, favorites, recent
  const [packs, setPacks] = useState(() => {
    const stored = readJson(LS.packs, null);
    if (stored && Array.isArray(stored)) return stored;
    return DEFAULT_PACKS;
  });

  const [staples, setStaples] = useState(() => {
    const stored = readJson(LS.staples, null);
    if (stored && Array.isArray(stored)) return stored;
    return DEFAULT_STAPLES;
  });

  const [staplesState, setStaplesState] = useState(() => {
    const stored = readJson(LS.staplesState, null);
    if (stored && typeof stored === "object") return stored;
    return {};
  });

  const [favorites, setFavorites] = useState(() => {
    const stored = readJson(LS.favorites, null);
    if (stored && Array.isArray(stored)) return stored;
    return [];
  });

  const [recent, setRecent] = useState(() => {
    const stored = readJson(LS.recent, null);
    if (stored && Array.isArray(stored)) return stored;
    return [];
  });

  // Sidebar UI toggles
  const [shortcutsOpen, setShortcutsOpen] = useState(true);
  const [packsOpen, setPacksOpen] = useState(true);
  const [staplesOpen, setStaplesOpen] = useState(true);

  // Pack modal (create or edit)
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [packEditingId, setPackEditingId] = useState(null);
  const [packName, setPackName] = useState("");
  const [packItemsText, setPackItemsText] = useState("");

  // Staples modal
  const [staplesModalOpen, setStaplesModalOpen] = useState(false);
  const [staplesText, setStaplesText] = useState("");

  const addInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  function showToast(message) {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 2200);
  }

  function persistPacks(next) {
    setPacks(next);
    writeJson(LS.packs, next);
  }

  function persistStaples(next) {
    setStaples(next);
    writeJson(LS.staples, next);
  }

  function persistStaplesState(next) {
    setStaplesState(next);
    writeJson(LS.staplesState, next);
  }

  function persistFavorites(next) {
    setFavorites(next);
    writeJson(LS.favorites, next);
  }

  function persistRecent(next) {
    setRecent(next);
    writeJson(LS.recent, next);
  }

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await listIngredients();
      const next = data?.items || [];
      setItems(next);

      setSelected((prev) => {
        const existing = new Set(next.map((x) => getRowId(x)).filter(Boolean));
        const keep = new Set();
        for (const id of prev) if (existing.has(id)) keep.add(id);
        return keep;
      });
    } catch (e) {
      setError(e?.message || "Failed to load ingredients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Units for filter dropdown
  const units = useMemo(() => {
    const set = new Set();
    for (const it of items) {
      const u = normalizeString(it.unit);
      if (u) set.add(u);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  // Filtered and sorted list
  const visibleItems = useMemo(() => {
    const q = safeLower(search);

    let filtered = items.filter((it) => {
      const nm = safeLower(it.name);
      const un = safeLower(it.unit);

      const matchesSearch = !q || nm.includes(q) || un.includes(q);
      const matchesUnit = unitFilter === "all" || safeLower(unitFilter) === un;

      return matchesSearch && matchesUnit;
    });

    const dir = sortBy.endsWith("_desc") ? -1 : 1;
    const key = sortBy.replace("_asc", "").replace("_desc", "");

    filtered.sort((a, b) => {
      if (key === "qty") {
        const aq = Number(a.qty);
        const bq = Number(b.qty);
        const aNum = Number.isFinite(aq) ? aq : -Infinity;
        const bNum = Number.isFinite(bq) ? bq : -Infinity;
        if (aNum === bNum) return safeLower(a.name).localeCompare(safeLower(b.name)) * dir;
        return (aNum - bNum) * dir;
      }

      if (key === "unit") {
        return safeLower(a.unit).localeCompare(safeLower(b.unit)) * dir;
      }

      return safeLower(a.name).localeCompare(safeLower(b.name)) * dir;
    });

    return filtered;
  }, [items, search, unitFilter, sortBy]);

  const selectedCount = selected.size;

  function toggleSelected(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function selectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const it of visibleItems) {
        const id = getRowId(it);
        if (id) next.add(id);
      }
      return next;
    });
  }

  function addToRecent(name) {
    const cleaned = normalizeString(name);
    if (!cleaned) return;

    const next = [cleaned, ...recent.filter((x) => safeLower(x) !== safeLower(cleaned))];
    persistRecent(clampList(next, 10));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");

    const name = normalizeString(addName);
    if (!name) {
      setError("Enter an ingredient name to add it.");
      addInputRef.current?.focus?.();
      return;
    }

    const payload = {
      name,
      qty: addDetailsOpen ? parseQty(addQty) : undefined,
      unit: addDetailsOpen ? normalizeString(addUnit) || undefined : undefined,
    };

    try {
      await addIngredient(payload);
      setAddName("");
      setAddQty("");
      setAddUnit("");
      setAddDetailsOpen(false);

      addToRecent(name);
      await refresh();

      showToast("Ingredient added");
      addInputRef.current?.focus?.();
    } catch (e2) {
      setError(e2?.message || "Failed to add ingredient");
    }
  }

  function openEdit(it) {
    setError("");
    setEditItem(it);
    setEditName(normalizeString(it?.name));
    setEditQty(normalizeString(it?.qty));
    setEditUnit(normalizeString(it?.unit));
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editItem) return;

    const id = getRowId(editItem);
    if (!id) {
      setError("Missing ingredient id. Cannot update.");
      return;
    }

    const name = normalizeString(editName);
    if (!name) {
      setError("Ingredient name cannot be empty.");
      return;
    }

    const payload = {
      name,
      qty: parseQty(editQty),
      unit: normalizeString(editUnit) || undefined,
    };

    try {
      await updateIngredient(id, payload);
      setEditOpen(false);
      setEditItem(null);
      await refresh();
      showToast("Ingredient updated");
    } catch (e) {
      setError(e?.message || "Failed to update ingredient");
    }
  }

  function openDeleteConfirm(it) {
    setError("");
    setConfirmItem(it);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!confirmItem) return;

    const id = getRowId(confirmItem);
    if (!id) {
      setError("Missing ingredient id. Cannot delete.");
      return;
    }

    try {
      await deleteIngredient(id);
      setConfirmOpen(false);
      setConfirmItem(null);

      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      await refresh();
      showToast("Ingredient deleted");
    } catch (e) {
      setError(e?.message || "Failed to delete ingredient");
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return;

    try {
      for (const id of selected) {
        await deleteIngredient(id);
      }

      clearSelection();
      await refresh();
      showToast("Selected ingredients deleted");
    } catch (e) {
      setError(e?.message || "Failed to delete selected ingredients");
    }
  }

  async function seedDemo() {
    setMoreOpen(false);
    setError("");

    const demo = [
      { name: "pasta", qty: 1, unit: "box" },
      { name: "tuna", qty: 1, unit: "can" },
      { name: "egg", qty: 6, unit: "count" },
    ];

    try {
      for (const ing of demo) {
        await addIngredient({ ...ing });
        addToRecent(ing.name);
      }
      await refresh();
      showToast("Demo ingredients added");
    } catch (e) {
      setError(e?.message || "Failed to add demo ingredients");
    }
  }

  // Pantry staples inclusion in recipe builder
  function stapleInStock(name) {
    return Boolean(staplesState[safeLower(name)]);
  }

  const inStockStapleNames = useMemo(() => {
    return staples
      .map((s) => normalizeString(s))
      .filter(Boolean)
      .filter((s) => stapleInStock(s));
  }, [staples, staplesState]);

  const selectedItemsForRecipe = useMemo(() => {
    return items.filter((it) => {
      const id = getRowId(it);
      return id && selected.has(id);
    });
  }, [items, selected]);

  const recipeIngredientDraft = useMemo(() => {
    // Combine selected items + in-stock pantry staples (always included)
    const out = [];
    const seen = new Set();

    // Selected first (more important)
    for (const it of selectedItemsForRecipe) {
      const name = normalizeString(it.name);
      if (!name) continue;
      const k = safeLower(name);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ name, qty: it.qty, unit: it.unit });
    }

    // Then staples (name-only if not already present)
    for (const s of inStockStapleNames) {
      const k = safeLower(s);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ name: s });
    }

    return out;
  }, [selectedItemsForRecipe, inStockStapleNames]);

  function handleCreateRecipe() {
    if (recipeIngredientDraft.length === 0) return;

    localStorage.setItem("foodable_recipe_ingredients_draft", JSON.stringify(recipeIngredientDraft));
    window.location.assign("/recipes/new");
  }

  // Favorites
  function isFavorite(it) {
    const key = stableKeyForIngredient(it);
    return favorites.includes(key);
  }

  function toggleFavorite(it) {
    const key = stableKeyForIngredient(it);
    const next = favorites.includes(key)
      ? favorites.filter((x) => x !== key)
      : [key, ...favorites];
    persistFavorites(clampList(next, 50));
  }

  const favoriteItems = useMemo(() => {
    const map = new Map(items.map((it) => [stableKeyForIngredient(it), it]));
    const out = [];
    for (const key of favorites) {
      const it = map.get(key);
      if (it) out.push(it);
    }
    return out;
  }, [items, favorites]);

  // Packs
  function openCreatePack() {
    setPackEditingId(null);
    setPackName("");
    setPackItemsText("");
    setPackModalOpen(true);
  }

  function openEditPack(pack) {
    setPackEditingId(pack.id);
    setPackName(pack.name || "");
    setPackItemsText((pack.items || []).join(", "));
    setPackModalOpen(true);
  }

  function savePack() {
    const name = normalizeString(packName);
    const itemsList = uniqByLower(
      packItemsText
        .split(",")
        .map((x) => normalizeString(x))
        .filter(Boolean)
    );

    if (!name) {
      setError("Pack name is required.");
      return;
    }

    if (itemsList.length === 0) {
      setError("Add at least one ingredient to the pack.");
      return;
    }

    const next = [...packs];
    if (packEditingId) {
      const idx = next.findIndex((p) => p.id === packEditingId);
      if (idx >= 0) {
        const existing = next[idx];
        next[idx] = { ...existing, name, items: itemsList };
      }
    } else {
      next.unshift({
        id: makeId(),
        name,
        items: itemsList,
        isDefault: false,
      });
    }

    persistPacks(next);
    setPackModalOpen(false);
    showToast("Pack saved");
  }

  function deletePack(pack) {
    const next = packs.filter((p) => p.id !== pack.id);
    persistPacks(next);
    showToast("Pack removed");
  }

  async function addPackToPantry(pack) {
    setError("");

    const existingNames = new Set(items.map((it) => safeLower(it.name)));
    const toAdd = (pack.items || [])
      .map((x) => normalizeString(x))
      .filter(Boolean)
      .filter((x) => !existingNames.has(safeLower(x)));

    if (toAdd.length === 0) {
      showToast("Nothing to add, you already have these");
      return;
    }

    try {
      for (const nm of toAdd) {
        await addIngredient({ name: nm });
        addToRecent(nm);
      }
      await refresh();
      showToast(`Added ${toAdd.length} item${toAdd.length === 1 ? "" : "s"}`);
    } catch (e) {
      setError(e?.message || "Failed to add pack items");
    }
  }

  // Pantry staples
  function openEditStaples() {
    setStaplesText(staples.join(", "));
    setStaplesModalOpen(true);
  }

  function saveStaples() {
    const list = uniqByLower(
      staplesText
        .split(",")
        .map((x) => normalizeString(x))
        .filter(Boolean)
    );

    if (list.length === 0) {
      setError("Pantry Staples list cannot be empty.");
      return;
    }

    persistStaples(list);
    setStaplesModalOpen(false);
    showToast("Pantry Staples updated");
  }

  function toggleStapleStock(name) {
    const key = safeLower(name);
    const next = { ...staplesState, [key]: !Boolean(staplesState[key]) };
    persistStaplesState(next);
  }

  async function addMissingStaples() {
    setError("");

    const existingNames = new Set(items.map((it) => safeLower(it.name)));
    const toAdd = staples
      .map((s) => normalizeString(s))
      .filter(Boolean)
      .filter((s) => !existingNames.has(safeLower(s)));

    if (toAdd.length === 0) {
      showToast("You already have all staples");
      return;
    }

    try {
      for (const nm of toAdd) {
        await addIngredient({ name: nm });
        addToRecent(nm);
      }
      await refresh();
      showToast(`Added ${toAdd.length} staple${toAdd.length === 1 ? "" : "s"}`);
    } catch (e) {
      setError(e?.message || "Failed to add missing staples");
    }
  }

  // Shortcuts quick add
  async function quickAddNameOnly(name) {
    const cleaned = normalizeString(name);
    if (!cleaned) return;

    try {
      await addIngredient({ name: cleaned });
      addToRecent(cleaned);
      await refresh();
      showToast("Ingredient added");
      addInputRef.current?.focus?.();
    } catch (e) {
      setError(e?.message || "Failed to add ingredient");
    }
  }

  const recipeSelectedCount = selectedItemsForRecipe.length;
  const recipeStaplesCount = inStockStapleNames.length;
  const recipeTotalCount = recipeIngredientDraft.length;

  return (
    <div className="ing3">
      <header className="ing3_header">
        <div className="ing3_titleBlock">
          <h1 className="ing3_title">Ingredients</h1>
          <div className="ing3_sub">
            Keep your pantry current, then create recipes from what you have.
            <span className="ing3_subtle">
              {" "}
              API <span className="ing3_mono">{import.meta.env.VITE_API_URL || "not set"}</span>
            </span>
          </div>
        </div>

        <div className="ing3_actions">
          <button
            className="ing3_btn ing3_btnGhost"
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen ? "true" : "false"}
          >
            Filters
          </button>

          <div className="ing3_moreWrap">
            <button
              className="ing3_btn ing3_btnGhost"
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen ? "true" : "false"}
            >
              More
            </button>

            {moreOpen && (
              <div className="ing3_moreMenu" role="menu">
                <button className="ing3_menuItem" type="button" onClick={refresh} disabled={loading}>
                  Refresh list
                </button>
                <button className="ing3_menuItem" type="button" onClick={seedDemo}>
                  Add demo ingredients
                </button>
                <button
                  className="ing3_menuItem"
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    clearSelection();
                    showToast("Selection cleared");
                  }}
                  disabled={selectedCount === 0}
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div role="alert" className="ing3_alert">
          {error}
        </div>
      )}

      <div className="ing3_layout">
        {/* Main column */}
        <main className="ing3_main">
          {/* Recipe Builder moved to top */}
          <section className="ing3_card ing3_recipeTop">
            <div className="ing3_recipeRow">
              <div className="ing3_recipeText">
                <div className="ing3_recipeTitle">Recipe Builder</div>
                <div className="ing3_recipeSub">
                  {recipeTotalCount === 0 ? (
                    <>Select ingredients, pantry staples marked in stock are included automatically.</>
                  ) : (
                    <>
                      Ready with <strong>{recipeTotalCount}</strong> ingredient{recipeTotalCount === 1 ? "" : "s"}:
                      <span className="ing3_recipeCounts">
                        {" "}
                        {recipeSelectedCount} selected, {recipeStaplesCount} pantry staples
                      </span>
                    </>
                  )}
                </div>
              </div>

              <button
                className="ing3_btn ing3_btnPrimary"
                type="button"
                onClick={handleCreateRecipe}
                disabled={recipeTotalCount === 0}
              >
                Create recipe
              </button>
            </div>
          </section>

          {/* Primary add card */}
          <section className="ing3_card">
            <form className="ing3_add" onSubmit={handleAdd}>
              <div className="ing3_addTop">
                <label className="ing3_label" htmlFor="ing3_addName">
                  Add ingredient
                </label>

                <div className="ing3_addRow">
                  <input
                    id="ing3_addName"
                    ref={addInputRef}
                    className="ing3_input ing3_inputLg"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Type a name and press Enter"
                    autoComplete="off"
                  />

                  <button className="ing3_btn ing3_btnPrimary" type="submit">
                    Add
                  </button>
                </div>

                <div className="ing3_addMeta">
                  <button
                    className="ing3_link"
                    type="button"
                    onClick={() => setAddDetailsOpen((v) => !v)}
                    aria-expanded={addDetailsOpen ? "true" : "false"}
                  >
                    {addDetailsOpen ? "Hide details" : "Add details"}
                  </button>
                  <div className="ing3_hint">Details are optional. Keep it quick.</div>
                </div>
              </div>

              {addDetailsOpen && (
                <div className="ing3_addDetails">
                  <div className="ing3_field">
                    <label className="ing3_label" htmlFor="ing3_addQty">
                      Qty
                    </label>
                    <input
                      id="ing3_addQty"
                      className="ing3_input"
                      value={addQty}
                      onChange={(e) => setAddQty(e.target.value)}
                      placeholder="2"
                      inputMode="decimal"
                      autoComplete="off"
                    />
                  </div>

                  <div className="ing3_field">
                    <label className="ing3_label" htmlFor="ing3_addUnit">
                      Unit
                    </label>
                    <input
                      id="ing3_addUnit"
                      className="ing3_input"
                      value={addUnit}
                      onChange={(e) => setAddUnit(e.target.value)}
                      placeholder="lb, cup, can"
                      autoComplete="off"
                    />
                  </div>
                </div>
              )}
            </form>
          </section>

          {/* Filters */}
          {filtersOpen && (
            <section className="ing3_card ing3_filters">
              <div className="ing3_filtersGrid">
                <div className="ing3_field">
                  <label className="ing3_label" htmlFor="ing3_search">
                    Search
                  </label>
                  <input
                    id="ing3_search"
                    className="ing3_input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or unit"
                    autoComplete="off"
                  />
                </div>

                <div className="ing3_field">
                  <label className="ing3_label" htmlFor="ing3_unitFilter">
                    Unit
                  </label>
                  <select
                    id="ing3_unitFilter"
                    className="ing3_select"
                    value={unitFilter}
                    onChange={(e) => setUnitFilter(e.target.value)}
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u === "all" ? "All units" : u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ing3_field">
                  <label className="ing3_label" htmlFor="ing3_sort">
                    Sort
                  </label>
                  <select
                    id="ing3_sort"
                    className="ing3_select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name_asc">Name A to Z</option>
                    <option value="name_desc">Name Z to A</option>
                    <option value="qty_asc">Qty low to high</option>
                    <option value="qty_desc">Qty high to low</option>
                    <option value="unit_asc">Unit A to Z</option>
                    <option value="unit_desc">Unit Z to A</option>
                  </select>
                </div>
              </div>

              {/* Nutrition stays inside Filters */}
              <div className="ing3_divider" />
              <details className="ing3_details">
                <summary className="ing3_detailsSummary">Nutrition</summary>
                <div className="ing3_detailsBody">
                  <div className="ing3_note">
                    Nutrition filters are ready for when ingredients include nutrition fields. We can enable these once the
                    data model supports it.
                  </div>

                  <div className="ing3_filtersGrid">
                    <div className="ing3_field">
                      <label className="ing3_label">Max calories</label>
                      <input className="ing3_input" placeholder="Disabled for now" disabled />
                    </div>
                    <div className="ing3_field">
                      <label className="ing3_label">Min protein</label>
                      <input className="ing3_input" placeholder="Disabled for now" disabled />
                    </div>
                    <div className="ing3_field">
                      <label className="ing3_label">Preset</label>
                      <select className="ing3_select" disabled>
                        <option>High protein</option>
                      </select>
                    </div>
                  </div>
                </div>
              </details>
            </section>
          )}

          {/* List */}
          <section className="ing3_card ing3_listCard">
            <div className="ing3_listTop">
              <div className="ing3_meta">
                {loading ? "Loading..." : `${visibleItems.length} ingredient${visibleItems.length === 1 ? "" : "s"}`}
                {selectedCount > 0 ? `, ${selectedCount} selected` : ""}
              </div>

              <div className="ing3_listActions">
                <button
                  className="ing3_btn ing3_btnGhost"
                  type="button"
                  onClick={selectAllVisible}
                  disabled={loading || visibleItems.length === 0}
                >
                  Select visible
                </button>
                <button
                  className="ing3_btn ing3_btnGhost"
                  type="button"
                  onClick={clearSelection}
                  disabled={selectedCount === 0}
                >
                  Clear
                </button>
                <button
                  className="ing3_btn ing3_btnDanger"
                  type="button"
                  onClick={deleteSelected}
                  disabled={selectedCount === 0}
                >
                  Delete selected
                </button>
              </div>
            </div>

            <div className="ing3_tableWrap" aria-busy={loading ? "true" : "false"}>
              <table className="ing3_table">
                <thead>
                  <tr>
                    <th className="ing3_colCheck" scope="col">
                      Select
                    </th>
                    <th scope="col">Ingredient</th>
                    <th className="ing3_colNum" scope="col">
                      Qty
                    </th>
                    <th scope="col">Unit</th>
                    <th className="ing3_colActions" scope="col">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="ing3_empty">
                        Loading ingredients...
                      </td>
                    </tr>
                  ) : visibleItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ing3_empty">
                        No results. Try a different search or clear filters.
                      </td>
                    </tr>
                  ) : (
                    visibleItems.map((it) => {
                      const id = getRowId(it);
                      const checked = id ? selected.has(id) : false;
                      const fav = isFavorite(it);

                      return (
                        <tr key={id || it.name} className={checked ? "ing3_rowSelected" : ""}>
                          <td className="ing3_colCheck">
                            <input
                              className="ing3_checkbox"
                              type="checkbox"
                              checked={checked}
                              onChange={() => id && toggleSelected(id)}
                              aria-label={`Select ${it.name}`}
                            />
                          </td>

                          <td className="ing3_cellStrong">
                            <div className="ing3_nameCell">
                              <button
                                className={`ing3_star ${fav ? "ing3_starOn" : ""}`}
                                type="button"
                                onClick={(e) => {
                                  stop(e);
                                  toggleFavorite(it);
                                }}
                                aria-label={fav ? `Remove ${it.name} from favorites` : `Add ${it.name} to favorites`}
                                title={fav ? "Favorited" : "Favorite"}
                              >
                                {fav ? "★" : "☆"}
                              </button>
                              <span className="ing3_name">{it.name}</span>
                            </div>
                          </td>

                          <td className="ing3_colNum">{it.qty ?? ""}</td>
                          <td>{it.unit ?? ""}</td>

                          <td className="ing3_colActions">
                            <div className="ing3_rowActions">
                              <button
                                className="ing3_btnSmall ing3_btnSmallGhost"
                                type="button"
                                onClick={(e) => {
                                  stop(e);
                                  openEdit(it);
                                }}
                              >
                                Edit
                              </button>

                              <button
                                className="ing3_btnSmall ing3_btnSmallDanger"
                                type="button"
                                onClick={(e) => {
                                  stop(e);
                                  openDeleteConfirm(it);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="ing3_side">
          {/* Shortcuts moved to top */}
          <section className="ing3_sideCard">
            <div className="ing3_sideHeader">
              <button className="ing3_sideTitleBtn" type="button" onClick={() => setShortcutsOpen((v) => !v)}>
                <span className="ing3_sideTitle">Shortcuts</span>
                <span className="ing3_chev">{shortcutsOpen ? "▾" : "▸"}</span>
              </button>

              <button
                className="ing3_btn ing3_btnGhost ing3_btnTight"
                type="button"
                onClick={() => {
                  persistRecent([]);
                  showToast("Recent cleared");
                }}
                disabled={recent.length === 0}
              >
                Clear
              </button>
            </div>

            {shortcutsOpen && (
              <div className="ing3_sideBody">
                <div className="ing3_shortcutsSection">
                  <div className="ing3_sideSubTitle">Favorites</div>
                  {favoriteItems.length === 0 ? (
                    <div className="ing3_note">Star ingredients in your list to pin them here.</div>
                  ) : (
                    <div className="ing3_shortcutsList">
                      {clampList(favoriteItems, 8).map((it) => (
                        <button
                          key={stableKeyForIngredient(it)}
                          className="ing3_shortcutBtn"
                          type="button"
                          onClick={() => quickAddNameOnly(it.name)}
                        >
                          {it.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ing3_divider ing3_dividerSoft" />

                <div className="ing3_shortcutsSection">
                  <div className="ing3_sideSubTitle">Recently added</div>
                  {recent.length === 0 ? (
                    <div className="ing3_note">Your recent ingredients will show up here for quick re add.</div>
                  ) : (
                    <div className="ing3_shortcutsList">
                      {clampList(recent, 8).map((nm) => (
                        <button
                          key={`recent:${nm}`}
                          className="ing3_shortcutBtn"
                          type="button"
                          onClick={() => quickAddNameOnly(nm)}
                        >
                          {nm}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Quick Packs */}
          <section className="ing3_sideCard">
            <div className="ing3_sideHeader">
              <button className="ing3_sideTitleBtn" type="button" onClick={() => setPacksOpen((v) => !v)}>
                <span className="ing3_sideTitle">Quick Packs</span>
                <span className="ing3_chev">{packsOpen ? "▾" : "▸"}</span>
              </button>

              <button className="ing3_btn ing3_btnGhost ing3_btnTight" type="button" onClick={openCreatePack}>
                New
              </button>
            </div>

            {packsOpen && (
              <div className="ing3_sideBody">
                {packs.length === 0 ? (
                  <div className="ing3_note">No packs yet. Create one to add a set of ingredients quickly.</div>
                ) : (
                  <div className="ing3_packList">
                    {packs.map((p) => (
                      <div key={p.id} className="ing3_pack">
                        <div className="ing3_packTop">
                          <div className="ing3_packName">{p.name}</div>
                          <div className="ing3_packActions">
                            <button
                              className="ing3_btnSmall ing3_btnSmallGhost"
                              type="button"
                              onClick={() => openEditPack(p)}
                              title="Edit pack"
                            >
                              Edit
                            </button>
                            {!p.isDefault && (
                              <button
                                className="ing3_btnSmall ing3_btnSmallDanger"
                                type="button"
                                onClick={() => deletePack(p)}
                                title="Delete pack"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="ing3_chips">
                          {clampList(p.items || [], 6).map((x) => (
                            <span key={`${p.id}:${x}`} className="ing3_chip">
                              {x}
                            </span>
                          ))}
                          {(p.items || []).length > 6 && (
                            <span className="ing3_chip ing3_chipMuted">+{(p.items || []).length - 6}</span>
                          )}
                        </div>

                        <button className="ing3_btn ing3_btnPrimary ing3_btnFull" type="button" onClick={() => addPackToPantry(p)}>
                          Add pack
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Pantry Staples */}
          <section className="ing3_sideCard">
            <div className="ing3_sideHeader">
              <button className="ing3_sideTitleBtn" type="button" onClick={() => setStaplesOpen((v) => !v)}>
                <span className="ing3_sideTitle">Pantry Staples</span>
                <span className="ing3_chev">{staplesOpen ? "▾" : "▸"}</span>
              </button>

              <button className="ing3_btn ing3_btnGhost ing3_btnTight" type="button" onClick={openEditStaples}>
                Edit
              </button>
            </div>

            {staplesOpen && (
              <div className="ing3_sideBody">
                <div className="ing3_staplesTop">
                  <button className="ing3_btn ing3_btnGhost ing3_btnFull" type="button" onClick={addMissingStaples}>
                    Add missing staples
                  </button>
                  <div className="ing3_note ing3_noteTight">
                    Staples marked in stock are always included in recipe generation.
                  </div>
                </div>

                <div className="ing3_staplesList">
                  {clampList(staples, 12).map((s) => (
                    <label key={s} className="ing3_stapleRow">
                      <input
                        type="checkbox"
                        checked={stapleInStock(s)}
                        onChange={() => toggleStapleStock(s)}
                      />
                      <span className="ing3_stapleName">{s}</span>
                      <span className={`ing3_stapleBadge ${stapleInStock(s) ? "ing3_badgeOn" : ""}`}>
                        {stapleInStock(s) ? "In stock" : "Off"}
                      </span>
                      <button
                        className="ing3_link ing3_linkInline"
                        type="button"
                        onClick={(e) => {
                          stop(e);
                          quickAddNameOnly(s);
                        }}
                        title="Add to pantry"
                      >
                        Add
                      </button>
                    </label>
                  ))}
                  {staples.length > 12 && <div className="ing3_note">Showing 12. Use Edit to customize your full list.</div>}
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* Toast */}
      {toast && <div className="ing3_toast">{toast}</div>}

      {/* Edit ingredient modal */}
      {editOpen && (
        <div className="ing3_modalBackdrop" role="presentation" onMouseDown={() => setEditOpen(false)}>
          <div className="ing3_modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ing3_modalHeader">
              <div className="ing3_modalTitle">Edit ingredient</div>
              <button className="ing3_btn ing3_btnGhost" type="button" onClick={() => setEditOpen(false)}>
                Close
              </button>
            </div>

            <div className="ing3_modalBody">
              <div className="ing3_field">
                <label className="ing3_label" htmlFor="ing3_editName">
                  Name
                </label>
                <input
                  id="ing3_editName"
                  className="ing3_input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="ing3_modalGrid">
                <div className="ing3_field">
                  <label className="ing3_label" htmlFor="ing3_editQty">
                    Qty
                  </label>
                  <input
                    id="ing3_editQty"
                    className="ing3_input"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                    inputMode="decimal"
                    autoComplete="off"
                  />
                </div>

                <div className="ing3_field">
                  <label className="ing3_label" htmlFor="ing3_editUnit">
                    Unit
                  </label>
                  <input
                    id="ing3_editUnit"
                    className="ing3_input"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <div className="ing3_modalFooter">
              <button className="ing3_btn ing3_btnGhost" type="button" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
              <button className="ing3_btn ing3_btnPrimary" type="button" onClick={saveEdit}>
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmOpen && (
        <div className="ing3_modalBackdrop" role="presentation" onMouseDown={() => setConfirmOpen(false)}>
          <div className="ing3_modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ing3_modalHeader">
              <div className="ing3_modalTitle">Delete ingredient</div>
              <button className="ing3_btn ing3_btnGhost" type="button" onClick={() => setConfirmOpen(false)}>
                Close
              </button>
            </div>

            <div className="ing3_modalBody">
              <p className="ing3_confirmText">
                Are you sure you want to delete <span className="ing3_confirmStrong">{confirmItem?.name}</span>
                This cannot be undone.
              </p>
            </div>

            <div className="ing3_modalFooter">
              <button className="ing3_btn ing3_btnGhost" type="button" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button className="ing3_btn ing3_btnDanger" type="button" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pack modal */}
      {packModalOpen && (
        <div className="ing3_modalBackdrop" role="presentation" onMouseDown={() => setPackModalOpen(false)}>
          <div className="ing3_modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ing3_modalHeader">
              <div className="ing3_modalTitle">{packEditingId ? "Edit pack" : "Create pack"}</div>
              <button className="ing3_btn ing3_btnGhost" type="button" onClick={() => setPackModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="ing3_modalBody">
              <div className="ing3_field">
                <label className="ing3_label">Pack name</label>
                <input className="ing3_input" value={packName} onChange={(e) => setPackName(e.target.value)} />
              </div>

              <div className="ing3_field">
                <label className="ing3_label">Ingredients in this pack</label>
                <textarea
                  className="ing3_textarea"
                  value={packItemsText}
                  onChange={(e) => setPackItemsText(e.target.value)}
                  placeholder="Comma separated, example: chicken, rice, broccoli"
                  rows={4}
                />
                <div className="ing3_note">Tip: Keep packs short. 5 to 10 items is ideal.</div>
              </div>
            </div>

            <div className="ing3_modalFooter">
              <button className="ing3_btn ing3_btnGhost" type="button" onClick={() => setPackModalOpen(false)}>
                Cancel
              </button>
              <button className="ing3_btn ing3_btnPrimary" type="button" onClick={savePack}>
                Save pack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pantry Staples modal */}
      {staplesModalOpen && (
        <div className="ing3_modalBackdrop" role="presentation" onMouseDown={() => setStaplesModalOpen(false)}>
          <div className="ing3_modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ing3_modalHeader">
              <div className="ing3_modalTitle">Edit Pantry Staples</div>
              <button className="ing3_btn ing3_btnGhost" type="button" onClick={() => setStaplesModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="ing3_modalBody">
              <div className="ing3_field">
                <label className="ing3_label">Staples list</label>
                <textarea
                  className="ing3_textarea"
                  value={staplesText}
                  onChange={(e) => setStaplesText(e.target.value)}
                  placeholder="Comma separated, example: salt, pepper, olive oil"
                  rows={5}
                />
                <div className="ing3_note">This list is yours. Keep what you always want to have around.</div>
              </div>
            </div>

            <div className="ing3_modalFooter">
              <button className="ing3_btn ing3_btnGhost" type="button" onClick={() => setStaplesModalOpen(false)}>
                Cancel
              </button>
              <button className="ing3_btn ing3_btnPrimary" type="button" onClick={saveStaples}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}