import React from 'react';

import L, { LatLng } from 'leaflet';
import { Map, TileLayer } from 'react-leaflet';

import MapDrawer from './models/MapDrawer';
import IDB from './models/IDB';
import { DEFAULT_ICON } from './utils/leaflet.icon';

import AdvancedAnalytics from './AdvancedAnalytics/AdvancedAnalytics';
import SpatialAnalytics from './SpatialAnalytics/SpatialAnalytics';
import TimeAnalytics from './TimeAnalytics/TimeAnalytics';
import UserAnalytics from './UserAnalytics/UserAnalytics';
import TabContent from './TabContent/TabContent';
import TabNavigation from './TabNavigation/TabNavigation';
import Spinner from './Spinner/Spinner';

import NorovaLogo from './images/Norova-Logo.png';
import HFULogo from './images/HFU-Logo.jpg';

import 'leaflet/dist/leaflet.css';
import './NorovaAnalytics.css';
import RouteAnalytics from './RouteAnalytics/RouteAnalytics';

interface NorovaAnalyticsState {
    idbReady: boolean
}

const INITIAL_MAP_CENTER = new LatLng(48.051620, 8.207980);
const INITIAL_ZOOM_LEVEL = 11;

class NorovaAnalytics extends React.Component<{}, NorovaAnalyticsState> {

    private mapReference: React.RefObject<Map> = React.createRef();
    private mapDrawer: MapDrawer;

    constructor(props: {}) {
        super(props);
        L.Marker.prototype.options.icon = DEFAULT_ICON;
        this.mapDrawer = MapDrawer.getInstance();
        this.state = {
            idbReady: false,
        };
    }

    async componentDidMount() {
        this.mapDrawer.bind(this.mapReference);
        if ((await IDB.init()) !== null) {
            this.setState(() => ({ idbReady: true }));
        }
    }

    render() {
        return (
            <main>
                <Map
                    center={INITIAL_MAP_CENTER}
                    zoom={INITIAL_ZOOM_LEVEL}
                    fadeAnimation={true}
                    animate={true}
                    ref={this.mapReference}
                >
                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </Map>
                <section className="analytics">
                    <div className="analytics-head">
                        <div className="analytics-head__brand">
                            <img src={NorovaLogo} alt="Norova-Logo" />
                            <h1 className="title">orOvA Analytics</h1>
                        </div>
                        <img id="hfu" src={HFULogo} alt="HFU-Logo" />
                    </div>
                    <div className="analytics__control">
                        {
                            this.state.idbReady
                                ?
                                <TabNavigation>
                                    <TabContent name="Benutzer">
                                        <UserAnalytics
                                            isComparable={true}
                                            routeColor={'#000'}
                                        />
                                    </TabContent>
                                    <TabContent name="Zeitraum">
                                        <TimeAnalytics hasPeriodMode={true} />
                                    </TabContent>
                                    <TabContent name="Fläche">
                                        <SpatialAnalytics />
                                    </TabContent>
                                    <TabContent name="Route">
                                        <RouteAnalytics />
                                    </TabContent>
                                    <TabContent name="Erweitert">
                                        <AdvancedAnalytics />
                                    </TabContent>
                                </TabNavigation>
                                :
                                <Spinner />
                        }
                    </div>
                </section>
            </main >
        )
    };
}

export default NorovaAnalytics;
