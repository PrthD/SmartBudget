import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import IncomeForm from '../components/incomes/IncomeForm';
// import '../styles/IncomePage.css';

const IncomesPage = () => {
  const [incomeData, setIncomeData] = useState([]);
  const [expandedIncome, setExpandedIncome] = useState({});

  const fetchData = async () => {
    try {
      const incomes = await axios.get('http://localhost:5000/api/income');
      setIncomeData(incomes.data);
    } catch (error) {
      console.error('Error fetching incomes:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIncomeAdded = () => {
    fetchData();
  };

  const totalIncome = useMemo(
    () =>
      incomeData
        .filter((income) => new Date(income.date) <= new Date())
        .reduce((sum, income) => sum + income.amount, 0),
    [incomeData]
  );

  const groupedIncomes = useMemo(() => {
    const grouped = {};
    incomeData.forEach((income) => {
      const key = `${income.source}-${income.frequency}`;
      if (income.isOriginal) {
        if (!grouped[key]) {
          grouped[key] = { ...income, futureInstances: [] };
        }
      } else {
        if (grouped[key]) {
          grouped[key].futureInstances.push(income);
        }
      }
    });
    return Object.values(grouped);
  }, [incomeData]);

  const toggleExpandIncome = (id) => {
    setExpandedIncome((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="incomes-page">
      <h2>Your Incomes</h2>
      <h3>Total Income: ${totalIncome}</h3>

      {/* Render the Income Form */}
      <IncomeForm onIncomeAdded={handleIncomeAdded} />

      {/* Render the Income Table */}
      {groupedIncomes.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Amount</th>
              <th>Frequency</th>
              <th>Date Added</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedIncomes.map((income) => (
              <React.Fragment key={income._id}>
                <tr>
                  <td>{income.source}</td>
                  <td>${income.amount}</td>
                  <td>{income.frequency}</td>
                  <td>{new Date(income.date).toLocaleDateString()}</td>
                  <td>{income.description || ''}</td>
                  <td>
                    {income.frequency !== 'once' && (
                      <button onClick={() => toggleExpandIncome(income._id)}>
                        {expandedIncome[income._id] ? 'Collapse' : 'Expand'}
                      </button>
                    )}
                  </td>
                </tr>

                {/* Collapsible section for future recurring instances */}
                {expandedIncome[income._id] &&
                  income.futureInstances.length > 0 &&
                  income.futureInstances.map((instance) => (
                    <tr key={instance._id}>
                      <td colSpan="2">
                        Recurring on:{' '}
                        {new Date(instance.date).toLocaleDateString()}
                      </td>
                      <td colSpan="2">Amount: ${instance.amount}</td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No recurring incomes</p>
      )}
    </div>
  );
};

IncomesPage.propTypes = {
  onIncomeAdded: PropTypes.func,
};

export default IncomesPage;
