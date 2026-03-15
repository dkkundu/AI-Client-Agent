import { useState } from 'react';
import { Settings as SettingsIcon, Save, Plug, HardDrive, Video, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import DbConfigForm from '../components/DbConfigForm';
import './Settings.css';

export default function Settings() {
  const store = useSettingsStore();
  
  const [ollamaUrl, setOllamaUrl] = useState(store.ollamaUrl);
  const [defaultModel, setDefaultModel] = useState(store.defaultModel);
  const [workspacePath, setWorkspacePath] = useState(store.workspacePath);
  const [videoApiUrl, setVideoApiUrl] = useState(store.videoApiUrl);
  
  const [saving, setSaving] = useState(false);
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success'|'error'|null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>(store.defaultModel ? [store.defaultModel] : ['llama3']);

  const handleSave = () => {
    setSaving(true);
    store.setOllamaUrl(ollamaUrl);
    store.setDefaultModel(defaultModel);
    store.setWorkspacePath(workspacePath);
    store.setVideoApiUrl(videoApiUrl);
    setTimeout(() => setSaving(false), 800);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Proxy through backend to avoid CORS if necessary
      const res = await fetch(`http://localhost:3001/api/models?url=${encodeURIComponent(ollamaUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          setAvailableModels(data.models);
          // Auto select first if current is not in list
          if (!data.models.includes(defaultModel)) {
            setDefaultModel(data.models[0]);
          }
          setTestResult('success');
        } else {
          setTestResult('error'); // Connected but no models
        }
      } else {
        setTestResult('error');
      }
    } catch (e) {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="settings-layout">
      <div className="settings-container glass-panel">
        <div className="settings-header flex-between border-b border-color pb-4 mb-6">
          <div className="flex-center gap-3">
            <div className="icon-wrapper bg-black/30 p-2 rounded-lg text-accent">
               <SettingsIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Settings</h2>
              <p className="text-muted text-sm mt-1">Configure your LLM Client environment and integrations.</p>
            </div>
          </div>
          <button 
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        <div className="settings-content">
          
          {/* AI Providers Section */}
          <div className="settings-section">
            <h3 className="section-title flex-center gap-2">
               <Plug size={18} className="text-accent" />
               AI Providers & Local LLM
            </h3>
            
            <div className="form-grid">
              <div className="form-group col-span-2">
                <label>LLM Server URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="input-base flex-1" 
                    value={ollamaUrl}
                    onChange={e => {
                      setOllamaUrl(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="e.g., http://localhost:11434 or http://115.127.54.26:6653/v1/models"
                  />
                  <button 
                    className="btn btn-secondary flex items-center gap-2"
                    onClick={testConnection}
                    disabled={testing || !ollamaUrl.trim()}
                  >
                    <RefreshCw size={14} className={testing ? 'spin' : ''} />
                    Test Connection
                  </button>
                </div>
                {testResult === 'success' && (
                  <p className="helper-text text-accent flex items-center gap-1 mt-2">
                    <CheckCircle2 size={12} /> Successfully connected and loaded models.
                  </p>
                )}
                {testResult === 'error' && (
                  <p className="helper-text text-pink flex items-center gap-1 mt-2">
                    <XCircle size={12} /> Connection failed or no models found. Ensure URL and server are correct.
                  </p>
                )}
                <p className="helper-text">The base URL where your local Ollama or OpenAI-compatible instance is running.</p>
              </div>

              <div className="form-group col-span-2">
                <label>Default Model</label>
                <select 
                  className="input-base"
                  value={defaultModel}
                  onChange={e => setDefaultModel(e.target.value)}
                  disabled={availableModels.length === 0}
                >
                  {availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  {!availableModels.includes(defaultModel) && (
                     <option value={defaultModel}>{defaultModel} (Custom)</option>
                  )}
                </select>
                <p className="helper-text">Select the model to be primarily used by the Code Assistant. Test connection to fetch models.</p>
              </div>
            </div>
          </div>

          <hr className="divider" />

          {/* Database Section */}
          <div className="settings-section">
            <DbConfigForm />
          </div>

          <hr className="divider" />

          {/* Filesystem Section */}
          <div className="settings-section">
            <h3 className="section-title flex-center gap-2">
               <HardDrive size={18} className="text-indigo" />
               Workspace & Filesystem
            </h3>
            
            <div className="form-grid">
              <div className="form-group col-span-2">
                <label>Default Workspace Path</label>
                <input 
                  type="text" 
                  className="input-base" 
                  value={workspacePath}
                  onChange={e => setWorkspacePath(e.target.value)}
                  placeholder="/home/user/projects"
                />
                <p className="helper-text">The root directory that the File Explorer will open on launch.</p>
              </div>
            </div>
          </div>

          <hr className="divider" />

          {/* Video Studio Section */}
          <div className="settings-section">
            <h3 className="section-title flex-center gap-2">
               <Video size={18} className="text-pink" />
               Video Generation API
            </h3>
            
            <div className="form-grid">
              <div className="form-group col-span-2">
                <label>External Video API Endpoint (Optional)</label>
                <input 
                  type="text" 
                  className="input-base" 
                  value={videoApiUrl}
                  onChange={e => setVideoApiUrl(e.target.value)}
                  placeholder="https://api.runpod.ai/v2/.../runsync"
                />
                <p className="helper-text">If you have a hosted endpoint for Stable Video Diffusion or similar models.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
