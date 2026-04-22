import { Controller, Get, Query, Res } from '@nestjs/common';
import { BaseResponse } from 'src/common/responses/base-response';
import { ConnectService } from './connect.service';
import { ApiWrappedOkResponse } from 'src/common/responses/swagger.decorators';
import { ConnectURLResponseDTO } from './dto/connect-url-response.dto';
import { ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

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
      return BaseResponse.success({ code, state });
      const response = await this.connectService.callbackRedirect(code);
      return res.redirect(`/connect/businesses?accessToken=${response}`);
    } catch (e) {
      return BaseResponse.error(
        400,
        'Error while connecting whatsapp number. Please try again later.',
      );
    }
  }

  @Get('/businesses')
  async getBusinesses(
    @Query('accessToken') accessToken: string,
  ): Promise<BaseResponse<any>> {
    try {
      const response = await this.connectService.getBusinesses(accessToken);
      return BaseResponse.success(response);
    } catch (e) {
      console.error('WABA Profile Error:', e?.response?.data || e.message || e);
      return BaseResponse.error(400, 'Error while getting profile');
    }
  }
}
