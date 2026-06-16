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

export default authClient;
