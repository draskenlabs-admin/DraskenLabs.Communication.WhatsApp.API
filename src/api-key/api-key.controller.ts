import { Controller, Post, Get, Body, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto, ApiKeyResponseDto, ApiKeyListResponseDto } from './dto/api-key.dto';
import { Request } from 'express';
import { ApiWrappedOkResponse } from 'src/common/responses/swagger.decorators';

@ApiTags('API Keys')
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiWrappedOkResponse({
    dataDto: ApiKeyResponseDto,
    description: 'Create API key',
  })
  async create(@Req() req: Request, @Body() dto: CreateApiKeyDto): Promise<ApiKeyResponseDto> {
    const user = (req as any).user;
    if (!user) {
      throw new UnauthorizedException('User not found in context');
    }
    return this.apiKeyService.createApiKey(user.id, dto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all API keys for current user' })
  @ApiWrappedOkResponse({
    dataDto: ApiKeyListResponseDto,
    isArray: true,
    description: 'List API keys',
  })
  async findAll(@Req() req: Request) {
    const user = (req as any).user;
    if (!user) {
      throw new UnauthorizedException('User not found in context');
    }
    return this.apiKeyService.findAllByUserId(user.id);
  }
}
