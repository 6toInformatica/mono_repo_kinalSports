import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection?: Connection) {}

  @Get()
  check() {
    const healthy = !this.connection || this.connection.readyState === 1;
    const body = {
      status: healthy ? 'Healthy' : 'Unhealthy',
      timestamp: new Date().toISOString(),
      service: 'KinalSports Admin Server',
    };
    if (!healthy) {
      throw new HttpException(body, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return body;
  }
}
