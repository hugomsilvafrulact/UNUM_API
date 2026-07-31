export interface AppConfig {
  port: number;
  database: {
    host: string;
    port: number;
    instanceName?: string;
    database: string;
    username: string;
    password: string;
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
  sap: {
    ashost: string;
    sysnr: string;
    client: string;
    user: string;
    password: string;
    lang: string;
  };
  application: {
    id: string;
    name: string;
    profile: string;
    defaultLang: string;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DB_HOST ?? '',
    port: parseInt(process.env.DB_PORT ?? '1433', 10),
    instanceName: process.env.DB_INSTANCE || undefined,
    database: process.env.DB_NAME ?? '',
    username: process.env.DB_USER ?? '',
    password: process.env.DB_PASSWORD ?? '',
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
  },
  sap: {
    ashost: process.env.SAP_ASHOST ?? '',
    sysnr: process.env.SAP_SYSNR ?? '',
    client: process.env.SAP_CLIENT ?? '',
    user: process.env.SAP_USER ?? '',
    password: process.env.SAP_PASSWORD ?? '',
    lang: process.env.SAP_LANG ?? 'PT',
  },
  application: {
    id: process.env.APP_ID ?? '',
    name: process.env.APP_NAME ?? 'UNUM_API',
    profile: process.env.APP_PROFILE ?? '',
    defaultLang: process.env.APP_DEFAULT_LANG ?? 'PT',
  },
});
