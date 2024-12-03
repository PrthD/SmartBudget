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
  });

  return result.isConfirmed;
};
