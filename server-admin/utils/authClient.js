'use strict';

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const authClient = axios.create({
  baseURL: process.env.AUTH_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Los endpoints profile/by-* de los servicios de auth requieren el token interno
authClient.interceptors.request.use((config) => {
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
  if (internalToken) {
    config.headers['x-internal-token'] = internalToken;
  }
  return config;
});

export default authClient;
