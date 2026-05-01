import { Test, TestingModule } from '@nestjs/testing';
import { StatusUpdateHandler } from './status-update.handler';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
  message: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('StatusUpdateHandler', () => {
  let handler: StatusUpdateHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatusUpdateHandler, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    handler = module.get<StatusUpdateHandler>(StatusUpdateHandler);
  });

  it('does nothing if message not found', async () => {
    mockPrisma.message.findUnique.mockResolvedValue(null);
    await handler.handle({ id: 'wamid.abc', status: 'delivered' });
    expect(mockPrisma.message.update).not.toHaveBeenCalled();
  });

  it('updates status from sent to delivered', async () => {
    mockPrisma.message.findUnique.mockResolvedValue({ id: 1, status: 'sent' });
    mockPrisma.message.update.mockResolvedValue({});
    await handler.handle({ id: 'wamid.abc', status: 'delivered' });
    expect(mockPrisma.message.update).toHaveBeenCalledWith({
      where: { metaMessageId: 'wamid.abc' },
      data: { status: 'delivered' },
    });
  });

  it('does not downgrade status from read to delivered', async () => {
    mockPrisma.message.findUnique.mockResolvedValue({ id: 1, status: 'read' });
    await handler.handle({ id: 'wamid.abc', status: 'delivered' });
    expect(mockPrisma.message.update).not.toHaveBeenCalled();
  });

  it('advances status to read', async () => {
    mockPrisma.message.findUnique.mockResolvedValue({ id: 1, status: 'delivered' });
    mockPrisma.message.update.mockResolvedValue({});
    await handler.handle({ id: 'wamid.abc', status: 'read' });
    expect(mockPrisma.message.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'read' } }),
    );
  });

  it('ignores unknown status values', async () => {
    mockPrisma.message.findUnique.mockResolvedValue({ id: 1, status: 'sent' });
    await handler.handle({ id: 'wamid.abc', status: 'unknown_status' });
    expect(mockPrisma.message.update).not.toHaveBeenCalled();
  });
});
