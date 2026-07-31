import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import { OperacaoBaseDto } from './operacao-base.dto';
import { CabecalhoEncomendaDto } from './cabecalho-encomenda.dto';
import { ParceiroEncomendaDto } from './parceiro-encomenda.dto';
import { LinhaEncomendaDto } from './linha-encomenda.dto';
import { LinhaEncomendaAvisoDto } from './linha-encomenda-aviso.dto';
import { PedidoEnvioAmostrasDto } from './pedido-envio-amostras.dto';

/** Corpo de POST /encomendas - equivalente a CriarEncomenda em Encomendas.cs. */
export class CriarEncomendaDto extends OperacaoBaseDto {
  @ApiPropertyOptional({ description: 'Executa em modo de teste (TESTRUN), sem persistir em SAP nem UNUM', default: false })
  @IsOptional()
  @IsBoolean()
  simulacao?: boolean;

  @ApiPropertyOptional({ description: 'Encomenda de consignacao (DOC_TYPE ZKB)', default: false })
  @IsOptional()
  @IsBoolean()
  consignacao?: boolean;

  @ApiPropertyOptional({
    description: 'Encomenda criada a partir de um Pedido de Envio de Amostras do Gestao de Oportunidades',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  gestaoOportunidades?: boolean;

  @ApiProperty({ type: CabecalhoEncomendaDto })
  @ValidateNested()
  @Type(() => CabecalhoEncomendaDto)
  cabecalho!: CabecalhoEncomendaDto;

  @ApiProperty({ type: [ParceiroEncomendaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParceiroEncomendaDto)
  parceiros!: ParceiroEncomendaDto[];

  @ApiProperty({ type: [LinhaEncomendaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinhaEncomendaDto)
  linhas!: LinhaEncomendaDto[];

  @ApiPropertyOptional({ type: [LinhaEncomendaAvisoDto], default: [] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinhaEncomendaAvisoDto)
  linhasAvisos?: LinhaEncomendaAvisoDto[];

  @ApiPropertyOptional({
    type: PedidoEnvioAmostrasDto,
    description: 'Obrigatorio quando gestaoOportunidades=true',
  })
  @ValidateIf((o) => o.gestaoOportunidades === true)
  @ValidateNested()
  @Type(() => PedidoEnvioAmostrasDto)
  pedidoEnvioAmostras?: PedidoEnvioAmostrasDto;
}
