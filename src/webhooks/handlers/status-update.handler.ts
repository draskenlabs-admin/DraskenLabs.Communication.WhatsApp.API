import { Injectable, Logger } from '@nestjs/common';
import { MessageStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const STATUS_ORDER: Record<string, number> = {
  sent: 0,
  delivered: 1,
  read: 2,
  failed: 3,
};

@Injectable()
export class StatusUpdateHandler {
  private readonly logger = new Logger(StatusUpdateHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(statusUpdate: any): Promise<void> {
    const { id: metaMessageId, status } = statusUpdate;

    if (!Object.keys(STATUS_ORDER).includes(status)) {
      this.logger.warn(`Unknown status value: ${status} for message ${metaMessageId}`);
      return;
    }

    try {
      const existing = await this.prisma.message.findUnique({
        where: { metaMessageId },
        select: { id: true, status: true },
      });

      if (!existing) return;

      // Only advance status forward — never go read → delivered
      if (STATUS_ORDER[status] <= STATUS_ORDER[existing.status]) return;

      await this.prisma.message.update({
        where: { metaMessageId },
        data: { status: status as MessageStatus },
      });
    } catch (err: any) {
      this.logger.error(`Failed to update status for ${metaMessageId}: ${err.message}`);
    }
  }
}
