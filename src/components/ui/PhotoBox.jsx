import { useRef } from 'react';
import { compressImage } from '../../storage';
import Button from './Button';

export default function PhotoBox({ value, onChange, label = 'Photo' }) {
  const cameraRef = useRef();
  const libraryRef = useRef();

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const compressed = await compressImage(ev.target.result);
      onChange(compressed);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  return (
    <div>
      {value ? (
        <div style={{ position: 'relative' }}>
          <img src={value} alt={label} className="photo-preview" />
          <button
            onClick={() => { onChange(null); }}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              border: 'none', borderRadius: 8, padding: '5px 10px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <div className="photo-zone">
          <div style={{ fontSize: 28, opacity: 0.4 }}>📷</div>
          <p style={{ fontSize: 13, color: 'var(--dust)', marginBottom: 4 }}>Add a photo</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => cameraRef.current.click()}>
              📷 Camera
            </Button>
            <Button variant="secondary" size="sm" onClick={() => libraryRef.current.click()}>
              🖼️ Library
            </Button>
          </div>
        </div>
      )}
      <input
        ref={cameraRef} type="file" accept="image/*" capture="environment"
        onChange={handleFile} style={{ display: 'none' }}
      />
      <input
        ref={libraryRef} type="file" accept="image/*"
        onChange={handleFile} style={{ display: 'none' }}
      />
    </div>
  );
}
