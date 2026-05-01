import { Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ConnectService } from './connect.service';
import { ConnectWhatsAppRequestDTO, ConnectWhatsAppResponseDTO } from './dto/connect-waba.dto';
import { ApiStandardErrorResponses, ApiWrappedOkResponse } from 'src/common/responses/swagger.decorators';

@ApiTags('Connect')
@Controller('connect')
export class ConnectController {
  constructor(private readonly connectService: ConnectService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Connect a WhatsApp Business Account',
    description: 'Exchanges a Meta Embedded Signup OAuth code for an access token, syncs WABA metadata and phone numbers, and populates the phone cache.',
  })
  @ApiWrappedOkResponse({ dataDto: ConnectWhatsAppResponseDTO, description: 'WABA connected successfully' })
  @ApiStandardErrorResponses({ unauthorized: true, badRequest: true, validation: true })
  async connectWhatsApp(
    @Body() body: ConnectWhatsAppRequestDTO,
    @Req() req: Request,
  ): Promise<ConnectWhatsAppResponseDTO> {
    const user = (req as any).user;
    const orgId = (req as any).orgId;
    if (!user || !orgId) throw new UnauthorizedException('User not found in context');
    return this.connectService.connectWhatsapp(body, user.id, orgId);
  }
}
