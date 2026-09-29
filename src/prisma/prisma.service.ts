import { Injectable } from '@nestjs/common';
import { db } from './db.js';

@Injectable()
export class PrismaService {
  getClient(): any {
    return db as any;
  }
}
