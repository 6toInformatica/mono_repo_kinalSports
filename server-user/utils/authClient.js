'use strict';

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const authBaseUrl =
  process.env.AUTH_NODE_URL ??
  process.env.AUTH_SERVICE_URL ??
  'http://localhost:3007/api/v1';

const authClient = axios.create({
  baseURL: authBaseUrl,
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
