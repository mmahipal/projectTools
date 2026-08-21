import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/GlobalHeader.css';

const UserProfileDropdown = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  // Get user initials from name
  const getUserInitials = () => {
    if (!user) return 'U';
    
    const name = user.name || user.email || '';
    const nameParts = name.trim().split(/\s+/);
    
    if (nameParts.length >= 2) {
      // First letter of first name and first letter of last name
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    } else if (nameParts.length === 1) {
      // Only one name part, use first two letters
      return nameParts[0].substring(0, 2).toUpperCase();
    } else {
      // Fallback to email first letter
      return (user.email || 'U').charAt(0).toUpperCase();
    }
  };

  // Calculate menu position when dropdown opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          // Use viewport coordinates for fixed positioning
          setMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right
          });
        }
      };

      updatePosition();
      // Update position on scroll and resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use capture phase to catch clicks before they bubble
      document.addEventListener('mousedown', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen]);

  const handleProfileClick = () => {
    setIsOpen(false);
    navigate('/administration?tab=settings');
  };

  const handleHelpClick = () => {
    setIsOpen(false);
    const helpUrl = `${window.location.origin}/help`;
    window.open(helpUrl, '_blank');
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <>
      <div className="user-profile-dropdown" ref={dropdownRef}>
        <button
          ref={buttonRef}
          className="user-avatar-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="User menu"
          aria-expanded={isOpen}
        >
          <div className="user-avatar">
            {getUserInitials()}
          </div>
        </button>
      </div>
      
      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className="user-profile-dropdown-menu"
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
            zIndex: 999999
          }}
        >
          <button
            className="dropdown-menu-item"
            onClick={handleProfileClick}
          >
            <User size={16} />
            <span>Profile</span>
          </button>
          <button
            className="dropdown-menu-item"
            onClick={handleHelpClick}
          >
            <HelpCircle size={16} />
            <span>Help</span>
          </button>
          <button
            className="dropdown-menu-item"
            onClick={handleLogoutClick}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>,
        document.body
      )}
    </>
  );
};

export default UserProfileDropdown;

