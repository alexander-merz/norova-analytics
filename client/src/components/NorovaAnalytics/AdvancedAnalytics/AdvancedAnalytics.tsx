import React from 'react';
import { LatLngBounds, LatLng, LatLngExpression } from 'leaflet';

import AnalyticsComponent, { AnalyticsComponentProps, AnalyticsComponentState } from '../models/AnalyticsComponent';
import SpatialAnalytics, { SpatialAnalyticsState, INITIAL_MAX_ROUTES } from '../SpatialAnalytics/SpatialAnalytics';
import Spinner from '../Spinner/Spinner';
import { HourState, INITIAL_FROM_HOUR, INITIAL_TO_HOUR, HourSelection } from '../TimeAnalytics/TimeAnalytics';
import WeekdayPicker, { Weekday, WeekdayPickerState, INITIAL_WEEKDAY } from '../WeekdayPicker/WeekdayPicker';

import API from '../models/API';
import ActiveRoute from '../models/ActiveRoute';
import TrackingData from '../models/TrackingData';

import './AdvancedAnalytics.css';
import RouteAnalytics, { RouteAnalyticsState } from '../RouteAnalytics/RouteAnalytics';

interface AdvancedAnalyticsState extends RouteAnalyticsState, WeekdayPickerState, HourState { }

export default class AdvancedAnalytics
    extends AnalyticsComponent<AnalyticsComponentProps, AdvancedAnalyticsState> {
    constructor(props: Readonly<AnalyticsComponentProps>) {
        super(props);
        this.state = {
            activeRoutes: [],
            isFetchingData: false,
            weekday: INITIAL_WEEKDAY,
            startHour: INITIAL_FROM_HOUR,
            endHour: INITIAL_TO_HOUR,
            route: [undefined, undefined],
        }
    }

    async componentDidUpdate(prevProps: AnalyticsComponentProps, prevState: AdvancedAnalyticsState) {
        const { route, activeRoutes, weekday, startHour, endHour } = this.state;
        const routeChanged = route[0] !== prevState.route[0] || route[1] !== prevState.route[1];
        const weekdayChanged = weekday.valueOf() !== prevState.weekday.valueOf();
        const hourChanged = startHour.valueOf() !== prevState.startHour.valueOf() ||
            endHour.valueOf() !== prevState.endHour.valueOf();

        if (activeRoutes !== prevState.activeRoutes) {
            for (const activeRoute of activeRoutes) {
                this.mapDrawer.drawFromActiveRoute(activeRoute);
            }
            return;
        }

        if (route[0] && route[1] && (routeChanged || weekdayChanged || hourChanged)) {
            this.mapDrawer.removePolylines();
            const activeRoutes: ActiveRoute[] = [];
            const trackingDataJSON = await API.getTrackingDataJSONByOriginAndDestinationAndDayOfWeek(
                {
                    minLat: route[0].getSouth(),
                    maxLat: route[0].getNorth(),
                    minLng: route[0].getWest(),
                    maxLng: route[0].getEast()
                },
                {
                    minLat: route[1].getSouth(),
                    maxLat: route[1].getNorth(),
                    minLng: route[1].getWest(),
                    maxLng: route[1].getEast()
                },
                weekday,
                startHour,
                endHour
            );
            const groupedTrackingDataJSON = TrackingData.JSON.groupByRoute(trackingDataJSON);
            for (const trackingDataJSON of groupedTrackingDataJSON) {
                const activeRoute = await ActiveRoute.from(trackingDataJSON);
                activeRoutes.push(activeRoute);
            }
            this.setState(state => ({ ...state, activeRoutes, isFetchingData: false }));
        }
    }

    onWeekdayChange(weekday: Weekday) {
        const isFetchingData = this.state.route.every(val => val !== undefined);
        this.setState(state => ({ ...state, weekday, isFetchingData }));
    }

    onHourChange(hourChange: { startHour: number, endHour: number }) {
        const isFetchingData = this.state.route.every(value => value !== undefined);
        this.setState(state => ({ ...state, ...hourChange, isFetchingData }));
    }

    onRouteDrawn(route: [LatLngBounds, LatLngBounds]) {
        this.setState(state => ({ ...state, route, isFetchingData: true }));
    }

    render() {
        return (
            <div className="advanced-analytics">
                <WeekdayPicker
                    primaryColor="#008b58"
                    secondaryColor="#008b58"
                    onWeekdayChange={this.onWeekdayChange.bind(this)}
                />
                <div className="flex-row">
                    <HourSelection
                        min={0}
                        max={24}
                        onHourChange={this.onHourChange.bind(this)}
                    />
                </div>
                <RouteAnalytics
                    activeRoutes={this.state.activeRoutes}
                    onRouteEnd={this.onRouteDrawn.bind(this)}
                />
                {this.state.isFetchingData && <Spinner />}
            </div>
        )
    }
}
