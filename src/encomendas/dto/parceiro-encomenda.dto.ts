import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';

/** Mapeia SAP_ParceirosEncomendas usado em Encomendas.cs (ORDER_PARTNERS + ENCOMENDAS_CriaMantem_Parceiros). */
export class ParceiroEncomendaDto {
  @ApiProperty({ description: 'Funcao do parceiro SAP, ex: AG, WE, RE, RG (PARTN_ROLE)' })
  @IsString()
  sapFuncaoParceiro!: string;

  @ApiProperty({ description: 'Numero da entidade SAP (PARTN_NUMB); e alinhado a 10 digitos pela API' })
  @IsString()
  sapEntidade!: string;

  @ApiProperty({ description: 'Tipo de conta SAP, ex: "CPD" para cliente ocasional/generico' })
  @IsString()
  sapTipoConta!: string;

  @ApiPropertyOptional({ description: 'Nome do cliente - obrigatorio quando sapTipoConta = "CPD"' })
  @ValidateIf((o) => o.sapTipoConta === 'CPD')
  @IsString()
  nomeCliente?: string;

  @ApiPropertyOptional({ description: 'Pais - obrigatorio quando sapTipoConta = "CPD"' })
  @ValidateIf((o) => o.sapTipoConta === 'CPD')
  @IsString()
  sapPais?: string;

  @ApiPropertyOptional({ description: 'Codigo postal - obrigatorio quando sapTipoConta = "CPD"' })
  @ValidateIf((o) => o.sapTipoConta === 'CPD')
  @IsString()
  codigoPostal?: string;

  @ApiPropertyOptional({ description: 'Cidade - obrigatorio quando sapTipoConta = "CPD"' })
  @ValidateIf((o) => o.sapTipoConta === 'CPD')
  @IsString()
  cidade?: string;

  @ApiPropertyOptional({ description: 'Rua - obrigatorio quando sapTipoConta = "CPD"' })
  @ValidateIf((o) => o.sapTipoConta === 'CPD')
  @IsString()
  rua?: string;

  @ApiPropertyOptional({ description: 'Porta (apenas UNUM)' })
  @IsOptional()
  @IsString()
  porta?: string;

  @ApiPropertyOptional({ description: 'Rua (linha 3, apenas UNUM)' })
  @IsOptional()
  @IsString()
  rua3?: string;

  @ApiPropertyOptional({ description: 'Zona de transporte (apenas UNUM)' })
  @IsOptional()
  @IsString()
  zonaTransporte?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fax?: string;

  @ApiPropertyOptional({ description: 'Idioma do cliente (apenas UNUM)' })
  @IsOptional()
  @IsString()
  sapIdiomaCliente?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  recebedorAceitaReceberMercadoriaSemBA?: boolean;

  @ApiPropertyOptional({
    description: 'Tipo de alteracao (apenas em AlterarEncomenda): I=insere, U=atualiza, D=elimina',
    enum: ['I', 'U', 'D'],
  })
  @IsOptional()
  @IsIn(['I', 'U', 'D'])
  estadoUpdate?: 'I' | 'U' | 'D';
}

/** Devolvido apos CriarEncomenda: inclui o SAP_Endereco atribuido por SAP para clientes CPD. */
export class ParceiroEncomendaResponseDto extends ParceiroEncomendaDto {
  @ApiPropertyOptional({ description: 'Numero de morada atribuido por SAP para clientes CPD' })
  sapEndereco?: string;
}
