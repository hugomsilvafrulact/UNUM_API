export interface BapiReturnRow {
  TYPE: string;
  ID: string;
  NUMBER: string;
  MESSAGE: string;
  [key: string]: unknown;
}

/** BAPI RETURN pode ser uma TABLE (array) ou uma STRUCTURE (objeto único), consoante a BAPI. */
export type BapiReturn = BapiReturnRow[] | BapiReturnRow | undefined;

/**
 * Junta as linhas de erro/abort (TYPE E ou A) no mesmo formato usado em Encomendas.cs: "ID - NUMBER - MESSAGE".
 * Aceita `unknown` porque o node-rfc tipa o resultado de client.call() como RfcParameterValue
 * (uniao generica), sem genericos para o shape real de cada BAPI.
 */
export function extractBapiErrors(bapiReturn: unknown): string[] {
  const value = bapiReturn as BapiReturn;
  const rows = Array.isArray(value) ? value : value ? [value] : [];

  return rows
    .filter((row) => row.TYPE === 'E' || row.TYPE === 'A')
    .map((row) => `${row.ID} - ${row.NUMBER} - ${row.MESSAGE}`);
}
