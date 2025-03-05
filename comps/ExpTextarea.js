function ExpTextarea({ label, name, onChange, value, placeholder, style, ...props }) {
  return (
    <div className="expTextarea" style={style}>
      <label htmlFor={name}>{label}</label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}
