import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v7 as uuidv7 } from 'uuid';
import { WABAConnectState } from './dto/waba-connect-state.dto';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger: Logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      lazyConnect: true,
    });
    this.client.on('connect', () => {
      this.logger.log('Redis Connected');
    });
    this.client.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
    this.client.on('reconnecting', () => {
      this.logger.warn('Redis reconnecting...');
    });
  }

  onModuleDestroy() {
    this.logger.log('Redis disconnecting...');
    this.client.disconnect();
  }

  // Connect State
  async getState(stateId: string): Promise<WABAConnectState | null> {
    const response = await this.client.get(`state:${stateId}`);
    if (response) return JSON.parse(response);
    return null;
  }

  async createState(): Promise<string> {
    const stateId = uuidv7();
    await this.client.set(`state:${stateId}`, JSON.stringify({}), 'EX', 300);
    return stateId;
  }

  async updateState(stateId: string, data: WABAConnectState): Promise<string> {
    await this.client.set(`state:${stateId}`, JSON.stringify(data), 'EX', 300);
    return stateId;
  }
}
