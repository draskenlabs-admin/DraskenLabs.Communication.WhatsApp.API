import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { InboundMessageHandler } from './handlers/inbound-message.handler';
import { StatusUpdateHandler } from './handlers/status-update.handler';
import { AccountHandler } from './handlers/account.handler';
import { TemplateStatusHandler } from './handlers/template-status.handler';

const mockPrisma = {
  webhookEvent: { create: jest.fn(), update: jest.fn() },
};
const mockInbound = { handle: jest.fn() };
const mockStatus = { handle: jest.fn() };
const mockAccount = { handleAccountUpdate: jest.fn(), handlePhoneQualityUpdate: jest.fn(), handlePhoneNameUpdate: jest.fn() };
const mockTemplateStatus = { handle: jest.fn() };

describe('WebhooksService', () => {
  let service: WebhooksService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: InboundMessageHandler, useValue: mockInbound },
        { provide: StatusUpdateHandler, useValue: mockStatus },
        { provide: AccountHandler, useValue: mockAccount },
        { provide: TemplateStatusHandler, useValue: mockTemplateStatus },
      ],
    }).compile();
    service = module.get<WebhooksService>(WebhooksService);
  });

  it('ignores payloads that are not whatsapp_business_account', async () => {
    await service.processPayload({ object: 'instagram', entry: [] });
    expect(mockPrisma.webhookEvent.create).not.toHaveBeenCalled();
  });

  it('logs event and routes messages field to inbound and status handlers', async () => {
    mockPrisma.webhookEvent.create.mockResolvedValue({ id: 1 });
    mockPrisma.webhookEvent.update.mockResolvedValue({});
    mockInbound.handle.mockResolvedValue(undefined);
    mockStatus.handle.mockResolvedValue(undefined);

    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'waba1',
        changes: [{
          field: 'messages',
          value: {
            metadata: { phone_number_id: 'p1' },
            contacts: [{ profile: { name: 'Alice' } }],
            messages: [{ id: 'wamid.1', from: '111', timestamp: '1700000000', type: 'text', text: { body: 'Hi' } }],
            statuses: [{ id: 'wamid.2', status: 'delivered', timestamp: '1700000001', recipient_id: '111' }],
          },
        }],
      }],
    };

    await service.processPayload(payload);

    expect(mockPrisma.webhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventType: 'messages', wabaId: 'waba1' }) }),
    );
    expect(mockInbound.handle).toHaveBeenCalledWith('waba1', 'p1', payload.entry[0].changes[0].value.messages[0], 'Alice');
    expect(mockStatus.handle).toHaveBeenCalledWith(payload.entry[0].changes[0].value.statuses[0]);
    expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { processed: true } });
  });

  it('routes account_update to account handler', async () => {
    mockPrisma.webhookEvent.create.mockResolvedValue({ id: 2 });
    mockPrisma.webhookEvent.update.mockResolvedValue({});
    mockAccount.handleAccountUpdate.mockResolvedValue(undefined);

    await service.processPayload({
      object: 'whatsapp_business_account',
      entry: [{ id: 'w1', changes: [{ field: 'account_update', value: { event: 'ACCOUNT_RESTRICTION' } }] }],
    });

    expect(mockAccount.handleAccountUpdate).toHaveBeenCalled();
  });

  it('routes template status update to template status handler', async () => {
    mockPrisma.webhookEvent.create.mockResolvedValue({ id: 3 });
    mockPrisma.webhookEvent.update.mockResolvedValue({});
    mockTemplateStatus.handle.mockResolvedValue(undefined);

    await service.processPayload({
      object: 'whatsapp_business_account',
      entry: [{ id: 'w1', changes: [{ field: 'message_template_status_update', value: { event: 'APPROVED' } }] }],
    });

    expect(mockTemplateStatus.handle).toHaveBeenCalled();
  });

  it('records error on event when handler throws', async () => {
    mockPrisma.webhookEvent.create.mockResolvedValue({ id: 4 });
    mockPrisma.webhookEvent.update.mockResolvedValue({});
    mockAccount.handleAccountUpdate.mockRejectedValue(new Error('handler blew up'));

    await service.processPayload({
      object: 'whatsapp_business_account',
      entry: [{ id: 'w1', changes: [{ field: 'account_update', value: {} }] }],
    });

    expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { error: 'handler blew up' },
    });
  });
});
