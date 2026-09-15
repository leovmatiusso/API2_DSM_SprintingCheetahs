import { useState } from "react";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function PasswordInput({ label, value, onChange, placeholder }: Props) {
  const [visible, setVisible] = useState(false);

  // O type do input muda entre password e text.
  return (
    <label>
      {label}
      <div className="password-wrapper">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
        />
        <button type="button" className="password-toggle" onClick={() => setVisible(!visible)}>
          {visible ? "Esconder" : "Mostrar"}
        </button>
      </div>
    </label>
  );
}