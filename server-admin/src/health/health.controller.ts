import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'Healthy',
      timestamp: new Date().toISOString(),
      service: 'KinalSports Admin Server',
    };
  }
}
