import React from "react";
import "./BarGraph.css";
import container from "/Users/dolevsmac/PycharmProjects/Hydrogen_Rocket_react/hydrogen-rocket-ui/src/assets/Components/Bargraph/container.png";

const BarGraph = ({ charge, maxCharge }) => {
  const heightPercentage = Math.min((charge / maxCharge) * 100, 100);

  const getBarColor = (value) => {
    if (value < 80) return "green";
    if (value < 100) return "yellow";
    return "red";
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
