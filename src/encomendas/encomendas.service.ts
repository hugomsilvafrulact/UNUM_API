import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RfcStructure, RfcTable } from 'node-rfc';
import { DataSource } from 'typeorm';
import { AppConfig } from '../config/configuration';
import { SapConnectionService, SapUserOverride } from '../sap/sap-connection.service';
import { BAPI } from '../sap/sap.constants';
import { extractBapiErrors } from '../sap/bapi-return.util';
import { EncomendasRepository } from './encomendas.repository';
import {
  buildConditionsCriar,
  buildItemsCriar,
  buildOrderHeaderInCriar,
  buildOrderHeaderInxCriar,
  buildOrderPartner,
} from './encomendas-sap.mapper';
import { padSapNumber } from './encomendas-sql.util';
import { CriarEncomendaDto } from './dto/criar-encomenda.dto';
import { CriarEncomendaResponseDto, EncomendaResultadoDto } from './dto/encomenda-resultado.dto';
import { SimularEncomendaDto } from './dto/simular-encomenda.dto';
import { SimularEncomendaResponseDto } from './dto/log-dados-incompletos.dto';
import { AlterarEncomendaDto } from './dto/alterar-encomenda.dto';
import { EliminarEncomendaDto } from './dto/eliminar-encomenda.dto';
import { FecharEncomendaDto } from './dto/fechar-encomenda.dto';
import { FecharLinhaEncomendaDto } from './dto/fechar-linha-encomenda.dto';
import { OperacaoBaseDto } from './dto/operacao-base.dto';
import { ParceiroEncomendaResponseDto } from './dto/parceiro-encomenda.dto';

@Injectable()
export class EncomendasService {
  constructor(
    private readonly sap: SapConnectionService,
    private readonly dataSource: DataSource,
    private readonly repo: EncomendasRepository,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  private userOverride(dto: OperacaoBaseDto): SapUserOverride | undefined {
    return dto.utilizadorSap ? { user: dto.utilizadorSap, password: dto.passwordSap! } : undefined;
  }

  private idioma(dto: OperacaoBaseDto): string {
    return dto.idioma ?? this.configService.get('application', { infer: true }).defaultLang;
  }

  /** Equivalente a CriarEncomenda (BAPI_SALESORDER_CREATEFROMDAT2). */
  async criar(dto: CriarEncomendaDto): Promise<CriarEncomendaResponseDto> {
    const consignacao = dto.consignacao ?? false;
    const gestaoOportunidades = dto.gestaoOportunidades ?? false;
    const simulacao = dto.simulacao ?? false;

    return this.sap.withConnection(async (client) => {
      const { itemsIn, itemsInx, schedulesIn, schedulesInx } = buildItemsCriar(
        dto.linhas,
        dto.cabecalho.hardOrder,
        gestaoOportunidades,
      );
      const { conditionsIn, conditionsInx } = buildConditionsCriar(dto.cabecalho.custosTransporte);

      const result = await client.call(BAPI.SALESORDER_CREATE, {
        TESTRUN: simulacao ? 'X' : ' ',
        ORDER_HEADER_IN: buildOrderHeaderInCriar(dto.cabecalho, consignacao, gestaoOportunidades),
        ORDER_HEADER_INX: buildOrderHeaderInxCriar(gestaoOportunidades),
        ORDER_PARTNERS: dto.parceiros.map(buildOrderPartner),
        ORDER_ITEMS_IN: itemsIn,
        ORDER_ITEMS_INX: itemsInx,
        ORDER_SCHEDULES_IN: schedulesIn,
        ORDER_SCHEDULES_INX: schedulesInx,
        ORDER_CONDITIONS_IN: conditionsIn,
        ORDER_CONDITIONS_INX: conditionsInx,
      });

      const erros = extractBapiErrors(result.RETURN);
      let sucesso = erros.length === 0;
      let mensagemErro = erros.join('\r\n\r\n');
      let numeroEncomenda = '';
      let parceirosResposta: ParceiroEncomendaResponseDto[] = dto.parceiros;

      if (sucesso && !simulacao) {
        numeroEncomenda = String(result.SALESDOCUMENT ?? '').trim();

        if (dto.parceiros[0]?.sapTipoConta === 'CPD') {
          const orderKeys = (result.ORDER_KEYS as unknown as Array<{ REFOBJECT: string; ADDRESS: string }>) ?? [];
          const enderecoRow = orderKeys.find((k) => k.REFOBJECT === 'ADDRESS');

          if (!enderecoRow) {
            sucesso = false;
          } else {
            parceirosResposta = dto.parceiros.map((p) => ({ ...p, sapEndereco: enderecoRow.ADDRESS }));
          }
        }
      }

      if (!simulacao) {
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();

        try {
          if (sucesso && !gestaoOportunidades) {
            const r = await this.repo.criaMantemCabecalho(qr, numeroEncomenda, dto.cabecalho);
            sucesso = r.sucesso;
            mensagemErro = r.mensagemErro;
          }

          if (sucesso && !gestaoOportunidades) {
            for (const parceiro of parceirosResposta) {
              const r = await this.repo.criaMantemParceiro(qr, numeroEncomenda, parceiro, dto.utilizador);
              sucesso = r.sucesso;
              mensagemErro = r.mensagemErro;
              if (!sucesso) break;
            }
          }

          if (sucesso && !gestaoOportunidades) {
            for (const linha of dto.linhas) {
              const temAviso = (dto.linhasAvisos ?? []).some(
                (a) => a.linhaEncomenda === linha.linhaEncomenda && a.subLinha === linha.subLinha,
              );
              const r = await this.repo.criaMantemLinha(
                qr,
                numeroEncomenda,
                linha,
                temAviso ? 2 : 1,
                dto.utilizador,
                dto.computador,
              );
              sucesso = r.sucesso;
              mensagemErro = r.mensagemErro;
              if (!sucesso) break;
            }
          }

          if (sucesso && !gestaoOportunidades) {
            for (const aviso of dto.linhasAvisos ?? []) {
              const r = await this.repo.criaMantemLinhaAviso(qr, numeroEncomenda, aviso, dto.utilizador);
              sucesso = r.sucesso;
              mensagemErro = r.mensagemErro;
              if (!sucesso) break;
            }
          }

          if (sucesso && gestaoOportunidades && dto.pedidoEnvioAmostras) {
            const primeiraLinha = dto.linhas[0].linhaEncomenda;

            if (!dto.pedidoEnvioAmostras.idPedido) {
              const r = await this.repo.insPedidoEnvioAmostras(
                qr,
                dto.pedidoEnvioAmostras,
                numeroEncomenda,
                primeiraLinha,
                dto.utilizador,
                this.idioma(dto),
              );
              sucesso = r.sucesso;
              if (!sucesso) mensagemErro = 'Nao foi possivel criar o pedido de envio de amostras';
            } else {
              const r = await this.repo.updPedidoEnvioAmostra(
                qr,
                dto.pedidoEnvioAmostras,
                numeroEncomenda,
                primeiraLinha,
                dto.utilizador,
                this.idioma(dto),
              );
              sucesso = r.sucesso;
              mensagemErro = r.mensagemErro;
            }
          }

          if (sucesso) {
            await qr.commitTransaction();
            await client.call(BAPI.TRANSACTION_COMMIT, { WAIT: 'X' });
          } else {
            numeroEncomenda = '';
            await qr.rollbackTransaction();
            await client.call(BAPI.TRANSACTION_ROLLBACK, {});
          }
        } catch (e) {
          sucesso = false;
          numeroEncomenda = '';
          mensagemErro = (e as Error).message;
          await qr.rollbackTransaction();
          await client.call(BAPI.TRANSACTION_ROLLBACK, {});
        } finally {
          await qr.release();
        }
      }

      return {
        sucesso,
        mensagemErro: mensagemErro || undefined,
        numeroEncomenda: numeroEncomenda || undefined,
        parceiros: parceirosResposta,
      };
    }, this.userOverride(dto));
  }

  /** Equivalente a SimulaCriacaoEncomenda (BAPI_SALESORDER_SIMULATE). */
  async simular(dto: SimularEncomendaDto): Promise<SimularEncomendaResponseDto> {
    const consignacao = dto.consignacao ?? false;

    return this.sap.withConnection(async (client) => {
      const orderHeaderIn: RfcStructure = {
        DOC_TYPE: consignacao ? 'ZKB' : 'TA',
        SALES_ORG: dto.cabecalho.sapOrgVendas,
        DISTR_CHAN: dto.cabecalho.sapCanalDistribuicao,
        DIVISION: dto.cabecalho.sapSetorAtividade,
        PURCH_DATE: dto.cabecalho.sapDataEncomenda,
        INCOTERMS1: dto.cabecalho.incoterms1 ?? '',
        INCOTERMS2: dto.cabecalho.incoterms2 ?? '',
        PMNTTRMS: dto.cabecalho.condicoesPagamento ?? '',
        PURCH_NO: dto.cabecalho.encomendaCliente,
        CURRENCY: dto.cabecalho.moeda ?? '',
      };

      const orderItemsIn = dto.linhas.map((linha) => ({
        ITM_NUMBER: linha.linhaEncomenda,
        MATERIAL: linha.sapMaterial,
        SHORT_TEXT: linha.descricaoMaterial ?? '',
        PLANT: linha.sapFabricaExpedicao,
        SHIP_POINT: linha.sapCodLocalExpedicao,
        TARGET_QTY: linha.quantidadeUV,
        TARGET_QU: linha.sapUnidadeVenda,
        CUST_MAT35: linha.refCliente ?? '',
      }));

      const orderScheduleIn = dto.linhas.map((linha) => ({
        ITM_NUMBER: linha.linhaEncomenda,
        SCHED_LINE: linha.subLinha,
        REQ_DATE: linha.sapDataEntrega,
        DLV_DATE: linha.sapDataEntrega,
        REQ_QTY: linha.quantidadeUV,
      }));

      const result = await client.call(BAPI.SALESORDER_SIMULATE, {
        ORDER_HEADER_IN: orderHeaderIn,
        ORDER_PARTNERS: dto.parceiros.map(buildOrderPartner),
        ORDER_ITEMS_IN: orderItemsIn,
        ORDER_SCHEDULE_IN: orderScheduleIn,
      });

      const erros = extractBapiErrors(result.RETURN);
      const orderIncomplete =
        (result.ORDER_INCOMPLETE as unknown as Array<{
          ITM_NUMBER: string;
          TABLE_NAME: string;
          FIELD_NAME: string;
          FIELD_TEXT: string;
        }>) ?? [];
      const linhasIncompletas = orderIncomplete.map(
        (row) => ({
          linhaEncomenda: Number(row.ITM_NUMBER),
          tabela: row.TABLE_NAME,
          campo: row.FIELD_NAME,
          mensagemErro: row.FIELD_TEXT,
        }),
      );

      return {
        sucesso: erros.length === 0 && linhasIncompletas.length === 0,
        mensagemErro: erros.join('\r\n\r\n') || undefined,
        linhasIncompletas,
      };
    }, this.userOverride(dto));
  }

  /** Equivalente a AlterarEncomenda (BAPI_SALESORDER_CHANGE). */
  async alterar(numero: string, dto: AlterarEncomendaDto): Promise<EncomendaResultadoDto> {
    const gestaoOportunidades = dto.gestaoOportunidades ?? false;
    const simulacao = dto.simulacao ?? false;
    const salesdocument = padSapNumber(numero);

    return this.sap.withConnection(async (client) => {
      const orderHeaderIn: RfcStructure = {
        SALES_ORG: dto.cabecalho.sapOrgVendas,
        DISTR_CHAN: dto.cabecalho.sapCanalDistribuicao,
        DIVISION: dto.cabecalho.sapSetorAtividade,
        PURCH_DATE: dto.cabecalho.sapDataEncomenda,
        PURCH_NO_C: dto.cabecalho.encomendaCliente,
        PURCH_NO_S: dto.cabecalho.encomendaClienteRecebedor ?? '',
        INCOTERMS1: dto.cabecalho.incoterms1 ?? '',
        INCOTERMS2: dto.cabecalho.incoterms2 ?? '',
      };
      const orderHeaderInx: RfcStructure = {
        UPDATEFLAG: 'U',
        SALES_ORG: 'X',
        DISTR_CHAN: 'X',
        DIVISION: 'X',
        PURCH_DATE: 'X',
        PURCH_NO_C: 'X',
        PURCH_NO_S: 'X',
        INCOTERMS1: 'X',
        INCOTERMS2: 'X',
      };

      if (!gestaoOportunidades) {
        orderHeaderIn.PMNTTRMS = dto.cabecalho.condicoesPagamento ?? '';
        orderHeaderInx.PMNTTRMS = 'X';
      }

      const partnerChanges: RfcTable = [];
      const partnerAddresses: RfcTable = [];

      for (const parceiro of dto.parceiros) {
        if (parceiro.estadoUpdate !== 'U') continue;

        const partnerNumb = padSapNumber(parceiro.sapEntidade);
        const change: RfcStructure = {
          DOCUMENT: numero,
          UPDATEFLAG: 'U',
          PARTN_ROLE: parceiro.sapFuncaoParceiro,
          P_NUMB_NEW: partnerNumb,
        };

        if (parceiro.sapTipoConta === 'CPD') {
          change.P_NUMB_OLD = partnerNumb;
          change.ADDR_LINK = '9999999999';
          partnerAddresses.push({
            ADDR_NO: '9999999999',
            NAME: parceiro.nomeCliente ?? '',
            COUNTRY: parceiro.sapPais ?? '',
            POSTL_COD1: parceiro.codigoPostal ?? '',
            CITY: parceiro.cidade ?? '',
            STREET: parceiro.rua ?? '',
          });
        }

        partnerChanges.push(change);
      }

      const itemsIn: RfcTable = [];
      const itemsInx: RfcTable = [];
      const schedulesIn: RfcTable = [];
      const schedulesInx: RfcTable = [];

      for (const linha of dto.linhas) {
        if (!linha.estadoUpdate) continue;

        const itmNumber = String(linha.linhaEncomenda).padStart(6, '0');
        const itemIn: RfcStructure = {
          ITM_NUMBER: itmNumber,
          MATERIAL: linha.sapMaterial,
          SHORT_TEXT: linha.descricaoMaterial ?? '',
          PLANT: linha.sapFabricaExpedicao,
          SHIP_POINT: linha.sapCodLocalExpedicao,
          TARGET_QTY: linha.quantidadeUV,
          TARGET_QU: linha.sapUnidadeVenda,
          SALES_UNIT: linha.sapUnidadeVenda,
          CUST_MAT35: linha.refCliente ?? '',
          PRICE_DATE: linha.sapDataEntrega,
          PO_ITM_NO: linha.linhaEncomendaCliente ?? '',
        };
        const itemInx: RfcStructure = {
          ITM_NUMBER: itmNumber,
          MATERIAL: 'X',
          SHORT_TEXT: 'X',
          PLANT: 'X',
          SHIP_POINT: 'X',
          TARGET_QTY: 'X',
          TARGET_QU: 'X',
          SALES_UNIT: 'X',
          CUST_MAT35: 'X',
          PRICE_DATE: 'X',
          PO_ITM_NO: 'X',
        };

        if (linha.trade && linha.estadoUpdate === 'D') {
          itemIn.REASON_REJ = 'Z1';
          itemInx.UPDATEFLAG = 'U';
          itemInx.REASON_REJ = 'X';
        } else {
          itemInx.UPDATEFLAG = linha.estadoUpdate;
        }

        if (linha.hardOrderNumber) {
          itemIn.REF_DOC = linha.hardOrderNumber;
          itemIn.REF_DOC_IT = linha.hardOrderNumberLine ?? '';
          itemIn.REF_DOC_CA = 'C';
          itemInx.REF_DOC = 'X';
          itemInx.REF_DOC_IT = 'X';
          itemInx.REF_DOC_CA = 'X';
        }

        if (gestaoOportunidades) {
          itemIn.ITEM_CATEG = linha.categoriaItem ?? '';
          itemIn.REC_POINT = linha.contacto ?? '';
          itemInx.ITEM_CATEG = 'X';
          itemInx.REC_POINT = 'X';
        }

        itemsIn.push(itemIn);
        itemsInx.push(itemInx);

        if (!dto.cabecalho.hardOrder) {
          const schedLine = String(linha.subLinha).padStart(4, '0');
          schedulesIn.push({
            ITM_NUMBER: itmNumber,
            SCHED_LINE: schedLine,
            REQ_DATE: linha.sapDataEntrega,
            REQ_Qty: linha.quantidadeUV,
          });
          schedulesInx.push({
            ITM_NUMBER: itmNumber,
            SCHED_LINE: schedLine,
            UPDATEFLAG: linha.estadoUpdate,
            REQ_DATE: 'X',
            REQ_Qty: 'X',
          });
        }
      }

      const { conditionsIn, conditionsInx } = buildConditionsCriar(dto.cabecalho.custosTransporte);

      const result = await client.call(BAPI.SALESORDER_CHANGE, {
        SALESDOCUMENT: salesdocument,
        SIMULATION: simulacao ? 'X' : ' ',
        ORDER_HEADER_IN: orderHeaderIn,
        ORDER_HEADER_INX: orderHeaderInx,
        LOGIC_SWITCH: { PRICING: 'B', COND_HANDL: 'X' },
        ORDER_ITEM_IN: itemsIn,
        ORDER_ITEM_INX: itemsInx,
        PARTNERCHANGES: partnerChanges,
        PARTNERADDRESSES: partnerAddresses,
        SCHEDULE_LINES: schedulesIn,
        SCHEDULE_LINESX: schedulesInx,
        CONDITIONS_IN: conditionsIn,
        CONDITIONS_INX: conditionsInx,
      });

      const erros = extractBapiErrors(result.RETURN);
      let sucesso = erros.length === 0;
      let mensagemErro = erros.join('\r\n\r\n');

      if (!simulacao) {
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();

        try {
          if (sucesso && !gestaoOportunidades) {
            const r = await this.repo.criaMantemCabecalho(qr, numero, dto.cabecalho);
            sucesso = r.sucesso;
            mensagemErro = r.mensagemErro;
          }

          if (sucesso && !gestaoOportunidades) {
            for (const parceiro of dto.parceiros) {
              const r = await this.repo.criaMantemParceiro(qr, numero, parceiro, dto.utilizador);
              sucesso = r.sucesso;
              mensagemErro = r.mensagemErro;
              if (!sucesso) break;
            }
          }

          if (sucesso && !gestaoOportunidades) {
            for (const linha of dto.linhas) {
              if (!linha.estadoUpdate) continue;

              const temAviso = (dto.linhasAvisos ?? []).some(
                (a) => a.linhaEncomenda === linha.linhaEncomenda && a.subLinha === linha.subLinha,
              );
              const r = await this.repo.criaMantemLinha(
                qr,
                numero,
                linha,
                temAviso ? 2 : 1,
                dto.utilizador,
                dto.computador,
              );
              sucesso = r.sucesso;
              mensagemErro = r.mensagemErro;
              if (!sucesso) break;
            }
          }

          if (sucesso && !gestaoOportunidades) {
            for (const aviso of dto.linhasAvisos ?? []) {
              const r = await this.repo.criaMantemLinhaAviso(qr, numero, aviso, dto.utilizador);
              sucesso = r.sucesso;
              mensagemErro = r.mensagemErro;
              if (!sucesso) break;
            }
          }

          if (sucesso && gestaoOportunidades && dto.pedidoEnvioAmostras) {
            const r = await this.repo.updPedidoEnvioAmostra(
              qr,
              dto.pedidoEnvioAmostras,
              numero,
              dto.linhas[0].linhaEncomenda,
              dto.utilizador,
              this.idioma(dto),
            );
            sucesso = r.sucesso;
            mensagemErro = r.mensagemErro;
          }

          if (sucesso) {
            await qr.commitTransaction();
            await client.call(BAPI.TRANSACTION_COMMIT, { WAIT: 'X' });
          } else {
            await qr.rollbackTransaction();
            await client.call(BAPI.TRANSACTION_ROLLBACK, {});
          }
        } catch (e) {
          sucesso = false;
          mensagemErro = (e as Error).message;
          await qr.rollbackTransaction();
          await client.call(BAPI.TRANSACTION_ROLLBACK, {});
        } finally {
          await qr.release();
        }
      }

      return { sucesso, mensagemErro: mensagemErro || undefined };
    }, this.userOverride(dto));
  }

  /** Equivalente a EliminarEncomenda (BAPI_SALESORDER_CHANGE, UPDATEFLAG=D). */
  async eliminar(numero: string, dto: EliminarEncomendaDto): Promise<EncomendaResultadoDto> {
    const gestaoOportunidades = dto.gestaoOportunidades ?? false;

    return this.sap.withConnection(async (client) => {
      const result = await client.call(BAPI.SALESORDER_CHANGE, {
        SALESDOCUMENT: padSapNumber(numero),
        ORDER_HEADER_INX: { UPDATEFLAG: 'D' },
      });

      const erros = extractBapiErrors(result.RETURN);
      let sucesso = erros.length === 0;
      let mensagemErro = erros.join('\r\n\r\n');

      const qr = this.dataSource.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();

      try {
        if (sucesso && !gestaoOportunidades) {
          const r = await this.repo.anulaEncomenda(qr, numero, dto.entidade, dto.motivo, dto.utilizador, dto.computador);
          sucesso = r.sucesso;
          mensagemErro = r.mensagemErro;
        }

        if (sucesso && gestaoOportunidades && dto.pedidoEnvioAmostras) {
          const r = await this.repo.goEliminaEncomenda(qr, dto.pedidoEnvioAmostras, dto.utilizador);
          sucesso = r.sucesso;
          mensagemErro = r.mensagemErro;
        }

        if (sucesso) {
          await qr.commitTransaction();
          await client.call(BAPI.TRANSACTION_COMMIT, { WAIT: 'X' });
        } else {
          await qr.rollbackTransaction();
          await client.call(BAPI.TRANSACTION_ROLLBACK, {});
        }
      } catch (e) {
        sucesso = false;
        mensagemErro = (e as Error).message;
        await qr.rollbackTransaction();
        await client.call(BAPI.TRANSACTION_ROLLBACK, {});
      } finally {
        await qr.release();
      }

      return { sucesso, mensagemErro: mensagemErro || undefined };
    }, this.userOverride(dto));
  }

  /** Equivalente a FecharEncomenda (fecha todas as linhas em aberto de uma encomenda). */
  async fechar(numero: string, dto: FecharEncomendaDto): Promise<EncomendaResultadoDto> {
    const hardOrder = dto.hardOrder ?? false;

    return this.sap.withConnection(async (client) => {
      const qr = this.dataSource.createQueryRunner();
      await qr.connect();

      const linhas = await this.repo.getLinhasParaFecharManualmenteEmSap(qr, numero);

      if (linhas.length === 0 && !hardOrder) {
        await qr.release();
        return { sucesso: false, mensagemErro: 'Nao existem linhas para fechar' };
      }

      let sucesso = true;
      let mensagemErro = '';

      try {
        for (const linha of linhas) {
          const result = await client.call(BAPI.SALESORDER_CHANGE, {
            SALESDOCUMENT: padSapNumber(numero),
            ORDER_HEADER_INX: { UPDATEFLAG: 'U' },
            ORDER_ITEM_IN: [{ ITM_NUMBER: linha.LinhaEncomenda, REASON_REJ: dto.sapMotivoFecho }],
            ORDER_ITEM_INX: [{ ITM_NUMBER: linha.LinhaEncomenda, UPDATEFLAG: 'U', REASON_REJ: 'X' }],
          });

          const erros = extractBapiErrors(result.RETURN);
          if (erros.length > 0) {
            sucesso = false;
            mensagemErro += erros.join('\r\n\r\n');
          }
        }

        if (sucesso) {
          await qr.startTransaction();
          const r = await this.repo.fechaEncomenda(qr, numero, dto.utilizador, dto.computador);
          sucesso = r.sucesso;
          mensagemErro = r.mensagemErro;

          if (sucesso) await qr.commitTransaction();
          else await qr.rollbackTransaction();
        }

        if (sucesso) {
          await client.call(BAPI.TRANSACTION_COMMIT, { WAIT: 'X' });
        } else {
          await client.call(BAPI.TRANSACTION_ROLLBACK, {});
        }
      } catch (e) {
        sucesso = false;
        mensagemErro = (e as Error).message;
        await client.call(BAPI.TRANSACTION_ROLLBACK, {});
      } finally {
        await qr.release();
      }

      return { sucesso, mensagemErro: mensagemErro || undefined };
    }, this.userOverride(dto));
  }

  /** Equivalente a FecharLinhaEncomenda. */
  async fecharLinha(numero: string, linha: string, dto: FecharLinhaEncomendaDto): Promise<EncomendaResultadoDto> {
    const hardOrder = dto.hardOrder ?? false;
    const linhaEncomenda = Number(linha);

    return this.sap.withConnection(async (client) => {
      const qr = this.dataSource.createQueryRunner();
      await qr.connect();

      const verificacao = await this.repo.verificaSeNecessitaFecharLinhaEncomendaSAP(
        qr,
        numero,
        linhaEncomenda,
        dto.subLinha,
      );

      if (!verificacao) {
        await qr.release();
        return { sucesso: false, mensagemErro: 'Linha de encomenda nao encontrada' };
      }

      const fecharSap =
        !(verificacao.QuantidadeEncomenda <= verificacao.QuantidadeExpedicao || dto.pedidoCompra || hardOrder);

      let sucesso = true;
      let mensagemErro = '';

      try {
        if (fecharSap) {
          const result = await client.call(BAPI.SALESORDER_CHANGE, {
            SALESDOCUMENT: padSapNumber(numero),
            ORDER_HEADER_INX: { UPDATEFLAG: 'U' },
            ORDER_ITEM_IN: [{ ITM_NUMBER: linha, REASON_REJ: dto.sapMotivoFecho }],
            ORDER_ITEM_INX: [{ ITM_NUMBER: linha, UPDATEFLAG: 'U', REASON_REJ: 'X' }],
          });

          const erros = extractBapiErrors(result.RETURN);
          sucesso = erros.length === 0;
          mensagemErro = erros.join('\r\n\r\n');
        }

        if (sucesso) {
          await qr.startTransaction();
          const r = await this.repo.fechaLinhaEncomenda(
            qr,
            numero,
            linhaEncomenda,
            dto.subLinha,
            dto.entidade,
            dto.motivo,
            dto.codigoMP,
            dto.utilizador,
          );
          sucesso = r.sucesso;
          mensagemErro = r.mensagemErro;

          if (sucesso) await qr.commitTransaction();
          else await qr.rollbackTransaction();
        }

        if (sucesso) {
          if (fecharSap) await client.call(BAPI.TRANSACTION_COMMIT, { WAIT: 'X' });
        } else {
          await client.call(BAPI.TRANSACTION_ROLLBACK, {});
        }
      } catch (e) {
        sucesso = false;
        mensagemErro = (e as Error).message;
        await client.call(BAPI.TRANSACTION_ROLLBACK, {});
      } finally {
        await qr.release();
      }

      return { sucesso, mensagemErro: mensagemErro || undefined };
    }, this.userOverride(dto));
  }
}
