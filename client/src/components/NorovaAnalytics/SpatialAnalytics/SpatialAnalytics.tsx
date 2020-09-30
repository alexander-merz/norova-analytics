import React from 'react';
import { LatLngBounds } from 'leaflet';

import AnalyticsComponent, { AnalyticsComponentProps, AnalyticsComponentState } from '../models/AnalyticsComponent';
import Spinner from '../Spinner/Spinner';

import API from '../models/API';
import ActiveRoute from '../models/ActiveRoute';
import { Observer } from '../models/ObserverPattern';
import TrackingData from '../models/TrackingData';

import './SpatialAnalytics.css';
import ActiveRouteSortableTable from '../ActiveRouteSortableTable/ActiveRouteSortableTable';

interface SpatialAnalyticsProps extends AnalyticsComponentProps {
    onDrawEnd?: (latLngBounds: LatLngBounds) => void;
}

export interface SpatialAnalyticsState extends AnalyticsComponentState {
    maxActiveRoutes: number;
    latLngBounds: LatLngBounds | undefined;
}

export const INITIAL_MAX_ROUTES = 100;
export const MAX_ROUTES = 999;

export default class SpatialAnalytics
    extends AnalyticsComponent<SpatialAnalyticsProps, SpatialAnalyticsState>
    implements Observer {

    constructor(props: SpatialAnalyticsProps) {
        super(props);
        this.state = {
            activeRoutes: [],
            isFetchingData: false,
            maxActiveRoutes: INITIAL_MAX_ROUTES,
            latLngBounds: undefined
        }
    }

    async update(payload: LatLngBounds): Promise<void> {
        if (this.props.onDrawEnd) this.props.onDrawEnd(payload);
        else this.setState(state => ({ ...state, isFetchingData: true, latLngBounds: payload }));
    }

    async componentDidMount() {
        this.mapDrawer.attach(this);
        this.mapDrawer.addDrawControl();
    }

    componentWillUnmount() {
        this.mapDrawer.detach(this);
        this.mapDrawer.removeDrawControl();
        this.mapDrawer.removeShapes();
        this.mapDrawer.removeAllLayers();
    }

    async componentDidUpdate(prevProps: SpatialAnalyticsProps, prevState: SpatialAnalyticsState) {
        const { activeRoutes: currentActiveRoutes, maxActiveRoutes, latLngBounds } = this.state;
        const { activeRoutes: prevActiveRoutes, maxActiveRoutes: prevMaxActiveRoutes } = prevState;
        if (
            currentActiveRoutes !== prevActiveRoutes ||
            maxActiveRoutes !== prevMaxActiveRoutes
            ) {
            this.mapDrawer.removeAllLayers();
            if (currentActiveRoutes.length <= maxActiveRoutes) {
                for (const activeRoute of currentActiveRoutes) {
                    await this.mapDrawer.drawFromActiveRoute(activeRoute);
                }
                if (latLngBounds) this.mapDrawer.fitBounds(latLngBounds);
            }
            return;
        }
        if (!this.state.isFetchingData) return;
        if (latLngBounds) {
            const activeRoutes: ActiveRoute[] = [];
            const trackingDataJSON = await API.getTrackingDataJSONWithinLatLngInterval({
                minLat: latLngBounds.getSouth(),
                maxLat: latLngBounds.getNorth(),
                minLng: latLngBounds.getWest(),
                maxLng: latLngBounds.getEast()
            });
            const groupedTrackingDataJSON = TrackingData.JSON.groupByRoute(trackingDataJSON);
            for (const trackingDataJSON of groupedTrackingDataJSON) {
                const activeRoute = await ActiveRoute.from(trackingDataJSON);
                activeRoutes.push(activeRoute);
            }
            this.setState(state => ({ ...state, isFetchingData: false, activeRoutes }));
        }
    }

    onMaxActiveRoutesChange(event: React.MouseEvent<HTMLInputElement>) {
        const maxActiveRoutes = parseInt((event.target as HTMLInputElement).value);
        this.setState(state => ({ ...state, maxActiveRoutes }));
    }

    onTBodyClick(cell: HTMLTableCellElement) {
        const row = cell.parentElement as HTMLTableRowElement;
        if (row.dataset.id) this.mapDrawer.highlight(parseInt(row.dataset.id));
    }

    render() {
        const { activeRoutes } = this.state;
        return (
            <div className="spatial-analytics">
                <div className="spatial-analytics__head">
                    <div>
                        <span>&#8598; Zeichne ein Rechteck auf der Karte!</span>
                    </div>
                    <div>
                        <label>Maximal</label>
                        <input
                            type="range"
                            name="hour" id="start"
                            className="no-arrow"
                            defaultValue={this.state.maxActiveRoutes}
                            min={0}
                            max={MAX_ROUTES}
                            onMouseUp={this.onMaxActiveRoutesChange.bind(this)}
                        />
                        <label>{this.state.maxActiveRoutes} Routen zeichnen</label>
                    </div>
                </div>
                <div className="spatial-analytics__body">
                    <ActiveRouteSortableTable activeRoutes={activeRoutes} />
                </div>
                {this.state.isFetchingData && <Spinner />}
            </div>
        );
    }

}
