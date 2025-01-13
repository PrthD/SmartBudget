import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import PropTypes from 'prop-types';

const MonthlyTrendsChart = ({ monthlyData = [] }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!Array.isArray(monthlyData) || !monthlyData.length) {
      return;
    }

    const ctx = chartRef.current.getContext('2d');

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = monthlyData.map((d) => d.month);
    const incomes = monthlyData.map((d) => d.income);
    const expenses = monthlyData.map((d) => d.expenses);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomes,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 8,
            tension: 0.3,
          },
          {
            label: 'Expenses',
            data: expenses,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 8,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1200,
          easing: 'easeOutQuart',
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed.y;
                return `${ctx.dataset.label}: $${val.toLocaleString()}`;
              },
            },
          },
          legend: {
            position: 'top',
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Month',
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Amount',
            },
            beginAtZero: true,
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [monthlyData]);

  if (!Array.isArray(monthlyData) || !monthlyData.length) {
    return <div className="no-data">No monthly trend data available</div>;
  }

  return (
    <div
      className="chart"
      style={{ height: '400px' }}
      role="img"
      aria-label="Line chart showing monthly income and expense trends"
    >
      <canvas ref={chartRef} />
    </div>
  );
};

MonthlyTrendsChart.propTypes = {
  monthlyData: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      income: PropTypes.number.isRequired,
      expenses: PropTypes.number.isRequired,
    })
  ),
};

export default MonthlyTrendsChart;
