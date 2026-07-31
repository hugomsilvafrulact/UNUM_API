import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/** Mapeia SAP_CabecalhoEncomenda usado em Encomendas.cs (ORDER_HEADER_IN + ENCOMENDAS_CriaMantem). */
export class CabecalhoEncomendaDto {
  @ApiProperty({ description: 'Encomenda "Hard Order" (DOC_TYPE ZO01, sem schedule lines)' })
  @IsBoolean()
  hardOrder!: boolean;

  @ApiProperty({ description: 'Organizacao de vendas SAP (SALES_ORG)' })
  @IsString()
  sapOrgVendas!: string;

  @ApiProperty({ description: 'Canal de distribuicao SAP (DISTR_CHAN)' })
  @IsString()
  sapCanalDistribuicao!: string;

  @ApiProperty({ description: 'Setor de atividade SAP (DIVISION)' })
  @IsString()
  sapSetorAtividade!: string;

  @ApiProperty({ description: 'Data da encomenda para SAP (PURCH_DATE)' })
  @Type(() => Date)
  @IsDate()
  sapDataEncomenda!: Date;

  @ApiProperty({ description: 'Data da encomenda para UNUM (ENCOMENDAS_CriaMantem)' })
  @Type(() => Date)
  @IsDate()
  dataEncomenda!: Date;

  @ApiProperty({ description: 'Numero de encomenda do cliente (PURCH_NO_C)' })
  @IsString()
  encomendaCliente!: string;

  @ApiPropertyOptional({ description: 'Numero de encomenda do cliente recebedor (PURCH_NO_S)' })
  @IsOptional()
  @IsString()
  encomendaClienteRecebedor?: string;

  @ApiPropertyOptional({ description: 'Incoterm 1 (INCOTERMS1)' })
  @IsOptional()
  @IsString()
  incoterms1?: string;

  @ApiPropertyOptional({ description: 'Incoterm 2 (INCOTERMS2)' })
  @IsOptional()
  @IsString()
  incoterms2?: string;

  @ApiPropertyOptional({
    description: 'Condicoes de pagamento (PMNTTRMS) - ignorado quando gestaoOportunidades=true',
  })
  @IsOptional()
  @IsString()
  condicoesPagamento?: string;

  @ApiPropertyOptional({ description: 'Moeda (CURRENCY) - ignorado quando gestaoOportunidades=true' })
  @IsOptional()
  @IsString()
  moeda?: string;

  @ApiPropertyOptional({ description: 'Custos de transporte (condicao ZTR1)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  custosTransporte?: number;

  @ApiProperty({ description: 'Codigo da empresa UNUM (ENCOMENDAS_CriaMantem)' })
  @IsString()
  unumCodEmpresa!: string;

  @ApiPropertyOptional({ description: 'Observacoes internas' })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ description: 'Observacoes visiveis para o cliente' })
  @IsOptional()
  @IsString()
  observacoesParaCliente?: string;
}
