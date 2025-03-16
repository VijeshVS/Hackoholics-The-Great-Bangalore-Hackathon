import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add auth token and handle monetary values
api.interceptors.request.use(
  (config) => {
    // Get token from cookie
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Convert monetary values to numbers in request data
    if (config.data) {
      const monetaryFields = [
        'wallet', 
        'fare', 
        'commitmentFee', 
        'amount',
        'refundAmount',
        'commissionAmount',
        'platformCommission',
        'penaltyAmount',
        'compensationAmount'
      ];
      for (const field of monetaryFields) {
        if (field in config.data) {
          config.data[field] = Number(config.data[field]);
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors and monetary values
api.interceptors.response.use(
  (response) => {
    // Convert monetary values to numbers in response data
    if (response.data) {
      const convertMonetaryValues = (obj) => {
        if (!obj || typeof obj !== 'object') return;

        // Handle wallet in user object
        if ('wallet' in obj) {
          obj.wallet = Number(obj.wallet);
        }

        // Handle monetary values in rides and transactions
        const monetaryFields = [
          'fare', 
          'commitmentFee', 
          'amount',
          'refundAmount',
          'commissionAmount',
          'platformCommission',
          'penaltyAmount',
          'compensationAmount'
        ];
        
        for (const field of monetaryFields) {
          if (field in obj) {
            obj[field] = Number(obj[field]);
          }
        }

        // Handle transactions array specifically
        if (Array.isArray(obj.transactions)) {
          obj.transactions.forEach(transaction => {
            if (transaction.amount) {
              transaction.amount = Number(transaction.amount);
            }
            if (transaction.commission) {
              transaction.commission = Number(transaction.commission);
            }
          });
        }

        // Handle nested objects and arrays
        for (const key in obj) {
          if (Array.isArray(obj[key])) {
            obj[key].forEach(item => convertMonetaryValues(item));
          } else if (typeof obj[key] === 'object') {
            convertMonetaryValues(obj[key]);
          }
        }
      };

      convertMonetaryValues(response.data);
    }

    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    // Handle API errors
    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Clear token on unauthorized
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        break;
      case 403:
        console.error('Forbidden:', data);
        break;
      case 404:
        console.error('Not found:', data);
        break;
      case 500:
        console.error('Server error:', data);
        break;
      default:
        console.error('API error:', data);
    }

    return Promise.reject(error);
  }
);

export default api;
