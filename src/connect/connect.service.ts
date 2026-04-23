import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RedisService } from 'src/redis/redis.service';
import { WABABusinesses } from 'src/redis/dto/waba-connect-state.dto';
import { WABANumberModel } from './dto/waba-number.dto';
import {
  ConnectWhatsAppRequestDTO,
  ConnectWhatsAppResponseDTO,
} from './dto/connect-waba.dto';
import { DebugTokenRequestDTO } from './dto/debug-token-request.dto';

@Injectable()
export class ConnectService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async connectWhatsapp(
    body: ConnectWhatsAppRequestDTO,
  ): Promise<ConnectWhatsAppResponseDTO> {
    // let stateData = await this.redisService.getState(body.code);
    // if (!stateData) throw new BadRequestException('Invalid state provided');

    // let redirectURI = new URL(
    //   this.configService.get('META_REDIRECT_URI') ?? '',
    // );
    // // redirectURI.searchParams.set('state', state);
    const tokenRes = await axios.get(
      `https://graph.facebook.com/v25.0/oauth/access_token`,
      {
        params: {
          client_id: this.configService.get('META_APP_ID') ?? '',
          client_secret: this.configService.get('META_APP_SECRET') ?? '',
          code: body.code,
        },
      },
    );
    const accessToken = tokenRes.data.access_token;
    // await this.redisService.updateState(body.code, {
    //   accessToken: accessToken,
    //   businesses: [],
    // });
    return {
      accessToken: accessToken,
    };
  }

  async debugToken(body: DebugTokenRequestDTO): Promise<any> {
    const debugTokenRes = await axios.get(
      `https://graph.facebook.com/v25.0/debug_token`,
      {
        params: {
          input_token: body.accessToken,
        },
      },
    );
    return debugTokenRes.data;
  }

  async getBusinesses(state: string): Promise<WABABusinesses[]> {
    const stateData = await this.redisService.getState(state);
    if (!stateData) throw new BadRequestException('Invalid state provided');

    const profileRes = await axios.get(
      `https://graph.facebook.com/v25.0/me/businesses`,
      {
        headers: { Authorization: `Bearer ${stateData.accessToken}` },
      },
    );
    const data = profileRes.data;
    return data.data;
  }

  async getOwnedWABAs(
    businessId: string,
    state: string,
  ): Promise<WABANumberModel[]> {
    const stateData = await this.redisService.getState(state);
    if (!stateData) throw new BadRequestException('Invalid state provided');

    const response = await axios.get(
      `https://graph.facebook.com/v25.0/${businessId}/owned_whatsapp_business_accounts`,
      {
        headers: { Authorization: `Bearer ${stateData.accessToken}` },
      },
    );
    const data = response.data;
    return data.data;
  }

  async getClientWABAs(
    businessId: string,
    state: string,
  ): Promise<WABANumberModel[]> {
    const stateData = await this.redisService.getState(state);
    if (!stateData) throw new BadRequestException('Invalid state provided');

    const response = await axios.get(
      `https://graph.facebook.com/v25.0/${businessId}/client_whatsapp_business_accounts`,
      {
        headers: { Authorization: `Bearer ${stateData.accessToken}` },
      },
    );
    const data = response.data;
    return data.data;
  }
}
