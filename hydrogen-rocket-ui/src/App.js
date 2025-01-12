import React from "react";
import { BaseApp } from "./BaseApp";
import "./App.css";
import AmpereGauge from "./components//AmpereGuage/AmpereGauge";
import BarGraph from "./components/BarGraph/BarGraph";
import startHebrew from './assets/start_screen/start_new_heb.jpg';
import startEnglish from './assets/start_screen/start_new_eng.png';
import startArabic from './assets/start_screen/start_new_arab.png';
import endHebrew from './assets/end_screen/end heb.png';
import endEnglish from './assets/end_screen/end eng.png';
import endArabic from './assets/end_screen/end arab.png';
import midScreenEng from './assets/middle_screen/mid_screen_eng.png';
import midScreenHeb from './assets/middle_screen/mid_screen_heb.png';
import midScreenArab from './assets/middle_screen/mid_screen_heb.png';
import regularFont from './assets/fonts/SimplerPro_HLAR-Regular.otf';



class App extends BaseApp {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state, // Include BaseApp state
            screen: "main", // Default to the opening screen
            language: "Hebrew", // Default language
            rawArduinoData: "", // Raw data from Arduino
            arduinoData: {
                current: 0, // Amperes
                charge: 0, // Coulombs
                ignition: 0, // Ignition button status
                language: 0, // Language index
            }, // Initialize with default values
        };
    }


    handleMessage = (event) => {
        // console.log("WebSocket message received:", event);
    
        let rawData;
    
        if (event.data instanceof ArrayBuffer) {
            rawData = new TextDecoder("utf-8").decode(event.data);
        } else if (typeof event.data === "string") {
            rawData = event.data;
        } else {
            return;
        }
    
        try {
            const [current, charge, ignition, language] = rawData
                .trim()
                .split(/\s+/)
                .map((val, index) => (index < 2 ? parseFloat(val) : parseInt(val, 10)));
    
            // console.log("Parsed data:", { current, charge, ignition, language });
    
              // Update Arduino data
        this.setState((prevState) => {
            const newLanguage = ["Hebrew", "English", "Arabic"][language || 0];

            // Only update language if it is different from the current language AND no manual change is happening
            const updatedLanguage =
                prevState.language === newLanguage ? prevState.language : newLanguage;

            return {
                rawArduinoData: rawData,
                arduinoData: {
                    current: current || 0,
                    charge: charge || 0,
                    ignition: ignition || 0,
                    language: language || 0,
                },
                language: prevState.languageChangeManual
                    ? prevState.language // Keep the manually set language
                    : updatedLanguage, // Update only if not manually changed
            };
        });

            if (current > 1 && this.state.screen !== "main") {
                console.log("Charge exceeded threshold. Moving to measuring screen...");
                this.setState({ screen: "main" });
            }
        
            // Trigger transition on ignition button press if charge is sufficient
            if (ignition === 1 && charge >= 100) {
                console.log("Ignition button pressed with sufficient charge. Transitioning to ending screen...");
                setTimeout(() => {
                    this.setState({ screen: "opening" });
                    console.log("Screen transitioned to 'ending'.");
                }, 3000); // 3-second delay
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", rawData, error);
        }
    };
    
    componentDidUpdate(prevProps, prevState) {
        // if (this.state.screen === "main" && prevState.screen !== "main") {
        //     this.endingTimeout = setTimeout(() => {
        //         console.log("Timeout reached. Returning to opening screen...");
        //         this.setState({ screen: "opening" });
        //     }, 30000); // 30 seconds
        // }
    
        if (prevState.screen === "ending" && this.state.screen !== "ending") {
            clearTimeout(this.endingTimeout); // Clear timeout if user leaves ending screen early
        }
    }
    
    componentDidMount() {
        super.componentDidMount(); // Set up WebSocket connection
        window.addEventListener("keydown", this.handleKeyPress);
    }

    componentWillUnmount() {
        super.componentWillUnmount(); // Clean up WebSocket and listeners
        window.removeEventListener("keydown", this.handleKeyPress);
        clearTimeout(this.endingTimeout);
    }

    handleKeyPress = (event) => {
        console.log("Key pressed:", event.code);
        if (event.code === "Enter") {
            this.moveToNextScreen();
        } else if (event.code === "Space") {
            event.preventDefault(); // Prevent default scrolling behavior
            this.changeLanguage();
        }
    };

    moveToNextScreen = () => {
        this.setState((prevState) => {
            if (prevState.screen === "opening") return { screen: "main" };
            if (prevState.screen === "main") return { screen: "opening" };
            // if (prevState.screen === "ending") return { screen: "opening" };
            return prevState;
        });
    };

    changeLanguage = () => {
        if (this.languageChangeTimeout) return; // Prevent rapid key presses
        const languages = ["Hebrew", "English", "Arabic"];
        this.setState((prevState) => {
            const currentIndex = languages.indexOf(prevState.language);
            const nextIndex = (currentIndex + 1) % languages.length;
            console.log("Changing language to:", languages[nextIndex]);
            return { 
                language: languages[nextIndex],
                languageChangeManual: true, // Set manual change flag
            };
        });
    
        // Add a short timeout to debounce rapid key presses
        this.languageChangeTimeout = setTimeout(() => {
            this.languageChangeTimeout = null;
        }, 300); // Adjust delay as needed (300ms works well for debouncing)
    
        // Reset manual change flag after some time (e.g., 5 seconds)
        setTimeout(() => {
            this.setState({ languageChangeManual: false });
        }, 5000);
    };
    

    renderScreen() {
        const { screen, language, arduinoData } = this.state;

        const labels = {
            Hebrew: {
                data1: "זרם נוכחי",
                data2: "מטען שהצטבר",
                unit1: "אמפר",
                unit2: "קולון",
                text1: "סובבו את הידית עד שתגיעו לחלק הצהוב",
                text2: "לחצו על ׳שגר׳!",
                text3: "חובה לשגר",
            },
            English: {
                data1: "Current",
                data2: "Accumulated Charge",
                unit1: "Amper",
                unit2: "Coulomb",
                text1: "Turn the handle until you reach the yellow zone",
                text2: "Press 'Launch'!",
                text3: "Must Launch!",
            },
            Arabic: {
                data1: "التيار الحالي",
                data2: "الشحنة المتراكمة",
                unit1: "أمبير",
                unit2: "كولوم",
                text1: "قم بتدوير المقبض حتى تصل إلى المنطقة الصفراء",
                text2: "اضغط على 'إطلاق'!",
                text3: "يجب الإطلاق",
            },
        };

        const currentLabels = labels[language];

        const getBottomText = (charge) => {
            if (charge < 85) return currentLabels.text1;
            if (charge >= 85 && charge <= 100) return currentLabels.text2;
            return currentLabels.text3;
        };

        const bottomText = getBottomText(arduinoData.charge);

        const getImagePath = (screen, language) => {
            if (screen === "opening") {
                if (language === "Hebrew") return startHebrew;
                if (language === "English") return startEnglish;
                if (language === "Arabic") return startArabic;
            } else if (screen === "ending") {
                if (language === "Hebrew") return endHebrew;
                if (language === "English") return endEnglish;
                if (language === "Arabic") return endArabic;
            } else if (screen === "main") {
                if (language === "Hebrew") return midScreenHeb;
                if (language === "English") return midScreenEng;
                if (language === "Arabic") return midScreenArab;
            }
            return null; // No image for the main screen
        };

        const barGraphColor = (value) => {
            if (value < 100) return "green";
            if (value < 120) return "yellow";
            return "red";
        };

        const gaugeRotation = (value) => {
            const maxValue = 30; // Adjust based on max value for current
            return (value / maxValue) * 180; // Scale to half-circle (180 degrees)
        };

    if (screen === "opening") {
    return (
        <div
            style={{
                position: "fixed", // Fill the entire viewport
                top: 0,
                left: 0,
                width: "100vw", // Full width of the viewport
                height: "100vh", // Full height of the viewport
            }}
        >
            <img
                src={getImagePath(screen, language)}
                alt={`${screen} screen`}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover", // Ensures the image scales proportionally
                    display: "block",
                }}
            />
        </div>
    );
}
if (screen === "main") {
    return (
        <div
            style={{
                position: "fixed", // Ensures it fills the viewport
                top: "50%", // Center vertically
                left: "50%", // Center horizontally
                width: "90vw", // Adjust width to fit within the viewport
                height: "90vh", // Adjust height to fit within the viewport
                transform: "translate(-50%, -50%)", // Center the div
                backgroundColor: "black", // Optional background color to test alignment
            }}
        >
            {/* Render the layout image */}
            <img
                src={getImagePath(screen, language)}
                alt="Middle Screen Layout"
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain", // Contain the image within the div
                    display: "block",
                }}
            />

            {/* Arduino Text: Ampere */}
            <div
                style={{
                    position: "absolute",
                    top: "50.5%", // Adjust the top position for Ampere text
                    left: "47%", // Adjust the left position
                    fontSize: "6rem", // Adjust text size
                    color: "black", // Text color
                    textAlign: "center", // Center text alignment
                    font: regularFont
                }}
            >
                {arduinoData.current.toFixed(0)} A
            </div>

            {/* Arduino Text: Coulomb */}
            <div
                style={{
                    position: "absolute",
                    top: "95%", // Adjust the top position for Coulomb text
                    left: "47%", // Adjust the left position
                    fontSize: "6rem", // Adjust text size
                    color: "black", // Text color
                    textAlign: "center", // Center text alignment
                    font: regularFont
                }}
            >
                {arduinoData.charge.toFixed(0)} C
            </div>

            {/* Ampere Gauge */}
            <div
                style={{
                    position: "absolute",
                    top: "27%", // Adjust the top position
                    left: "40%", // Adjust the left position
                    width: "20%", // Adjust width as needed
                    height: "auto", // Maintain aspect ratio
                    transform: "scale(8)", // Adjust the size of the component
                }}
            >
                <AmpereGauge
                    currentValue={arduinoData.current}
                    maxValue={30}
                    className="ampere-gauge"
                    style={{
                        width: "100%", // Ensure the bar graph fills its container
                        height: "auto", // Maintain aspect ratio
                    }}
                />
            </div>

            {/* Bar Graph */}
            <div
                style={{
                    position: "absolute",
                    top: "80%", // Adjust the top position
                    right: "37%", // Adjust the right position
                    width: "20%", // Adjust width as needed
                    height: "10%", // Maintain aspect ratio
                    transform: "scale(4)", // Adjust the size of the component
                }}
            >
                <BarGraph
                    charge={arduinoData.charge}
                    maxCharge={150}
                    className="bar-graph"
                    style={{
                        width: "100%", // Ensure the bar graph fills its container
                        height: "auto", // Maintain aspect ratio
                    }}
                />
            </div>
        </div>
    );
}








        // if (screen === "ending") {
        //     return (
        //         <div className="full-screen-image-wrapper">
        //             <img
        //                 src={getImagePath(screen, language)}
        //                 alt={`${screen} screen`}
        //                 className="full-screen-image"
        //             />
        //         </div>
        //     );
        // }
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">{this.renderScreen()}</header>
            </div>
        );
    }

    
}

export default App;
