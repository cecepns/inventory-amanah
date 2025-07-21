import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://api-inventory.isavralabel.com/api/inventory-amanah';

export const useUsageReports = (dateRange = 'this_month', category = '', search = '') => {
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          dateRange,
          category,
          search
        });
        
        const response = await fetch(`${API_BASE_URL}/reports/usage?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch usage data');
        }
        
        const data = await response.json();
        setUsageData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setUsageData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();
  }, [dateRange, category, search]);

  return { usageData, loading, error };
};

export const useDailyUsage = (dateRange = 'this_month') => {
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDailyData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/reports/usage/daily?dateRange=${dateRange}`);
        if (!response.ok) {
          throw new Error('Failed to fetch daily usage data');
        }
        
        const data = await response.json();
        setDailyData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setDailyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyData();
  }, [dateRange]);

  return { dailyData, loading, error };
};

export const useCategoryUsage = (dateRange = 'this_month') => {
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/reports/usage/category?dateRange=${dateRange}`);
        if (!response.ok) {
          throw new Error('Failed to fetch category usage data');
        }
        
        const data = await response.json();
        setCategoryData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setCategoryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [dateRange]);

  return { categoryData, loading, error };
};

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        setCategories(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}; 