import {
  Injectable,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { closeDatabase, dbConnection } from '../../legacy/configs/db.js';

/**
 * Conexión a MongoDB: se abre al iniciar el módulo y se cierra en el apagado ordenado,
 * después de que Nest deja de aceptar peticiones.
 */
@Injectable()
export class DatabaseLifecycle implements OnModuleInit, OnApplicationShutdown {
  async onModuleInit() {
    await dbConnection();
  }

  async onApplicationShutdown() {
    await closeDatabase();
  }
}
