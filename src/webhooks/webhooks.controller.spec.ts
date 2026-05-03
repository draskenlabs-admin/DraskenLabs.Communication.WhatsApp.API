import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { ConfigService } from '@nestjs/config';

const mockWebhooksService = { processPayload: jest.fn() };
const mockConfigService = { get: jest.fn().mockReturnValue('my_verify_token') };

describe('WebhooksController', () => {
  let controller: WebhooksController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        { provide: WebhooksService, useValue: mockWebhooksService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    controller = module.get<WebhooksController>(WebhooksController);
  });

  describe('verify', () => {
    const mockRes = () => {
      const res: any = {};
      res.status = jest.fn().mockReturnValue(res);
      res.send = jest.fn().mockReturnValue(res);
      return res;
    };

    it('echoes challenge when mode and token match', () => {
      const res = mockRes();
      controller.verify('subscribe', 'my_verify_token', '12345', res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('12345');
    });

    it('throws ForbiddenException when mode is wrong', () => {
      const res = mockRes();
      expect(() => controller.verify('unsubscribe', 'my_verify_token', '12345', res)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when token does not match', () => {
      const res = mockRes();
      expect(() => controller.verify('subscribe', 'wrong_token', '12345', res)).toThrow(ForbiddenException);
    });
  });

  describe('receive', () => {
    it('responds immediately with EVENT_RECEIVED and processes async', async () => {
      const res: any = {};
      res.status = jest.fn().mockReturnValue(res);
      res.send = jest.fn().mockReturnValue(res);
      mockWebhooksService.processPayload.mockResolvedValue(undefined);

      controller.receive({ entry: [] }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('EVENT_RECEIVED');
    });
  });
});
