import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'CollabFlow platform is running';
  }

  getHealth(): { status: string; service: string } {
    return {
      status: 'ok',
      service: 'collabflow-api',
    };
  }
}
