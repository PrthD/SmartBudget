import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { calculateTotalIncomeInInterval } from '../utils/incomeHelpers';
import { calculateTotalExpenseInInterval } from '../utils/expenseHelpers';
import moment from 'moment-timezone';

Chart.register(ArcElement, Tooltip, Legend, ChartDataLabels);

// Generate monthly data for income and expense
export const generateMonthlyData = (incomeData, expenseData) => {
  if (
    (!incomeData || incomeData.length === 0) &&
    (!expenseData || expenseData.length === 0)
  ) {
    return [];
  }

  const monthlyTotals = [];
  const startOfYear = moment().startOf('year');
  const currentMonth = moment().endOf('month');

  for (
    let month = startOfYear.clone();
    month.isSameOrBefore(currentMonth);
    month.add(1, 'month')
  ) {
    const monthStart = month.clone().startOf('month');
    const monthEnd = month.clone().endOf('month');

    const totalIncome = calculateTotalIncomeInInterval(
      incomeData,
      monthStart,
      monthEnd
    );
    const totalExpense = calculateTotalExpenseInInterval(
      expenseData,
      monthStart,
      monthEnd
    );

    monthlyTotals.push({
      month: month.format('MMM'),
      income: totalIncome,
      expenses: totalExpense,
    });
  }

  return monthlyTotals;
};

// Generate savings data based on monthly data
export const generateSavingsData = (monthlyData) => {
  return monthlyData.map((data) => ({
    month: data.month,
    savings: data.income - data.expenses,
  }));
};

// Generalized function to generate a pie chart
export const createExpensePieChart = (
  ctx,
  data,
  options = {},
  breakdownMap,
  zeroCategories = []
) => {
  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: data.label || 'Distribution',
          data: data.values,
          backgroundColor: data.colors || [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#D4A5A5',
            '#8FD175',
            '#F1C232',
            '#76A5AF',
            '#B8860B',
            '#3CB371',
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            generateLabels: (chart) => {
              const labels = chart.data.labels.map((label, index) => {
                const { budget = 0, spent = 0 } = breakdownMap[label] || {};
                const suffix =
                  budget === 0 && spent > 0
                    ? ` (Expenses: $${spent.toFixed(2)})`
                    : '';
                return {
                  text: `${label} (${budget})${suffix}`,
                  fillStyle: chart.data.datasets[0].backgroundColor[index],
                };
              });

              zeroCategories.forEach((cat) => {
                const { spent = 0 } = breakdownMap[cat] || {};
                labels.push({
                  text: `${cat} (0)${spent > 0 ? ` (Expenses: $${spent.toFixed(2)})` : ''}`,
                  fillStyle: '#D3D3D3',
                });
              });

              return labels;
            },
          },
        },
        datalabels: {
          color: '#fff',
          formatter: (val, ctx2) => {
            const cat = ctx2.chart.data.labels[ctx2.dataIndex];
            const { spent = 0, budget = 0 } = breakdownMap[cat] || {};
            return `${cat}\n$${spent.toFixed(2)} / $${budget.toFixed(2)}`;
          },
          font: { size: 12, weight: 'bold' },
          align: 'end',
          clip: false,
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              const cat = tooltipItem.label;
              const { spent = 0, budget = 0 } = breakdownMap[cat] || {};
              if (budget === 0 && spent > 0) {
                return `Expenses Present: $${spent.toFixed(2)}, Budget: $${budget.toFixed(2)}`;
              }
              return `Spent: $${spent.toFixed(2)}, Budget: $${budget.toFixed(2)}`;
            },
          },
        },
      },
      ...options,
    },
  });
};

export const createIncomePieChart = (
  ctx,
  data,
  options = {},
  breakdownMap,
  zeroSources = []
) => {
  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: data.label || 'Income Goal Distribution',
          data: data.values,
          backgroundColor: data.colors || [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#D4A5A5',
            '#8FD175',
            '#F1C232',
            '#76A5AF',
            '#B8860B',
            '#3CB371',
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            generateLabels: (chart) => {
              const labels = chart.data.labels.map((label, index) => {
                const { earned = 0, goal = 0 } = breakdownMap[label] || {};
                const suffix =
                  goal === 0 && earned > 0
                    ? ` (Earned: $${earned.toFixed(2)})`
                    : '';
                return {
                  text: `${label} (${goal})${suffix}`,
                  fillStyle: chart.data.datasets[0].backgroundColor[index],
                };
              });

              zeroSources.forEach((source) => {
                const { earned = 0 } = breakdownMap[source] || {};
                labels.push({
                  text: `${source} (0)${
                    earned > 0 ? ` (Earned: $${earned.toFixed(2)})` : ''
                  }`,
                  fillStyle: '#D3D3D3',
                });
              });

              return labels;
            },
          },
        },
        datalabels: {
          color: '#fff',
          formatter: (val, ctx2) => {
            const source = ctx2.chart.data.labels[ctx2.dataIndex];
            const { earned = 0, goal = 0 } = breakdownMap[source] || {};
            return `${source}\n$${earned.toFixed(2)} / $${goal.toFixed(2)}`;
          },
          font: { size: 12, weight: 'bold' },
          align: 'end',
          clip: false,
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              const source = tooltipItem.label;
              const { earned = 0, goal = 0 } = breakdownMap[source] || {};
              if (goal === 0 && earned > 0) {
                return `Earned: $${earned.toFixed(2)}, Goal: $${goal.toFixed(2)}`;
              }
              return `Earned: $${earned.toFixed(2)}, Goal: $${goal.toFixed(2)}`;
            },
          },
        },
      },
      ...options,
    },
  });
};

export const createSavingsPieChart = (
  ctx,
  data,
  options = {},
  breakdownMap,
  zeroCategories = []
) => {
  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: data.label || 'Savings Distribution',
          data: data.values,
          backgroundColor: data.colors || [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#D4A5A5',
            '#8FD175',
            '#F1C232',
            '#76A5AF',
            '#B8860B',
            '#3CB371',
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            generateLabels: (chart) => {
              const labels = chart.data.labels.map((label, index) => {
                const {
                  allocated = 0,
                  current = 0,
                  target = 0,
                } = breakdownMap[label] || {};
                const totalAllocated = allocated + current;
                const suffix =
                  target === 0 && totalAllocated > 0
                    ? ` (Allocated: $${totalAllocated.toFixed(2)})`
                    : '';
                return {
                  text: `${label} (${target})${suffix}`,
                  fillStyle: chart.data.datasets[0].backgroundColor[index],
                };
              });

              zeroCategories.forEach((cat) => {
                const { allocated = 0, current = 0 } = breakdownMap[cat] || {};
                const totalAllocated = allocated + current;
                labels.push({
                  text: `${cat} (0)${
                    totalAllocated > 0
                      ? ` (Allocated: $${totalAllocated.toFixed(2)})`
                      : ''
                  }`,
                  fillStyle: '#D3D3D3',
                });
              });

              return labels;
            },
          },
        },
        datalabels: {
          color: '#fff',
          formatter: (val, ctx2) => {
            const cat = ctx2.chart.data.labels[ctx2.dataIndex];
            const {
              allocated = 0,
              current = 0,
              target = 0,
            } = breakdownMap[cat] || {};
            const totalAllocated = allocated + current;
            return `${cat}\n$${totalAllocated.toFixed(2)} / $${target.toFixed(2)}`;
          },
          font: { size: 12, weight: 'bold' },
          align: 'end',
          clip: false,
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              const cat = tooltipItem.label;
              const { allocated = 0, target = 0 } = breakdownMap[cat] || {};
              if (target === 0 && allocated > 0) {
                return `Allocated: $${allocated.toFixed(
                  2
                )}, Target: $${target.toFixed(2)}`;
              }
              return `Allocated: $${allocated.toFixed(
                2
              )}, Target: $${target.toFixed(2)}`;
            },
          },
        },
      },
      ...options,
    },
  });
};

// Function to create vertical gradient for bar charts
export function createVerticalGradient(ctx, colorStart, colorEnd, area) {
  const gradient = ctx.createLinearGradient(0, 0, 0, area.bottom);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  return gradient;
}

// Custom tooltip callback
export const customTooltipCallbacks = {
  title: (tooltipItems) => {
    if (!tooltipItems.length) return '';
    return tooltipItems[0].label;
  },
  label: (tooltipItem) => {
    const { formattedValue } = tooltipItem;
    return `Value: ${formattedValue}`;
  },
};

// Plugin to show values on top of bars or slices
export const showDataLabelsPlugin = {
  id: 'showDataLabelsPlugin',
  afterDatasetsDraw: (chart) => {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      if (!meta || !meta.data) return;
      meta.data.forEach((element, index) => {
        if (!dataset.data[index] && dataset.data[index] !== 0) return;

        const { x, y } = element.tooltipPosition();
        const dataString = dataset.data[index].toLocaleString();

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(dataString, x, y - 5);
        ctx.restore();
      });
    });
  },
};
