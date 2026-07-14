import { useState, useEffect, useCallback } from 'react';
import { nutritionAPI, authAPI } from '../services/api';
import { showToast } from '../utils/toast';
import NutritionCard from '../components/NutritionCard';
import Footer from '../components/Footer';
import { Plus, Trash2, Edit2, Search, Calculator, X, Check } from 'lucide-react';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const ACTIVITY_LEVELS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Athlete'];
const FITNESS_GOALS = ['Weight Loss', 'Weight Maintenance', 'Weight Gain', 'Muscle Gain'];

const emptyMeal = { meal_type: 'Breakfast', food_name: '', quantity: 1, calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 };

function GoalBar({ label, icon, consumed, goal, unit, color }) {
  const pct = Math.min(Math.round((consumed / (goal || 1)) * 100), 100);
  const exceeded = consumed > goal;
  let barColor = color;
  if (pct >= 100) barColor = '#10b981';
  else if (pct >= 80) barColor = '#f59e0b';
  if (exceeded) barColor = '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {icon} {label}
        </span>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
          <span style={{ color: barColor, fontWeight: '700' }}>{typeof consumed === 'number' ? consumed.toFixed(consumed % 1 === 0 ? 0 : 1) : consumed} {unit}</span>
          <span style={{ color: 'var(--text-secondary)' }}>/ {typeof goal === 'number' ? goal.toFixed(goal % 1 === 0 ? 0 : 1) : goal} {unit}</span>
          <span style={{ color: exceeded ? '#ef4444' : '#10b981', fontWeight: '600' }}>
            {exceeded ? `+${(consumed - goal).toFixed(1)}` : `${(goal - consumed).toFixed(1)} left`}
          </span>
        </div>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  );
}

function MealSection({ mealType, meals, onEdit, onDelete }) {
  const totals = meals.reduce((acc, m) => ({
    cal: acc.cal + (m.calories || 0), prot: acc.prot + (m.protein || 0),
    carbs: acc.carbs + (m.carbohydrates || 0), fat: acc.fat + (m.fat || 0), fib: acc.fib + (m.fiber || 0),
  }), { cal: 0, prot: 0, carbs: 0, fat: 0, fib: 0 });

  const icons = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snacks: '🍎' };

  return (
    <div className="glass-panel-2" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: '700', fontSize: '15px' }}>{icons[mealType]} {mealType}</span>
        {meals.length > 0 && (
          <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600' }}>{Math.round(totals.cal)} kcal</span>
        )}
      </div>
      {meals.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px 0' }}>No foods added yet</p>
      ) : (
        <table className="data-table" style={{ fontSize: '13px' }}>
          <thead>
            <tr>
              <th>Food</th>
              <th>Qty</th>
              <th>Cal</th>
              <th>Prot</th>
              <th>Carbs</th>
              <th>Fat</th>
              <th style={{ width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {meals.map(m => (
              <tr key={m.id}>
                <td style={{ fontWeight: '500' }}>{m.food_name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{m.quantity}g</td>
                <td style={{ color: '#f59e0b' }}>{m.calories}</td>
                <td style={{ color: '#3b82f6' }}>{m.protein}g</td>
                <td style={{ color: '#8b5cf6' }}>{m.carbohydrates}g</td>
                <td style={{ color: '#f59e0b' }}>{m.fat}g</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => onEdit(m)} style={{
                      background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '2px',
                    }}><Edit2 size={13} /></button>
                    <button onClick={() => onDelete(m.id)} style={{
                      background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px',
                    }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function NutritionCalculator({ date }) {
  const [goals, setGoals] = useState(null);
  const [meals, setMeals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCalcForm, setShowCalcForm] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [mealForm, setMealForm] = useState({ ...emptyMeal, date });
  const [foodSearch, setFoodSearch] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [calcForm, setCalcForm] = useState({});

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
        age: p.profile?.age || '', gender: p.profile?.gender || 'Male',
        height: p.profile?.height || '', weight: p.profile?.weight || '',
        activity_level: p.profile?.activity_level || 'Moderately Active',
        fitness_goal: p.profile?.fitness_goal || 'Weight Maintenance',
      });
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  // Also load goals when profile is ready
  useEffect(() => {
    if (!profile) return;
    nutritionAPI.calculateGoals({
      age: profile.profile?.age, gender: profile.profile?.gender,
      height: profile.profile?.height, weight: profile.profile?.weight,
      activity_level: profile.profile?.activity_level, fitness_goal: profile.profile?.fitness_goal,
    }).then(res => setGoals(res.data)).catch(() => {});
  }, [profile]);

  const totals = meals.reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0), protein: acc.protein + (m.protein || 0),
    carbohydrates: acc.carbohydrates + (m.carbohydrates || 0), fat: acc.fat + (m.fat || 0),
    fiber: acc.fiber + (m.fiber || 0),
  }), { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });

  const handleRecalculate = async () => {
    try {
      const payload = { ...calcForm, age: Number(calcForm.age), height: Number(calcForm.height), weight: Number(calcForm.weight) };
      const res = await nutritionAPI.calculateGoals(payload);
      setGoals(res.data);
      setShowCalcForm(false);
      showToast('Nutrition goals updated!', 'success');
    } catch {
      showToast('Failed to calculate goals', 'error');
    }
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

  const openAddMeal = (type = 'Breakfast') => {
    setEditingMeal(null);
    setMealForm({ ...emptyMeal, date, meal_type: type });
    setShowMealModal(true);
  };

  const openEditMeal = (meal) => {
    setEditingMeal(meal);
    setMealForm({ ...meal });
    setShowMealModal(true);
  };

  const handleSaveMeal = async () => {
    if (!mealForm.food_name.trim()) { showToast('Food name is required', 'error'); return; }
    if (!mealForm.calories) { showToast('Calories are required', 'error'); return; }
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
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save meal', 'error');
    }
  };

  const handleDeleteMeal = async (id) => {
    try {
      await nutritionAPI.deleteMeal(id);
      showToast('Meal deleted', 'success');
      loadData();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const mealsByType = MEAL_TYPES.reduce((acc, t) => {
    acc[t] = meals.filter(m => m.meal_type === t);
    return acc;
  }, {});

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '12px' }}>
      <span className="spinner" style={{ width: '28px', height: '28px' }} />
      <span style={{ color: 'var(--text-secondary)' }}>Loading nutrition data...</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Nutrition Tracker</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Track your daily macros and calories
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => setShowCalcForm(s => !s)}>
            <Calculator size={14} /> {showCalcForm ? 'Hide Calculator' : 'Recalculate Goals'}
          </button>
          <button className="btn-primary" onClick={() => openAddMeal()}>
            <Plus size={14} /> Add Food
          </button>
        </div>
      </div>

      {/* Recalculate form */}
      {showCalcForm && (
        <div className="stat-card fade-in">
          <div className="section-title"><Calculator size={16} /> Nutrition Goal Calculator</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {[['Age', 'age', 'number'], ['Height (cm)', 'height', 'number'], ['Weight (kg)', 'weight', 'number']].map(([label, key, type]) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}</label>
                <input type={type} className="form-input" value={calcForm[key] || ''}
                  onChange={e => setCalcForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-input" value={calcForm.gender || 'Male'}
                onChange={e => setCalcForm(f => ({ ...f, gender: e.target.value }))}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Activity Level</label>
              <select className="form-input" value={calcForm.activity_level || ''}
                onChange={e => setCalcForm(f => ({ ...f, activity_level: e.target.value }))}>
                {ACTIVITY_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fitness Goal</label>
              <select className="form-input" value={calcForm.fitness_goal || ''}
                onChange={e => setCalcForm(f => ({ ...f, fitness_goal: e.target.value }))}>
                {FITNESS_GOALS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-primary" onClick={handleRecalculate}>
            <Calculator size={14} /> Calculate & Save Goals
          </button>
        </div>
      )}

      {/* Goals cards */}
      {goals && (
        <div>
          <div className="section-title" style={{ marginBottom: '14px' }}>🎯 Daily Goals</div>
          <div className="grid-4" style={{ marginBottom: '16px' }}>
            <NutritionCard label="Calories" icon="🔥" consumed={totals.calories} goal={goals.calories_goal} unit="kcal" color="#3b82f6" />
            <NutritionCard label="Protein" icon="💪" consumed={totals.protein} goal={goals.protein_goal} unit="g" color="#3b82f6" />
            <NutritionCard label="Carbohydrates" icon="🍚" consumed={totals.carbohydrates} goal={goals.carbs_goal} unit="g" color="#8b5cf6" />
            <NutritionCard label="Fat" icon="🥑" consumed={totals.fat} goal={goals.fat_goal} unit="g" color="#f59e0b" />
          </div>
          <div className="grid-2">
            <NutritionCard label="Fiber" icon="🌾" consumed={totals.fiber} goal={goals.fiber_goal} unit="g" color="#10b981" />
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="stat-card">
        <div className="section-title">📊 Consumption Summary</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <GoalBar label="Calories" icon="🔥" consumed={totals.calories} goal={goals?.calories_goal || 2000} unit="kcal" color="#3b82f6" />
          <GoalBar label="Protein" icon="💪" consumed={totals.protein} goal={goals?.protein_goal || 140} unit="g" color="#3b82f6" />
          <GoalBar label="Carbohydrates" icon="🍚" consumed={totals.carbohydrates} goal={goals?.carbs_goal || 240} unit="g" color="#8b5cf6" />
          <GoalBar label="Fat" icon="🥑" consumed={totals.fat} goal={goals?.fat_goal || 60} unit="g" color="#f59e0b" />
          <GoalBar label="Fiber" icon="🌾" consumed={totals.fiber} goal={goals?.fiber_goal || 25} unit="g" color="#10b981" />
        </div>
      </div>

      {/* Meal sections */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>🍽 Meal Log</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {MEAL_TYPES.map(type => (
            <div key={type}>
              <MealSection
                mealType={type}
                meals={mealsByType[type]}
                onEdit={openEditMeal}
                onDelete={handleDeleteMeal}
              />
              <button
                className="btn-secondary"
                onClick={() => openAddMeal(type)}
                style={{ marginTop: '8px', fontSize: '13px', padding: '7px 14px' }}
              >
                <Plus size={13} /> Add to {type}
              </button>
            </div>
          ))}
        </div>
      </div>

      <Footer />

      {/* Meal Modal */}
      {showMealModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMealModal(false)}>
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px' }}>{editingMeal ? 'Edit Meal' : 'Add Food'}</h3>
              <button onClick={() => setShowMealModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Food Search */}
              {!editingMeal && (
                <div style={{ position: 'relative' }}>
                  <div className="form-group">
                    <label className="form-label">Search Food Library</label>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        className="form-input" placeholder="Search foods..."
                        value={foodSearch} onChange={e => handleFoodSearch(e.target.value)}
                        style={{ paddingLeft: '34px' }}
                      />
                    </div>
                  </div>
                  {foodResults.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                      background: 'var(--bg-card)', border: '1px solid hsl(var(--border-color))',
                      borderRadius: '8px', overflow: 'hidden',
                    }}>
                      {foodResults.slice(0, 8).map(f => (
                        <button key={f.id} onClick={() => fillFromFood(f)} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px', width: '100%', background: 'none', border: 'none',
                          color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <span>{f.name}</span>
                          <span style={{ color: '#f59e0b', fontSize: '12px' }}>{f.calories} kcal</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Meal Type</label>
                <select className="form-input" value={mealForm.meal_type}
                  onChange={e => setMealForm(f => ({ ...f, meal_type: e.target.value }))}>
                  {MEAL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Food Name *</label>
                <input className="form-input" placeholder="e.g. Chicken Breast" value={mealForm.food_name}
                  onChange={e => setMealForm(f => ({ ...f, food_name: e.target.value }))} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Quantity (g/serving)</label>
                  <input type="number" className="form-input" value={mealForm.quantity}
                    onChange={e => setMealForm(f => ({ ...f, quantity: e.target.value }))} min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Calories (kcal) *</label>
                  <input type="number" className="form-input" value={mealForm.calories}
                    onChange={e => setMealForm(f => ({ ...f, calories: e.target.value }))} min="0" />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Protein (g)</label>
                  <input type="number" className="form-input" value={mealForm.protein}
                    onChange={e => setMealForm(f => ({ ...f, protein: e.target.value }))} min="0" step="0.1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Carbohydrates (g)</label>
                  <input type="number" className="form-input" value={mealForm.carbohydrates}
                    onChange={e => setMealForm(f => ({ ...f, carbohydrates: e.target.value }))} min="0" step="0.1" />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fat (g)</label>
                  <input type="number" className="form-input" value={mealForm.fat}
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
                  <Check size={15} /> {editingMeal ? 'Update Meal' : 'Add Meal'}
                </button>
                <button className="btn-secondary" onClick={() => setShowMealModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
