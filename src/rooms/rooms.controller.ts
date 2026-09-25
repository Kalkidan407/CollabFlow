import { Controller, Get } from '@nestjs/common';
import { RoomsService } from './rooms.service.js';

@Controller('rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) {}

    @Get()
    getRooms(){
        return this.roomsService.getMessage();
    }
}
