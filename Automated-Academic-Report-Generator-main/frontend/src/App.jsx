import { useState } from "react";
import Header from "./components/Header";
import Tabs from "./components/Tabs";
import FormLayout from "./components/FormLayout";
import Footer from "./components/Footer";
export default function App() {
  const [activeTab, setActiveTab] = useState(null);

  const titles = [
    "Certification Program Report",
    "FDP / STTP Report",
    "Workshop / Seminar Report",
    "Sports / Cultural Activity Report",
    "In-house Activity Report",
    "Outreach Program Report",
  ];

  return (
    <>
      <Header />

      <div className="page">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <FormLayout 
         title={activeTab !== null ? titles[activeTab] : null} 
        /> 

      </div>

      <Footer/>
    </>
  );
}
