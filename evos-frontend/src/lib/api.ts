import axios, { AxiosError } from 'axios';

export const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailureResponse {
  success: false;
  message: string;
  errors: string[];
}

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiFailureResponse>;
    return axiosError.response?.data?.message || 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
};
