export interface Time {
  id: string;
  nome_time: string;
  departamento: string;
  responsavel_id: string | null;
  usuarios_ids: string[];
}

export const times: Time[] = [
  {
    id: "1",
    nome_time: "Software",
    departamento: "Software",
    responsavel_id: "6",
    usuarios_ids: ["6"]
  },
  {
    id: "2",
    nome_time: "Comercial",
    departamento: "Comercial",
    responsavel_id: "3",
    usuarios_ids: ["3"]
  }
];