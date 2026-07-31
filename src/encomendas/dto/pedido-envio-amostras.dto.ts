import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Mapeia PedidoEnvioAmostras usado em Encomendas.cs quando gestaoOportunidades=true.
 * NEncomenda e LinhaEncomenda (preenchidos pela BAPI apos a criacao) nao fazem parte do pedido.
 */
export class PedidoEnvioAmostrasDto {
  @ApiPropertyOptional({ description: 'Id do pedido de envio de amostras; omitir para criar um novo' })
  @IsOptional()
  @IsString()
  idPedido?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idProjectoComercial?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataPedido?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataLimiteEnvio?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  qdeEmbalagens?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codEmbalagem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codCliente?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  numMorada?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codContacto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoEntidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  centroDesenvolvimento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idTipoFormulacao?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  abandonarPedido?: boolean;

  @ApiPropertyOptional({ description: 'Obrigatorio quando abandonarPedido=true' })
  @IsOptional()
  @IsString()
  motivoAbandono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motivoAlteracao?: string;

  @ApiPropertyOptional({ description: 'Usado em EliminarEncomenda para eliminar tambem o pedido de amostras' })
  @IsOptional()
  @IsBoolean()
  eliminarPedido?: boolean;
}
