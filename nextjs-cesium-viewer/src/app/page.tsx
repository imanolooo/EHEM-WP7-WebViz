'use client'    // Client component

import "cesium/Build/Cesium/Widgets/widgets.css"
import dynamic from "next/dynamic"
import FilterToolbar from "../components/FilterToolbar";

const Map = dynamic(() => import("../components/Map"), {  // dynamic import
  ssr:false // Disable server-side rendering for this component
});

export default function Home() {

  return (
    <div>
      {/* <FilterToolbar /> */}
      <Map />
    </div>
  );
}