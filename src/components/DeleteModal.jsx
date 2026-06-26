import React from 'react'
import { Trash2 } from 'lucide-react'

// Reusable delete confirmation modal
// props: message, onConfirm, onCancel
function DeleteModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm deletion">
      <div className="modal" style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Trash2 size={24} color="#dc2626" aria-hidden="true" />
        </div>

        <h2 className="modal-title" style={{ marginBottom: 8 }}>Are you sure?</h2>
        <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: 24 }}>{message}</p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onCancel} aria-label="Cancel deletion">
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} aria-label="Confirm deletion">
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteModal