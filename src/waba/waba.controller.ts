import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WabaService } from './waba.service';
import { Request } from 'express';
import { ApiWrappedOkResponse } from 'src/common/responses/swagger.decorators';
import { WabaResponseDto, MetaWabaDetailsDto } from './dto/waba-response.dto';

@ApiTags('WABAs')
@Controller('wabas')
export class WabaController {
  constructor(private readonly wabaService: WabaService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all WABAs for current user' })
  @ApiWrappedOkResponse({
    dataDto: WabaResponseDto,
    isArray: true,
    description: 'List all WABAs',
  })
  async findAll(@Req() req: Request): Promise<WabaResponseDto[]> {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException('User not found in context');
    return this.wabaService.findAllByUserId(user.id);
  }

  @Get('/:wabaId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get specific WABA details from Meta Graph API' })
  @ApiWrappedOkResponse({
    dataDto: MetaWabaDetailsDto,
    description: 'WABA details from Meta',
  })
  async findDetails(
    @Param('wabaId') wabaId: string,
    @Req() req: Request,
  ): Promise<any> {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException('User not found in context');
    return this.wabaService.getWabaDetailsFromMeta(user.id, wabaId);
  }

  @Post('/:wabaId/sync')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync WABA details from Meta Graph API to database',
  })
  @ApiWrappedOkResponse({
    dataDto: WabaResponseDto,
    description: 'Synced WABA details',
  })
  async syncWaba(
    @Param('wabaId') wabaId: string,
    @Req() req: Request,
  ): Promise<WabaResponseDto> {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException('User not found in context');

    const metaDetails = await this.wabaService.getWabaDetailsFromMeta(
      user.id,
      wabaId,
    );

    return this.wabaService.createOrUpdateWaba({
      wabaId: metaDetails.id,
      userId: user.id,
      name: metaDetails.name,
      currency: metaDetails.currency,
      timezoneId: metaDetails.timezone_id,
      messageTemplateNamespace: metaDetails.message_template_namespace,
    });
  }
}
