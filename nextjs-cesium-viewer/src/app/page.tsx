'use client'    // Client component

import "cesium/Build/Cesium/Widgets/widgets.css"
import dynamic from "next/dynamic"
import StoriesDisplay from "@/components/StoriesDisplay";
import CesiumContext from '@/contexts/CesiumContext';

const Map = dynamic(() => import("../components/Map"), {  // dynamic import
  ssr:false // Disable server-side rendering for this component
});

export default function Home() {

  const setCameraView = (viewConfig: any) => {
    console.log('Home setCameraView called with:', viewConfig);
    // This function will be implemented in the Map component
  };

  return (
    <CesiumContext.Provider value={{ setCameraView }}>
      <div className="relative w-full h-full">
        <Map />
        <StoriesDisplay />
      </div>
    </CesiumContext.Provider>
  );
}