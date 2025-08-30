import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, TrendingUp, Calendar } from 'lucide-react';

const API_BASE = 'http://localhost:3000';

const moodOptions = [
  { value: 1, emoji: '😢', label: 'Very Sad', color: 'text-red-500' },
  { value: 2, emoji: '😟', label: 'Sad', color: 'text-orange-500' },
  { value: 3, emoji: '😐', label: 'Okay', color: 'text-yellow-500' },
  { value: 4, emoji: '😊', label: 'Good', color: 'text-green-500' },
  { value: 5, emoji: '😄', label: 'Great', color: 'text-blue-500' },
];

export function MoodTracker() {
  const { user } = useAuth();
  const [todayMood, setTodayMood] = useState<any>(null);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTodayMood();
      fetchRecentEntries();
    }
  }, [user]);

  const fetchTodayMood = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${API_BASE}/mood_entries?patient_id=${user._id}&limit=1`);
      const data = await res.json();
      const entry = data.find((e: any) => e.date === today);
      if (entry) {
        setTodayMood(entry);
        setSelectedMood(entry.mood_score);
        setNotes(entry.notes || '');
      } else {
        setTodayMood(null);
        setSelectedMood(null);
        setNotes('');
      }
    } catch (error) {
      // No entry for today, which is fine
    }
  };

  const fetchRecentEntries = async () => {
    try {
      const res = await fetch(`${API_BASE}/mood_entries?patient_id=${user._id}&limit=7`);
      const data = await res.json();
      setRecentEntries(data || []);
    } catch (error) {
      console.error('Error fetching recent entries:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      if (todayMood) {
        // Update existing entry
        const res = await fetch(`${API_BASE}/mood_entries/${todayMood._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mood_score: selectedMood,
            notes: notes,
          }),
        });
        if (!res.ok) throw new Error('Failed to update mood entry');
      } else {
        // Create new entry
        const res = await fetch(`${API_BASE}/mood_entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: user._id,
            mood_score: selectedMood,
            notes: notes,
            date: today,
          }),
        });
        if (!res.ok) throw new Error('Failed to create mood entry');
      }
      await fetchTodayMood();
      await fetchRecentEntries();
    } catch (error) {
      console.error('Error saving mood entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAverageMood = () => {
    if (recentEntries.length === 0) return 0;
    const sum = recentEntries.reduce((acc: number, entry: any) => acc + entry.mood_score, 0);
    return (sum / recentEntries.length).toFixed(1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Daily Mood Check-in</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">How are you feeling today?</p>
      </div>

      {/* Today's Check-in */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          {todayMood ? 'Update Today\'s Mood' : 'Today\'s Mood'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
              How are you feeling?
            </label>
            <div className="grid grid-cols-5 gap-4">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setSelectedMood(mood.value)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedMood === mood.value
                      ? 'border-blue-500 bg-blue-50 scale-105 dark:bg-blue-900/50 dark:border-blue-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-4xl mb-2">{mood.emoji}</span>
                  <span className={`text-sm font-medium ${mood.color}`}>
                    {mood.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
              placeholder="How was your day? Any concerns or highlights?"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedMood || loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-lg font-semibold py-4 rounded-lg transition-colors duration-200 dark:disabled:bg-slate-600"
          >
            {loading ? 'Saving...' : (todayMood ? 'Update Mood' : 'Save Mood')}
          </button>
        </form>
      </div>

      {/* Recent Entries & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
            Your Mood Trends
          </h3>
          
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/50 rounded-lg p-4">
              <p className="text-sm text-green-600 dark:text-green-300 font-medium">7-Day Average</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-200">{getAverageMood()}/5</p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Total Check-ins</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{recentEntries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            Recent Entries
          </h3>
          
          <div className="space-y-3">
            {recentEntries.slice(0, 5).map((entry: any) => {
              const mood = moodOptions.find(m => m.value === entry.mood_score);
              return (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{mood?.emoji}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{mood?.label}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${mood?.color}`}>
                    {entry.mood_score}/5
                  </span>
                </div>
              );
            })}
            
            {recentEntries.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No entries yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}