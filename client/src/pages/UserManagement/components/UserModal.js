// UserModal component for UserManagement
// Note: Full implementation remains in original file

import React from 'react';

const UserModal = ({ 
  show, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  roles, 
  editingUser,
  loading 
}) => {
  // Full implementation to be extracted from UserManagement.js
  return (
    <div className={`modal ${show ? 'show' : ''}`}>
      {/* Component implementation will be moved here */}
      <p>UserModal - to be fully extracted</p>
    </div>
  );
};

export default UserModal;

