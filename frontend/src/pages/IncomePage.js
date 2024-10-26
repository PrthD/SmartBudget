import React, { useState, useMemo, useEffect } from 'react';
import { fetchIncomes } from '../services/incomeService';
import {
  calculateTotalIncome,
  groupIncomesBySource,
} from '../utils/incomeHelpers';
import IncomeForm from '../components/incomes/IncomeForm';
// import '../styles/IncomePage.css';

const IncomesPage = () => {
  const [incomeData, setIncomeData] = useState([]);
  const [expandedIncome, setExpandedIncome] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleIncomeAdded = async () => {
    try {
      setLoading(true);
      const incomes = await fetchIncomes();
      setIncomeData(incomes);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleIncomeAdded();
  }, []);

  const totalIncome = useMemo(
    () => calculateTotalIncome(incomeData),
    [incomeData]
  );

  const groupedIncomes = useMemo(
    () => groupIncomesBySource(incomeData),
    [incomeData]
  );

  const toggleExpandIncome = (key) => {
    setExpandedIncome((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="incomes-page">
      <h2>Your Incomes</h2>
      <h3>Total Income: ${totalIncome}</h3>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
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
                  <React.Fragment key={`${income.source}-${income.frequency}`}>
                    <tr>
                      <td>{income.source}</td>
                      <td>${income.amount}</td>
                      <td>{income.frequency}</td>
                      <td>{new Date(income.date).toLocaleDateString()}</td>
                      <td>{income.description || ''}</td>
                      <td>
                        {income.frequency !== 'once' && (
                          <button
                            onClick={() =>
                              toggleExpandIncome(
                                `${income.source}-${income.frequency}`
                              )
                            }
                          >
                            {expandedIncome[
                              `${income.source}-${income.frequency}`
                            ]
                              ? 'Collapse'
                              : 'Expand'}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Collapsible section for future recurring instances */}
                    {expandedIncome[`${income.source}-${income.frequency}`] &&
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
        </>
      )}
    </div>
  );
};

export default IncomesPage;
