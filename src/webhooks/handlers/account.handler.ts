import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AccountHandler {
  private readonly logger = new Logger(AccountHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleAccountUpdate(value: any): Promise<void> {
    this.logger.warn(`Account update: phone=${value.phone_number}, event=${value.event}`);
  }

  async handlePhoneQualityUpdate(value: any): Promise<void> {
    const { display_phone_number, event, current_limit } = value;
    this.logger.log(`Phone quality update: ${display_phone_number} → ${event} (limit: ${current_limit})`);

    try {
      await this.prisma.wabaPhoneNumber.updateMany({
        where: { displayPhoneNumber: display_phone_number },
        data: { qualityRating: current_limit ?? event },
      });
    } catch (err: any) {
      this.logger.error(`Failed to update phone quality for ${display_phone_number}: ${err.message}`);
    }
  }

  async handlePhoneNameUpdate(value: any): Promise<void> {
    this.logger.log(`Phone name update: ${JSON.stringify(value)}`);
  }
}
