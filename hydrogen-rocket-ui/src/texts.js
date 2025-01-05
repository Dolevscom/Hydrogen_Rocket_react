import React from "react";
import './App.css';

const hebrewPageTitle = <h1 className={'Hebrew h1-bold'}>טיל מימן</h1>;

const hebrewInstructions =
    <p className={'Hebrew h3-regular'}>
        סובבו את ידית הגנרטור על מנת ליצור מתח חשמלי<br/>
    </p>;

const hebrewGaugeTitle = <h2 className={'Hebrew h2-semi-bold'}>הזרם שנוצר:</h2>;

const hebrewEnergyTitle = <h2 className={'Hebrew h2-semi-bold'}>כמות האנרגיה:</h2>;

const englishPageTitle = <h1 className={'English h1-bold'}>Hydrogen Rocket</h1>;

const englishInstructions =
    <p className={'English h3-regular'}>
        Turn the generator handle to generate electrical voltage.<br/>
    </p>;

const englishGaugeTitle = <h2 className={'English h2-semi-bold'}>Current Generated:</h2>;

const englishEnergyTitle = <h2 className={'English h2-semi-bold'}>Energy Generated:</h2>;

const arabicPageTitle = <h1 className={'Arabic h1-bold'}>صاروخ الهيدروجين</h1>;

const arabicInstructions =
    <p className={'Arabic h3-regular'}>
        قم بتدوير مقبض المولد لتوليد الجهد الكهربائي.<br/>
    </p>;

const arabicGaugeTitle = <h2 className={'Arabic h2-semi-bold'}>التيار المتولد:</h2>;

const arabicEnergyTitle = <h2 className={'Arabic h2-semi-bold'}>الطاقة المتولدة:</h2>;

export const texts = {
    'Hebrew': {
        pageTitle: hebrewPageTitle,
        instructions: hebrewInstructions,
        gaugeTitle: hebrewGaugeTitle,
        energyTitle: hebrewEnergyTitle
    },
    'English': {
        pageTitle: englishPageTitle,
        instructions: englishInstructions,
        gaugeTitle: englishGaugeTitle,
        energyTitle: englishEnergyTitle
    },
    'Arabic': {
        pageTitle: arabicPageTitle,
        instructions: arabicInstructions,
        gaugeTitle: arabicGaugeTitle,
        energyTitle: arabicEnergyTitle
    }
};

export function FillTextAccordingToLanguage(language, gaugeAndEnergy) {
    return (
        <>
            {texts[language].pageTitle}
            {texts[language].instructions}
            {gaugeAndEnergy(texts[language].gaugeTitle, texts[language].energyTitle)}
            {texts[language].explanation}
        </>
    );
}
