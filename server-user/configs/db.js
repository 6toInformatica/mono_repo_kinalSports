'use strict';

import mongoose from 'mongoose';

export const dbConnection = async () => {
  try {
    mongoose.connection.on('error', () => {
      console.log('MongoDB | no se pudo conectar a mongoDB');
      mongoose.disconnect();
    });

    mongoose.connection.on('connecting', () => {
      console.log('MongoDB | intentando conectar a mongoDB');
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB | conectado a mongoDB');
    });

    mongoose.connection.on('open', () => {
      console.log('MongoDB | conectado a la base de datos kinalSports');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB | reconectado a mongoDB');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB | desconectado de mongoDB');
    });

    await mongoose.connect(process.env.URI_MONGODB, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
  } catch (error) {
    console.log(`Error al conectar la db: ${error}`);
    process.exit(1);
  }
};

export const closeDatabase = async () => {
  await mongoose.connection.close();
  console.log('MongoDB | Database connection closed successfully');
};
