import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { BaseResponse } from 'src/common/responses/base-response';
import { ConnectService } from './connect.service';
import { ApiWrappedOkResponse } from 'src/common/responses/swagger.decorators';
import { ConnectURLResponseDTO } from './dto/connect-url-response.dto';
import { ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { WABABusinesses } from 'src/redis/dto/waba-connect-state.dto';
import { WABANumberModel } from './dto/waba-number.dto';

@Controller('connect')
export class ConnectController {
  constructor(private readonly connectService: ConnectService) {}

  @ApiOperation({ description: 'Get WhatsApp Connect URL' })
  @ApiWrappedOkResponse({
    dataDto: ConnectURLResponseDTO,
    description: 'Get WhatsApp Connect URL',
  })
  @Get()
  async getWhatsAppConnectURL(): Promise<BaseResponse<ConnectURLResponseDTO>> {
    const response = await this.connectService.connectService();
    return BaseResponse.success(response);
  }

  @Get('/redirect')
  async callbackRedirect(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<any> {
    try {
      const response = await this.connectService.callbackRedirect(code, state);
      return BaseResponse.success({});
      // return res.redirect(`/connect/businesses?state=${state}`);
    } catch (e) {
      return BaseResponse.error(
        400,
        e?.message ??
          'Error while connecting whatsapp number. Please try again later.',
      );
    }
  }

  @ApiWrappedOkResponse({
    dataDto: WABABusinesses,
    description: 'Get WABA Businesses from logged in state',
  })
  @Get('/businesses')
  async getBusinesses(
    @Query('state') state: string,
  ): Promise<BaseResponse<WABABusinesses[]>> {
    if (!state)
      return BaseResponse.fieldError(400, [
        { field: 'state', message: 'State is required' },
      ]);

    try {
      const response = await this.connectService.getBusinesses(state);
      return BaseResponse.success(response);
    } catch (e) {
      return BaseResponse.error(400, 'Error while getting businesses');
    }
  }

  @ApiWrappedOkResponse({
    dataDto: WABANumberModel,
    isArray: true,
    description: 'Get WABAs owned by organisation',
  })
  @Get('/:businessId/ownedWABAs')
  async getOwnedWABAs(
    @Param('businessId') businessId: string,
    @Query('state') state: string,
  ): Promise<BaseResponse<WABANumberModel[]>> {
    if (!state)
      return BaseResponse.fieldError(400, [
        { field: 'state', message: 'State is required' },
      ]);

    try {
      const response = await this.connectService.getOwnedWABAs(
        businessId,
        state,
      );
      return BaseResponse.success(response);
    } catch (e) {
      return BaseResponse.error(400, 'Error while getting WABAs');
    }
  }

  @ApiWrappedOkResponse({
    dataDto: WABANumberModel,
    isArray: true,
    description: 'Get WABAs owned by organisation clients',
  })
  @Get('/:businessId/clientWABAs')
  async getClientWABAs(
    @Param('businessId') businessId: string,
    @Query('state') state: string,
  ): Promise<BaseResponse<WABANumberModel[]>> {
    if (!state)
      return BaseResponse.fieldError(400, [
        { field: 'state', message: 'State is required' },
      ]);

    try {
      const response = await this.connectService.getClientWABAs(
        businessId,
        state,
      );
      return BaseResponse.success(response);
    } catch (e) {
      return BaseResponse.error(400, 'Error while getting WABAs');
    }
  }
}
