import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import PropTypes from 'prop-types';
import {
  createVerticalGradient,
  showDataLabelsPlugin,
} from '../../utils/chartHelpers';

const SavingsChart = ({ savingsData = [] }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!Array.isArray(savingsData) || !savingsData.length) {
      return;
    }

    const ctx = chartRef.current.getContext('2d');

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const gradient = createVerticalGradient(
      ctx,
      'rgba(75,192,192,1)',
      'rgba(153,102,255,1)',
      chartRef.current.getBoundingClientRect()
    );

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: savingsData.map((d) => d.month),
        datasets: [
          {
            label: 'Savings',
            data: savingsData.map((d) => d.savings),
            backgroundColor: gradient,
            borderWidth: 1,
            borderColor: '#999',
            hoverBackgroundColor: 'rgba(153,102,255,0.8)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeInOutCubic',
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.parsed.y || 0;
                return `Savings: $${val.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Month',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Amount',
            },
            beginAtZero: true,
          },
        },
      },
      plugins: [showDataLabelsPlugin],
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [savingsData]);

  if (!Array.isArray(savingsData) || !savingsData.length) {
    return <div className="no-data">No savings data available</div>;
  }

  return (
    <div
      className="chart"
      style={{ height: '400px' }}
      role="img"
      aria-label="Savings Bar Chart showing monthly savings data"
    >
      <canvas ref={chartRef} />
    </div>
  );
};

SavingsChart.propTypes = {
  savingsData: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      savings: PropTypes.number.isRequired,
    })
  ),
};

export default SavingsChart;
