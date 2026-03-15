import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader, FileCode, FolderPlus, Eye, BrainCircuit } from 'lucide-react';
import './AgentProgress.css';

export interface AgentTask {
  id: string;
  actionType: 'create_dir' | 'write_file' | 'read_file';
  path: string;
  status: 'running' | 'ok' | 'error';
  error?: string;
}

interface Props {
  tasks: AgentTask[];
  phase: 'thinking' | 'executing';
  thinkingLabel: string;
  total: number;
}

export default function AgentProgress({ tasks, phase, thinkingLabel, total }: Props) {
  const done = tasks.filter(t => t.status === 'ok' || t.status === 'error').length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  return (
    <motion.div
      className="agent-progress"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      {/* Header */}
      <div className="ap-header">
        <div className="ap-icon-wrap">
          {phase === 'thinking'
            ? <BrainCircuit size={15} className="ap-brain-icon" />
            : <Loader size={15} className="ap-spin-icon" />}
        </div>
        <div className="ap-header-text">
          <span className="ap-phase-label">
            {phase === 'thinking' ? thinkingLabel : `Running ${total} action${total !== 1 ? 's' : ''}…`}
          </span>
          {total > 0 && (
            <span className="ap-count">{done} / {total} done</span>
          )}
        </div>
      </div>

      {/* Thinking shimmer */}
      {phase === 'thinking' && (
        <div className="ap-shimmer-wrap">
          <div className="ap-shimmer-bar" />
          <div className="ap-shimmer-bar short" />
          <div className="ap-shimmer-bar shorter" />
        </div>
      )}

      {/* Task list */}
      {tasks.length > 0 && (
        <div className="ap-task-list">
          <AnimatePresence initial={false}>
            {tasks.map(task => (
              <motion.div
                key={task.id}
                className={`ap-task ${task.status}`}
                initial={{ opacity: 0, x: -16, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              >
                <span className="ap-status-icon">
                  {task.status === 'running' && <Loader size={12} className="ap-spin-icon" />}
                  {task.status === 'ok'      && <CheckCircle size={12} />}
                  {task.status === 'error'   && <XCircle size={12} />}
                </span>
                <span className="ap-type-icon">
                  {task.actionType === 'create_dir'  && <FolderPlus size={12} />}
                  {task.actionType === 'write_file'  && <FileCode size={12} />}
                  {task.actionType === 'read_file'   && <Eye size={12} />}
                </span>
                <span className="ap-task-path">{task.path}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Progress bar */}
      {total > 0 && (
        <div className="ap-progress-track">
          <motion.div
            className="ap-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </div>
      )}
    </motion.div>
  );
}
