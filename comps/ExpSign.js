function ExpSign({ label, style, ...props }) {
  const canvasRef = useRef(null);

  // ... handleClear() ...

  return (
    <div className="expSign" style={style}>
      <label htmlFor="signatureCanvas">{label}</label>
      <canvas id="signatureCanvas" ref={canvasRef} {...props} />
      <button type="button" onClick={handleClear}>Clear</button>
    </div>
  );
}
