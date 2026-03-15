import { useState } from 'react';
import { Play, Download, Film } from 'lucide-react';
import './VideoStudio.css';

export default function VideoStudio() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      setGenerating(false);
      // For demo, we just use a placeholder text or mock video URL if we had one
      // Using a placeholder video URL (just an element)
      setGeneratedVideo('mock');
    }, 3000);
  };

  return (
    <div className="video-studio-layout">
      {/* Prompt & Config Pane */}
      <div className="video-sidebar glass-panel">
        <div className="pane-header">
          <Film size={18} className="text-pink" />
          <h3>Video Studio</h3>
        </div>
        
        <div className="video-config-content">
          <div className="form-group">
            <label>Prompt</label>
            <textarea 
              className="input-base video-textarea"
              placeholder="Describe the video you want to generate (e.g., 'A futuristic city at sunset, cinematic lighting...')"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Aspect Ratio</label>
            <select className="input-base">
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
              <option value="1:1">1:1 (Square)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Motion Scale</label>
            <input type="range" className="range-input" min="1" max="100" defaultValue="50" />
            <div className="range-labels">
              <span>Subtle</span>
              <span>Dynamic</span>
            </div>
          </div>
        </div>

        <div className="video-actions">
          <button 
            className="btn btn-primary w-full"
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
          >
            {generating ? (
              <>Generating <span className="spin" style={{ display: 'inline-block' }}>⚙️</span></>
            ) : (
              <><Play size={16} /> Generate Video</>
            )}
          </button>
        </div>
      </div>

      {/* Preview Pane */}
      <div className="video-preview-pane glass-panel">
        <div className="preview-container">
          {generating ? (
            <div className="generating-overlay">
              <div className="spinner"></div>
              <p>Rendering frames...</p>
            </div>
          ) : generatedVideo ? (
            <div className="video-player">
              <div className="video-placeholder flex-center flex-col gap-4">
                <Film size={48} className="text-muted" />
                <p>Mock Generated Video for: "{prompt}"</p>
                <div className="video-controls-bar">
                   <button className="btn btn-primary btn-sm"><Play size={16}/></button>
                   <div className="scrubber"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-preview flex-center flex-col gap-4">
              <Film size={48} className="text-muted opacity-50" />
              <p className="text-muted">Enter a prompt and click generate to see the preview here.</p>
            </div>
          )}
        </div>

        {generatedVideo && !generating && (
          <div className="preview-footer flex-between border-t border-color p-4">
            <div className="video-stats text-muted text-sm">
              Resolution: 1080p | FPS: 24 | Duration: 4s
            </div>
            <button className="btn btn-ghost">
              <Download size={16} /> Export MP4
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
