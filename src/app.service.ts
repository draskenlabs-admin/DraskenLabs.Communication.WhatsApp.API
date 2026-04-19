import { Injectable } from '@nestjs/common';
import { RootDataDto } from './common/responses/swagger-response.dto';

@Injectable()
export class AppService {
  getHello(): RootDataDto {
    return {
      name: 'Communication WhatsApp API',
      docs: '/swagger/docs',
      openApiJson: '/swagger/json',
    };
  }
}
