export class WABABusinesses {
  id: number;
  name: string;
}

export class WABAConnectState {
  accessToken?: string | undefined;
  businesses: WABABusinesses[];
}
