import SelectFiltro from "./SelectFiltro";

export interface OpcaoDepartamento {
  value: string;
  label: string;
}

export default function SeletorDepartamento({
  value,
  opcoes,
  onChange,
  placeholder = "Departamento",
}: {
  value: string;
  opcoes: OpcaoDepartamento[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <SelectFiltro value={value} placeholder={placeholder} options={opcoes} onChange={onChange} />
  );
}
