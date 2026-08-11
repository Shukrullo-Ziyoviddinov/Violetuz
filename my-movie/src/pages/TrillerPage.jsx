import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Triller from '../components/Triller/Triller';
import './TrillerPage.css';

const TrillerPage = () => {
  const { id } = useParams();

  useEffect(() => {
    document.body.classList.add('triller-page-active');
    return () => {
      document.body.classList.remove('triller-page-active');
    };
  }, []);

  return (
    <div className="triller-page">
      <Triller activeId={id} />
    </div>
  );
};

export default TrillerPage;
