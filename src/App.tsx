import * as React from 'react';
import {useCallback, useState} from 'react';
import Map, {Layer, Source} from 'react-map-gl/maplibre';
import type {CircleLayer, FillLayer} from 'react-map-gl/maplibre';
import './App.css'
import DatePicker, {registerLocale} from "react-datepicker";
import { fr } from 'date-fns/locale/fr';

import 'react-calendar/dist/Calendar.css';
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faFireFlameCurved, faFireExtinguisher} from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import ApiService from './services/api.service';
registerLocale('fr', fr)

// import gridding from './carro.json';

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];


const apiUrl = process.env.REACT_APP_API_URL
if (!apiUrl) {
  throw new Error("REACT_APP_API_URL is not defined")
}
const api = new ApiService(apiUrl);

const daysInFuture = 2;
const daysInPast = 1000

const predictionLayerStyle: FillLayer = {
  id: 'predict',
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
    "fill-opacity": 0.2,
  }
};

const griddingLayerStyle: FillLayer = {
  id: 'gridding',
  type: 'fill',
  source:'data.gouv.fr',
  paint: {
    "fill-outline-color": "black",
    "fill-color": "transparent",
    "fill-opacity": 0.2
  }
}

const firesLayerStyle: CircleLayer = {
  id: 'predict',
  type: 'circle',
  source: "risk",
  paint:{
    "circle-radius": 10,
    "circle-color": "red",
    "circle-opacity": 0.4,

  }
};

function App() {

  const dateOneDayBeforeDate = (date: Date) => {
    let newDate = new Date(date)
    newDate.setDate(newDate.getDate() - 1)
    return newDate
  }
  const dateOneDayAfterDate = (date: Date) => {
    let newDate = new Date(date)
    newDate.setDate(newDate.getDate() + 1)
    return newDate
  }

  let maxDayInfuture = new Date();
  maxDayInfuture.setDate(maxDayInfuture.getDate() + daysInFuture);
  console.log(maxDayInfuture)
  let minDaysInPast = new Date();
  minDaysInPast.setDate(minDaysInPast.getDate() - daysInPast);

  const [viewState, setViewState] = useState({
    longitude: -0.9929634774681517,
    latitude: 44.38580171870862,
    zoom: 6
  });
  const [mode, setMode] = useState<"predictive" | "past">("past");
  const [hoverInfo, setHoverInfo] = useState<any>(null);

  const [predictionGeojson, setPredictionGeojson] = useState<any>(null);
  const [detectionGeojson, setDetectionGeojson] = useState<any>(null);
  const [predictionFirstLoaded, setPredictionFirstLoaded] = useState<boolean>(false);
  const [predictionLoading, setPredictionLoading] = useState<boolean>(true);
  const [detectionFirstLoaded, setDetectionFirstLoaded] = useState<boolean>(false);
  const [detectionLoading, setDetectionLoading] = useState<boolean>(true);

  const [date, setDate] = useState<Date>(dateOneDayBeforeDate(new Date()));

  const getPredictionGeoJsonFromDate = async () => {
    setPredictionLoading(true)
    const geojson = await api.getFwiGeoJsonForDate(date)
    if (geojson !== null) {
      setPredictionGeojson(geojson)
      setPredictionLoading(false)
      setPredictionFirstLoaded(true)
    }
  }

  const getDetectionGeoJsonFromDate = async () => {
    setDetectionLoading(true)
    const geojson = await api.getFiresGeoJsonForDate(date)
    if (geojson !== null) {
      setDetectionGeojson(geojson)
      setDetectionLoading(false)
      setDetectionFirstLoaded(true)
    }
  }

  React.useEffect(() => {
    console.log("date changed")
    getPredictionGeoJsonFromDate()
    getDetectionGeoJsonFromDate()
  },[date])

  const onHover = useCallback((event: any) => {
      const {
      features,
      point: {x, y}
    } = event;
    const hoveredFeature = features && features[0];

    // prettier-ignore
    setHoverInfo(hoveredFeature && {feature: hoveredFeature, x, y});
  }, []);

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
console.log(mode, date, new Date(), date < dateOneDayBeforeDate(new Date()))

    if (mode === "past") {
      return date < dateOneDayBeforeDate(new Date())
    }
    return date < dateOneDayBeforeDate(maxDayInfuture)
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

  const geoJsonIsEmpty = (geojson: any) => {
    return geojson === null || geojson.features.length === 0
  }

  return (
    <>
      <Navbar/>
      <div id="mainContainer">

        <div id="configContainer">
          <div className="calendarContainer">
            <FontAwesomeIcon icon={faChevronLeft} style={{color : (isPreviousDaySelectable() ? "" : "disabled")}} className='calendarChevron' onClick={onPreviousDay}/>
            <DatePicker dateFormat="dd/MM/yyyy" locale="fr" selected={date} startDate={date} onChange={onCalendarDateChange} {...calendarSettings}/>
            <FontAwesomeIcon icon={faChevronRight} style={{color : (isPreviousDaySelectable() ? "" : "disabled")}} className='calendarChevron' onClick={onNextDay}/>
            <Toggle onChange={onModeChange}/>
          </div>
          <PredictionLegend date={date} isFuture={mode === "predictive"}/>
          {predictionLoading && detectionLoading && <FontAwesomeIcon  className="loader" icon={faFireFlameCurved} beatFade/>}
        </div>

        {mode === "past" && <div id="detectionLegendContainer">
          <DetectionLegend date={date}/>
        </div>}
        <div id="mapsContainer">
          {geoJsonIsEmpty(predictionGeojson) && predictionFirstLoaded && <NoData/>}
          <div className="mapContainer">
            <Map
              {...viewState}
              mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${process.env.REACT_APP_MAPTILER_API_KEY}`}
              onMove={evt => {setViewState(evt.viewState); console.log(evt)}}
              onMouseMove={onHover}
              >
              {/* <Source id="my-data" type="geojson" data={gridding}>
                <Layer {...griddingLayerStyle}/>
              </Source> */}
              <Source id="my-data" type="geojson" data={predictionGeojson}>
              <Layer {...predictionLayerStyle} />
              </Source>

            </Map>
          </div>
          {mode === "past" && <div className="mapContainer">
            {geoJsonIsEmpty(detectionGeojson) && detectionFirstLoaded &&<NoData/>}
            <Map
                // onMove={onMapMove}
                {...viewState}
                onMouseMove={onHover}
                mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${process.env.REACT_APP_MAPTILER_API_KEY}`}
                onMove={evt => setViewState(evt.viewState)}
              >
              <Source id="fires" type="geojson" data={detectionGeojson}>
                <Layer {...firesLayerStyle} />
              </Source>
            </Map>
          </div>}

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

function PredictionLegend ({date, isFuture}: {date: Date, isFuture: boolean}) {
  return <div className="legend">
    {
      isFuture ?
      <h2>Prévision de feux pour la journée du {date.toLocaleDateString('fr')}</h2>:
      <h2>Historique de prévision de feux pour la journée du {date.toLocaleDateString('fr')}</h2>
    }

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

function DetectionLegend({date}: {date: Date}) {
  return <div className="legend">
    <h2>Détections de feux pour la journée du {date.toLocaleDateString('fr')}</h2>
    <div className="legend-item">
      <span className='legend-circle' style={{ height: "1rem",width: "1rem",display: "inline-block", backgroundColor: "red"}}></span>
      <span className="legend-label">Détection de feu</span>
    </div>
    <p className="legend-info">Les données de detection s'arrêtent au 31/12/2022</p>
  </div>
}

function Navbar() {

  const logoUrl = 'https://pyronear.org/img/logo_letters.png'
  return <>
      <nav>
        <div className="navLeft">
          <img id="logo" src={logoUrl} alt="Pyronear logo" />
          <p className='title'>Risks</p>
          <span className="pill">Beta</span>
        </div>
        <div className="navRight">
            <FontAwesomeIcon icon={faGithub} className='githubIcon'/>
            <a href="https://github.com/pyronear/hackathon-meteo-france-front">Code</a>
        </div>
      </nav>
    </>
}


function NoData() {
  return <div className="no-data">
    <FontAwesomeIcon icon={faFireExtinguisher} className='no-data-icon'/>
    <p>Pas de donnée</p>
  </div>
}
export default App
