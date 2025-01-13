import React from 'react';
import PropTypes from 'prop-types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import SavingsChart from './SavingsChart';
import MonthlyTrendsChart from './MonthlyTrendsChart';
import IncomeVsExpenseChart from './IncomeVsExpenseChart';

const ChartSwiper = ({
  savingsChartData,
  monthlyChartData,
  totalIncome,
  totalExpense,
}) => {
  return (
    <div className="chart-swiper-container">
      <Swiper
        spaceBetween={30}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        modules={[Navigation, Pagination]}
        style={{ height: '500px' }}
      >
        {/* Slide #1: SavingsChart */}
        <SwiperSlide>
          <h3 className="swiper-slide-title">Savings Over Time</h3>
          <SavingsChart savingsData={savingsChartData} />
        </SwiperSlide>

        {/* Slide #2: MonthlyTrendsChart */}
        <SwiperSlide>
          <h3 className="swiper-slide-title">Monthly Trends</h3>
          <MonthlyTrendsChart monthlyData={monthlyChartData} />
        </SwiperSlide>

        {/* Slide #3: IncomeVsExpenseChart */}
        <SwiperSlide>
          <h3 className="swiper-slide-title">Income vs Expenses Overview</h3>
          <IncomeVsExpenseChart
            totalIncome={totalIncome}
            totalExpense={totalExpense}
          />
        </SwiperSlide>
      </Swiper>
    </div>
  );
};

ChartSwiper.propTypes = {
  savingsChartData: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      savings: PropTypes.number.isRequired,
    })
  ).isRequired,
  monthlyChartData: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      income: PropTypes.number.isRequired,
      expenses: PropTypes.number.isRequired,
    })
  ).isRequired,
  totalIncome: PropTypes.number.isRequired,
  totalExpense: PropTypes.number.isRequired,
};

export default ChartSwiper;
