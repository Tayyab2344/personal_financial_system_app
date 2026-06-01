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
import { LogOut, Plus, Landmark, ArrowUpRight, ArrowDownRight, Target, Shield, Wallet } from 'lucide-react-native';
import { api } from '../services/api';
import { useAuth } from '../services/authContext';

export default function OverviewScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  // Quick Add Income Form
  const [incomeSource, setIncomeSource] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeLoading, setIncomeLoading] = useState(false);

  // Quick Add Expense Form
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);

  // Savings Target Slider State
  const [sliderWidth, setSliderWidth] = useState(0);
  const [tempSavingsTarget, setTempSavingsTarget] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  const categories = ['Food', 'Fuel', 'Transport', 'Education', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await api.get('/finance/summary');
      setSummary(data);
      if (!isSliding) {
        setTempSavingsTarget(data.savingsTarget);
      }
    } catch (err: any) {
      console.error('Fetch summary error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  // Custom Touch-Based Slider handlers
  const handleSliderTouch = (evt: any) => {
    if (!summary || summary.totalIncome === 0 || sliderWidth === 0) return;
    setIsSliding(true);
    const touchX = evt.nativeEvent.locationX;
    const pct = Math.min(Math.max(0, touchX / sliderWidth), 1);
    const newTarget = Math.round(pct * summary.totalIncome);
    setTempSavingsTarget(newTarget);
  };

  const handleSliderRelease = async () => {
    if (!summary || summary.totalIncome === 0) return;
    setIsSliding(false);
    try {
      await api.post('/finance/budget', {
        month: summary.month,
        savings_target: tempSavingsTarget,
      });
      // Fetch updated summary to sync everything
      const data = await api.get('/finance/summary');
      setSummary(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update savings target.');
      setTempSavingsTarget(summary.savingsTarget);
    }
  };

  const handleAddIncome = async () => {
    if (!incomeSource || !incomeAmount) {
      Alert.alert('Warning', 'Please fill out all fields.');
      return;
    }
    const amt = parseFloat(incomeAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Warning', 'Income amount must be positive.');
      return;
    }

    setIncomeLoading(true);
    try {
      await api.post('/finance/income', {
        source: incomeSource,
        amount: amt,
      });
      setIncomeSource('');
      setIncomeAmount('');
      setShowIncomeForm(false);
      fetchSummary();
      Alert.alert('Success', 'Income logged successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add income.');
    } finally {
      setIncomeLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseAmount) {
      Alert.alert('Warning', 'Please enter an amount.');
      return;
    }
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Warning', 'Expense amount must be positive.');
      return;
    }

    setExpenseLoading(true);
    try {
      await api.post('/finance/expense', {
        category: expenseCategory,
        amount: amt,
        description: expenseDesc || `Logged via mobile`,
      });
      setExpenseAmount('');
      setExpenseDesc('');
      setShowExpenseForm(false);
      fetchSummary();
      Alert.alert('Success', 'Expense logged successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add expense.');
    } finally {
      setExpenseLoading(false);
    }
  };

  if (loading && !summary) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const income = summary?.totalIncome || 0;
  const target = isSliding ? tempSavingsTarget : (summary?.savingsTarget || 0);
  const remainingBudget = Math.max(0, income - target);
  const spent = summary?.totalExpenses || 0;
  const budgetLeft = remainingBudget - spent;
  const progressPct = income > 0 ? (target / income) * 100 : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
      }
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, {user?.name || 'User'}</Text>
          <Text style={styles.dateText}>Finance Dashboard • {summary?.month || 'Current Month'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <LogOut size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Daily Allowance Glowing Banner */}
      <View style={styles.allowanceCard}>
        <View style={styles.allowanceGlow} />
        <View style={styles.allowanceHeader}>
          <Shield size={18} color="#3b82f6" />
          <Text style={styles.allowanceTitle}>DAILY SPENDING ALLOWANCE</Text>
        </View>
        <Text style={styles.allowanceAmount}>
          Rs. {summary?.dailySpendingAllowance?.toLocaleString() || '0'}
        </Text>
        <Text style={styles.allowanceDays}>
          Safe daily limit for the remaining {summary?.remainingDays || '0'} days
        </Text>
      </View>

      {/* Savings Target Slider Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Set Savings Target</Text>
        <Text style={styles.cardSubtext}>
          Drag to allocate your income. Real-time updates to available spending budget.
        </Text>

        <View style={styles.sliderInfoRow}>
          <View>
            <Text style={styles.sliderInfoLabel}>Savings Target</Text>
            <Text style={[styles.sliderInfoVal, { color: '#8b5cf6' }]}>
              Rs. {target.toLocaleString()} ({Math.round(progressPct)}%)
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.sliderInfoLabel}>Spending Budget</Text>
            <Text style={[styles.sliderInfoVal, { color: '#10b981' }]}>
              Rs. {remainingBudget.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Custom Track Slider */}
        <View
          style={styles.sliderTrackContainer}
          onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onResponderMove={handleSliderTouch}
          onResponderRelease={handleSliderRelease}
        >
          <View style={styles.sliderBgTrack} />
          <View style={[styles.sliderFillTrack, { width: `${progressPct}%` }]} />
          <View style={[styles.sliderThumb, { left: `${Math.min(95, Math.max(0, progressPct - 2))}%` }]} />
        </View>

        <View style={styles.sliderLimitsRow}>
          <Text style={styles.limitText}>Rs. 0</Text>
          <Text style={styles.limitText}>Max: Rs. {income.toLocaleString()}</Text>
        </View>
      </View>

      {/* Four Summary Tracker Boxes */}
      <View style={styles.summaryGrid}>
        <View style={styles.gridCard}>
          <View style={[styles.gridIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
            <ArrowUpRight size={20} color="#10b981" />
          </View>
          <Text style={styles.gridLabel}>Monthly Income</Text>
          <Text style={styles.gridValue}>Rs. {income.toLocaleString()}</Text>
        </View>

        <View style={styles.gridCard}>
          <View style={[styles.gridIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
            <ArrowDownRight size={20} color="#ef4444" />
          </View>
          <Text style={styles.gridLabel}>Total Expenses</Text>
          <Text style={styles.gridValue}>Rs. {spent.toLocaleString()}</Text>
        </View>

        <View style={styles.gridCard}>
          <View style={[styles.gridIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.25)' }]}>
            <Target size={20} color="#8b5cf6" />
          </View>
          <Text style={styles.gridLabel}>Savings Goal</Text>
          <Text style={styles.gridValue}>Rs. {target.toLocaleString()}</Text>
        </View>

        <View style={styles.gridCard}>
          <View style={[styles.gridIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.25)' }]}>
            <Wallet size={20} color="#3b82f6" />
          </View>
          <Text style={styles.gridLabel}>Budget Left</Text>
          <Text style={[styles.gridValue, { color: budgetLeft >= 0 ? '#3b82f6' : '#ef4444' }]}>
            Rs. {budgetLeft.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Forms Section */}
      <View style={styles.formsSection}>
        {/* Toggle Income Form */}
        <TouchableOpacity
          onPress={() => {
            setShowIncomeForm(!showIncomeForm);
            setShowExpenseForm(false);
          }}
          style={[styles.actionButton, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}
        >
          <Plus size={18} color="#10b981" />
          <Text style={[styles.actionButtonText, { color: '#10b981' }]}>Log New Income</Text>
        </TouchableOpacity>

        {showIncomeForm && (
          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>Income Source</Text>
            <TextInput
              placeholder="e.g. Salary, Freelance, Bonus"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={incomeSource}
              onChangeText={setIncomeSource}
              style={styles.input}
            />

            <Text style={styles.formLabel}>Amount (PKR)</Text>
            <TextInput
              placeholder="e.g. 50000"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
              value={incomeAmount}
              onChangeText={setIncomeAmount}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={handleAddIncome}
              disabled={incomeLoading}
              style={[styles.submitButton, { backgroundColor: '#10b981' }]}
            >
              {incomeLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Add Income</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Toggle Expense Form */}
        <TouchableOpacity
          onPress={() => {
            setShowExpenseForm(!showExpenseForm);
            setShowIncomeForm(false);
          }}
          style={[styles.actionButton, { borderColor: 'rgba(239, 68, 68, 0.3)', marginTop: 12 }]}
        >
          <Plus size={18} color="#ef4444" />
          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Log New Expense</Text>
        </TouchableOpacity>

        {showExpenseForm && (
          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>Category</Text>
            <View style={styles.categoryPicker}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setExpenseCategory(cat)}
                  style={[
                    styles.categoryChip,
                    expenseCategory === cat && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      expenseCategory === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Amount (PKR)</Text>
            <TextInput
              placeholder="e.g. 1500"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              style={styles.input}
            />

            <Text style={styles.formLabel}>Description (Optional)</Text>
            <TextInput
              placeholder="e.g. Weekly Groceries"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={expenseDesc}
              onChangeText={setExpenseDesc}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={handleAddExpense}
              disabled={expenseLoading}
              style={[styles.submitButton, { backgroundColor: '#ef4444' }]}
            >
              {expenseLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Add Expense</Text>}
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dateText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 4,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  allowanceCard: {
    backgroundColor: 'rgba(21, 28, 44, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  allowanceGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  allowanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  allowanceTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 1,
  },
  allowanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  allowanceDays: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  sectionCard: {
    backgroundColor: 'rgba(21, 28, 44, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    marginBottom: 20,
  },
  sliderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sliderInfoLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  sliderInfoVal: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  sliderTrackContainer: {
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderBgTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
  },
  sliderFillTrack: {
    height: 6,
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLimitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  limitText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridCard: {
    width: '48%',
    backgroundColor: 'rgba(21, 28, 44, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
  },
  gridIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  formsSection: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(21, 28, 44, 0.45)',
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: 'rgba(21, 28, 44, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: 'rgba(11, 15, 25, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    color: '#ffffff',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 8,
    fontSize: 14,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  categoryChipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  categoryChipTextActive: {
    color: '#ef4444',
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
