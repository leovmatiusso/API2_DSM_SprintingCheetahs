export type Role =
  | "superusuario"
  | "gestor"
  | "comercial"
  | "suporte"
  | "producao"
  | "software"
  | "implantacao";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}
