function ExpTextarea({ label, name, onChange, value, placeholder, style, ...props }) {
  return (
    <div className="expTextarea" style={style}>
      <label>{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}
