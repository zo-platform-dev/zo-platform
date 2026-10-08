import { create } from 'zustand';
import axios from 'axios';

import { API_BASE_URL } from '../config/api';
const API_URL = API_BASE_URL;

export const useTaskStore = create((set, get) => ({
  tasks: [],
  currentTask: null,
  results: [],
  stats: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },

  fetchTasks: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams(params);
      const response = await axios.get(`${API_URL}/tasks?${queryParams}`);
      const { tasks, pagination } = response.data;

      set({
        tasks,
        pagination,
        loading: false
      });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch tasks';
      set({ error: message, loading: false });
    }
  },

  fetchTask: async (taskId) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/tasks/${taskId}`);
      set({ currentTask: response.data.task, loading: false });
      return response.data.task;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch task';
      set({ error: message, loading: false });
      return null;
    }
  },

  createTask: async (taskData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/tasks`, taskData);
      const task = response.data.task;

      set(state => ({
        tasks: [task, ...state.tasks],
        loading: false
      }));

      return { success: true, task };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create task';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  updateTask: async (taskId, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/tasks/${taskId}`, updates);
      const updatedTask = response.data.task;

      set(state => ({
        tasks: state.tasks.map(t => t._id === taskId ? updatedTask : t),
        currentTask: state.currentTask?._id === taskId ? updatedTask : state.currentTask,
        loading: false
      }));

      return { success: true, task: updatedTask };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update task';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  deleteTask: async (taskId) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`);

      set(state => ({
        tasks: state.tasks.filter(t => t._id !== taskId),
        loading: false
      }));

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete task';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  runTask: async (taskId) => {
    try {
      const response = await axios.post(`${API_URL}/tasks/${taskId}/run`);
      const updatedTask = response.data.task;

      set(state => ({
        tasks: state.tasks.map(t => t._id === taskId ? updatedTask : t),
        currentTask: state.currentTask?._id === taskId ? updatedTask : state.currentTask
      }));

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to run task';
      return { success: false, error: message };
    }
  },

  fetchResults: async (taskId, params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams(params);
      const response = await axios.get(`${API_URL}/tasks/${taskId}/results?${queryParams}`);
      const { results, pagination } = response.data;

      set({
        results,
        loading: false
      });

      return { results, pagination };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch results';
      set({ error: message, loading: false });
      return { results: [], pagination: {} };
    }
  },

  fetchStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks/stats`);
      set({ stats: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return null;
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentTask: () => set({ currentTask: null })
}));