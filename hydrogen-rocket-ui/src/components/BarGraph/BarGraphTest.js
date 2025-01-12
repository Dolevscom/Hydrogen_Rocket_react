import React, { useState, useEffect } from "react";
import BarGraph from "./BarGraph"; // Import your BarGraph component

const BarGraphTest = () => {
  const [charge, setCharge] = useState(0);
  const maxCharge = 150; // Maximum charge value

  // Simulate dynamic charge changes for testing
  useEffect(() => {
    const interval = setInterval(() => {
      setCharge((prev) => (prev >= maxCharge ? 0 : prev + 10));
    }, 1000); // Increment every second
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Testing Bar Graph</h1>
      <BarGraph charge={charge} maxCharge={maxCharge} />
      <p>Current Charge: {charge} / {maxCharge}</p>
    </div>
  );
};

export default BarGraphTest;
