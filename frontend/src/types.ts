export type Role =
  "superusuario" | "gestor" | "comercial" | "suporte" | "producao" | "software" | "implantacao";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  time_id?: string | null;
}

export interface Time {
  id: string;
  nome_time: string;
  departamento: string;
  responsavel_id: string | null;
  responsavel: User | null;
  pessoasVinculadas: User[];
}

export interface LoginResponse {
  token: string;
  user: User;
}
