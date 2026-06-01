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
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { Sparkles, Activity, AlertTriangle, AlertCircle, CheckCircle, Shield, DollarSign } from 'lucide-react-native';
import { api } from '../services/api';

export default function InsightsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  // Scenario Simulator
  const [extraSavings, setExtraSavings] = useState(5000);

  // Digital Twin Simulator
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [twinResult, setTwinResult] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await api.get('/finance/analytics/dashboard');
      setAnalytics(data);
    } catch (err: any) {
      console.error('Fetch insights error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSimulatePurchase = () => {
    if (!itemPrice || isNaN(parseFloat(itemPrice)) || parseFloat(itemPrice) <= 0) {
      Alert.alert('Warning', 'Please enter a valid purchase price.');
      return;
    }
    const price = parseFloat(itemPrice);
    const item = itemName.trim() || 'Unspecified Item';

    const basic = analytics?.basicAnalytics || {};
    const budgetRemaining = basic.budgetRemaining || 0;
    const totalIncome = basic.totalIncome || 0;
    const totalExpenses = basic.totalExpenses || 0;
    const currentHealth = analytics?.budgetIntelligence?.healthScore || 100;
    const safeDailyLimit = analytics?.budgetIntelligence?.safeDailyLimit || 0;
    const remainingDays = basic.remainingDays || 30;

    let recommendation = 'Approved';
    let riskStatus = 'Safe';
    let color = '#10b981'; // Green
    let advice = `Approved: This purchase fits within your remaining spending budget of Rs. ${budgetRemaining.toLocaleString()}. Your daily limit remains safe.`;
    let simulatedScore = currentHealth;

    if (budgetRemaining >= price) {
      recommendation = 'Approved';
      riskStatus = 'Safe';
      color = '#10b981';
      simulatedScore = Math.max(0, currentHealth - 2);
    } else if (totalIncome - totalExpenses - price >= 0) {
      recommendation = 'Warning (Savings at Risk)';
      riskStatus = 'At Risk';
      color = '#f59e0b'; // Amber
      const impact = price - budgetRemaining;
      advice = `Warning: This purchase exceeds your monthly spending allowance by Rs. ${impact.toLocaleString()}. Buying this will reduce your reserved savings target.`;
      simulatedScore = Math.max(0, currentHealth - 15);
    } else {
      recommendation = 'Denied (Budget Deficit)';
      riskStatus = 'Critically At Risk';
      color = '#ef4444'; // Red
      const deficit = price - (totalIncome - totalExpenses);
      advice = `Denied: This purchase creates a deficit of Rs. ${deficit.toLocaleString()}. Purchasing this will require dipping into emergency savings or borrowing funds.`;
      simulatedScore = Math.max(0, currentHealth - 35);
    }

    const simBudgetRemaining = budgetRemaining - price;
    const simDailyLimit = Math.max(0, simBudgetRemaining) / remainingDays;

    setTwinResult({
      item,
      price,
      recommendation,
      riskStatus,
      color,
      advice,
      simulatedScore,
      scoreDelta: simulatedScore - currentHealth,
      simDailyLimit: parseFloat(simDailyLimit.toFixed(2)),
      dailyLimitDelta: simDailyLimit - safeDailyLimit,
    });
  };

  if (loading && !analytics) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Fallbacks
  const basic = analytics?.basicAnalytics || { totalIncome: 0, totalExpenses: 0, budgetRemaining: 0, remainingDays: 1 };
  const budgetIntel = analytics?.budgetIntelligence || { healthScore: 100, monthProgressPct: 0, budgetUsedPct: 0, safeDailyLimit: 0, burnRateWarning: 'On track', deductions: [] };
  const patterns = analytics?.patternDetection || { dayPatternMessage: '', timePatternMessage: '', recurringSuggestions: [] };
  const predict = analytics?.predictiveAnalytics || { goalCompletionPredictions: [] };
  const aiInsights = analytics?.aiInsights || [];

  // Health score color
  const score = budgetIntel.healthScore;
  const healthColor = score >= 80 ? '#10b981' : (score >= 60 ? '#f59e0b' : '#ef4444');
  const grade = score >= 80 ? 'A' : (score >= 60 ? 'B' : 'C');

  // SVG Dial Math
  const r = 45;
  const circ = 2 * Math.PI * r;
  const strokeOffset = circ - (score / 100) * circ;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
      }
    >
      <Text style={styles.title}>AI Insights & Twin</Text>
      <Text style={styles.subtitle}>Simulations and patterns from your digital twin</Text>

      {/* Health Score Circular Dial Card */}
      <View style={styles.gridCard}>
        <View style={styles.cardHeaderRow}>
          <Activity size={18} color="#8b5cf6" />
          <Text style={styles.cardLabel}>Financial Health Score</Text>
        </View>

        <View style={styles.dialWrapper}>
          <Svg width={130} height={130} viewBox="0 0 100 100">
            <G rotation="-90" origin="50, 50">
              <Circle
                cx="50"
                cy="50"
                r={r}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="8"
              />
              <Circle
                cx="50"
                cy="50"
                r={r}
                fill="transparent"
                stroke={healthColor}
                strokeWidth="8"
                strokeDasharray={circ}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
              />
            </G>
          </Svg>
          <View style={styles.dialLabelContainer}>
            <Text style={styles.dialNumber}>{score}</Text>
            <View style={[styles.gradeBadge, { backgroundColor: `${healthColor}20`, borderColor: healthColor }]}>
              <Text style={[styles.gradeText, { color: healthColor }]}>Grade {grade}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.violationsText}>
          {budgetIntel.deductions.length === 0
            ? '✨ Perfect Score! You have zero budget violations.'
            : `Adjusted for ${budgetIntel.deductions.length} budget violations.`}
        </Text>
      </View>

      {/* Burn Rate Meters */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Budget Burn Rate</Text>
        <Text style={styles.cardSubtext}>{budgetIntel.burnRateWarning}</Text>

        <View style={styles.meterContainer}>
          <View style={styles.meterLabelRow}>
            <Text style={styles.meterLabel}>Month Progress</Text>
            <Text style={styles.meterValue}>{budgetIntel.monthProgressPct}%</Text>
          </View>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: `${budgetIntel.monthProgressPct}%`, backgroundColor: '#6b7280' }]} />
          </View>
        </View>

        <View style={styles.meterContainer}>
          <View style={styles.meterLabelRow}>
            <Text style={styles.meterLabel}>Budget Spent</Text>
            <Text style={styles.meterValue}>{budgetIntel.budgetUsedPct}%</Text>
          </View>
          <View style={styles.meterTrack}>
            <View
              style={[
                styles.meterFill,
                {
                  width: `${Math.min(100, budgetIntel.budgetUsedPct)}%`,
                  backgroundColor: budgetIntel.burnRateStatus === 'danger' ? '#ef4444' : (budgetIntel.burnRateStatus === 'warning' ? '#f59e0b' : '#10b981'),
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* What-If Purchase Digital Twin Simulator */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>What-If Purchase Simulator</Text>
        <Text style={styles.cardSubtext}>
          Query your digital twin before checking out. Test budget impact in real-time.
        </Text>

        <TextInput
          placeholder="Item Name (e.g. New Shoes, Tablet)"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={itemName}
          onChangeText={setItemName}
          style={styles.input}
        />

        <TextInput
          placeholder="Price (PKR)"
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="numeric"
          value={itemPrice}
          onChangeText={setItemPrice}
          style={styles.input}
        />

        <TouchableOpacity onPress={handleSimulatePurchase} style={styles.simulateBtn}>
          <Sparkles size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.simulateBtnText}>Simulate Purchase</Text>
        </TouchableOpacity>

        {twinResult && (
          <View style={[styles.resultCard, { borderColor: `${twinResult.color}40`, backgroundColor: `${twinResult.color}05` }]}>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultTitle, { color: twinResult.color }]}>
                {twinResult.recommendation}
              </Text>
              <Text style={styles.resultItem}>For: {twinResult.item}</Text>
            </View>
            <Text style={styles.resultAdvice}>{twinResult.advice}</Text>
            
            <View style={styles.resultImpactRow}>
              <View>
                <Text style={styles.impactLabel}>Simulated Health</Text>
                <Text style={styles.impactValue}>
                  {twinResult.simulatedScore} pts ({twinResult.scoreDelta > 0 ? '+' : ''}{twinResult.scoreDelta})
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.impactLabel}>Simulated Allowance</Text>
                <Text style={styles.impactValue}>
                  Rs. {twinResult.simDailyLimit}/day ({twinResult.dailyLimitDelta >= 0 ? '+' : ''}{twinResult.dailyLimitDelta.toFixed(0)})
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Scenario Timelines Simulator */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Savings Target Simulator</Text>
        <Text style={styles.cardSubtext}>
          Simulate putting extra funds into savings and check timeline impact.
        </Text>

        <View style={styles.adjustRow}>
          <TouchableOpacity
            onPress={() => setExtraSavings(Math.max(-10000, extraSavings - 2000))}
            style={styles.adjustBtn}
          >
            <Text style={styles.adjustBtnText}>- Rs. 2,000</Text>
          </TouchableOpacity>
          <View style={styles.adjustValContainer}>
            <Text style={styles.adjustVal}>+ Rs. {extraSavings.toLocaleString()}</Text>
            <Text style={styles.adjustValLabel}>Extra Monthly Savings</Text>
          </View>
          <TouchableOpacity
            onPress={() => setExtraSavings(Math.min(50000, extraSavings + 2000))}
            style={styles.adjustBtn}
          >
            <Text style={styles.adjustBtnText}>+ Rs. 2,000</Text>
          </TouchableOpacity>
        </View>

        {predict.goalCompletionPredictions.length === 0 ? (
          <Text style={styles.noGoalsText}>Create savings goals to simulate completion timelines.</Text>
        ) : (
          predict.goalCompletionPredictions.map((goal: any, idx: number) => {
            const baseVelocity = Math.max(2000, basic.totalIncome - basic.totalExpenses);
            const baseMonths = Math.ceil(goal.remainingAmount / baseVelocity);

            const simVelocity = Math.max(1000, baseVelocity + extraSavings);
            const simMonths = Math.ceil(goal.remainingAmount / simVelocity);

            const delta = baseMonths - simMonths;

            return (
              <View key={idx} style={styles.simGoalRow}>
                <View>
                  <Text style={styles.simGoalName}>{goal.goalName}</Text>
                  <Text style={styles.simGoalMonths}>
                    Takes: {simMonths} months {delta > 0 ? `(${delta} months faster!)` : ''}
                  </Text>
                </View>
                <Text style={styles.simGoalDate}>{goal.projectedDate}</Text>
              </View>
            );
          })
        )}
      </View>

      {/* Spending Warnings and Insights */}
      {aiInsights.length > 0 && (
        <View style={styles.insightsCard}>
          <Text style={styles.insightsHeader}>Active Digital Twin Alerts</Text>
          {aiInsights.map((insight: string, idx: number) => (
            <View key={idx} style={styles.insightAlert}>
              <AlertTriangle size={16} color="#f59e0b" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      )}
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
  gridCard: {
    backgroundColor: 'rgba(21, 28, 44, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  dialWrapper: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  dialLabelContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  dialNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  gradeBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  gradeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  violationsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: 'rgba(21, 28, 44, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 16,
  },
  meterContainer: {
    marginBottom: 14,
  },
  meterLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  meterValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  meterTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  input: {
    backgroundColor: 'rgba(11, 15, 25, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    color: '#ffffff',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
    fontSize: 14,
  },
  simulateBtn: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  simulateBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  resultItem: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  resultAdvice: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginBottom: 14,
  },
  resultImpactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingTop: 12,
  },
  impactLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 2,
  },
  impactValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(11, 15, 25, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  adjustBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adjustBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  adjustValContainer: {
    alignItems: 'center',
  },
  adjustVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  adjustValLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  noGoalsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginVertical: 12,
  },
  simGoalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  simGoalName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  simGoalMonths: {
    fontSize: 11,
    color: '#8b5cf6',
    marginTop: 2,
  },
  simGoalDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  insightsCard: {
    backgroundColor: 'rgba(21, 28, 44, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    padding: 20,
    marginBottom: 20,
  },
  insightsHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  insightAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
});
