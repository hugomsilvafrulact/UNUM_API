import { RfcStructure, RfcTable } from 'node-rfc';
import { CabecalhoEncomendaDto } from './dto/cabecalho-encomenda.dto';
import { ParceiroEncomendaDto } from './dto/parceiro-encomenda.dto';
import { LinhaEncomendaDto } from './dto/linha-encomenda.dto';
import { padSapNumber } from './encomendas-sql.util';

/** ORDER_HEADER_IN para BAPI_SALESORDER_CREATEFROMDAT2 (ver CriarEncomenda em Encomendas.cs). */
export function buildOrderHeaderInCriar(
  cabecalho: CabecalhoEncomendaDto,
  consignacao: boolean,
  gestaoOportunidades: boolean,
): RfcStructure {
  let docType: string;
  if (consignacao) docType = 'ZKB';
  else if (cabecalho.hardOrder) docType = 'ZO01';
  else if (gestaoOportunidades) docType = 'ZO02';
  else docType = 'TA';

  const header: RfcStructure = {
    DOC_TYPE: docType,
    SALES_ORG: cabecalho.sapOrgVendas,
    DISTR_CHAN: cabecalho.sapCanalDistribuicao,
    DIVISION: cabecalho.sapSetorAtividade,
    PURCH_DATE: cabecalho.sapDataEncomenda,
    PURCH_NO_C: cabecalho.encomendaCliente,
    PURCH_NO_S: cabecalho.encomendaClienteRecebedor ?? '',
    INCOTERMS1: cabecalho.incoterms1 ?? '',
    INCOTERMS2: cabecalho.incoterms2 ?? '',
  };

  if (!gestaoOportunidades) {
    header.PMNTTRMS = cabecalho.condicoesPagamento ?? '';
    header.CURRENCY = cabecalho.moeda ?? '';
  }

  return header;
}

export function buildOrderHeaderInxCriar(gestaoOportunidades: boolean): RfcStructure {
  const headerx: RfcStructure = {
    UPDATEFLAG: 'I',
    DOC_TYPE: 'X',
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
    headerx.CURRENCY = 'X';
    headerx.PMNTTRMS = 'X';
  }

  return headerx;
}

/** ORDER_PARTNERS (comum a criar/simular/alterar). */
export function buildOrderPartner(parceiro: ParceiroEncomendaDto): RfcStructure {
  const row: RfcStructure = {
    PARTN_ROLE: parceiro.sapFuncaoParceiro,
    PARTN_NUMB: padSapNumber(parceiro.sapEntidade),
  };

  if (parceiro.sapTipoConta === 'CPD') {
    row.NAME = parceiro.nomeCliente ?? '';
    row.COUNTRY = parceiro.sapPais ?? '';
    row.POSTL_CODE = parceiro.codigoPostal ?? '';
    row.CITY = parceiro.cidade ?? '';
    row.STREET = parceiro.rua ?? '';
  }

  return row;
}

export interface ItemRows {
  itemsIn: RfcTable;
  itemsInx: RfcTable;
  schedulesIn: RfcTable;
  schedulesInx: RfcTable;
}

/** ORDER_ITEMS_IN/INX + ORDER_SCHEDULES_IN/INX para BAPI_SALESORDER_CREATEFROMDAT2. */
export function buildItemsCriar(linhas: LinhaEncomendaDto[], hardOrder: boolean, gestaoOportunidades: boolean): ItemRows {
  const itemsIn: RfcTable = [];
  const itemsInx: RfcTable = [];
  const schedulesIn: RfcTable = [];
  const schedulesInx: RfcTable = [];

  for (const linha of linhas) {
    const itemIn: RfcStructure = {
      ITM_NUMBER: String(linha.linhaEncomenda),
      MATERIAL: linha.sapMaterial,
      SHORT_TEXT: linha.descricaoMaterial ?? '',
      PLANT: linha.sapFabricaExpedicao,
      SHIP_POINT: linha.sapCodLocalExpedicao,
      TARGET_QTY: String(linha.quantidadeUV),
      TARGET_QU: linha.sapUnidadeVenda,
      SALES_UNIT: linha.sapUnidadeVenda,
      CUST_MAT35: linha.refCliente ?? '',
      PRICE_DATE: linha.sapDataEntrega,
      PO_ITM_NO: linha.linhaEncomendaCliente ?? '',
    };
    const itemInx: RfcStructure = {
      ITM_NUMBER: String(linha.linhaEncomenda),
      UPDATEFLAG: 'I',
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

    if (!hardOrder) {
      schedulesIn.push({
        ITM_NUMBER: String(linha.linhaEncomenda),
        SCHED_LINE: String(linha.subLinha),
        REQ_DATE: linha.sapDataEntrega,
        REQ_QTY: String(linha.quantidadeUV),
      });
      schedulesInx.push({
        ITM_NUMBER: String(linha.linhaEncomenda),
        SCHED_LINE: String(linha.subLinha),
        UPDATEFLAG: 'I',
        REQ_DATE: 'X',
        REQ_QTY: 'X',
      });
    }
  }

  return { itemsIn, itemsInx, schedulesIn, schedulesInx };
}

export function buildConditionsCriar(custosTransporte: number | undefined): {
  conditionsIn: RfcTable;
  conditionsInx: RfcTable;
} {
  if (!custosTransporte || custosTransporte <= 0) return { conditionsIn: [], conditionsInx: [] };

  return {
    conditionsIn: [{ ITM_NUMBER: '000000', COND_TYPE: 'ZTR1', COND_VALUE: custosTransporte, UPDATEFLAG: 'I' }],
    conditionsInx: [{ ITM_NUMBER: '000000', COND_VALUE: 'X' }],
  };
}
