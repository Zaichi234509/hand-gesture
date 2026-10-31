import React from 'react';
import { GestureId } from '../types';

interface Props {
  gesture: GestureId;
  className?: string;
}

export const GesturePoseIcon: React.FC<Props> = ({ gesture, className = 'w-6 h-6' }) => {
  switch (gesture) {
    case 'open_palm':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 16V7.5a1.5 1.5 0 0 1 3 0V15m0 0V6a1.5 1.5 0 0 1 3 0v9m0 0V7.5a1.5 1.5 0 0 1 3 0V16m0 0v-6a1.5 1.5 0 0 1 3 0v9.5c0 4.418-3.582 8-8 8h-1.5c-3.5 0-6.2-2.1-7.4-5.2l-1.9-4.6a1.5 1.5 0 0 1 2.75-1.2L10 19v-8.5a1.5 1.5 0 0 1 2 0V16Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'peace':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M13.5 16 11 6.8a1.5 1.5 0 1 1 2.9-.75L16 14.5l2.1-8.45a1.5 1.5 0 1 1 2.9.75L18.5 16"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11 17.5a2 2 0 0 1 2-2h6.5a2.5 2.5 0 0 1 2.5 2.5v3a6.5 6.5 0 0 1-13 0v-2a1.5 1.5 0 0 1 2-1.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'finger_heart':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          {/* Small floating heart above crossed fingers */}
          <path
            d="M16 10.2s-2.8-1.85-2.8-3.65a1.6 1.6 0 0 1 2.8-1.05 1.6 1.6 0 0 1 2.8 1.05c0 1.8-2.8 3.65-2.8 3.65Z"
            fill="#D45863"
          />
          <path
            d="M12.5 18.5 17.5 13a1.4 1.4 0 0 1 2 2l-4 4.2M19 18l-4.5-4.8a1.4 1.4 0 0 0-2 2l3 3.3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.5 20.5c0 3.8 2.8 6.5 6.5 6.5s6-2.7 6-6.2V19a2 2 0 0 0-2-2h-7.5a3 3 0 0 0-3 3.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'ily':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 17V7.5a1.5 1.5 0 0 1 3 0V16m6 1V9.5a1.5 1.5 0 0 1 3 0v10c0 4.2-3.1 7.5-7.5 7.5-3.4 0-5.8-1.8-7.2-4.6L7 18.2a1.5 1.5 0 0 1 2.6-1.5L12 19.5M15 15.5a1.5 1.5 0 0 1 3 0v2.5m0-2a1.5 1.5 0 0 1 3 0v2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'thumbs_up':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M14 14V8.5A2.5 2.5 0 0 1 16.5 6c.9 0 1.7.5 2 1.35L19.5 11v3h4.2a2.3 2.3 0 0 1 2.25 2.75l-1.1 6.5A2.5 2.5 0 0 1 22.4 25.3H12.5A2.5 2.5 0 0 1 10 22.8v-6.3A2.5 2.5 0 0 1 12.5 14H14Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'two_hand_heart':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M16 24.5s-8.5-5.2-8.5-10.8A4.7 4.7 0 0 1 12.2 9c1.65 0 3.05.8 3.8 2.05A4.45 4.45 0 0 1 19.8 9a4.7 4.7 0 0 1 4.7 4.7c0 5.6-8.5 10.8-8.5 10.8Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="15.8" r="2" fill="#D45863" />
        </svg>
      );
  }
};
