export default function PdfWithCaptionSection({ title, items, setItems }) {

  const handleFileChange = (index, file) => {
    const updated = [...items];
    updated[index] = { ...updated[index], file: file };
    setItems(updated);
  };

  const handleCaptionChange = (index, caption) => {
    const updated = [...items];
    updated[index] = { ...updated[index], caption: caption };
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { file: null, caption: "" }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const updated = items.filter((_, i) => i !== index);
      setItems(updated);
    }
  };

  return (
    <section className="form-section" style={{ borderBottom: '1px solid #ddd', paddingBottom: '20px' }}>
      <h3>{title}</h3>

      {items.map((item, index) => (
        <div className="form-grid" key={index} style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Upload File {index + 1}</label>
            {items.length > 1 && (
              <button type="button" onClick={() => removeItem(index)} className="remove-btn" style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>
                ✖ Remove
              </button>
            )}
          </div>
          
          <input
            type="file"
            accept="application/pdf" 
            onChange={(e) => handleFileChange(index, e.target.files[0])}
          />

          <label>Caption for File {index + 1}</label>
          <input
            type="text"
            value={item.caption}
            onChange={(e) => handleCaptionChange(index, e.target.value)}
          />
        </div>
      ))}

      <button type="button" className="add-btn" onClick={addItem}>
        + Add Another {title.split(' ')[0]}
      </button>
    </section>
  );
}