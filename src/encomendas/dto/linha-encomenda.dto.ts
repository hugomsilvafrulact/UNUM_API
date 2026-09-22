import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

/** Mapeia SAP_LinhasEncomenda usado em Encomendas.cs (ORDER_ITEMS_IN/ORDER_SCHEDULES_IN + ENCOMENDAS_CriaMantem_Linhas). */
export class LinhaEncomendaDto {
  // --- Identificacao da linha ---
  @ApiProperty({ description: 'Numero do item SAP (ITM_NUMBER)' })
  @IsNumber()
  linhaEncomenda!: number;

  @ApiProperty({ description: 'Numero da sublinha/schedule line SAP (SCHED_LINE)' })
  @IsNumber()
  subLinha!: number;

  @ApiPropertyOptional({
    description: 'Tipo de alteracao (apenas em AlterarEncomenda): I=insere, U=atualiza, D=elimina',
    enum: ['I', 'U', 'D'],
  })
  @IsOptional()
  @IsIn(['I', 'U', 'D'])
  estadoUpdate?: 'I' | 'U' | 'D';

  // --- Material ---
  @ApiProperty({ description: 'Codigo do material SAP (MATERIAL)' })
  @IsString()
  sapMaterial!: string;

  @ApiProperty({ description: 'Codigo do material UNUM' })
  @IsString()
  unumMaterial!: string;

  @ApiPropertyOptional({ description: 'Descricao do material (SHORT_TEXT)' })
  @IsOptional()
  @IsString()
  descricaoMaterial?: string;

  @ApiPropertyOptional({ description: 'Referencia do cliente para este material (CUST_MAT35)' })
  @IsOptional()
  @IsString()
  refCliente?: string;

  @ApiPropertyOptional({ description: 'Codigo de materia-prima associado' })
  @IsOptional()
  @IsString()
  codigoMP?: string;

  // --- Fabrica / local de expedicao ---
  @ApiProperty({ description: 'Fabrica de expedicao SAP (PLANT)' })
  @IsString()
  sapFabricaExpedicao!: string;

  @ApiProperty({ description: 'Fabrica de expedicao UNUM' })
  @IsNumber()
  unumFabricaExpedicao!: number;

  @ApiPropertyOptional({ description: 'Fabrica de origem SAP' })
  @IsOptional()
  @IsString()
  sapCodFabrica?: string;

  @ApiPropertyOptional({ description: 'Fabrica de origem UNUM' })
  @IsOptional()
  @IsNumber()
  unumCodFabrica?: number;

  @ApiProperty({ description: 'Local de expedicao SAP (SHIP_POINT)' })
  @IsString()
  sapCodLocalExpedicao!: string;

  // --- Quantidades e unidades ---
  @ApiProperty({ description: 'Quantidade na unidade de venda (TARGET_QTY/REQ_QTY)' })
  @IsNumber()
  quantidadeUV!: number;

  @ApiProperty({ description: 'Unidade de venda SAP (TARGET_QU/SALES_UNIT)' })
  @IsString()
  sapUnidadeVenda!: string;

  @ApiPropertyOptional({ description: 'Unidade de venda UNUM' })
  @IsOptional()
  @IsNumber()
  unumUnidadeVenda?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sapUnVendaNumerador?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sapUnVendaDenominador?: number;

  @ApiPropertyOptional({ description: 'Quantidade de embalagens' })
  @IsOptional()
  @IsNumber()
  qtdEmbalagens?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codEmbalagem?: string;

  @ApiPropertyOptional({ description: 'Peso liquido' })
  @IsOptional()
  @IsNumber()
  pesoLiquido?: number;

  // --- Datas ---
  @ApiProperty({ description: 'Data de entrega para SAP (PRICE_DATE/REQ_DATE)' })
  @Type(() => Date)
  @IsDate()
  sapDataEntrega!: Date;

  @ApiPropertyOptional({ description: 'Data de entrega para UNUM' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataEntrega?: Date;

  @ApiPropertyOptional({ description: 'Data de expedicao para UNUM' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataExpedicao?: Date;

  @ApiPropertyOptional({ description: 'Data pedida pelo cliente' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataPedidaCliente?: Date;

  @ApiPropertyOptional({ description: 'Data de insercao da linha' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataInsercaoLinhaEncomenda?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  qdePedidaCliente?: number;

  // --- Preco ---
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sapPreco?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sapMoeda?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sapPrecoQtd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sapPrecoUnidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sapIncoterms1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sapIncoterms2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sapCondPagamento?: string;

  // --- Referencias a hard order / gestao de oportunidades ---
  @ApiPropertyOptional({ description: 'Numero da encomenda de referencia (REF_DOC), quando ligada a uma Hard Order' })
  @IsOptional()
  @IsString()
  hardOrderNumber?: string;

  @ApiPropertyOptional({ description: 'Linha da encomenda de referencia (REF_DOC_IT)' })
  @IsOptional()
  @IsString()
  hardOrderNumberLine?: string;

  @ApiPropertyOptional({ description: 'Categoria do item (ITEM_CATEG) - so usado com gestaoOportunidades' })
  @IsOptional()
  @IsString()
  categoriaItem?: string;

  @ApiPropertyOptional({ description: 'Ponto de contacto (REC_POINT) - so usado com gestaoOportunidades' })
  @IsOptional()
  @IsString()
  contacto?: string;

  @ApiPropertyOptional({ description: 'Numero da linha no lado do cliente (PO_ITM_NO)' })
  @IsOptional()
  @IsString()
  linhaEncomendaCliente?: string;

  // --- Flags ---
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  trade?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  consignacao?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  urgente?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  entidadeResponsavelUrgencia?: number;

  @ApiPropertyOptional({ description: 'Indicativo (uso interno UNUM)', default: false })
  @IsOptional()
  @IsBoolean()
  ti?: boolean;

  @ApiPropertyOptional({ description: 'Entidade responsavel pela alteracao (apenas em AlterarEncomenda)' })
  @IsOptional()
  @IsNumber()
  unumEntidadeAlteracao?: number;

  @ApiPropertyOptional({ description: 'Motivo da alteracao (apenas em AlterarEncomenda)' })
  @IsOptional()
  @IsNumber()
  unumMotivoAlteracao?: number;

  // --- MTO/MTS e lead times ---
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  mto?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  mts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  leadTimeContratadoMTO?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  leadTimeContratadoMTS?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  leadTimeInternoProduto?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  diasAnaliseProduto?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  diasViagemRecebedor?: number;

  // --- Disponibilidade para receber mercadoria ---
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  recebeMercadoriaSemBA?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  recebeMercadoriaSegunda?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  recebeMercadoriaTerca?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  recebeMercadoriaQuarta?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  recebeMercadoriaQuinta?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  recebeMercadoriaSexta?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  recebeMercadoriaSabado?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  recebeMercadoriaDomingo?: boolean;
}
