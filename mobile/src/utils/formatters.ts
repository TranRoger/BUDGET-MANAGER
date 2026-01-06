import { format } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'dd/MM/yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
};

export const getMonthYear = (date: Date): string => {
  return format(date, 'MMMM yyyy');
};

export const shortDate = (date: string | Date): string => {
  return format(new Date(date), 'dd MMM');
};
