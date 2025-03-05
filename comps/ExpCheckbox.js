export default function ExpCheckbox({ label, checked, onChange, name }) {
  return (
    <div className="expCheckbox">
      <input
        id={name}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
      />
      <label htmlFor={name}>{label}</label>
    </div>
  );
}
