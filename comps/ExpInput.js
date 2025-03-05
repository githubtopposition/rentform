import React from 'react';

function ExpInput({ label, placeholder, type, value, onChange, name, style }) {
  return (
    <div className="expInput" style={style}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default ExpInput;
