import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { CabecalhoEncomendaDto } from './dto/cabecalho-encomenda.dto';
import { ParceiroEncomendaDto } from './dto/parceiro-encomenda.dto';
import { LinhaEncomendaDto } from './dto/linha-encomenda.dto';
import { LinhaEncomendaAvisoDto } from './dto/linha-encomenda-aviso.dto';
import { PedidoEnvioAmostrasDto } from './dto/pedido-envio-amostras.dto';
import { bit, formatDateDdMmYyyy, formatDateMmDdYyyy } from './encomendas-sql.util';

export interface SpResult {
  sucesso: boolean;
  mensagemErro: string;
}

/**
 * Chama as stored procedures DAL.AcessData_DB.ENCOMENDAS_... e GO_... usadas por Encomendas.cs.
 *
 * IMPORTANTE: o codigo original chama estas procedures atraves de uma camada DAL (DAL.AcessData_DB)
 * cujo codigo-fonte nao esta disponivel aqui - so se conhece a assinatura (ordem dos parametros)
 * a partir das chamadas em Encomendas.cs. runProcedure() assume que cada procedure devolve um
 * result set de 1 linha com colunas Sucesso (bit) e MensagemErro (nvarchar); confirma/ajusta este
 * contrato de acordo com a definicao real das stored procedures em SQL Server.
 */
@Injectable()
export class EncomendasRepository {
  private async runProcedure(qr: QueryRunner, procedure: string, params: unknown[]): Promise<SpResult> {
    const placeholders = params.map((_, i) => `@${i}`).join(', ');
    const rows: Array<{ Sucesso?: boolean | number; MensagemErro?: string }> = await qr.query(
      `EXEC dbo.${procedure} ${placeholders}`,
      params,
    );
    const row = rows?.[0];

    return {
      sucesso: row ? Boolean(row.Sucesso) : false,
      mensagemErro: row?.MensagemErro ?? '',
    };
  }

  criaMantemCabecalho(
    qr: QueryRunner,
    numeroEncomenda: string,
    cabecalho: CabecalhoEncomendaDto,
  ): Promise<SpResult> {
    return this.runProcedure(qr, 'ENCOMENDAS_CriaMantem', [
      numeroEncomenda,
      cabecalho.unumCodEmpresa,
      formatDateDdMmYyyy(cabecalho.dataEncomenda),
      cabecalho.encomendaCliente,
      cabecalho.encomendaClienteRecebedor ?? '',
      cabecalho.observacoes ?? '',
      cabecalho.observacoesParaCliente ?? '',
      cabecalho.sapOrgVendas,
      cabecalho.sapCanalDistribuicao,
      cabecalho.sapSetorAtividade,
      '0',
      bit(cabecalho.hardOrder),
    ]);
  }

  criaMantemParceiro(
    qr: QueryRunner,
    numeroEncomenda: string,
    parceiro: ParceiroEncomendaDto,
    utilizador: string,
  ): Promise<SpResult> {
    return this.runProcedure(qr, 'ENCOMENDAS_CriaMantem_Parceiros', [
      numeroEncomenda,
      parceiro.sapFuncaoParceiro,
      parceiro.sapEntidade,
      (parceiro as { sapEndereco?: string }).sapEndereco ?? '',
      parceiro.nomeCliente ?? '',
      parceiro.sapTipoConta,
      parceiro.cidade ?? '',
      parceiro.codigoPostal ?? '',
      parceiro.rua ?? '',
      parceiro.porta ?? '',
      parceiro.rua3 ?? '',
      parceiro.zonaTransporte ?? '',
      parceiro.telefone ?? '',
      parceiro.fax ?? '',
      parceiro.sapPais ?? '',
      parceiro.sapIdiomaCliente ?? '',
      bit(parceiro.recebedorAceitaReceberMercadoriaSemBA),
      utilizador,
    ]);
  }

  criaMantemLinha(
    qr: QueryRunner,
    numeroEncomenda: string,
    linha: LinhaEncomendaDto,
    estadoLinhaEncomenda: 1 | 2,
    utilizador: string,
    computador: string,
  ): Promise<SpResult> {
    return this.runProcedure(qr, 'ENCOMENDAS_CriaMantem_Linhas', [
      numeroEncomenda,
      linha.linhaEncomenda,
      linha.subLinha,
      linha.unumMaterial,
      linha.quantidadeUV,
      linha.qtdEmbalagens ?? 0,
      linha.pesoLiquido ?? 0,
      linha.codEmbalagem ?? '',
      linha.sapUnidadeVenda,
      linha.unumUnidadeVenda ?? '',
      linha.sapUnVendaNumerador ?? 0,
      linha.sapUnVendaDenominador ?? 0,
      formatDateDdMmYyyy(linha.dataEntrega),
      formatDateDdMmYyyy(linha.dataExpedicao),
      linha.sapCodFabrica ?? '',
      linha.unumCodFabrica ?? '',
      linha.sapPreco ?? 0,
      linha.sapMoeda ?? '',
      linha.sapPrecoQtd ?? 0,
      linha.sapPrecoUnidade ?? '',
      linha.sapIncoterms1 ?? '',
      linha.sapIncoterms2 ?? '',
      linha.sapCondPagamento ?? '',
      linha.ti ?? '',
      linha.estadoUpdate ?? '',
      linha.unumEntidadeAlteracao ?? '',
      linha.unumMotivoAlteracao ?? '',
      linha.codigoMP ?? '',
      formatDateDdMmYyyy(linha.dataPedidaCliente),
      linha.qdePedidaCliente ?? 0,
      linha.leadTimeContratadoMTO ?? 0,
      linha.leadTimeContratadoMTS ?? 0,
      bit(linha.mto),
      bit(linha.mts),
      bit(linha.recebeMercadoriaSemBA),
      bit(linha.recebeMercadoriaSegunda),
      bit(linha.recebeMercadoriaTerca),
      bit(linha.recebeMercadoriaQuarta),
      bit(linha.recebeMercadoriaQuinta),
      bit(linha.recebeMercadoriaSexta),
      bit(linha.recebeMercadoriaSabado),
      bit(linha.recebeMercadoriaDomingo),
      linha.leadTimeInternoProduto ?? 0,
      linha.diasAnaliseProduto ?? 0,
      linha.diasViagemRecebedor ?? 0,
      estadoLinhaEncomenda,
      formatDateDdMmYyyy(linha.dataInsercaoLinhaEncomenda),
      bit(linha.urgente),
      linha.entidadeResponsavelUrgencia ?? '',
      linha.refCliente ?? '',
      linha.sapCodLocalExpedicao,
      String(linha.unumFabricaExpedicao),
      linha.sapFabricaExpedicao,
      bit(linha.trade),
      bit(linha.consignacao),
      linha.linhaEncomendaCliente ?? '',
      linha.hardOrderNumber ?? '',
      linha.hardOrderNumberLine ?? '',
      utilizador,
      computador,
    ]);
  }

  criaMantemLinhaAviso(
    qr: QueryRunner,
    numeroEncomenda: string,
    aviso: LinhaEncomendaAvisoDto,
    utilizador: string,
  ): Promise<SpResult> {
    return this.runProcedure(qr, 'ENCOMENDAS_CriaMantem_Linhas_Avisos', [
      numeroEncomenda,
      aviso.linhaEncomenda,
      aviso.subLinha,
      aviso.idMensagem,
      utilizador,
    ]);
  }

  anulaEncomenda(
    qr: QueryRunner,
    numeroEncomenda: string,
    entidade: string,
    motivo: string,
    utilizador: string,
    computador: string,
  ): Promise<SpResult> {
    return this.runProcedure(qr, 'ENCOMENDAS_anulaEncomenda', [numeroEncomenda, entidade, motivo, utilizador, computador]);
  }

  goEliminaEncomenda(qr: QueryRunner, pedido: PedidoEnvioAmostrasDto, utilizador: string): Promise<SpResult> {
    return this.runProcedure(qr, 'GO_Elimina_Encomenda', [
      pedido.idProjectoComercial,
      pedido.idPedido,
      bit(pedido.eliminarPedido),
      utilizador,
    ]);
  }

  fechaEncomenda(qr: QueryRunner, numeroEncomenda: string, utilizador: string, computador: string): Promise<SpResult> {
    return this.runProcedure(qr, 'ENCOMENDAS_FechaEncomenda', [numeroEncomenda, utilizador, computador]);
  }

  async getLinhasParaFecharManualmenteEmSap(qr: QueryRunner, numeroEncomenda: string): Promise<Array<{ LinhaEncomenda: string }>> {
    return qr.query(`EXEC dbo.ENCOMENDAS_getLinhasEncomendasParaManualmenteEmSAP @0`, [numeroEncomenda]);
  }

  async verificaSeNecessitaFecharLinhaEncomendaSAP(
    qr: QueryRunner,
    numeroEncomenda: string,
    linhaEncomenda: number,
    subLinha: number,
  ): Promise<{ QuantidadeEncomenda: number; QuantidadeExpedicao: number } | undefined> {
    const rows = await qr.query(`EXEC dbo.ENCOMENDAS_verificaSeNecessitaFecharLinhaEncomendaSAP @0, @1, @2`, [
      numeroEncomenda,
      linhaEncomenda,
      subLinha,
    ]);

    return rows?.[0];
  }

  /** Equivalente a GO_ins_PedidoEnvioAmostras_WOUT_TRANS; devolve o Id atribuido (DV[0]["IdPedidoEnvioAmostra"]). */
  async insPedidoEnvioAmostras(
    qr: QueryRunner,
    pedido: PedidoEnvioAmostrasDto,
    numeroEncomenda: string,
    primeiraLinhaEncomenda: number,
    utilizador: string,
    idioma: string,
  ): Promise<{ sucesso: boolean; idPedidoEnvioAmostra?: string }> {
    const rows: Array<{ IdPedidoEnvioAmostra: string }> = await qr.query(
      `EXEC dbo.GO_ins_PedidoEnvioAmostras_WOUT_TRANS @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15`,
      [
        pedido.idProjectoComercial,
        formatDateMmDdYyyy(pedido.dataPedido),
        formatDateMmDdYyyy(pedido.dataLimiteEnvio),
        pedido.qdeEmbalagens,
        pedido.codEmbalagem,
        pedido.codCliente,
        pedido.numMorada,
        pedido.codContacto,
        pedido.observacoes ?? '',
        utilizador,
        pedido.tipoEntidade,
        idioma,
        pedido.centroDesenvolvimento,
        numeroEncomenda,
        primeiraLinhaEncomenda,
        pedido.idTipoFormulacao,
      ],
    );

    return rows.length > 0 ? { sucesso: true, idPedidoEnvioAmostra: rows[0].IdPedidoEnvioAmostra } : { sucesso: false };
  }

  /** Equivalente a GO_upd_PedidoEnvioAmostra_WOUT_TRANS. */
  updPedidoEnvioAmostra(
    qr: QueryRunner,
    pedido: PedidoEnvioAmostrasDto,
    numeroEncomenda: string,
    primeiraLinhaEncomenda: number,
    utilizador: string,
    idioma: string,
  ): Promise<SpResult> {
    return this.runProcedure(qr, 'GO_upd_PedidoEnvioAmostra_WOUT_TRANS', [
      pedido.idPedido,
      pedido.idProjectoComercial,
      formatDateMmDdYyyy(pedido.dataLimiteEnvio),
      pedido.codEmbalagem,
      pedido.codCliente,
      pedido.codContacto,
      pedido.observacoes ?? '',
      pedido.qdeEmbalagens,
      utilizador,
      bit(pedido.abandonarPedido),
      pedido.abandonarPedido ? (pedido.motivoAbandono ?? '') : '',
      pedido.numMorada,
      pedido.motivoAlteracao ?? '',
      formatDateMmDdYyyy(pedido.dataPedido),
      pedido.tipoEntidade,
      idioma,
      pedido.centroDesenvolvimento,
      numeroEncomenda,
      primeiraLinhaEncomenda,
      pedido.idTipoFormulacao,
    ]);
  }

  fechaLinhaEncomenda(
    qr: QueryRunner,
    numeroEncomenda: string,
    linhaEncomenda: number,
    subLinha: number,
    entidade: string,
    motivo: string,
    codigoMP: string | undefined,
    utilizador: string,
  ): Promise<SpResult> {
    return this.runProcedure(qr, 'ENCOMENDAS_fechaLinhaEncomenda', [
      numeroEncomenda,
      linhaEncomenda,
      subLinha,
      entidade,
      motivo,
      codigoMP ?? '',
      utilizador,
    ]);
  }
}
