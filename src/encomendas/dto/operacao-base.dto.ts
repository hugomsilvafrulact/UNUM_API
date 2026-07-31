import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

/**
 * Campos comuns a todas as operacoes de encomendas (equivalentes a
 * Utilizador/Computador/UNUM_Idioma/Utilizador_SAP/Password_SAP em Encomendas.cs).
 * IdAplicacao/PerfilBD/ServidorBD/NamedInstance/NomeBD/NomeAplicacao NAO fazem parte
 * do pedido: identificam esta propria API e vivem em configuration.ts (env vars).
 */
export class OperacaoBaseDto {
  @ApiProperty({ description: 'Utilizador que despoleta a operacao (para auditoria em UNUM)' })
  @IsString()
  @IsNotEmpty()
  utilizador!: string;

  @ApiProperty({ description: 'Computador de onde parte o pedido (para auditoria em UNUM)' })
  @IsString()
  @IsNotEmpty()
  computador!: string;

  @ApiPropertyOptional({ description: 'Idioma do utilizador; usa APP_DEFAULT_LANG se omitido' })
  @IsOptional()
  @IsString()
  idioma?: string;

  @ApiPropertyOptional({
    description: 'Utilizador SAP a usar na ligacao RFC, quando diferente do utilizador tecnico da aplicacao',
  })
  @IsOptional()
  @IsString()
  utilizadorSap?: string;

  @ApiPropertyOptional({ description: 'Password do utilizador SAP; obrigatoria quando utilizadorSap for indicado' })
  @ValidateIf((o) => !!o.utilizadorSap)
  @IsNotEmpty()
  @IsString()
  passwordSap?: string;
}
