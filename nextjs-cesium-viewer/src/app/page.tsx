'use client'    // Client component

import "cesium/Build/Cesium/Widgets/widgets.css"
import dynamic from "next/dynamic"
import StoriesDisplay from "@/components/StoriesDisplay";

const Map = dynamic(() => import("../components/Map"), {  // dynamic import
  ssr:false // Disable server-side rendering for this component
});

export default function Home() {

  return (
    <div className="relative w-full h-full">
      <Map />
      <StoriesDisplay />
    </div>
  );
}