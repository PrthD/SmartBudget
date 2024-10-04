import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import PropTypes from 'prop-types';

const SavingsChart = ({ savingsData }) => {
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
      type: 'bar',
      data: {
        labels: savingsData.map((data) => data.month),
        datasets: [
          {
            label: 'Savings',
            data: savingsData.map((data) => data.savings),
            backgroundColor: '#4bc0c0',
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
  }, [savingsData]);

  return (
    <div className="chart">
      <canvas ref={chartRef} width="600" height="400"></canvas>
    </div>
  );
};

// Prop-types validation for the component props
SavingsChart.propTypes = {
  savingsData: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      savings: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default SavingsChart;
