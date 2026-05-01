const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn().mockResolvedValue(undefined);
const mockPoolEnd = jest.fn().mockResolvedValue(undefined);

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({ end: mockPoolEnd })),
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(function () {
    this.$connect = mockConnect;
    this.$disconnect = mockDisconnect;
  }),
}));

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  describe('constructor', () => {
    it('throws when DATABASE_URL is not set', () => {
      delete process.env.DATABASE_URL;
      expect(() => new PrismaService()).toThrow('DATABASE_URL is required');
    });

    it('initialises without error when DATABASE_URL is set', () => {
      expect(() => new PrismaService()).not.toThrow();
    });
  });

  describe('onModuleInit', () => {
    it('calls $connect', async () => {
      const service = new PrismaService();
      await service.onModuleInit();
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy', () => {
    it('calls $disconnect and pool.end', async () => {
      const service = new PrismaService();
      await service.onModuleDestroy();
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(mockPoolEnd).toHaveBeenCalledTimes(1);
    });
  });
});
