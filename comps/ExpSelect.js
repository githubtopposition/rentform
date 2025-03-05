import React from 'react';

function ExpSelect({ label, options, onChange, name, value }) {
  return (
    <div className="expSelect">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} value={value} onChange={onChange}>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

export default ExpSelect;
