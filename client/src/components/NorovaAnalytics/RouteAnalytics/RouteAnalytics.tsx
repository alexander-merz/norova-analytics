import React from 'react';
import AnalyticsComponent, { AnalyticsComponentProps, AnalyticsComponentState } from '../models/AnalyticsComponent';
import { Observer } from '../models/ObserverPattern';
import { LatLngBounds } from 'leaflet';
import API from '../models/API';
import TrackingData from '../models/TrackingData';
import ActiveRoute from '../models/ActiveRoute';
import ActiveRouteSortableTable from '../ActiveRouteSortableTable/ActiveRouteSortableTable';
import Spinner from '../Spinner/Spinner';

import './RouteAnalytics.css';

export interface RouteAnalyticsProps extends AnalyticsComponentProps {
    onRouteEnd?: (route: [LatLngBounds, LatLngBounds]) => void;
}

export interface RouteAnalyticsState extends AnalyticsComponentState {
    route: [LatLngBounds | undefined, LatLngBounds | undefined];
}

export default class RouteAnalytics
    extends AnalyticsComponent<RouteAnalyticsProps, RouteAnalyticsState>
    implements Observer {

    origin: LatLngBounds | undefined = undefined;
    destination: LatLngBounds | undefined = undefined;

    constructor(props: RouteAnalyticsProps) {
        super(props);
        this.state = {
            activeRoutes: [],
            isFetchingData: false,
            route: [undefined, undefined]
        }
    }

    async update(payload: LatLngBounds) {
        if (this.state.isFetchingData) return;
        if (!this.origin || (this.origin && this.destination)) {
            this.origin = payload;
            this.destination = undefined;
            return;
        }
        if (this.origin && !this.destination) {
            this.destination = payload;
            if (this.props.onRouteEnd) {
                this.props.onRouteEnd([this.origin, this.destination]);
            } else {
                this.setState(state => ({
                    ...state,
                    isFetchingData: true,
                    route: [this.origin, this.destination],
                }));
            }
        }
    }

    componentDidMount() {
        this.mapDrawer.attach(this);
        this.mapDrawer.addDrawControl();
    }

    componentWillUnmount() {
        this.mapDrawer.detach(this);
        this.mapDrawer.removeDrawControl();
        this.mapDrawer.removeAllLayers();
        this.mapDrawer.removeShapes();
    }

    async componentDidUpdate(prevProps: AnalyticsComponentProps, prevState: RouteAnalyticsState) {
        const { route, activeRoutes: currentActiveRoutes } = this.state;
        if (currentActiveRoutes !== prevState.activeRoutes) {
            for (const activeRoute of currentActiveRoutes) {
                this.mapDrawer.removeAllLayers();
                this.mapDrawer.drawFromActiveRoute(activeRoute);
            }
            return;
        }
        if (this.origin && !this.destination) this.mapDrawer.removeShapes();
        const routeChanged = route[0] !== prevState.route[0] || route[1] !== prevState.route[1];
        if (this.origin && this.destination && routeChanged) {
            const trackingDataJSON = await API.getTrackingDataJSONByOriginAndDestination(
                {
                    minLat: this.origin.getSouth(),
                    maxLat: this.origin.getNorth(),
                    minLng: this.origin.getWest(),
                    maxLng: this.origin.getEast()
                },
                {
                    minLat: this.destination.getSouth(),
                    maxLat: this.destination.getNorth(),
                    minLng: this.destination.getWest(),
                    maxLng: this.destination.getEast()
                }
            );
            const activeRoutes: ActiveRoute[] = [];
            const groupedTrackingDataJSON = TrackingData.JSON.groupByRoute(trackingDataJSON);
            for (const trackingDataJSON of groupedTrackingDataJSON) {
                const activeRoute = await ActiveRoute.from(trackingDataJSON);
                activeRoutes.push(activeRoute);
            }
            this.setState(state => ({ ...state, activeRoutes, isFetchingData: false }));
        }
    }

    render() {
        const { isFetchingData, activeRoutes } = this.state;
        return (
            <div className="route-analytics">
                <h1>Zeichne zwei Rechtecke auf der Karte, um Start- und Endpunkt zu bestimmen</h1>
                {
                    isFetchingData
                        ?
                        <Spinner />
                        :
                        <div>
                            <ActiveRouteSortableTable activeRoutes={activeRoutes} />
                        </div>
                }
            </div>
        )
    }
}
