import "cesium/Build/Cesium/Widgets/widgets.css"
import dynamic from "next/dynamic"

const Map = dynamic(() => import("../components/Map"), {  // dynamic import
  ssr:false // Disable server-side rendering for this component
});

export default function Home() {

  return (
    <div>
      <Map />
    </div>
  );
}