import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  darkTheme?: boolean;
  className?: string;
}

export default function PasswordInput({ label, value, onChange, placeholder, darkTheme }: Props) {
  const [visible, setVisible] = useState(false);

  // O type do input muda entre password e text.
  return (
    <label className="input-label">
      {label}
      <div className="password-wrapper">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className={`${darkTheme ? "" : "no-dark"} password-input`}
        />
        <button type="button" className="password-toggle" onClick={() => setVisible(!visible)}>
          {visible ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      </div>
    </label>
  );
}
