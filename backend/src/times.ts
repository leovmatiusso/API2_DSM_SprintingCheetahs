export interface Time {
  id: string;
  nome_time: string;
  departamento: string;
  responsavel_id: string | null;
  responsavel: unknown;
  pessoasVinculadas: unknown[];
}
