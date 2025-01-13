import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import DataLabelsPlugin from 'chartjs-plugin-datalabels';
import PropTypes from 'prop-types';

ChartJS.register(ArcElement, Tooltip, Legend, DataLabelsPlugin);

const IncomeVsExpenseChart = ({ totalIncome = 0, totalExpense = 0 }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof totalIncome !== 'number' || typeof totalExpense !== 'number') {
      return;
    }

    const ctx = chartRef.current.getContext('2d');

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new ChartJS(ctx, {
      type: 'pie',
      data: {
        labels: ['Income', 'Expense'],
        datasets: [
          {
            label: 'Income vs Expense',
            data: [totalIncome, totalExpense],
            backgroundColor: ['#36a2eb', '#ff6384'],
            hoverOffset: 12,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed;
                return `${ctx.label}: $${val.toLocaleString()}`;
              },
            },
          },
          datalabels: {
            anchor: 'center',
            align: 'center',
            formatter: (value, context) => {
              const dataset = context.dataset;
              const total = dataset.data.reduce((acc, val) => acc + val, 0);
              const percent = (value / total) * 100 || 0;
              return `${percent.toFixed(1)}%`;
            },
            font: {
              weight: 'bold',
            },
            color: '#333',
            padding: 5,
          },
        },
        animation: {
          animateScale: true,
          duration: 1000,
        },
        layout: {
          padding: {
            top: 20,
            bottom: 20,
          },
        },
        elements: {
          arc: {
            borderWidth: 2,
            borderColor: '#fff',
          },
        },
        cutout: '0%',
        clip: true,
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [totalIncome, totalExpense]);

  if (typeof totalIncome !== 'number' || typeof totalExpense !== 'number') {
    return <div className="no-data">Invalid Income/Expense values</div>;
  }

  return (
    <div
      style={{ width: '100%', height: '400px' }}
      role="img"
      aria-label="Pie chart showing total income vs total expenses"
    >
      <canvas ref={chartRef} />
    </div>
  );
};

IncomeVsExpenseChart.propTypes = {
  totalIncome: PropTypes.number,
  totalExpense: PropTypes.number,
};

export default IncomeVsExpenseChart;
