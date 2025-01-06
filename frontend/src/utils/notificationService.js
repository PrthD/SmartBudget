import { toast } from 'react-toastify';
import '../styles/common/alerts.css';

export const notifySuccess = (message) => {
  toast.success(message, {
    position: 'top-center',
    closeButton: true,
    autoClose: 2000,
  });
};

export const notifyError = (message) => {
  toast.error(message, {
    position: 'top-center',
    closeButton: true,
    autoClose: 2000,
  });
};

export const notifyInfo = (message) => {
  toast.info(message, {
    position: 'top-center',
    closeButton: true,
    autoClose: 2000,
  });
};

export const notifyWarning = (message) => {
  toast.warn(message, {
    position: 'top-center',
    closeButton: true,
    autoClose: 2000,
  });
};

export const showBudgetAlert = (message) => {
  toast.warning(message, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    className: 'budget-toast',
  });
};

export const showGoalSuccessAlert = (message) => {
  toast.success(message, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    className: 'goal-toast',
  });
};

export const showSavingsGoalSuccessAlert = (message) => {
  toast.success(message, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    className: 'savings-goal-toast',
  });
};
