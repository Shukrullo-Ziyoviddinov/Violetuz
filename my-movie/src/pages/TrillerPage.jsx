import React from 'react';
import { useParams } from 'react-router-dom';
import Triller from '../components/Triller/Triller';
import './TrillerPage.css';

const TrillerPage = () => {
  const { id } = useParams();

  return (
    <div className="triller-page">
      <Triller activeId={id} />
    </div>
  );
};

export default TrillerPage;
