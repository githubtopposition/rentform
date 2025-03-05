function ExpInput2({ label, placeholder, type, value, onChange, name, style, ...props }) {
  return (
    <div className="expInput2" style={style}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  );
}
