import React, { useContext } from 'react';
import { LoadingContext } from '../../contexts/LoadingContext';
import { Oval } from 'react-loader-spinner';
import '../../styles/common/GlobalLoader.css';

const GlobalLoader = () => {
  const { loading } = useContext(LoadingContext);

  if (!loading) return null;

  return (
    <div className="global-loader">
      <div className="loader-container">
        <Oval color="#004c99" secondaryColor="#e6e8f1" height={80} width={80} />
        <div className="loader-text">Loading, please wait...</div>
      </div>
    </div>
  );
};

export default GlobalLoader;
