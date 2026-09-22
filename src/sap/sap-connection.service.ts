import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Pool } from 'node-rfc';
import { AppConfig } from '../config/configuration';
import { dateFromABAP, dateToABAP } from './sap-date.util';

const CLIENT_OPTIONS = {
  date: { toABAP: dateToABAP, fromABAP: dateFromABAP },
};

/**
 * Gere um Pool de ligacoes RFC a SAP (node-rfc).
 *
 * Cada operacao de negocio (criar/alterar/eliminar/fechar encomenda) precisa de
 * usar a MESMA ligacao RFC do inicio ao fim - incluindo o BAPI_TRANSACTION_COMMIT/ROLLBACK -
 * tal como o RfcSessionManager.BeginContext/EndContext fazia em Encomendas.cs.
 * Por isso withConnection() empresta uma ligacao do pool para toda a operacao,
 * em vez de uma ligacao nova por cada chamada RFC.
 */
export interface SapUserOverride {
  user: string;
  password: string;
}

@Injectable()
export class SapConnectionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SapConnectionService.name);
  private pool!: Pool;
  private baseParams!: { ashost: string; sysnr: string; client: string; user: string; passwd: string; lang: string };

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  onModuleInit(): void {
    const sap = this.configService.get('sap', { infer: true });

    this.baseParams = {
      ashost: sap.ashost,
      sysnr: sap.sysnr,
      client: sap.client,
      user: sap.user,
      passwd: sap.password,
      lang: sap.lang,
    };

    this.pool = new Pool({ connectionParameters: this.baseParams, clientOptions: CLIENT_OPTIONS });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.closeAll();
  }

  /**
   * Empresta uma ligacao para toda a operacao de negocio (equivalente a
   * RfcSessionManager.BeginContext/EndContext em Encomendas.cs): a mesma ligacao
   * e usada para a(s) BAPI(s) de negocio e para o BAPI_TRANSACTION_COMMIT/ROLLBACK final.
   *
   * Quando e passado um `userOverride` (equivalente a Utilizador_SAP/Password_SAP),
   * abre-se uma ligacao dedicada com essas credenciais em vez de usar o pool partilhado,
   * porque o pool esta fixo as credenciais tecnicas configuradas em SAP_USER/SAP_PASSWORD.
   */
  async withConnection<T>(work: (client: Client) => Promise<T>, userOverride?: SapUserOverride): Promise<T> {
    if (!userOverride) {
      const client = (await this.pool.acquire()) as Client;

      return this.runAndCleanup(client, work, () => Promise.resolve(this.pool.release(client)));
    }

    const client = new Client(
      { ...this.baseParams, user: userOverride.user, passwd: userOverride.password },
      CLIENT_OPTIONS,
    );
    await client.open();

    return this.runAndCleanup(client, work, () => Promise.resolve(client.close()));
  }

  /**
   * Corre `work` e garante a limpeza da ligacao, sem deixar uma falha na limpeza
   * (ex: "Client release() invoked for already closed client", quando a ligacao
   * cai entretanto - por exemplo presa num breakpoint ABAP) mascarar o erro real de `work`.
   */
  private async runAndCleanup<T>(
    client: Client,
    work: (client: Client) => Promise<T>,
    cleanup: () => Promise<unknown>,
  ): Promise<T> {
    try {
      return await work(client);
    } finally {
      try {
        await cleanup();
      } catch (cleanupError) {
        this.logger.warn(`Falha ao libertar/fechar a ligacao RFC: ${(cleanupError as Error).message}`);
      }
    }
  }
}
