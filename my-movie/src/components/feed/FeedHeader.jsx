import React from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import './FeedHeader.css';

const defaultAccount = { name: 'Shukrullo', avatar: null };

const FeedHeader = ({ currentUser, followedPeople = [] }) => {
  const navigate = useNavigate();

  const openPerson = (person) => {
    if (person.entityType === 'actor') {
      navigate(`/actor/${person.followId}`);
    } else {
      navigate(`/music/artist/${person.followId}`);
    }
  };

  const user = currentUser || defaultAccount;

  return (
    <div className="feed-header">
      <ScrollTouch className="feed-header-scroll">
        <button
          type="button"
          className="feed-header-person feed-header-person--account"
          onClick={() => navigate('/profile')}
        >
          <div className="feed-header-account-avatar" aria-hidden="true">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="feed-header-account-avatar-img" />
            ) : (
              <svg
                className="feed-header-account-avatar-icon"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
          <span className="feed-header-account-name">{user.name}</span>
        </button>
        {followedPeople.map((person) => (
          <button
            key={person.key}
            type="button"
            className="feed-header-person"
            onClick={() => openPerson(person)}
          >
            <img src={person.image} alt="" className="feed-header-person-img" />
            <span className="feed-header-person-name">{person.name}</span>
          </button>
        ))}
      </ScrollTouch>
    </div>
  );
};

export default FeedHeader;
