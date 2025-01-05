import React from "react";
import { BaseApp } from "./BaseApp";
import "./App.css";
import startHebrew from './assets/start_screen/start_new_heb.jpg';
import startEnglish from './assets/start_screen/start_new_eng.png';
import startArabic from './assets/start_screen/start_new_arab.png';
import endHebrew from './assets/end_screen/end heb.png';
import endEnglish from './assets/end_screen/end eng.png';
import endArabic from './assets/end_screen/end arab.png';

class App extends BaseApp {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state, // Include BaseApp state
            screen: "opening", // Default to the opening screen
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
                    this.setState({ screen: "ending" });
                    console.log("Screen transitioned to 'ending'.");
                }, 3000); // 3-second delay
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", rawData, error);
        }
    };
    
    componentDidUpdate(prevProps, prevState) {
        if (this.state.screen === "ending" && prevState.screen !== "ending") {
            this.endingTimeout = setTimeout(() => {
                console.log("Timeout reached. Returning to opening screen...");
                this.setState({ screen: "opening" });
            }, 30000); // 30 seconds
        }
    
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
            if (prevState.screen === "main") return { screen: "ending" };
            if (prevState.screen === "ending") return { screen: "opening" };
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
            if (charge < 100) return currentLabels.text1;
            if (charge >= 100 && charge <= 120) return currentLabels.text2;
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
                <div className="full-screen-image-wrapper">
                    <img
                        src={getImagePath(screen, language)}
                        alt={`${screen} screen`}
                        className="full-screen-image"
                    />
                    
                </div>
            );
        }

        if (screen === "main") {
            return (
                <>
                    <h1 className={`${language} h1-bold`}>
                        {language === "Hebrew"
                            ? "טיל מימן"
                            : language === "English"
                            ? "Hydrogen Rocket"
                            : "صاروخ الهيدروجين"}
                    </h1>
                    <p className={`${language} h3-regular`}>
                        {language === "Hebrew"
                            ? "סובבו את ידית הגנרטור על מנת ליצור מתח חשמלי"
                            : language === "English"
                            ? "Turn the generator handle to generate electrical voltage."
                            : "قم بتدوير مقبض المولد لتوليد الجهد الكهربائي."}
                    </p>
                    <div className="data-screen-side-by-side">
                        <div className="data-item">
                            <h2 className={`${language} data-label`}>{currentLabels.data1}</h2>
                            <p className={`${language} data-value`}>
                                {arduinoData.current.toFixed(2)} {currentLabels.unit1}
                            </p>
                            <div className="gauge-container">
                                <div
                                    className="gauge"
                                    style={{
                                        transform: `rotate(${gaugeRotation(
                                            arduinoData.current
                                        )}deg)`,
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="data-item">
                            <h2 className={`${language} data-label`}>{currentLabels.data2}</h2>
                            <p className={`${language} data-value`}>
                                {arduinoData.charge.toFixed(2)} {currentLabels.unit2}
                            </p>
                            <div className="bar-graph-container-vertical">
                                <div
                                    className="bar-graph-vertical"
                                    style={{
                                        height: `${arduinoData.charge}%`,
                                        backgroundColor: barGraphColor(arduinoData.charge),
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                    <div className="bottom-text">
                        <p className={`${language} h3-regular`}>{bottomText}</p>
                    </div>
                </>
            );
        }

        if (screen === "ending") {
            return (
                <div className="full-screen-image-wrapper">
                    <img
                        src={getImagePath(screen, language)}
                        alt={`${screen} screen`}
                        className="full-screen-image"
                    />
                </div>
            );
        }
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
