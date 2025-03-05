function ExpRadio({ label, options, onChange, name, selectedValue }) {
  return (
    <fieldset className="expRadio">
      <legend>{label}</legend>
      {options.map((option, idx) => (
        <div key={idx}>
          <input
            id={`${name}-${option.value}`}
            type="radio"
            name={name}
            value={option.value}
            checked={selectedValue === option.value}
            onChange={onChange}
          />
          <label htmlFor={`${name}-${option.value}`}>{option.label}</label>
        </div>
      ))}
    </fieldset>
  );
}
