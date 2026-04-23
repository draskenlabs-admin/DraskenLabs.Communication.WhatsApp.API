import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConnectModule } from './connect/connect.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ApiKeyModule } from './api-key/api-key.module';
import { WabaModule } from './waba/waba.module';
import { WabaPhoneNumberModule } from './waba-phone-number/waba-phone-number.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ConnectModule,
    RedisModule,
    CommonModule,
    PrismaModule,
    UserModule,
    ApiKeyModule,
    WabaModule,
    WabaPhoneNumberModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
