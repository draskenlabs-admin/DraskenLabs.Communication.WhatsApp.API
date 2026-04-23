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
import { UserWhatsappService } from 'src/user/user-whatsapp.service';
import { WabaService } from 'src/waba/waba.service';

@Injectable()
export class ConnectService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly userWhatsappService: UserWhatsappService,
    private readonly wabaService: WabaService,
  ) {}

  async connectWhatsapp(
    body: ConnectWhatsAppRequestDTO,
    userId: number,
  ): Promise<ConnectWhatsAppResponseDTO> {
    // Exchange code for access token
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

    // First create or update the Waba record
    await this.wabaService.createOrUpdateWaba({
      wabaId: body.data.wabaId,
      userId: userId,
    });

    // Store the connection information in the database
    await this.userWhatsappService.createOrUpdate({
      userId: userId,
      businessId: body.data.businessId,
      phoneNumberId: body.data.phoneNumberId,
      wabaId: body.data.wabaId,
      accessToken: accessToken,
    });

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
