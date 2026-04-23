import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WabaPhoneNumberService } from './waba-phone-number.service';
import { Request } from 'express';
import { ApiWrappedOkResponse } from 'src/common/responses/swagger.decorators';
import { WabaPhoneNumberResponseDto } from './dto/waba-phone-number-response.dto';

@ApiTags('WABA Phone Numbers')
@Controller('wabas/:wabaId/phone-numbers')
export class WabaPhoneNumberController {
  constructor(private readonly phoneNumberService: WabaPhoneNumberService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all phone numbers for a specific WABA' })
  @ApiWrappedOkResponse({
    dataDto: WabaPhoneNumberResponseDto,
    isArray: true,
    description: 'List of WABA phone numbers',
  })
  async findAll(
    @Param('wabaId') wabaId: string,
    @Req() req: Request,
  ): Promise<WabaPhoneNumberResponseDto[]> {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException('User not found in context');
    return this.phoneNumberService.findAllByWabaId(user.id, wabaId);
  }

  @Post('sync')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync phone numbers from Meta Graph API for a specific WABA',
  })
  @ApiWrappedOkResponse({
    dataDto: WabaPhoneNumberResponseDto,
    isArray: true,
    description: 'List of synced WABA phone numbers',
  })
  async sync(
    @Param('wabaId') wabaId: string,
    @Req() req: Request,
  ): Promise<WabaPhoneNumberResponseDto[]> {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException('User not found in context');
    return this.phoneNumberService.syncPhoneNumbers(user.id, wabaId);
  }
}
