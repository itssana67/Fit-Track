import toast from 'react-hot-toast';
import { API_URL } from '../services/api';

/** Readable message from an Axios error */
export function getErrorMessage(error) {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ERR_NETWORK') return `Cannot reach the FitTrack server at ${API_URL}. Start the backend and try again.`;
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond. Try again.';
  return error?.message || 'Something went wrong';
}

/** Per-field messages sent by the backend validator, e.g. { email: 'Enter a valid email' } */
export function getFieldErrors(error) {
  return error?.response?.data?.errors || {};
}

/** Shows a toast for every achievement the backend says was just unlocked */
export function announceAchievements(list = []) {
  list.forEach((achievement) => {
    toast.success(`Achievement unlocked: ${achievement.title}`, { icon: '🏆', duration: 5000 });
  });
}
