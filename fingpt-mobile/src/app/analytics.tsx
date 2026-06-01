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
  Dimensions,
  RefreshControl,
} from 'react-native';
import Svg, { Circle, Rect, G } from 'react-native-svg';
import { Search, Trash2, Calendar, Tag, AlertTriangle } from 'lucide-react-native';
import { api } from '../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

const CATEGORY_COLORS: { [key: string]: string } = {
  Food: '#ef4444',         // Red
  Fuel: '#f59e0b',         // Amber
  Transport: '#3b82f6',    // Blue
  Education: '#8b5cf6',    // Purple
  Shopping: '#ec4899',     // Pink
  Bills: '#10b981',        // Green
  Entertainment: '#d946ef',// Magenta
  Health: '#14b8a6',       // Teal
  Other: '#6b7280',        // Grey
};

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Food', 'Fuel', 'Transport', 'Education', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const analyticsData = await api.get('/finance/analytics/dashboard');
      const expensesList = await api.get('/finance/expense');
      setAnalytics(analyticsData);
      setExpenses(expensesList);
    } catch (err: any) {
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/finance/expense/${id}`);
              // Refresh
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete expense.');
            }
          },
        },
      ]
    );
  };

  if (loading && !analytics) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Calculate filtered expenses
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exp.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 1. Doughnut Chart configuration
  const categoryAnalytics = analytics?.categoryAnalytics || [];
  const totalSpent = analytics?.basicAnalytics?.totalExpenses || 0;
  
  // Filter out zero amount categories for doughnut chart
  const activeSlices = categoryAnalytics.filter((c: any) => c.amount > 0);
  
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  // 2. Bar Chart Configuration (Last 15 days)
  const dailyTrends = analytics?.basicAnalytics?.last15DaysData || [];
  const maxSpend = Math.max(...dailyTrends.map((t: any) => t.amount), 500); // minimum 500 for scaling

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
      }
    >
      <Text style={styles.title}>Spending Analytics</Text>
      <Text style={styles.subtitle}>Insightful breakdown of your monthly payouts</Text>

      {/* Doughnut Chart Section */}
      <View style={styles.chartCard}>
        <Text style={styles.cardHeader}>Category Distribution</Text>
        {totalSpent === 0 ? (
          <View style={styles.emptyChartState}>
            <AlertTriangle size={32} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyStateText}>No expense data for this month yet.</Text>
          </View>
        ) : (
          <View style={styles.pieRow}>
            {/* SVG Doughnut */}
            <View style={styles.svgContainer}>
              <Svg width={140} height={140} viewBox="0 0 120 120">
                <G rotation="-90" origin="60, 60">
                  {/* Background Track */}
                  <Circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="12"
                  />
                  {activeSlices.map((slice: any, index: number) => {
                    const strokeDashoffset = currentOffset;
                    const strokeDasharray = `${(slice.amount / totalSpent) * circumference} ${circumference}`;
                    currentOffset += (slice.amount / totalSpent) * circumference;
                    
                    return (
                      <Circle
                        key={index}
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="transparent"
                        stroke={CATEGORY_COLORS[slice.category] || '#6b7280'}
                        strokeWidth="12"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  })}
                </G>
              </Svg>
              <View style={styles.pieCenterLabel}>
                <Text style={styles.pieCenterTitle}>Total Spent</Text>
                <Text style={styles.pieCenterVal}>Rs. {totalSpent.toLocaleString()}</Text>
              </View>
            </View>

            {/* Legends */}
            <View style={styles.legendContainer}>
              {activeSlices.map((slice: any, index: number) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendIndicator, { backgroundColor: CATEGORY_COLORS[slice.category] }]} />
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    {slice.category}: <Text style={styles.legendPct}>{slice.percentage}%</Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Daily Trends Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.cardHeader}>Daily Spending (Last 15 Days)</Text>
        {dailyTrends.length === 0 ? (
          <Text style={styles.emptyStateText}>No trend data available.</Text>
        ) : (
          <View style={styles.barChartWrapper}>
            <Svg width="100%" height={150} style={styles.barSvg}>
              {dailyTrends.map((trend: any, idx: number) => {
                const barWidth = 14;
                const gap = 6;
                const x = idx * (barWidth + gap) + 10;
                const barHeight = (trend.amount / maxSpend) * 110; // map to max height of 110
                const y = 120 - barHeight;

                return (
                  <G key={idx}>
                    {/* Bar Background Track */}
                    <Rect
                      x={x}
                      y={10}
                      width={barWidth}
                      height={110}
                      fill="rgba(255,255,255,0.02)"
                      rx={3}
                    />
                    {/* Active Bar */}
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 2)}
                      fill={trend.amount > 0 ? '#3b82f6' : 'rgba(255,255,255,0.1)'}
                      rx={3}
                    />
                  </G>
                );
              })}
            </Svg>
            {/* Bar labels (dates) */}
            <View style={styles.barLabelsContainer}>
              <Text style={styles.barLabel}>{dailyTrends[0]?.date}</Text>
              <Text style={styles.barLabel}>{dailyTrends[Math.floor(dailyTrends.length / 2)]?.date}</Text>
              <Text style={styles.barLabel}>{dailyTrends[dailyTrends.length - 1]?.date}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Transaction History Logs */}
      <View style={styles.historySection}>
        <Text style={styles.sectionHeader}>Transaction Log</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color="rgba(255, 255, 255, 0.4)" style={styles.searchIcon} />
          <TextInput
            placeholder="Search transactions..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Category Horizontal Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.filterChip,
                selectedCategory === cat && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat && styles.filterChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Expense List */}
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyListState}>
            <Text style={styles.emptyStateText}>No matching expenses found.</Text>
          </View>
        ) : (
          filteredExpenses.map((exp) => (
            <View key={exp.id} style={styles.expenseCard}>
              <View style={[styles.categoryColorDot, { backgroundColor: CATEGORY_COLORS[exp.category] || '#6b7280' }]} />
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseDesc}>{exp.description || exp.category}</Text>
                <View style={styles.expenseMetaRow}>
                  <View style={styles.metaBadge}>
                    <Tag size={10} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.metaBadgeText}>{exp.category}</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Calendar size={10} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.metaBadgeText}>
                      {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.expenseActionCol}>
                <Text style={styles.expenseAmount}>Rs. {exp.amount.toLocaleString()}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteExpense(exp.id)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
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
  chartCard: {
    backgroundColor: 'rgba(21, 28, 44, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  svgContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pieCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  pieCenterTitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  pieCenterVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
    textAlign: 'center',
  },
  legendContainer: {
    flex: 1,
    marginLeft: 20,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  legendPct: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyChartState: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyStateText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
  },
  barChartWrapper: {
    alignItems: 'center',
  },
  barSvg: {
    marginBottom: 8,
  },
  barLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  barLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
  historySection: {
    marginTop: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  filtersScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyListState: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 28, 44, 0.65)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 12,
  },
  categoryColorDot: {
    width: 6,
    height: 40,
    borderRadius: 3,
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  expenseDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  expenseMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  expenseActionCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  deleteBtn: {
    padding: 4,
  },
});
