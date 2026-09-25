import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomsService {

    getMessage() {
    return 'Rooms service is working!';
  }
}

