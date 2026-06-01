import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Target, TrendingUp, Calendar, CalendarRange, Plus, CirclePlus, DollarSign } from 'lucide-react-native';
import { api } from '../services/api';

export default function SavingsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any>(null);

  // New Goal Form State
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  // Contribution Modal/Form State
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribLoading, setContribLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const goalsList = await api.get('/finance/goals');
      const predictionsData = await api.get('/finance/predictions');
      setGoals(goalsList);
      setPredictions(predictionsData);
    } catch (err: any) {
      console.error('Fetch savings error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCreateGoal = async () => {
    if (!goalName || !targetAmount || !targetDate) {
      Alert.alert('Warning', 'Please fill out Name, Target Amount, and Target Date.');
      return;
    }
    const targetAmt = parseFloat(targetAmount);
    const currAmt = parseFloat(currentAmount || '0');

    if (isNaN(targetAmt) || targetAmt <= 0) {
      Alert.alert('Warning', 'Target amount must be positive.');
      return;
    }

    setAddLoading(true);
    try {
      await api.post('/finance/goals', {
        goal_name: goalName,
        target_amount: targetAmt,
        current_amount: currAmt,
        target_date: targetDate,
      });

      setGoalName('');
      setTargetAmount('');
      setCurrentAmount('');
      setTargetDate('');
      setShowAddForm(false);
      fetchData();
      Alert.alert('Success', 'Savings goal created!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create goal.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleLogContribution = async () => {
    if (!selectedGoalId || !contribAmount) {
      Alert.alert('Warning', 'Please enter contribution amount.');
      return;
    }
    const amt = parseFloat(contribAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Warning', 'Contribution must be positive.');
      return;
    }

    setContribLoading(true);
    try {
      await api.post('/finance/goals/contribution', {
        goal_id: selectedGoalId,
        amount: amt,
      });

      setContribAmount('');
      setSelectedGoalId(null);
      fetchData();
      Alert.alert('Success', 'Contribution logged successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add contribution.');
    } finally {
      setContribLoading(false);
    }
  };

  if (loading && goals.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
      }
    >
      <Text style={styles.title}>Savings Goals</Text>
      <Text style={styles.subtitle}>Set targets and forecast completion timelines</Text>

      {/* AI Savings Forecast Card */}
      {predictions && (
        <View style={styles.forecastCard}>
          <View style={styles.forecastHeader}>
            <TrendingUp size={20} color="#8b5cf6" />
            <Text style={styles.forecastTitle}>AI FORECAST SUMMARY</Text>
          </View>
          <Text style={styles.forecastMessage}>
            {predictions.savingsStatusMessage}
          </Text>
          <View style={styles.forecastDetailsRow}>
            <View style={styles.forecastDetailItem}>
              <Text style={styles.forecastDetailLabel}>Projected End Savings</Text>
              <Text style={styles.forecastDetailVal}>Rs. {predictions.predictedSavings?.toLocaleString()}</Text>
            </View>
            <View style={styles.forecastDetailItem}>
              <Text style={styles.forecastDetailLabel}>Savings Speed</Text>
              <Text style={[styles.forecastDetailVal, { color: predictions.spendingSpeed === 'Faster than planned' ? '#ef4444' : '#10b981' }]}>
                {predictions.spendingSpeed}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Goals Checklist / List */}
      <View style={styles.goalsSection}>
        <View style={styles.goalsHeaderRow}>
          <Text style={styles.sectionTitle}>Active Goals</Text>
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            style={styles.addGoalBtn}
          >
            <Plus size={16} color="#3b82f6" />
            <Text style={styles.addGoalBtnText}>New Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Create Goal Collapsible Form */}
        {showAddForm && (
          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>Goal Name</Text>
            <TextInput
              placeholder="e.g. Electric Bike, Laptop, Travel"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={goalName}
              onChangeText={setGoalName}
              style={styles.input}
            />

            <Text style={styles.formLabel}>Target Amount (PKR)</Text>
            <TextInput
              placeholder="e.g. 150000"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
              value={targetAmount}
              onChangeText={setTargetAmount}
              style={styles.input}
            />

            <Text style={styles.formLabel}>Initial Savings (Optional)</Text>
            <TextInput
              placeholder="e.g. 10000"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
              value={currentAmount}
              onChangeText={setCurrentAmount}
              style={styles.input}
            />

            <Text style={styles.formLabel}>Target Date (YYYY-MM-DD)</Text>
            <TextInput
              placeholder="e.g. 2026-12-31"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={targetDate}
              onChangeText={setTargetDate}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={handleCreateGoal}
              disabled={addLoading}
              style={styles.submitBtn}
            >
              {addLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Goal</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Log Contribution Form Inline */}
        {selectedGoalId && (
          <View style={styles.contribContainer}>
            <Text style={styles.contribTitle}>Log Contribution</Text>
            <Text style={styles.contribSubtext}>Add funds directly to this savings goal</Text>
            <View style={styles.contribRow}>
              <TextInput
                placeholder="Amount (PKR)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="numeric"
                value={contribAmount}
                onChangeText={setContribAmount}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
              />
              <TouchableOpacity
                onPress={handleLogContribution}
                disabled={contribLoading}
                style={styles.contribSubmitBtn}
              >
                {contribLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.contribSubmitText}>Add</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedGoalId(null)}
                style={styles.contribCancelBtn}
              >
                <Text style={styles.contribCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* List of Goals */}
        {goals.length === 0 ? (
          <View style={styles.emptyGoalsState}>
            <Text style={styles.emptyStateText}>No active savings goals found.</Text>
          </View>
        ) : (
          goals.map((g) => {
            const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
            const progressColor = pct >= 100 ? '#10b981' : '#8b5cf6';
            const remains = Math.max(0, g.target_amount - g.current_amount);

            return (
              <View key={g.id} style={styles.goalCard}>
                <View style={styles.goalInfoRow}>
                  <View style={styles.goalIconBox}>
                    <Target size={22} color="#8b5cf6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalName}>{g.goal_name}</Text>
                    <View style={styles.goalTargetRow}>
                      <Calendar size={12} color="rgba(255,255,255,0.4)" />
                      <Text style={styles.goalTargetDate}>
                        Target Date: {new Date(g.target_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedGoalId(g.id)}
                    style={styles.addFundsBtn}
                  >
                    <CirclePlus size={18} color="#8b5cf6" />
                  </TouchableOpacity>
                </View>

                {/* Progress Indicators */}
                <View style={styles.progressTextRow}>
                  <Text style={styles.progressPctText}>{Math.round(pct)}% Saved</Text>
                  <Text style={styles.progressAmountText}>
                    Rs. {g.current_amount.toLocaleString()} / Rs. {g.target_amount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(100, pct)}%`, backgroundColor: progressColor }]} />
                </View>

                {pct < 100 && (
                  <Text style={styles.remainsText}>
                    Need Rs. {remains.toLocaleString()} more to complete.
                  </Text>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#0b0f19',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
    marginBottom: 24,
  },
  forecastCard: {
    backgroundColor: 'rgba(21, 28, 44, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    padding: 20,
    marginBottom: 24,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  forecastTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 1,
  },
  forecastMessage: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    marginBottom: 16,
  },
  forecastDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingTop: 16,
  },
  forecastDetailItem: {
    flex: 1,
  },
  forecastDetailLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  forecastDetailVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  goalsSection: {},
  goalsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  addGoalBtnText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: 'rgba(21, 28, 44, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: 'rgba(11, 15, 25, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    color: '#ffffff',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 8,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  contribContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  contribTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  contribSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    marginBottom: 12,
    marginTop: 2,
  },
  contribRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contribSubmitBtn: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contribSubmitText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  contribCancelBtn: {
    paddingHorizontal: 10,
  },
  contribCancelText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  emptyGoalsState: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
  },
  goalCard: {
    backgroundColor: 'rgba(21, 28, 44, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 16,
  },
  goalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  goalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  goalTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  goalTargetDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
  },
  addFundsBtn: {
    padding: 6,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressPctText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  progressAmountText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainsText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
  },
});
