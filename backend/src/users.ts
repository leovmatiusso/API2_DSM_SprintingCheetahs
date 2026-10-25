export type Role =
  | "superusuario"
  | "gestor"
  | "comercial"
  | "suporte"
  | "producao"
  | "software"
  | "implantacao"
  | "monitoramento";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  time_id: string | null;
}
