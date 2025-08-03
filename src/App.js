import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUpload, FaTrash, FaEdit, FaPlayCircle } from 'react-icons/fa';

const API_BASE = 'http://192.168.31.89:5000';
const UPLOAD_PASSWORD = '1234';

export default function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');
  const [videoList, setVideoList] = useState([]);
  const [password, setPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchVideoList = async () => {
    setLoadingList(true);
    try {
      const res = await axios.get(`${API_BASE}/videos`);
      setVideoList(res.data);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('❌ Failed to fetch video list');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchVideoList();
  }, []);

  const uploadVideo = async () => {
    if (password !== UPLOAD_PASSWORD) return setErrorMsg('❌ Wrong password');
    if (!videoFile) return setErrorMsg('❌ Please select a video file');

    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      setUploading(true);
      setErrorMsg('');

      const res = await axios.post(`${API_BASE}/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });

      const url = `${API_BASE}${res.data.videoUrl}`;
      setUploadedVideoUrl(url);
      setVideoFile(null);
      setPassword('');
      fetchVideoList();
    } catch (err) {
      setErrorMsg('❌ Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteVideo = async (name) => {
    if (!window.confirm(`Delete video: ${name}?`)) return;
    try {
      await axios.delete(`${API_BASE}/videos/${name}`);
      fetchVideoList();
    } catch (err) {
      setErrorMsg('❌ Failed to delete');
    }
  };

  const renameVideo = async (oldName) => {
    const ext = oldName.substring(oldName.lastIndexOf('.'));
    const base = oldName.substring(0, oldName.lastIndexOf('.'));
    const input = prompt('Enter new name (without extension):', base);
    if (!input || input === base) return;
    const newName = input + ext;

    try {
      await axios.post(`${API_BASE}/rename`, { oldName, newName });
      fetchVideoList();
    } catch (err) {
      setErrorMsg('❌ Rename failed');
    }
  };

  const btnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '8px 12px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '5px',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  };

  const fileInputWrapperStyle = {
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-block',

  };

  const fileInputStyle = {
    fontSize: 100,
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0,

  };

  const iconStyle = {
    fontSize: '16px',
  };
  const passwordInputStyle = {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '5px',

  };

  function handleView(video) {
    const newList = videoList.map(v => {
      if (v.name === video.name) {
        return { ...v, view: !v.view };
      }
      return v;
    });
    setVideoList(newList);
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h2>🎥 Video Sharing App</h2>

      <div style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={fileInputWrapperStyle}>
          <button style={btnStyle}><FaUpload style={iconStyle} /> {videoFile ? videoFile.name : "Choose File"}</button>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            style={fileInputStyle}
          />

        </div>
        <input
          style={passwordInputStyle}
          type="password"
          value={password}
          placeholder="Upload Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={uploadVideo} disabled={uploading} style={btnStyle}>
          <FaUpload style={iconStyle} />
          {uploading ? `Uploading... (${uploadProgress}%)` : 'Upload Video'}
        </button>


        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      </div>

      {uploadedVideoUrl && (
        <div style={{ marginBottom: 30 }}>
          <h4>✅ Uploaded Video</h4>
          <video controls src={uploadedVideoUrl} style={{ width: '100%' }} />
          <p><a href={uploadedVideoUrl} target="_blank" rel="noreferrer">Open in new tab</a></p>
        </div>
      )}

      <h3>📃 All Videos</h3>
      {loadingList ? (
        <p>Loading videos...</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          {videoList.map((video) => (
            <div key={video.name} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 10 }}>
              {video?.view ? (
                <video controls src={`${API_BASE}${video.url}`} style={{ width: '100%', marginTop: 8 }} />
              ) : (
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <FaPlayCircle color='yellow' size={50} style={{ position: "absolute", zIndex: 2, cursor: "pointer" }} onClick={() => handleView(video)} />
                  <img src={`${API_BASE}${video.thumbnail}`} alt="thumbnail" style={{ width: '100%', borderRadius: 4 }} />
                </div>
              )}
              <p style={{ wordBreak: 'break-word' }}>{video.name}</p>
              <small>Uploaded: {new Date(video.uploadDate).toLocaleString()}</small><br />
              <small>Size: {(video.size / (1024 * 1024)).toFixed(2)} MB</small>

              <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
                <button onClick={() => deleteVideo(video.name)} style={{ ...btnStyle, backgroundColor: '#dc3545' }}>
                  <FaTrash style={iconStyle} /> Delete
                </button>
                <button onClick={() => renameVideo(video.name)} style={{ ...btnStyle, backgroundColor: '#ffc107', color: '#000' }}>
                  <FaEdit style={iconStyle} /> Rename
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
