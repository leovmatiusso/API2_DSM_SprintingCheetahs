import Button from "@/components/ui/Button";

export default function Configuracoes() {
  return (
    <div>
      <h1 className="text-title font-bold">
        Configurações
      </h1>

      <p className="mt-2 text-text-muted">
        Configurações do sistema.
      </p>

      <Button onClick={() => alert('teste')}>
        Primary
      </Button>

      

      <Button variant="secondary">
        Submit
      </Button>

      

      <Button variant="danger" disabled={true}>
        Danger
      </Button>
    </div>
  );
}