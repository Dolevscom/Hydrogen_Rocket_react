import React from "react";
import "./BarGraph.css";
import container from "/home/mada/Desktop/Hydrogen_Rocket/hydrogen-rocket-ui/src/assets/Components/Bargraph/container.png";

const BarGraph = ({ charge, maxCharge }) => {
  const heightPercentage = Math.min((charge / maxCharge) * 100, 100);

  const getBarColor = (value) => {
    if (value < 75) return "rgb(94,187,70)";
    if (value < 100) return "rgb(243,230,0)";
    return "rgb(240,97,122)";
  };

  return (
    <div className="bar-graph-wrapper">
      {/* Container image */}
      <img src={container} alt="Bar Graph Container" className="container-image" />

      {/* Bar Graph */}
      <div className="bar-graph">
        <div
          className="bar-graph-fill"
          style={{
            height: `${heightPercentage}%`, // Dynamic height
            backgroundColor: getBarColor(charge), // Dynamic color
          }}
        ></div>
      </div>
    </div>
  );
};

export default BarGraph;
