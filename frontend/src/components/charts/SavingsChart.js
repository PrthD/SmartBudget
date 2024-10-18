import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import PropTypes from 'prop-types';

const SavingsChart = ({ savingsData }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

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

SavingsChart.propTypes = {
  savingsData: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      savings: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default SavingsChart;
