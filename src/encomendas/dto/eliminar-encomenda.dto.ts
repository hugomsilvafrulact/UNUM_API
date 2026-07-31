import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';
import { OperacaoBaseDto } from './operacao-base.dto';
import { PedidoEnvioAmostrasDto } from './pedido-envio-amostras.dto';

/** Corpo de DELETE /encomendas/:numero - equivalente a EliminarEncomenda em Encomendas.cs. */
export class EliminarEncomendaDto extends OperacaoBaseDto {
  @ApiProperty({ description: 'Entidade responsavel pela eliminacao' })
  @IsString()
  entidade!: string;

  @ApiProperty({ description: 'Motivo da eliminacao' })
  @IsString()
  motivo!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  gestaoOportunidades?: boolean;

  @ApiPropertyOptional({
    type: PedidoEnvioAmostrasDto,
    description: 'Obrigatorio quando gestaoOportunidades=true',
  })
  @ValidateIf((o) => o.gestaoOportunidades === true)
  @ValidateNested()
  @Type(() => PedidoEnvioAmostrasDto)
  pedidoEnvioAmostras?: PedidoEnvioAmostrasDto;
}
