import type { SelectHTMLAttributes } from "react";
import styles from "./Select.module.css";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

export function Select({ label, error, id, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <label className={styles.field} htmlFor={selectId}>
      <span>{label}</span>
      <select id={selectId} {...props}>
        {children}
      </select>
      {error ? <small>{error}</small> : null}
    </label>
  );
}

