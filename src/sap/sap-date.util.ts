/**
 * node-rfc, sem clientOptions.date configurado, exige que campos ABAP do tipo DATS
 * cheguem como string "YYYYMMDD" (ver RFCTYPE_DATE em nwrfcsdk.cc) - nao aceita
 * objetos Date do JS diretamente. Estes conversores permitem manter `Date` nativo
 * nos DTOs e nos mapeamentos para SAP.
 */
export function dateToABAP(date: unknown): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}${mm}${dd}`;
}

export function dateFromABAP(abapDate: string): Date | null {
  if (!abapDate || abapDate === '00000000') return null;

  const yyyy = Number(abapDate.slice(0, 4));
  const mm = Number(abapDate.slice(4, 6)) - 1;
  const dd = Number(abapDate.slice(6, 8));

  return new Date(yyyy, mm, dd);
}
