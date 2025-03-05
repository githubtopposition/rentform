import React from 'react';

function ExpRadio({ label, options, onChange, name, selectedValue }) {
  return (
    <fieldset className="expRadio">
      <legend>{label}</legend>
      {options.map((option, index) => (
        <div key={index}>
          <input
            id={`${name}-${option.value}`}
            type="radio"
            name={name}
            value={option.value}
            checked={selectedValue === option.value}
            onChange={onChange}
          />
          <label htmlFor={`${name}-${option.value}`}>
            {option.label}
          </label>
        </div>
      ))}
    </fieldset>
  );
}

export default ExpRadio;
