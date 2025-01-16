import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const SwalWithReactContent = withReactContent(Swal);

export const confirmAction = async (title, text) => {
  const result = await SwalWithReactContent.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#004c99',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, do it!',
    cancelButtonText: 'Cancel',
    customClass: {
      popup: 'swal2-popup-custom',
    },
  });

  return result.isConfirmed;
};

export const showFirstTimeGreeting = async () => {
  await SwalWithReactContent.fire({
    html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="font-size: 3em; margin-bottom: 16px;">🎉</div>
        <h2 style="font-size: 1.5em; color: #004c99; font-weight: bold; margin: 4px;">
          Welcome to Smart Budget!
        </h2>
        <p style="font-size: 1.1em; color: #004c99; font-weight: bold; margin-top: 8px;">We’re thrilled to have you here!</p>
        <p style="font-size: 1em; color: #555; margin-top: 4px;">Start managing your finances smarter and easier.</p>
        <p style="font-size: 1em; color: #004c99; font-weight: bold; margin-top: 4px;">Add your incomes and expenses to get started!</p>
      </div>
    `,
    confirmButtonText: 'Let’s Go! 🚀',
    customClass: {
      popup: 'swal2-popup-custom',
      confirmButton: 'swal2-confirm-button-custom',
    },
    didRender: () => {
      const popup = document.querySelector('.swal2-popup');
      if (popup) {
        popup.style.backgroundColor = '#f9fbfc';
        popup.style.border = '1px solid #004c99';
        popup.style.borderRadius = '12px';
        popup.style.padding = '16px';
      }

      const confirmButton = document.querySelector('.swal2-confirm');
      if (confirmButton) {
        confirmButton.style.backgroundColor = '#004c99';
        confirmButton.style.color = '#fff';
        confirmButton.style.borderRadius = '8px';
        confirmButton.style.padding = '8px 16px';
        confirmButton.style.fontWeight = 'bold';
        confirmButton.style.transition = 'background-color 0.3s';

        confirmButton.addEventListener('mouseover', () => {
          confirmButton.style.backgroundColor = '#003366';
        });
        confirmButton.addEventListener('mouseout', () => {
          confirmButton.style.backgroundColor = '#004c99';
        });
      }
    },
  });
};
