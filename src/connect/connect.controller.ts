import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { BaseResponse } from 'src/common/responses/base-response';
import { ConnectService } from './connect.service';
import { ApiWrappedOkResponse } from 'src/common/responses/swagger.decorators';
import { ApiOperation, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WABABusinesses } from 'src/redis/dto/waba-connect-state.dto';
import { WABANumberModel } from './dto/waba-number.dto';
import {
  ConnectWhatsAppRequestDTO,
  ConnectWhatsAppResponseDTO,
} from './dto/connect-waba.dto';
import { DebugTokenRequestDTO } from './dto/debug-token-request.dto';
import { Request } from 'express';

@ApiTags('Connect')
@Controller('connect')
export class ConnectController {
  constructor(private readonly connectService: ConnectService) {}

  @ApiOperation({ description: 'Connect WhatsApp Number' })
  @ApiBearerAuth()
  @ApiWrappedOkResponse({
    dataDto: ConnectWhatsAppResponseDTO,
    description: 'Connect WhatsApp Number',
  })
  @Post()
  async connectWhatsApp(
    @Body() body: ConnectWhatsAppRequestDTO,
    @Req() req: Request,
  ): Promise<BaseResponse<ConnectWhatsAppResponseDTO>> {
    const user = (req as any).user;
    if (!user) {
      throw new UnauthorizedException('User not found in context');
    }

    try {
      const response = await this.connectService.connectWhatsapp(body, user.id);
      return BaseResponse.success(response);
    } catch (e) {
      return BaseResponse.error(
        400,
        e?.message ??
          'Error while connecting whatsapp number. Please try again later.',
      );
    }
  }

  @ApiOperation({ description: 'Debug Token' })
  @Post('/debugToken')
  async debugToken(
    @Body() body: DebugTokenRequestDTO,
  ): Promise<BaseResponse<any>> {
    try {
      const response = await this.connectService.debugToken(body);
      return BaseResponse.success(response);
    } catch (e) {
      return BaseResponse.error(
        400,
        e?.message ?? 'Error while debug token. Please try again later.',
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
