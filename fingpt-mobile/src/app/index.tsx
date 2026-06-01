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
  Modal,
} from 'react-native';
import { 
  LogOut, 
  Plus, 
  Landmark, 
  ArrowUpRight, 
  ArrowDownRight, 
  Target, 
  Shield, 
  Wallet,
  Settings,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  ShieldAlert,
  Coins,
  Smartphone,
  CreditCard
} from 'lucide-react-native';
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
  const [incomeAccount, setIncomeAccount] = useState('Cash');
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeLoading, setIncomeLoading] = useState(false);

  // Quick Add Expense Form
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAccount, setExpenseAccount] = useState('Cash');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);

  // Savings Target Slider State
  const [sliderWidth, setSliderWidth] = useState(0);
  const [tempSavingsTarget, setTempSavingsTarget] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  // System Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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
        account_type: incomeAccount,
      });
      setIncomeSource('');
      setIncomeAmount('');
      setIncomeAccount('Cash');
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
        account_type: expenseAccount,
      });
      setExpenseAmount('');
      setExpenseDesc('');
      setExpenseAccount('Cash');
      setShowExpenseForm(false);
      fetchSummary();
      Alert.alert('Success', 'Expense logged successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add expense.');
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Warning', 'All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Warning', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Warning', 'New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      Alert.alert('Success', 'Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowSettings(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to change password. Double check your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Danger Zone: Reset Vault',
      'Are you absolutely sure you want to delete all transaction records, budgets, and savings goals? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Everything', 
          style: 'destructive',
          onPress: async () => {
            setResetLoading(true);
            try {
              await api.post('/finance/reset', {});
              Alert.alert('Success', 'All financial data has been wiped.');
              setShowSettings(false);
              fetchSummary();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to reset data.');
            } finally {
              setResetLoading(false);
            }
          }
        }
      ]
    );
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
  const isDeficit = spent > remainingBudget;
  const deficitAmount = isDeficit ? spent - remainingBudget : 0;
  const budgetLeft = Math.max(0, remainingBudget - spent);
  const progressPct = income > 0 ? (target / income) * 100 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0f19' }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.welcomeText} numberOfLines={1}>Hello, {user?.name || 'User'}</Text>
            <Text style={styles.dateText}>Finance Dashboard • {summary?.month || 'Current Month'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsBtn}>
              <Settings size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <LogOut size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

      {/* Daily Allowance Glowing Banner */}
      <View style={[styles.allowanceCard, isDeficit && { borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
        <View style={[styles.allowanceGlow, isDeficit && { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]} />
        <View style={styles.allowanceHeader}>
          {isDeficit ? (
            <ShieldAlert size={18} color="#ef4444" />
          ) : (
            <Shield size={18} color="#3b82f6" />
          )}
          <Text style={[styles.allowanceTitle, isDeficit && { color: '#ef4444' }]}>
            {isDeficit ? 'BUDGET DEFICIT' : 'DAILY SPENDING ALLOWANCE'}
          </Text>
        </View>
        <Text style={styles.allowanceAmount}>
          Rs. {Math.max(0, summary?.dailySpendingAllowance || 0).toLocaleString()}
        </Text>
        {isDeficit ? (
          <Text style={styles.allowanceDays}>
            Overspent by Rs. {deficitAmount.toLocaleString()} with {summary?.remainingDays || '0'} days left this month
          </Text>
        ) : (
          <Text style={styles.allowanceDays}>
            Safe daily limit for the remaining {summary?.remainingDays || '0'} days
          </Text>
        )}
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
          <View style={[styles.gridIconContainer, isDeficit ? { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.25)' } : { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.25)' }]}>
            <Wallet size={20} color={isDeficit ? '#ef4444' : '#3b82f6'} />
          </View>
          <Text style={styles.gridLabel}>Budget Left</Text>
          <Text style={[styles.gridValue, { color: isDeficit ? '#ef4444' : '#3b82f6' }]}>
            Rs. {budgetLeft.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Wallet Accounts Breakdown Section */}
      <View style={styles.sectionCard}>
        <View style={styles.walletHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Wallet size={18} color="#3b82f6" />
              <Text style={styles.cardTitle}>Wallet Accounts</Text>
            </View>
            <Text style={styles.cardSubtext}>Real-time balances across your payment methods</Text>
          </View>
          <View style={styles.totalBalanceBadge}>
            <Text style={styles.totalBalanceBadgeLabel}>TOTAL BALANCE</Text>
            <Text style={styles.totalBalanceBadgeVal}>
              Rs. {summary?.totalBalance?.toLocaleString() || '0'}
            </Text>
          </View>
        </View>

        <View style={styles.walletGrid}>
          {/* Cash Card */}
          <View style={[styles.walletCard, { borderColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <View style={[styles.walletIconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }]}>
              <Coins size={16} color="#f59e0b" />
            </View>
            <View style={styles.walletCardInfo}>
              <Text style={styles.walletCardLabel}>Cash</Text>
              <Text style={styles.walletCardVal} numberOfLines={1}>
                Rs. {summary?.accountBalances?.Cash?.toLocaleString() || '0'}
              </Text>
            </View>
          </View>

          {/* EasyPaisa Card */}
          <View style={[styles.walletCard, { borderColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <View style={[styles.walletIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Smartphone size={16} color="#10b981" />
            </View>
            <View style={styles.walletCardInfo}>
              <Text style={styles.walletCardLabel}>EasyPaisa</Text>
              <Text style={styles.walletCardVal} numberOfLines={1}>
                Rs. {summary?.accountBalances?.EasyPaisa?.toLocaleString() || '0'}
              </Text>
            </View>
          </View>

          {/* JazzCash Card */}
          <View style={[styles.walletCard, { borderColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <View style={[styles.walletIconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <CreditCard size={16} color="#ef4444" />
            </View>
            <View style={styles.walletCardInfo}>
              <Text style={styles.walletCardLabel}>JazzCash</Text>
              <Text style={styles.walletCardVal} numberOfLines={1}>
                Rs. {summary?.accountBalances?.JazzCash?.toLocaleString() || '0'}
              </Text>
            </View>
          </View>

          {/* Bank Card */}
          <View style={[styles.walletCard, { borderColor: 'rgba(139, 92, 246, 0.15)' }]}>
            <View style={[styles.walletIconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <Landmark size={16} color="#8b5cf6" />
            </View>
            <View style={styles.walletCardInfo}>
              <Text style={styles.walletCardLabel}>Bank</Text>
              <Text style={styles.walletCardVal} numberOfLines={1}>
                Rs. {summary?.accountBalances?.Bank?.toLocaleString() || '0'}
              </Text>
            </View>
          </View>
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

            <Text style={styles.formLabel}>Deposit To</Text>
            <View style={styles.accountPicker}>
              {['Cash', 'EasyPaisa', 'JazzCash', 'Bank'].map((acc) => (
                <TouchableOpacity
                  key={acc}
                  onPress={() => setIncomeAccount(acc)}
                  style={[
                    styles.accountChip,
                    incomeAccount === acc && styles.accountChipActiveGreen,
                  ]}
                >
                  <Text
                    style={[
                      styles.accountChipText,
                      incomeAccount === acc && styles.accountChipTextActiveGreen,
                    ]}
                  >
                    {acc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleAddIncome}
              disabled={incomeLoading}
              style={[styles.submitButton, { backgroundColor: '#10b981', marginTop: 8 }]}
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

            <Text style={styles.formLabel}>Paid From</Text>
            <View style={styles.accountPicker}>
              {['Cash', 'EasyPaisa', 'JazzCash', 'Bank'].map((acc) => (
                <TouchableOpacity
                  key={acc}
                  onPress={() => setExpenseAccount(acc)}
                  style={[
                    styles.accountChip,
                    expenseAccount === acc && styles.accountChipActiveRed,
                  ]}
                >
                  <Text
                    style={[
                      styles.accountChipText,
                      expenseAccount === acc && styles.accountChipTextActiveRed,
                    ]}
                  >
                    {acc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleAddExpense}
              disabled={expenseLoading}
              style={[styles.submitButton, { backgroundColor: '#ef4444', marginTop: 8 }]}
            >
              {expenseLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Add Expense</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>

    <Modal
      visible={showSettings}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSettings(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>System Settings</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {/* Change Password Form */}
            <View style={styles.cardSection}>
              <View style={styles.sectionHeader}>
                <Lock size={18} color="#3b82f6" />
                <Text style={styles.sectionTitle}>Change Password</Text>
              </View>

              <Text style={styles.formLabel}>Current Password</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  placeholder="Current Password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!showOldPassword}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  style={styles.modalInput}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} style={{ padding: 4 }}>
                  {showOldPassword ? <EyeOff size={16} color="rgba(255,255,255,0.4)" /> : <Eye size={16} color="rgba(255,255,255,0.4)" />}
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>New Password</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  placeholder="At least 6 characters"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  style={styles.modalInput}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={{ padding: 4 }}>
                  {showNewPassword ? <EyeOff size={16} color="rgba(255,255,255,0.4)" /> : <Eye size={16} color="rgba(255,255,255,0.4)" />}
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>Confirm New Password</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  placeholder="Re-enter new password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.modalInput}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
                  {showConfirmPassword ? <EyeOff size={16} color="rgba(255,255,255,0.4)" /> : <Eye size={16} color="rgba(255,255,255,0.4)" />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={passwordLoading}
                style={[styles.submitButton, { backgroundColor: '#3b82f6', marginTop: 16 }]}
              >
                {passwordLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Danger Zone Card */}
            <View style={[styles.cardSection, { borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.02)', marginTop: 20 }]}>
              <View style={styles.sectionHeader}>
                <ShieldAlert size={18} color="#ef4444" />
                <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
              </View>
              <Text style={styles.dangerText}>
                Resetting all vault data deletes all records of incomes, expenses, budgets, saving goals, and chat history. This action is permanent and cannot be undone.
              </Text>
              <TouchableOpacity
                onPress={handleResetData}
                disabled={resetLoading}
                style={[styles.submitButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: '#ef4444', marginTop: 12 }]}
              >
                {resetLoading ? (
                  <ActivityIndicator color="#ef4444" />
                ) : (
                  <Text style={[styles.submitButtonText, { color: '#ef4444' }]}>Reset All Vault Data</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0b0f19',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  modalScroll: {
    paddingBottom: 20,
  },
  cardSection: {
    backgroundColor: 'rgba(21, 28, 44, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  modalInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  dangerText: {
    fontSize: 12,
    color: '#ef4444',
    lineHeight: 18,
    marginBottom: 8,
  },
  walletHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
    marginBottom: 16,
  },
  totalBalanceBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  totalBalanceBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 0.5,
  },
  totalBalanceBadgeVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  walletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  walletCard: {
    width: '48%',
    backgroundColor: 'rgba(21, 28, 44, 0.45)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletCardInfo: {
    flex: 1,
  },
  walletCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.45)',
  },
  walletCardVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  accountPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  accountChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  accountChipActiveGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  accountChipActiveRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  accountChipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  accountChipTextActiveGreen: {
    color: '#10b981',
    fontWeight: '600',
  },
  accountChipTextActiveRed: {
    color: '#ef4444',
    fontWeight: '600',
  },
});
