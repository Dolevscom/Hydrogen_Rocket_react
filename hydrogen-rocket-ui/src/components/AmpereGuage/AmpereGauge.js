import React from "react";
import "./AmpereGauge.css";
import container from "/home/mada/Desktop/Hydrogen_Rocket/hydrogen-rocket-ui/src/assets/Components/Gauge/container.png";
import pointer from "/home/mada/Desktop/Hydrogen_Rocket/hydrogen-rocket-ui/src/assets/Components/Gauge/pointer_S.png";

const AmpereGauge = ({ currentValue, maxValue }) => {
  const needleAngle = (currentValue / maxValue) * 180;

  return (
    <div className="gauge-container">
      {/* Background image of the gauge */}
      <img
        src={container}
        alt="Gauge Background"
        className="gauge-image"
      />
      {/* Needle */}
      <div
        className="gauge-needle"
        style={{
          transform: `rotate(${needleAngle - 90}deg)`, // Rotate needle
          backgroundImage: `url(${pointer})`, // Use pointer image
        }}
      ></div>
      {/* Display Current Value */}
      {/*<div className="gauge-value">*/}
      {/*  <p>{`${currentValue} A`}</p>*/}
      {/*</div>*/}
    </div>
  );
};

export default AmpereGauge;
