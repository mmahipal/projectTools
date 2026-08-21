import React, { useState } from 'react';
import { Plus, X, Mail, User } from 'lucide-react';
import './EmailConfig.css';

const EmailRecipientManager = ({ recipients, onRecipientsChange }) => {
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const addRecipient = () => {
    if (!newEmail || !validateEmail(newEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    const newRecipient = {
      id: `recipient_${Date.now()}`,
      email: newEmail.trim(),
      name: newName.trim() || newEmail.trim().split('@')[0]
    };

    onRecipientsChange([...recipients, newRecipient]);
    setNewEmail('');
    setNewName('');
  };

  const removeRecipient = (id) => {
    onRecipientsChange(recipients.filter(r => r.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addRecipient();
    }
  };

  return (
    <div className="email-recipient-manager">
      <div className="email-recipient-add">
        <div className="email-recipient-input-group">
          <input
            type="text"
            placeholder="Name (optional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="email-recipient-input"
          />
          <input
            type="email"
            placeholder="Email address *"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            className="email-recipient-input"
          />
          <button
            type="button"
            onClick={addRecipient}
            className="email-recipient-add-btn"
            disabled={!newEmail}
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      <div className="email-recipient-list">
        {recipients.length === 0 ? (
          <div className="email-recipient-empty">
            No recipients added. Add email addresses above.
          </div>
        ) : (
          recipients.map(recipient => (
            <div key={recipient.id} className="email-recipient-item">
              <div className="email-recipient-info">
                <User size={14} />
                <div>
                  <div className="email-recipient-name">{recipient.name}</div>
                  <div className="email-recipient-email">{recipient.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeRecipient(recipient.id)}
                className="email-recipient-remove-btn"
                title="Remove recipient"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmailRecipientManager;

