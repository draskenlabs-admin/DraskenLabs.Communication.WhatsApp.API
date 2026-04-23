import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './services/crypto.service';

@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class CommonModule {}
