import type { PropsWithChildren } from "react";

interface InputProps {
  label: string;
  name: string;
  /** The ID assigned the input element and the label's `for` attribute, defaults to `name` if not supplied */
  id: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  containerStyles?: React.CSSProperties;
}

function InputWrapper({
  label,
  id,
  error,
  children,
  required,
  name,
  containerStyles = {},
}: PropsWithChildren<InputProps>) {
  return (
    <div className="input-wrapper" style={containerStyles}>
      <label htmlFor={id}>
        {label}
        {required ? <span>&nbsp;*</span> : null}
      </label>
      {children}
      {error ? (
        <p
          className="form-validation-error"
          role="alert"
          id={`${id}-error`}
          data-test={`${name}-error`}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextInputProps extends Omit<InputProps, "id"> {
  type?: "text" | "password" | "datetime-local" | "url";
  defaultValue?: string;
  id?: string;
  placeholder?: string;
  autoCapitalize?: string;
  autoComplete?: string;
}

export function TextInput({
  name,
  id = `${name}-input`,
  defaultValue,
  error,
  type = "text",
  placeholder,
  required,
  disabled,
  autoCapitalize,
  autoComplete,
  ...props
}: TextInputProps) {
  return (
    <InputWrapper
      name={name}
      id={id}
      error={error}
      required={required}
      {...props}
    >
      <input
        type={type}
        id={id}
        name={name}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-errormessage={error ? `${id}-error` : undefined}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
      />
    </InputWrapper>
  );
}

interface TextAreaInputProps extends Omit<InputProps, "id"> {
  defaultValue?: string;
  id?: string;
  rows?: number;
  minLength?: number;
  maxLength?: number;
}

export function TextAreaInput({
  name,
  id = `${name}-input`,
  defaultValue,
  error,
  rows,
  required,
  disabled,
  minLength,
  maxLength,
  ...props
}: TextAreaInputProps) {
  return (
    <InputWrapper
      name={name}
      id={id}
      error={error}
      required={required}
      {...props}
    >
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-errormessage={error ? `${id}-error` : undefined}
        disabled={disabled}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
      ></textarea>
    </InputWrapper>
  );
}

interface NumberInputProps extends Omit<InputProps, "id"> {
  defaultValue?: number;
  id?: string;
  placeholder?: string;
}

export function NumberInput({
  name,
  id = `${name}-input`,
  defaultValue,
  error,
  placeholder,
  required,
  disabled,
  ...props
}: NumberInputProps) {
  return (
    <InputWrapper
      name={name}
      id={id}
      error={error}
      required={required}
      {...props}
    >
      <input
        type="number"
        id={id}
        name={name}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-errormessage={error ? `${id}-error` : undefined}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
    </InputWrapper>
  );
}

interface SelectInputProps extends Omit<InputProps, "id"> {
  id?: string;
  defaultValue?: string;
}

export function SelectInput({
  name,
  id = `${name}-input`,
  error,
  required,
  disabled,
  defaultValue,
  children,
  ...props
}: PropsWithChildren<SelectInputProps>) {
  return (
    <InputWrapper
      name={name}
      id={id}
      error={error}
      required={required}
      {...props}
    >
      <select
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-errormessage={error ? `${id}-error` : undefined}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
      >
        {children}
      </select>
    </InputWrapper>
  );
}

interface SelectOptionProps {
  value: string;
  label: string;
}

export function SelectOption({ value, label }: SelectOptionProps) {
  return <option value={value}>{label}</option>;
}
