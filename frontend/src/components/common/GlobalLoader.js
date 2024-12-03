import React, { useContext } from 'react';
import { LoadingContext } from '../../contexts/LoadingContext';
import { Oval } from 'react-loader-spinner';

const GlobalLoader = () => {
  const { loading } = useContext(LoadingContext);

  if (!loading) return null;

  return (
    <div className="global-loader">
      <Oval color="#004c99" height={80} width={80} />
    </div>
  );
};

export default GlobalLoader;
