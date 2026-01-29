import { ReactNode } from 'react';
import './ActionCard.css';

interface ActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  actionText?: string;
}

export default function ActionCard({ title, description, icon, onClick, actionText = 'Get Started' }: ActionCardProps) {
  return (
    <div className="action-card-wrapper" onClick={onClick}>
      <div className="action-card">
        <div className="action-card-icon">
          {icon}
        </div>
        <p className="action-card-heading">{title}</p>
        <p className="action-card-description">{description}</p>
        <p className="action-card-action">{actionText}</p>
      </div>
    </div>
  );
}
