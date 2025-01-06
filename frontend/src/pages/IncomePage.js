import React, { useState, useMemo, useEffect, useRef, useContext } from 'react';
import {
  fetchIncomes,
  deleteIncome,
  skipNextRecurrence,
} from '../services/incomeService';
import {
  formatIncomeData,
  groupIncomesBySource,
  calculateNextRecurrence,
  filterIncomes,
  sortByFields,
} from '../utils/incomeHelpers';
import IncomeForm from '../components/incomes/IncomeForm';
import IncomeSearch from '../components/incomes/IncomeSearch';
import IncomeSort from '../components/incomes/IncomeSort';
import NavBar from '../components/common/NavBar';
import Chart from 'react-apexcharts';
import IncomeCard from '../components/incomes/IncomeCard';
import GoalCard from '../components/incomes/GoalCard';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import noIncomesIllustration from '../assets/icons/no-incomes.svg';
import '../styles/incomes/IncomePage.css';
import moment from 'moment-timezone';
import { LoadingContext } from '../contexts/LoadingContext';
import { notifyError, notifySuccess } from '../utils/notificationService';

const IncomePage = () => {
  const [incomeData, setIncomeData] = useState([]);
  const [expandedIncome, setExpandedIncome] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState(null);
  const [highlightForm, setHighlightForm] = useState(false);
  const [isIncomesListVisible, setIsIncomesListVisible] = useState(true);
  const [sortedIncomes, setSortedIncomes] = useState([]);
  const [filteredIncomes, setFilteredIncomes] = useState([]);
  const [errorNotified, setErrorNotified] = useState(false);

  const { setLoading } = useContext(LoadingContext);

  const formSectionRef = useRef(null);

  useEffect(() => {
    fetchInitialIncomes();
  }, []);

  useEffect(() => {
    setFilteredIncomes(sortedIncomes);
  }, [sortedIncomes]);

  useEffect(() => {
    if (incomeData.length > 0) {
      const sorted = sortByFields(incomeData, ['date'], ['desc']);
      setSortedIncomes(sorted);
    } else {
      setSortedIncomes([]);
    }
  }, [incomeData]);

  const fetchInitialIncomes = async () => {
    try {
      setLoading(true);
      const incomes = await fetchIncomes();

      const formattedIncomes = formatIncomeData(incomes);

      setIncomeData(formattedIncomes);
      setErrorNotified(false);
    } catch (error) {
      if (!error.notified) {
        const errorMessage =
          error.response?.data?.error || 'Failed to fetch incomes.';
        notifyError(errorMessage);
        setErrorNotified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleValidationError = (message) => {
    notifyError(message);
  };

  const handleIncomeAdded = async (newIncome) => {
    try {
      setLoading(true);
      if (newIncome.frequency && newIncome.frequency !== 'once') {
        await fetchInitialIncomes();
      } else {
        setIncomeData((prevIncomes) => [...prevIncomes, newIncome]);
      }
      notifySuccess('Income added successfully!');
      setErrorNotified(false);
    } catch (error) {
      if (!error.notified) {
        const errorMessage =
          error.response?.data?.error || 'Failed to add income.';
        notifyError(errorMessage);
        setErrorNotified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditIncome = (income) => {
    setEditMode(true);
    setIncomeToEdit(income);

    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      const firstInput = formSectionRef.current.querySelector(
        'input, select, textarea'
      );
      if (firstInput) {
        firstInput.focus();
      }
    }

    setHighlightForm(true);

    setTimeout(() => {
      setHighlightForm(false);
    }, 2000);
  };

  const handleIncomeUpdated = async (updatedIncome) => {
    try {
      setLoading(true);
      if (updatedIncome.frequency && updatedIncome.frequency !== 'once') {
        await fetchInitialIncomes();
      } else {
        setIncomeData((prevIncomes) =>
          prevIncomes.map((income) =>
            income._id === updatedIncome._id ? updatedIncome : income
          )
        );
      }
      notifySuccess('Income updated successfully!');
      setEditMode(false);
      setIncomeToEdit(null);
      setErrorNotified(false);
    } catch (error) {
      if (!error.notified) {
        const errorMessage =
          error.response?.data?.error || 'Failed to update income.';
        notifyError(errorMessage);
        setErrorNotified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIncome = async (id) => {
    try {
      setLoading(true);
      setIncomeData((prevIncomes) =>
        prevIncomes.filter(
          (income) => income._id !== id && income.originalIncomeId !== id
        )
      );
      await deleteIncome(id);
      notifySuccess('Income deleted successfully.');
      setErrorNotified(false);
    } catch (error) {
      if (!errorNotified) {
        const errorMessage =
          error.response?.data?.error || 'Failed to delete income.';
        notifyError(errorMessage);
        setErrorNotified(true);
      }
      await fetchInitialIncomes();
    } finally {
      setLoading(false);
    }
  };

  const handleSkipNextRecurrence = async (incomeId, dateToSkip) => {
    try {
      setLoading(true);
      await skipNextRecurrence(incomeId, dateToSkip);

      await fetchInitialIncomes();

      setIncomeData((prevIncomes) =>
        prevIncomes.map((income) => {
          if (income._id === incomeId) {
            const updatedSkippedDates = [
              ...(income.skippedDates || []),
              dateToSkip,
            ];

            const nextRecurrence = calculateNextRecurrence({
              ...income,
              skippedDates: updatedSkippedDates,
            });

            return {
              ...income,
              skippedDates: updatedSkippedDates,
              nextRecurrence: nextRecurrence
                ? moment(nextRecurrence)
                    .tz('America/Edmonton')
                    .format('YYYY-MM-DD')
                : null,
            };
          }
          return income;
        })
      );
      notifySuccess('Next recurrence skipped successfully.');
      setErrorNotified(false);
    } catch (error) {
      if (!errorNotified) {
        const errorMessage =
          error.response?.data?.error || 'Failed to skip next recurrence.';
        notifyError(errorMessage);
        setErrorNotified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    const filtered = filterIncomes(sortedIncomes, query);
    setFilteredIncomes(filtered);
  };

  const handleSortChange = (field, order) => {
    const sorted = sortByFields(incomeData, [field, 'date', 'amount'], [order]);
    setSortedIncomes(sorted);
  };

  const groupedIncomes = useMemo(
    () => groupIncomesBySource(incomeData),
    [incomeData]
  );

  const toggleExpandIncome = (id) => {
    setExpandedIncome((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const noIncomesMessage =
    incomeData.length === 0
      ? 'Nothing here yet! Add your first income to kick things off 💵'
      : 'No incomes match your search. Try adjusting your filters.';

  return (
    <div className="incomes-page">
      <NavBar />

      <div className="goal-card-wrapper">
        <GoalCard incomes={incomeData} />
      </div>

      <div
        className={`split-screen-container ${
          groupedIncomes.length === 0 ? 'centered' : ''
        }`}
      >
        {/* Form Section */}
        <div
          className={`form-section ${
            groupedIncomes.length === 0 ? 'centered-horizontal' : ''
          }`}
          ref={formSectionRef}
        >
          <IncomeForm
            onIncomeAdded={handleIncomeAdded}
            onIncomeUpdated={handleIncomeUpdated}
            onValidationError={handleValidationError}
            mode={editMode ? 'edit' : 'add'}
            incomeToEdit={incomeToEdit}
            highlight={highlightForm}
          />
        </div>

        {/* Overview Section - Single Graph Card */}
        {groupedIncomes.length > 0 && (
          <div className="overview-section">
            <Chart
              options={{
                chart: {
                  type: 'pie',
                  toolbar: {
                    show: false,
                  },
                },
                labels: groupedIncomes.map((inc) => inc.source),
                legend: {
                  position: 'bottom',
                  labels: {
                    colors: ['#000000'],
                    useSeriesColors: false,
                  },
                },
              }}
              series={groupedIncomes.map((inc) => inc.amount)}
              type="pie"
              width="450"
            />
          </div>
        )}
      </div>

      {/* Incomes List Section */}
      <div className="incomes-list">
        <h3
          className="collapsible-header"
          onClick={() => setIsIncomesListVisible(!isIncomesListVisible)}
        >
          Your Incomes{' '}
          {isIncomesListVisible ? <FaChevronUp /> : <FaChevronDown />}
        </h3>
        {isIncomesListVisible && (
          <>
            <IncomeSearch onSearch={handleSearch} />
            <IncomeSort onSortChange={handleSortChange} />
          </>
        )}
        <CSSTransition
          in={isIncomesListVisible}
          timeout={300}
          classNames="incomes-list-transition"
          unmountOnExit
        >
          <div className="income-cards-container">
            {filteredIncomes.length > 0 ? (
              <TransitionGroup component={null}>
                {filteredIncomes.map((income) => (
                  <CSSTransition
                    key={income._id}
                    timeout={500}
                    classNames="income-card-transition"
                  >
                    <IncomeCard
                      key={income._id}
                      income={income}
                      onEdit={() => handleEditIncome(income)}
                      onDelete={() => handleDeleteIncome(income._id)}
                      onExpand={() => toggleExpandIncome(income._id)}
                      expanded={!!expandedIncome[income._id]}
                      onSkipNextRecurrence={(incomeId, dateToSkip) =>
                        handleSkipNextRecurrence(incomeId, dateToSkip)
                      }
                    />
                  </CSSTransition>
                ))}
              </TransitionGroup>
            ) : (
              <div className="no-incomes-container">
                <img
                  src={noIncomesIllustration}
                  alt="No incomes illustration"
                  className="no-incomes-illustration"
                />
                <p>{noIncomesMessage}</p>
              </div>
            )}
          </div>
        </CSSTransition>
      </div>
    </div>
  );
};

export default IncomePage;
