
import { useState, useEffect, useCallback } from 'react';
import { nutritionAPI, authAPI } from '../services/api';
import { showToast } from '../utils/toast';
import Footer from '../components/Footer';
import { Plus, Trash2, Edit2, Search, Calculator, X, Check, Calendar, FileSpreadsheet, Table2, RefreshCw } from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';

const MEAL_TYPES      = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const ACTIVITY_LEVELS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Athlete'];
const FITNESS_GOALS   = ['Weight Loss', 'Weight Maintenance', 'Weight Gain', 'Muscle Gain'];
const emptyMeal       = { meal_type: 'Breakfast', food_name: '', quantity: 1, calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 };

const MEAL_COLORS = { Breakfast: '#ff9800', Lunch: '#4caf50', Dinner: '#2196f3', Snacks: '#9c27b0' };

/* ── Macro stat mini card (top row) ── */
function MacroTopCard({ label, value, unit, color, sub }) {
  return (
    <div className="stat-card" style={{ borderBottom: '3px solid ' + color, padding: '16px' }}>
      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
        <span style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--font-display)', color }}>{typeof value === 'number' ? Math.round(value) : value ?? 0}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{sub}</div>}
      <div style={{ height: '3px', borderRadius: '99px', background: color, marginTop: '8px', width: '100%' }} />
    </div>
  );
}

function GoalBar({ label, icon, consumed, goal, unit, color }) {
  const pct     = Math.min(Math.round((consumed / (goal || 1)) * 100), 100);
  const exceeded = consumed > goal;
  const barColor = exceeded ? '#e53935' : color;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {icon} {label}
        </span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ color: barColor, fontWeight: '700' }}>{typeof consumed === 'number' ? consumed.toFixed(0) : consumed} {unit}</span>
          <span style={{ color: 'var(--text-secondary)' }}>/ {typeof goal === 'number' ? goal.toFixed(0) : goal} {unit}</span>
          <span style={{ color: exceeded ? '#e53935' : '#4caf50', fontWeight: '600' }}>
            {exceeded ? `+${(consumed - goal).toFixed(0)}` : `${(goal - consumed).toFixed(0)} left`}
          </span>
        </div>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  );
}

export default function NutritionCalculator({ date }) {
  const [goals,         setGoals]         = useState(null);
  const [meals,         setMeals]         = useState([]);
  const [profile,       setProfile]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [showCalcForm,  setShowCalcForm]  = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [editingMeal,   setEditingMeal]   = useState(null);
  const [mealForm,      setMealForm]      = useState({ ...emptyMeal, date });
  const [foodSearch,    setFoodSearch]    = useState('');
  const [foodResults,   setFoodResults]   = useState([]);
  const [calcForm,      setCalcForm]      = useState({});
  const [activeTab,     setActiveTab]     = useState('log');  // 'log' | 'live'
  const [lastUpdated,   setLastUpdated]   = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [mealsRes, profileRes] = await Promise.all([
        nutritionAPI.getMeals(date),
        authAPI.getProfile(),
      ]);
      setMeals(mealsRes.data);
      const p = profileRes.data;
      setProfile(p);
      setCalcForm({
        age:            p.profile?.age            || '',
        gender:         p.profile?.gender         || 'Male',
        height:         p.profile?.height         || '',
        weight:         p.profile?.weight         || '',
        activity_level: p.profile?.activity_level || 'Moderately Active',
        fitness_goal:   p.profile?.fitness_goal   || 'Weight Maintenance',
      });
    } catch { showToast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!profile) return;
    nutritionAPI.calculateGoals({
      age: profile.profile?.age, gender: profile.profile?.gender,
      height: profile.profile?.height, weight: profile.profile?.weight,
      activity_level: profile.profile?.activity_level, fitness_goal: profile.profile?.fitness_goal,
    }).then(res => setGoals(res.data)).catch(() => {});
  }, [profile]);

  const totals = meals.reduce((acc, m) => ({
    calories:      acc.calories      + (m.calories      || 0),
    protein:       acc.protein       + (m.protein       || 0),
    carbohydrates: acc.carbohydrates + (m.carbohydrates || 0),
    fat:           acc.fat           + (m.fat           || 0),
    fiber:         acc.fiber         + (m.fiber         || 0),
  }), { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });

  const handleRecalculate = async () => {
    try {
      const payload = { ...calcForm, age: Number(calcForm.age), height: Number(calcForm.height), weight: Number(calcForm.weight) };
      const res = await nutritionAPI.calculateGoals(payload);
      setGoals(res.data);
      setShowCalcForm(false);
      showToast('Nutrition goals updated!', 'success');
    } catch { showToast('Failed to calculate goals', 'error'); }
  };

  const handleFoodSearch = async (q) => {
    setFoodSearch(q);
    if (q.length < 2) { setFoodResults([]); return; }
    try {
      const res = await nutritionAPI.searchFoods(q);
      setFoodResults(res.data);
    } catch {}
  };

  const fillFromFood = (food) => {
    setMealForm(f => ({ ...f, food_name: food.name, calories: food.calories, protein: food.protein, carbohydrates: food.carbohydrates, fat: food.fat, fiber: food.fiber }));
    setFoodResults([]);
    setFoodSearch('');
  };

  const openAddMeal  = (type = 'Breakfast') => { setEditingMeal(null); setMealForm({ ...emptyMeal, date, meal_type: type }); setShowMealModal(true); };
  const openEditMeal = (meal) => { setEditingMeal(meal); setMealForm({ ...meal }); setShowMealModal(true); };

  const handleSaveMeal = async () => {
    if (!mealForm.food_name.trim()) { showToast('Food name is required', 'error'); return; }
    if (!mealForm.calories)          { showToast('Calories are required', 'error'); return; }
    try {
      const payload = { ...mealForm, date, quantity: Number(mealForm.quantity), calories: Number(mealForm.calories), protein: Number(mealForm.protein), carbohydrates: Number(mealForm.carbohydrates), fat: Number(mealForm.fat), fiber: Number(mealForm.fiber) };
      if (editingMeal) {
        await nutritionAPI.updateMeal(editingMeal.id, payload);
        showToast('Meal updated!', 'success');
      } else {
        await nutritionAPI.addMeal(payload);
        showToast('Meal added!', 'success');
      }
      setShowMealModal(false);
      loadData();
    } catch (err) { showToast(err.response?.data?.detail || 'Failed to save meal', 'error'); }
  };

  const handleDeleteMeal = async (id) => {
    try { await nutritionAPI.deleteMeal(id); showToast('Meal deleted', 'success'); loadData(); }
    catch { showToast('Failed to delete', 'error'); }
  };

  const mealsByType = MEAL_TYPES.reduce((acc, t) => {
    acc[t] = meals.filter(m => m.meal_type === t);
    return acc;
  }, {});

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' }}>
      <span className="spinner" />
      <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading nutrition data...</span>
    </div>
  );

  /* ── Export current meals + summary to Excel ── */
  const handleExportExcel = () => {
    if (meals.length === 0) { showToast('No meals to export', 'info'); return; }

    // Sheet 1 — full meal log
    const mealHeaders = ['Date', 'Meal Type', 'Food Name', 'Quantity (g)', 'Calories (kcal)', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Fiber (g)'];
    const mealRows = meals.map(m => [
      date,
      m.meal_type,
      m.food_name,
      m.quantity,
      m.calories,
      m.protein,
      m.carbohydrates,
      m.fat,
      m.fiber,
    ]);

    // Sheet 2 — daily totals vs goals
    const summaryHeaders = ['Nutrient', 'Consumed', 'Goal', 'Remaining', 'Status'];
    const g = goals || {};
    const summaryRows = [
      ['Calories (kcal)', totals.calories,      g.calories_goal || 0, Math.max(0, (g.calories_goal || 0) - totals.calories),      totals.calories > (g.calories_goal || 0) ? 'Over' : 'OK'],
      ['Protein (g)',     totals.protein,        g.protein_goal  || 0, Math.max(0, (g.protein_goal  || 0) - totals.protein),        totals.protein  > (g.protein_goal  || 0) ? 'Over' : 'OK'],
      ['Carbs (g)',       totals.carbohydrates,  g.carbs_goal    || 0, Math.max(0, (g.carbs_goal    || 0) - totals.carbohydrates),  totals.carbohydrates > (g.carbs_goal || 0) ? 'Over' : 'OK'],
      ['Fat (g)',         totals.fat,            g.fat_goal      || 0, Math.max(0, (g.fat_goal      || 0) - totals.fat),            totals.fat  > (g.fat_goal      || 0) ? 'Over' : 'OK'],
      ['Fiber (g)',       totals.fiber,          g.fiber_goal    || 0, Math.max(0, (g.fiber_goal    || 0) - totals.fiber),          totals.fiber > (g.fiber_goal   || 0) ? 'Over' : 'OK'],
    ];

    // Sheet 3 — breakdown per meal type
    const breakdownHeaders = ['Meal Type', 'Items', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'];
    const breakdownRows = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(type => {
      const items = meals.filter(m => m.meal_type === type);
      return [
        type,
        items.length,
        items.reduce((a, m) => a + m.calories,      0),
        items.reduce((a, m) => a + m.protein,        0),
        items.reduce((a, m) => a + m.carbohydrates,  0),
        items.reduce((a, m) => a + m.fat,            0),
      ];
    });

    exportToExcel(
      [
        { name: 'Meal Log',   headers: mealHeaders,      rows: mealRows      },
        { name: 'Daily Goals', headers: summaryHeaders,   rows: summaryRows   },
        { name: 'By Meal Type', headers: breakdownHeaders, rows: breakdownRows },
      ],
      `nutrition_${date}.xlsx`
    );
    showToast('Excel exported!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Track your daily macros and calories</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-secondary"
            onClick={handleExportExcel}
            style={{ fontSize: '13px', padding: '7px 14px', color: '#4caf50', borderColor: 'rgba(76,175,80,0.4)' }}
            title="Export current data to Excel"
          >
            <FileSpreadsheet size={14} /> Export Excel
          </button>
          <button className="btn-secondary" onClick={() => setShowCalcForm(s => !s)} style={{ fontSize: '13px', padding: '7px 14px' }}>
            <Calculator size={13} /> {showCalcForm ? 'Hide' : 'Recalculate Goals'}
          </button>
          <button className="btn-primary" onClick={() => openAddMeal()}>
            <Plus size={14} /> Add Meal
          </button>
        </div>
      </div>

      {/* Top macro summary cards */}
      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <MacroTopCard label="Total Calories"  value={totals.calories}      unit="kcal consumed" color="var(--accent)"  sub={goals ? `Goal: ${Math.round(goals.calories_goal)} kcal` : null} />
        <MacroTopCard label="Total Protein"   value={totals.protein}       unit="g"             color="#e53935"        sub={goals ? `Goal: ${Math.round(goals.protein_goal)}g`       : null} />
        <MacroTopCard label="Carbohydrates"   value={totals.carbohydrates} unit="g"             color="#ff9800"        sub={goals ? `Goal: ${Math.round(goals.carbs_goal)}g`         : null} />
        <MacroTopCard label="Total Fat"       value={totals.fat}           unit="g"             color="#ffeb3b"        sub={goals ? `Goal: ${Math.round(goals.fat_goal)}g`           : null} />
        <MacroTopCard label="Meals Added"     value={meals.length}         unit=""              color="#4caf50"        sub={<span style={{ cursor: 'pointer', color: 'var(--accent)' }}>View details →</span>} />
      </div>

      {/* Recalculate form */}
      {showCalcForm && (
        <div className="stat-card fade-in">
          <div className="section-title" style={{ fontSize: '14px' }}><Calculator size={14} color="var(--accent)" /> Nutrition Goal Calculator</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            {[['Age', 'age', 'number'], ['Height (cm)', 'height', 'number'], ['Weight (kg)', 'weight', 'number']].map(([label, key, type]) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}</label>
                <input type={type} className="form-input" value={calcForm[key] || ''} onChange={e => setCalcForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-input" value={calcForm.gender || 'Male'} onChange={e => setCalcForm(f => ({ ...f, gender: e.target.value }))}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Activity Level</label>
              <select className="form-input" value={calcForm.activity_level || ''} onChange={e => setCalcForm(f => ({ ...f, activity_level: e.target.value }))}>
                {ACTIVITY_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fitness Goal</label>
              <select className="form-input" value={calcForm.fitness_goal || ''} onChange={e => setCalcForm(f => ({ ...f, fitness_goal: e.target.value }))}>
                {FITNESS_GOALS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-primary" onClick={handleRecalculate} style={{ fontSize: '13px' }}>
            <Calculator size={13} /> Calculate & Save Goals
          </button>
        </div>
      )}

      {/* Log a New Meal form */}
      <div className="stat-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Log a New Meal</div>
          <button
            onClick={() => openAddMeal()}
            style={{ background: 'none', border: '1px solid hsl(var(--border-color))', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--accent)' }}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Consumption summary bars */}
        {goals && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <GoalBar label="Calories"      icon="🔥" consumed={totals.calories}      goal={goals.calories_goal} unit="kcal" color="var(--accent)" />
            <GoalBar label="Protein"       icon="💪" consumed={totals.protein}       goal={goals.protein_goal}  unit="g"    color="#e53935"        />
            <GoalBar label="Carbohydrates" icon="🍚" consumed={totals.carbohydrates} goal={goals.carbs_goal}    unit="g"    color="#ff9800"        />
            <GoalBar label="Fat"           icon="🥑" consumed={totals.fat}           goal={goals.fat_goal}      unit="g"    color="#ffeb3b"        />
            <GoalBar label="Fiber"         icon="🌾" consumed={totals.fiber}         goal={goals.fiber_goal}    unit="g"    color="#4caf50"        />
          </div>
        )}
      </div>

      {/* Meal History */}
      <div className="stat-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Meal History</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <Calendar size={12} /> Filter by Date
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Food Name</th>
              <th>Calories</th>
              <th>Protein</th>
              <th>Carbs</th>
              <th>Fat</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {meals.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No meals logged yet</td></tr>
            ) : meals.map(m => {
              const color = MEAL_COLORS[m.meal_type] || '#aaa';
              return (
                <tr key={m.id}>
                  <td>
                    <span className="badge" style={{ background: color + '22', color, border: '1px solid ' + color + '55', fontSize: '9px' }}>
                      {m.meal_type}
                    </span>
                  </td>
                  <td style={{ fontWeight: '500', color: '#fff' }}>{m.food_name}</td>
                  <td style={{ color: 'var(--accent)' }}>{m.calories} kcal</td>
                  <td style={{ color: '#e53935' }}>{m.protein}g</td>
                  <td>{m.carbohydrates}g</td>
                  <td>{m.fat}g</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEditMeal(m)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDeleteMeal(m.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Showing {meals.length} of {meals.length} meals recorded today</span>
        </div>
      </div>

      <Footer />

      {/* Meal Modal */}
      {showMealModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMealModal(false)}>
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px' }}>{editingMeal ? 'Edit Meal' : 'Add Meal'}</h3>
              <button onClick={() => setShowMealModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!editingMeal && (
                <div style={{ position: 'relative' }}>
                  <div className="form-group">
                    <label className="form-label">Search Food Library</label>
                    <div style={{ position: 'relative' }}>
                      <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input className="form-input" placeholder="Search foods..." value={foodSearch}
                        onChange={e => handleFoodSearch(e.target.value)} style={{ paddingLeft: '30px' }} />
                    </div>
                  </div>
                  {foodResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, background: 'var(--bg-card)', border: '1px solid hsl(var(--border-color))', borderRadius: '6px', overflow: 'hidden' }}>
                      {foodResults.slice(0, 8).map(f => (
                        <button key={f.id} onClick={() => fillFromFood(f)} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '9px 14px', width: '100%', background: 'none', border: 'none',
                          color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <span>{f.name}</span>
                          <span style={{ color: 'var(--accent)', fontSize: '12px' }}>{f.calories} kcal</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Meal Type</label>
                <select className="form-input" value={mealForm.meal_type} onChange={e => setMealForm(f => ({ ...f, meal_type: e.target.value }))}>
                  {MEAL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Food Name *</label>
                <input className="form-input" placeholder="e.g. Grilled Chicken Breast" value={mealForm.food_name}
                  onChange={e => setMealForm(f => ({ ...f, food_name: e.target.value }))} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Quantity (g)</label>
                  <input type="number" className="form-input" placeholder="200g" value={mealForm.quantity}
                    onChange={e => setMealForm(f => ({ ...f, quantity: e.target.value }))} min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Calories *</label>
                  <input type="number" className="form-input" placeholder="330" value={mealForm.calories}
                    onChange={e => setMealForm(f => ({ ...f, calories: e.target.value }))} min="0" />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Protein (g)</label>
                  <input type="number" className="form-input" placeholder="62" value={mealForm.protein}
                    onChange={e => setMealForm(f => ({ ...f, protein: e.target.value }))} min="0" step="0.1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Carbs (g)</label>
                  <input type="number" className="form-input" placeholder="0" value={mealForm.carbohydrates}
                    onChange={e => setMealForm(f => ({ ...f, carbohydrates: e.target.value }))} min="0" step="0.1" />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fat (g)</label>
                  <input type="number" className="form-input" placeholder="7" value={mealForm.fat}
                    onChange={e => setMealForm(f => ({ ...f, fat: e.target.value }))} min="0" step="0.1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fiber (g)</label>
                  <input type="number" className="form-input" value={mealForm.fiber}
                    onChange={e => setMealForm(f => ({ ...f, fiber: e.target.value }))} min="0" step="0.1" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button className="btn-primary" onClick={handleSaveMeal} style={{ flex: 1, justifyContent: 'center' }}>
                  <Check size={14} /> {editingMeal ? 'Update Meal' : 'Add Meal'}
                </button>
                <button className="btn-secondary" onClick={() => setShowMealModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
