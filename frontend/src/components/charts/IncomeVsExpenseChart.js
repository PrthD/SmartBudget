import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import PropTypes from 'prop-types';

const IncomeVsExpenseChart = ({ totalIncome, totalExpense }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Total Income', 'Total Expense'],
        datasets: [
          {
            label: 'Income vs Expense',
            data: [totalIncome, totalExpense],
            backgroundColor: ['#36a2eb', '#ff6384'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [totalIncome, totalExpense]);

  return (
    <div className="chart">
      <canvas ref={chartRef} width="400" height="400"></canvas>
    </div>
  );
};

IncomeVsExpenseChart.propTypes = {
  totalIncome: PropTypes.number.isRequired,
  totalExpense: PropTypes.number.isRequired,
};

export default IncomeVsExpenseChart;
