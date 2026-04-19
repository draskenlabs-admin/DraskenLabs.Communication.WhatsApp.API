import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation } from '@nestjs/swagger';
import { ApiWrappedOkResponse } from './common/responses/swagger.decorators';
import { RootDataDto } from './common/responses/swagger-response.dto';
import { BaseResponse } from './common/responses/base-response';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'API Root' })
  @ApiWrappedOkResponse({ dataDto: RootDataDto, description: 'API root' })
  @Get()
  getHello(): BaseResponse<RootDataDto> {
    const response = this.appService.getHello();
    return response as unknown as BaseResponse<RootDataDto>;
  }
}
