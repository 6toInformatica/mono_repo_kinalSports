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

export default authClient;
