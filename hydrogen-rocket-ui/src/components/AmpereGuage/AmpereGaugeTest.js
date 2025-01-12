import React, { useState, useEffect } from "react";
import AmpereGauge from "./AmpereGauge"; // Import the component to test

const AmpereGaugeTest = () => {
  const [currentValue, setCurrentValue] = useState(0);

  // Simulate dynamic data (e.g., from Arduino)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentValue((prev) => (prev >= 200 ? 0 : prev + 10));
    }, 1000); // Increment every second
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Testing Ampere Gauge</h1>
      <AmpereGauge currentValue={currentValue} maxValue={200} />
    </div>
  );
};

export default AmpereGaugeTest;
