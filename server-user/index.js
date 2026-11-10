// Primero: las variables de .env deben existir antes de que cualquier módulo las lea
import 'dotenv/config';
import { initServer } from './configs/app.js';

// Manejar errores no capturados
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception in User Server:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
  process.exit(1);
});

// Inicializar servidor user
console.log('Starting KinalSports User Server...');
initServer();
