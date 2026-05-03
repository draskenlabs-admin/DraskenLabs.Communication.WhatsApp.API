import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SsoService } from './sso.service';
import { UserModule } from 'src/user/user.module';
import { OrgModule } from 'src/org/org.module';

@Module({
  imports: [UserModule, OrgModule],
  controllers: [AuthController],
  providers: [AuthService, SsoService],
})
export class AuthModule {}
