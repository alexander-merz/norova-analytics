import React, { ChangeEvent } from 'react';

import ActiveRoute from '../models/ActiveRoute';
import AnalyticsComponent, { AnalyticsComponentProps, AnalyticsComponentState } from '../models/AnalyticsComponent';
import ColorPicker from '../ColorPicker/ColorPicker';

import API from '../models/API';
import User from '../models/User';
import Route from '../models/Route';

import { getRandomColor } from '../utils/random.values';

import './UserAnalytics.css';
import { LatLng } from 'leaflet';

interface UserAnalyticsProps extends AnalyticsComponentProps {
    isComparable?: boolean;
    routeColor?: string;
    userToCompareTo?: User;
}

export interface UserAnalyticsState extends AnalyticsComponentState {
    users: User[],
    routes: Route[],
    routeColor: string,
    inCompareMode: boolean,
    currentUser: User | undefined,
}

export default class UserAnalytics
    extends AnalyticsComponent<UserAnalyticsProps, UserAnalyticsState> {

    style = this.props.parentAnalyticsComponent
        ? { width: '100%', margin: '0' }
        : { width: '80%', margin: '2rem auto 0 auto' }

    constructor(props: UserAnalyticsProps) {
        super(props);
        this.state = {
            users: [],
            routes: [],
            routeColor: props.routeColor || getRandomColor(),
            currentUser: undefined,
            inCompareMode: false,
            activeRoutes: [],
            isFetchingData: false
        };
    }

    async componentDidMount() {
        const users = this.idb ? await this.idb.getAllUsers() : await API.getUsers();
        this.setState(state => ({ ...state, users }));
    }

    async componentDidUpdate(prevProps: UserAnalyticsProps, prevState: UserAnalyticsState) {
        const { activeRoutes, currentUser, routeColor: color } = this.state;
        const { activeRoutes: prevActiveRoutes, currentUser: prevCurrentUser } = prevState;
        const activeRoutesChanged = activeRoutes.length !== prevActiveRoutes.length;
        const userChanged = currentUser?.getID() !== prevCurrentUser?.getID();
        if (currentUser && activeRoutesChanged) {
            prevCurrentUser && userChanged
                ? this.mapDrawer.removeLayersById(prevCurrentUser?.getID())
                : this.mapDrawer.removeLayersById(currentUser.getID());
            activeRoutes.forEach(async (activeRoute, index) => {
                const id = currentUser.getID();
                await this.mapDrawer.drawFromActiveRoute(activeRoute, id, color);
                if (index === activeRoutes.length - 1) {
                    const trackingData = activeRoute.getTrackingData();
                    const center = trackingData[Math.round(trackingData.length / 2)];
                    this.mapDrawer.panTo(new LatLng(center.getLatitude(), center.getLongitude()));
                }
            });
        }
    }

    componentWillUnmount() {
        this.mapDrawer.removeAllLayers();
    }

    async onUserChange(event: ChangeEvent<HTMLSelectElement>) {
        const userId = parseInt(event.target.value);
        const currentUser = this.state.users.find(user => user.getID() === userId);
        const routes = this.idb
            ? await this.idb.getRoutesByUserId(userId)
            : await API.getRoutesByUserId(userId);
        this.setState(state => ({ ...state, currentUser, routes, activeRoutes: [] }));
    }

    async onRouteChange(event: ChangeEvent<HTMLSelectElement>) {
        const routeId = parseInt(event.target.value);
        const route = this.state.routes.find(route => route.getID() === routeId);
        const trackingData = await API.getTrackingDataByRouteId(routeId);
        if (route && trackingData) {
            const activeRoute = new ActiveRoute(route, trackingData);
            const activeRoutes = [...this.state.activeRoutes, activeRoute];
            this.setState(state => ({ ...state, activeRoutes }));
        }
    }

    onCompareModeChange() {
        this.setState(state => ({ ...state, inCompareMode: !state.inCompareMode }));
    }

    onColorChange(event: ChangeEvent<HTMLInputElement>) {
        this.setState(state => ({ ...state, routeColor: event.target.value }));
    }

    onRemoveAllRoutes() {
        this.setState(state => ({
            ...state, activeRoutes: state.activeRoutes.filter(route => {
                return route.getUserId() !== this.state.currentUser?.getID();
            })
        }));
    }

    onRemoveLastRoute() {
        if (this.state.currentUser) {
            const userIds = this.state.activeRoutes.map(route => route.getUserId());
            const targetIndex = userIds.lastIndexOf(this.state.currentUser.getID());;
            this.setState(state => ({
                ...state, activeRoutes: state.activeRoutes.filter((route, index) => {
                    return index !== targetIndex;
                })
            }));
        }
    }

    render() {
        const { users, routes, activeRoutes } = this.state;
        const userOptions = users.map(user =>
            <option key={user.getID()} value={user.getID()}>
                {user.getUsername()}
            </option>
        )
        const routeOptions = routes.map(route =>
            <option key={route.getID()} value={route.getID()}>
                {route.getFormattedStartDateTime()}&nbsp;
                -&nbsp;{route.getFormattedEndDateTime()}
            </option>
        );
        return (
            <div className="user-analytics" style={this.style}>
                <div className="flex-row">
                    <select
                        name="user"
                        id="user"
                        defaultValue={0}
                        onChange={this.onUserChange.bind(this)}
                    >
                        <option key={0} value={0} disabled>Benutzer wählen</option>
                        {userOptions}
                    </select>
                </div>
                <div className="flex-row">
                    <select
                        name="route" id="route"
                        className="no-arrow"
                        defaultValue={0}
                        onChange={this.onRouteChange.bind(this)}
                        disabled={routes.length === 0}
                    >
                        <option key={0} value={0}>Route wählen</option>
                        {routeOptions}
                    </select>
                    <ColorPicker
                        id="color" color={this.state.routeColor}
                        disabled={routes.length === 0}
                        onColorChange={this.onColorChange.bind(this)}
                    ></ColorPicker>
                </div>
                <div className="flex-row">
                    <button
                        style={{ visibility: activeRoutes.length > 0 ? 'visible' : 'collapse' }}
                        disabled={activeRoutes.length === 0}
                        onClick={this.onRemoveLastRoute.bind(this)}
                    >Letzte Route entfernen</button>
                    <button
                        style={{ visibility: activeRoutes.length > 0 ? 'visible' : 'collapse' }}
                        disabled={activeRoutes.length === 0}
                        onClick={this.onRemoveAllRoutes.bind(this)}
                    >Alle Routen entfernen</button>
                    {
                        this.props.isComparable
                        &&
                        <div className="flex-row">
                            <input
                                type="checkbox"
                                name="compare"
                                id="compare"
                                onChange={this.onCompareModeChange.bind(this)}
                            />
                            <label>Vergleichen</label>
                        </div>
                    }
                </div>
                {
                    this.state.inCompareMode
                    &&
                    <UserAnalytics
                        userToCompareTo={this.state.currentUser}
                        parentAnalyticsComponent={this}
                    ></UserAnalytics>
                }
            </div>
        );
    }
}
