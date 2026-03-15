import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDbStore } from '../store/dbStore';
import DbConfigForm from './DbConfigForm';
import './DbConnectionModal.css';

export default function DbConnectionModal() {
  const { isConnected, isChecking, checkConnectionStatus } = useDbStore();

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  if (isChecking || isConnected) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="db-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="db-modal-content glass-panel"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
        >
          <div className="db-modal-accent-bar" />
          <DbConfigForm 
            title="Database Setup Required" 
            description="Please connect to a database to continue. By default, SQLite creates a local file." 
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
