import { Test, TestingModule } from '@nestjs/testing';
import { InboundMessageHandler } from './inbound-message.handler';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
  inboundMessage: { upsert: jest.fn() },
};

describe('InboundMessageHandler', () => {
  let handler: InboundMessageHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [InboundMessageHandler, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    handler = module.get<InboundMessageHandler>(InboundMessageHandler);
  });

  it('upserts inbound message with parsed timestamp', async () => {
    mockPrisma.inboundMessage.upsert.mockResolvedValue({});

    const message = {
      id: 'wamid.abc',
      from: '447911111111',
      timestamp: '1700000000',
      type: 'text',
      text: { body: 'Hello' },
    };

    await handler.handle('waba1', 'phone1', message, 'Alice');

    expect(mockPrisma.inboundMessage.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { metaMessageId: 'wamid.abc' },
        create: expect.objectContaining({
          metaMessageId: 'wamid.abc',
          wabaId: 'waba1',
          phoneNumberId: 'phone1',
          from: '447911111111',
          senderName: 'Alice',
          type: 'text',
          payload: { body: 'Hello' },
          timestamp: new Date(1700000000 * 1000),
        }),
        update: {},
      }),
    );
  });

  it('is idempotent — update is empty object', async () => {
    mockPrisma.inboundMessage.upsert.mockResolvedValue({});
    const msg = { id: 'wamid.x', from: '111', timestamp: '1700000000', type: 'text', text: {} };
    await handler.handle('w', 'p', msg, undefined);
    const call = mockPrisma.inboundMessage.upsert.mock.calls[0][0];
    expect(call.update).toEqual({});
  });

  it('does not throw if upsert fails — logs error instead', async () => {
    mockPrisma.inboundMessage.upsert.mockRejectedValue(new Error('DB error'));
    const msg = { id: 'wamid.fail', from: '111', timestamp: '1700000000', type: 'text', text: {} };
    await expect(handler.handle('w', 'p', msg, undefined)).resolves.toBeUndefined();
  });
});
