import { Test, TestingModule } from '@nestjs/testing';
import { AccountHandler } from './account.handler';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
  wabaPhoneNumber: { updateMany: jest.fn() },
};

describe('AccountHandler', () => {
  let handler: AccountHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountHandler,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    handler = module.get<AccountHandler>(AccountHandler);
  });

  describe('handleAccountUpdate', () => {
    it('logs the event without throwing', async () => {
      await expect(
        handler.handleAccountUpdate({ phone_number: '+1555', event: 'ACCOUNT_UPDATE' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('handlePhoneQualityUpdate', () => {
    it('updates quality rating for matching phone number', async () => {
      mockPrisma.wabaPhoneNumber.updateMany.mockResolvedValue({ count: 1 });
      await handler.handlePhoneQualityUpdate({
        display_phone_number: '+1555',
        event: 'FLAGGED',
        current_limit: 'TIER_50',
      });
      expect(mockPrisma.wabaPhoneNumber.updateMany).toHaveBeenCalledWith({
        where: { displayPhoneNumber: '+1555' },
        data: { qualityRating: 'TIER_50' },
      });
    });

    it('uses event as fallback when current_limit is absent', async () => {
      mockPrisma.wabaPhoneNumber.updateMany.mockResolvedValue({ count: 1 });
      await handler.handlePhoneQualityUpdate({
        display_phone_number: '+1555',
        event: 'FLAGGED',
        current_limit: null,
      });
      expect(mockPrisma.wabaPhoneNumber.updateMany).toHaveBeenCalledWith({
        where: { displayPhoneNumber: '+1555' },
        data: { qualityRating: 'FLAGGED' },
      });
    });

    it('handles DB error gracefully without throwing', async () => {
      mockPrisma.wabaPhoneNumber.updateMany.mockRejectedValue(new Error('DB error'));
      await expect(
        handler.handlePhoneQualityUpdate({ display_phone_number: '+1555', event: 'FLAGGED', current_limit: null }),
      ).resolves.toBeUndefined();
    });
  });

  describe('handlePhoneNameUpdate', () => {
    it('logs without throwing', async () => {
      await expect(handler.handlePhoneNameUpdate({ phone_number: '+1555' })).resolves.toBeUndefined();
    });
  });
});
