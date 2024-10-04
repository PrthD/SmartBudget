import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import PropTypes from 'prop-types';

const MonthlyTrendsChart = ({ monthlyData }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null); // Reference to store the Chart instance

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    // Destroy existing chart instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Create new Chart instance
    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthlyData.map((data) => data.month),
        datasets: [
          {
            label: 'Income',
            data: monthlyData.map((data) => data.income),
            borderColor: '#36a2eb',
            fill: false,
          },
          {
            label: 'Expenses',
            data: monthlyData.map((data) => data.expenses),
            borderColor: '#ff6384',
            fill: false,
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

    // Cleanup function to destroy chart instance on component unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [monthlyData]);

  return (
    <div className="chart">
      <canvas ref={chartRef} width="600" height="400"></canvas>
    </div>
  );
};

// Prop-types validation for the component props
MonthlyTrendsChart.propTypes = {
  monthlyData: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      income: PropTypes.number.isRequired,
      expenses: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default MonthlyTrendsChart;
