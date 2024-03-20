import React from 'react';

const CesiumContext = React.createContext({
  setCameraView: (viewConfig: any) => {
    console.log('setCameraView not implemented');
  },
});

export default CesiumContext;