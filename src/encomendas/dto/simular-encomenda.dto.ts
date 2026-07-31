import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { OperacaoBaseDto } from './operacao-base.dto';
import { CabecalhoEncomendaDto } from './cabecalho-encomenda.dto';
import { ParceiroEncomendaDto } from './parceiro-encomenda.dto';
import { LinhaEncomendaDto } from './linha-encomenda.dto';

/** Corpo de POST /encomendas/simulacao - equivalente a SimulaCriacaoEncomenda (BAPI_SALESORDER_SIMULATE). */
export class SimularEncomendaDto extends OperacaoBaseDto {
  @ApiPropertyOptional({ description: 'Encomenda de consignacao (DOC_TYPE ZKB)', default: false })
  @IsOptional()
  @IsBoolean()
  consignacao?: boolean;

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
}
