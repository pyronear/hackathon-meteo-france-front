import * as React from 'react';
import {useCallback, useState} from 'react';
import Map, {Layer, Source} from 'react-map-gl/maplibre';
import type {FillLayer} from 'react-map-gl/maplibre';
import {Calendar} from 'react-calendar'
import './App.css'
import DatePicker from "react-datepicker";

import 'react-calendar/dist/Calendar.css';
import "react-datepicker/dist/react-datepicker.css";
import riskGeoJson from './risk.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];


const daysInFuture = 7;
const daysInPast = 365

const layerStyle: FillLayer = {
  id: 'fill',
  type: 'fill',
  source: "risk",
  paint: {
    "fill-color": {
      type: "interval",
      property: "fwi_category",
      stops: [
        [1, "green"],
        [2, "yellow"],
        [3, "orange"],
        [4, "red"],
        [5, "purple"],
        [6, "black"],
      ],
    },
    "fill-opacity": 1,
  }
};

function App() {
  const [viewState, setViewState] = useState({
    longitude: 1.9038900,
    latitude: 47.9028900,
    zoom: 4
  });
  const [mode, setMode] = useState<"predictive" | "past">("past");
  const [hoverInfo, setHoverInfo] = useState<any>(null);

  const onHover = useCallback((event: any) => {
      const {
      features,
      point: {x, y}
    } = event;
    const hoveredFeature = features && features[0];

    // prettier-ignore
    setHoverInfo(hoveredFeature && {feature: hoveredFeature, x, y});
  }, []);

  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  let tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  let maxDayInfuture = new Date();
  maxDayInfuture.setDate(maxDayInfuture.getDate() + daysInFuture);
  let minDaysInPast = new Date();
  minDaysInPast.setDate(minDaysInPast.getDate() - daysInPast);

  const [date, setDate] = useState<Date>(yesterday);

  const onModeChange = (changedMode: "predictive"|"past") => {
    setMode(changedMode)
    if (changedMode === "predictive") {
      setDate(new Date())
    } else {
      setDate(new Date())
    }
  }


  const onCalendarDateChange = (e: Value) => {
    if (!e) {
      return
    }
    if (Array.isArray(e)) {
      return
    }
    setDate(e)
  }
  const calendarSettings = {
    maxDate: (mode === "past") ? new Date() : maxDayInfuture,
    minDate: (mode === "past") ? minDaysInPast : new Date()
  }

  const isPreviousDaySelectable = () => {
    if (mode === "past") {
      return date > minDaysInPast
    }
    return date > new Date()
  }

  const isNextdaySelectable = () => {
    console.log(mode, date, new Date(), date < new Date())
    if (mode === "past") {
      return date < new Date()
    }
    return date < maxDayInfuture
  }

  const onPreviousDay = () => {
    if (isPreviousDaySelectable()) {
      let newDate = new Date(date)
      newDate.setDate(newDate.getDate() - 1)
      setDate(newDate)
    }
  }

  const onNextDay = () => {
    if (isNextdaySelectable()) {
      let newDate = new Date(date)
      newDate.setDate(newDate.getDate() + 1)
      setDate(newDate)
    }
  }

  return (
    <>
      <Navbar/>
      <div id="mainContainer">

        <div id="configContainer">
          <div className="calendarContainer">
            <FontAwesomeIcon icon={faChevronLeft} style={{color : (isPreviousDaySelectable() ? "" : "disabled")}} className='calendarChevron' onClick={onPreviousDay}/>
            <DatePicker selected={date} startDate={date} onChange={onCalendarDateChange} {...calendarSettings}/>
            <FontAwesomeIcon icon={faChevronRight} style={{color : (isPreviousDaySelectable() ? "" : "disabled")}} className='calendarChevron' onClick={onNextDay}/>
            <Toggle onChange={onModeChange}/>
          </div>
          <Legend/>
        </div>
        <div id="mapsContainer">
          <Map
            {...viewState}
            mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${process.env.REACT_APP_MAPTILER_API_KEY}`}
            onMove={evt => setViewState(evt.viewState)}
            onMouseMove={onHover}
            >
            <Source id="my-data" type="geojson" data={riskGeoJson}>
                <Layer {...layerStyle} />
              </Source>
          </Map>;
          {mode === "past" && <Map
              // onMove={onMapMove}
              {...viewState}
              onMouseMove={onHover}
              mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${process.env.REACT_APP_MAPTILER_API_KEY}`}
              onMove={evt => setViewState(evt.viewState)}
            >
          </Map>}
        </div>
      </div>
    </>
  )
}

function Toggle ({onChange}: {onChange: (changedMode: "predictive"|"past") => void}) {

  const _onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked ? "predictive" : "past")
  }

  return <div className="btn-container">
    <i className="fa fa-sun-o" aria-hidden="true"></i>
      <label className="switch btn-color-mode-switch">
        <input type="checkbox" name="color_mode" id="color_mode" value="1" onChange={_onChange}/>
        <label htmlFor="color_mode" data-on="Prédictif" data-off="Passé" className="btn-color-mode-switch-inner"></label>
      </label>
    <i className="fa fa-moon-o" aria-hidden="true"></i>
  </div>

}

function Legend () {
  return <div className="legend">
    <p>L'<a href="https://forest-fire.emergency.copernicus.eu/">EFFIS (European Forest Fire Information System)</a> représente l'IFM (Indice Feu Météo) à travers les 6 catégories suivantes :</p>
    <div className="legend-item">
      <span className='legend-square' style={{ height: "1rem",width: "1rem",display: "inline-block", backgroundColor: "green"}}></span>
      <span className="legend-label">Bas</span>
    </div>
    <div className="legend-item">
      <span className='legend-square' style={{ height: "1rem",width: "1rem",display: "inline-block", backgroundColor: "yellow"}}></span>
      <span className="legend-label">Moyen</span>
    </div>
    <div className="legend-item">
      <span className='legend-square' style={{ height: "1rem",width: "1rem",display: "inline-block", backgroundColor: "orange"}}></span>
      <span className="legend-label">Élevé</span>
    </div>
    <div className="legend-item">
      <span className='legend-square' style={{ height: "1rem",width: "1rem",display: "inline-block", backgroundColor: "red"}}></span>
      <span className="legend-label">Très élevé</span>
    </div>
    <div className="legend-item">
      <span className='legend-square' style={{ height: "1rem",width: "1rem",display: "inline-block", backgroundColor: "purple"}}></span>
      <span className="legend-label">Extrême</span>
    </div>
    <div className="legend-item">
      <span className='legend-square' style={{ height: "1rem",width: "1rem",display: "inline-block", backgroundColor: "black"}}></span>
      <span className="legend-label">Très extrême</span>
    </div>
  </div>
}

function Navbar() {

  const logoUrl = 'https://pyronear.org/img/logo_letters.png'
  return <>
      <nav>
        <img id="logo" src={logoUrl} alt="Pyronear logo" />
        <a id="about" href="https://pyronear.org">À propos de Pyronear</a>
      </nav>
    </>
}


function ToolBox() {
  return <div className="toolbox">

  </div>
}
export default App
