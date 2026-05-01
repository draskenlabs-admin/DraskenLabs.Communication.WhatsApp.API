import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClerkService } from './clerk.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule], // provides UserService + JwtModule
  controllers: [AuthController],
  providers: [AuthService, ClerkService],
})
export class AuthModule {}
