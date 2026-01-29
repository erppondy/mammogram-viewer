import { useNavigate } from 'react-router-dom';
import './UserProfileButton.css';

interface UserProfileButtonProps {
  username: string;
  isAdmin?: boolean;
}

export default function UserProfileButton({ username, isAdmin }: UserProfileButtonProps) {
  const navigate = useNavigate();

  return (
    <div className="user-profile-button-wrapper">
      <div className="gradient-container">
        <button 
          className="profile-button"
          onClick={() => navigate('/profile')}
          title="Click to edit profile"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="username-text">{username}</span>
          {isAdmin && (
            <span className="admin-badge">Admin</span>
          )}
        </button>
      </div>
    </div>
  );
}
