import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GamesModule } from './games/games.module.js';
import { RoomsModule } from './rooms/rooms.module.js';

@Module({
  imports: [RoomsModule, GamesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
