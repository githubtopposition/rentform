function ExpSelect({ label, options, onChange, name, value }) {
  return (
    <div className="expSelect">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} value={value} onChange={onChange}>
        ...
      </select>
    </div>
  );
}
