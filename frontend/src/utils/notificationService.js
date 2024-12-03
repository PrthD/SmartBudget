import { toast } from 'react-toastify';

export const notifySuccess = (message) => {
  toast.success(message, {
    position: 'top-right',
  });
};

export const notifyError = (message) => {
  toast.error(message, {
    position: 'top-right',
  });
};

export const notifyInfo = (message) => {
  toast.info(message, {
    position: 'top-right',
  });
};

export const notifyWarning = (message) => {
  toast.warn(message, {
    position: 'top-right',
  });
};
