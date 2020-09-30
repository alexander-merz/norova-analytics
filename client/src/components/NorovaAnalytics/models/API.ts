import Axios from 'axios';

import User, { UserJSON } from './User';
import Route, { RouteJSON } from './Route';
import TrackingData, { TrackingDataJSON } from './TrackingData';

import { Weekday } from '../WeekdayPicker/WeekdayPicker';

declare type DateInput = {
    year: number;
    month: number;
    day: number;
    startHour?: number;
    endHour?: number;
};

declare type PeriodInput = {
    startYear: number;
    startMonth: number;
    startDay: number;
    endYear: number;
    endMonth: number;
    endDay: number;
}

declare type LatLngInterval = {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
};

export default class API {

    private static readonly UTIL = {
        parametersToQueryString: (parameter: any[]) => {
            return `?${parameter.map(([key, value]) => `${key}=${value}`).join('&')}`;
        }
    }

    private static readonly BASE_URL = 'http://localhost:8080';

    private static readonly ENDPOINTS = {
        USERS: `${API.BASE_URL}/api/user`,
        USER_ROUTES: `${API.BASE_URL}/api/user_route`,
        TRACKING_DATA: `${API.BASE_URL}/api/tracking_data`,
    };

    private static readonly URLS = {
        countUsers: `${API.ENDPOINTS.USERS}/count`,
        countRoutes: `${API.ENDPOINTS.USER_ROUTES}/count`,
        countTrackingData: `${API.ENDPOINTS.TRACKING_DATA}/count`,
        getUsers: `${API.ENDPOINTS.USERS}/get`,
        getRoutes: `${API.ENDPOINTS.USER_ROUTES}/get`,
        getTrackingData: `${API.ENDPOINTS.TRACKING_DATA}/get`,
        getUserById: (id: number) => `${API.ENDPOINTS.USERS}/get?id=${id}`,
        getRoutesByUserId: (id: number) => `${API.ENDPOINTS.USER_ROUTES}/get?user=${id}`,
        getTrackingDataByRouteId: (id: number) => {
            return `${API.ENDPOINTS.TRACKING_DATA}/get?route=${id}`;
        },
        getTrackingDataJSONByDate: (dateInput: DateInput) => {
            const endpoint = `${API.ENDPOINTS.TRACKING_DATA}/getByDate`;
            const query = API.UTIL.parametersToQueryString(Object.entries(dateInput));
            return endpoint.concat(query);
        },
        getTrackingDataJSONByPeriod: (periodInput: PeriodInput) => {
            const endpoint = `${API.ENDPOINTS.TRACKING_DATA}/getByPeriod`;
            const query = API.UTIL.parametersToQueryString(Object.entries(periodInput));
            return endpoint.concat(query);
        },
        getTrackingDataJSONWithinLatLngInterval: (interval: LatLngInterval) => {
            const endpoint = `${API.ENDPOINTS.TRACKING_DATA}/getByLatLngInterval`;
            const query = API.UTIL.parametersToQueryString(Object.entries(interval));
            return endpoint.concat(query);
        },
        getTrackingDataJSONByDayOfWeek: (weekday: Weekday) => {
            return `${API.ENDPOINTS.TRACKING_DATA}/getByDayOfWeek?weekday=${weekday}`;
        },
        getTrackingDataJSONByLatLngIntervalAndDayOfWeek: (
            interval: LatLngInterval, weekday: Weekday, startHour: number, endHour: number
        ) => {
            const parameters = { ...interval, weekday, startHour, endHour };
            const endpoint = `${API.ENDPOINTS.TRACKING_DATA}/getByLatLngIntervalAndDayOfWeek`;
            const query = API.UTIL.parametersToQueryString(Object.entries(parameters));
            return endpoint.concat(query);
        },
        getTrackingDataJSONByOriginAndDestination: (start: LatLngInterval, end: LatLngInterval) => {
            const parameters = {
                startMinLat: start.minLat,
                startMinLng: start.minLng,
                startMaxLat: start.maxLat,
                startMaxLng: start.maxLng,
                endMinLat: end.minLat,
                endMinLng: end.minLng,
                endMaxLat: end.maxLat,
                endMaxLng: end.maxLng
            };
            const endpoint = `${API.ENDPOINTS.TRACKING_DATA}/getByOriginAndDestination`;
            const query = API.UTIL.parametersToQueryString(Object.entries(parameters));
            return endpoint.concat(query);
        },
        getTrackingDataJSONByOriginAndDestinationAndDayOfWeek: (
            start: LatLngInterval, end: LatLngInterval, weekday: Weekday, startHour: number, endHour: number
        ) => {
            const parameters = {
                startMinLat: start.minLat,
                startMinLng: start.minLng,
                startMaxLat: start.maxLat,
                startMaxLng: start.maxLng,
                endMinLat: end.minLat,
                endMinLng: end.minLng,
                endMaxLat: end.maxLat,
                endMaxLng: end.maxLng,
                weekday,
                startHour,
                endHour
            };
            const endpoint = `${API.ENDPOINTS.TRACKING_DATA}/getByOriginAndDestinationAndDayOfWeek`;
            const query = API.UTIL.parametersToQueryString(Object.entries(parameters));
            return endpoint.concat(query);
        }
    };

    public static async getUsers() {
        const userJSONArray = await API.fetch<UserJSON[]>(API.URLS.getUsers);
        return User.Array.from(userJSONArray);
    }

    public static async getUsersAsJSON() {
        return await API.fetch<UserJSON[]>(API.URLS.getUsers);
    }

    public static async getUserById(id: number) {
        const url = API.URLS.getUserById(id);
        const userJSONArray = await API.fetch<UserJSON[]>(url);
        return User.Array.from(userJSONArray)[0];
    }

    public static async getRoutes() {
        const routeJSONArray = await API.fetch<RouteJSON[]>(API.URLS.getRoutes);
        return Route.Array.from(routeJSONArray);
    }

    public static async getRoutesAsJSON() {
        return await API.fetch<RouteJSON[]>(API.URLS.getRoutes);
    }

    public static async getRoutesByUserId(userId: number) {
        const url = API.URLS.getRoutesByUserId(userId);
        const routeJSONArray = await API.fetch<RouteJSON[]>(url);
        return Route.Array.from(routeJSONArray);
    }

    public static async getTrackingDataByRouteId(routeId: number) {
        const url = API.URLS.getTrackingDataByRouteId(routeId);
        const trackingDataJSONArray = await API.fetch<TrackingDataJSON[]>(url);
        return TrackingData.Array.from(trackingDataJSONArray);
    }

    public static async getTrackingDataJSONByDate(dateInput: DateInput) {
        return await API.fetch<TrackingDataJSON[]>(
            API.URLS.getTrackingDataJSONByDate(dateInput)
        );
    }

    public static async getTrackingDataJSONByPeriod(periodInput: PeriodInput) {
        return await API.fetch<TrackingDataJSON[]>(
            API.URLS.getTrackingDataJSONByPeriod(periodInput)
        );
    }

    public static async getTrackingDataJSONWithinLatLngInterval(interval: LatLngInterval) {
        return await API.fetch<TrackingDataJSON[]>(
            API.URLS.getTrackingDataJSONWithinLatLngInterval(interval)
        );
    }

    public static async getTrackingDataJSONByDayOfWeek(weekday: Weekday) {
        return await API.fetch<TrackingDataJSON[]>(
            API.URLS.getTrackingDataJSONByDayOfWeek(weekday)
        );
    }

    public static async getTrackingDataJSONByLatLngIntervalAndDayOfWeek(
        interval: LatLngInterval,
        weekday: Weekday,
        startHour: number,
        endHour: number
    ) {
        return await API.fetch<TrackingDataJSON[]>(
            API.URLS.getTrackingDataJSONByLatLngIntervalAndDayOfWeek(
                interval,
                weekday,
                startHour,
                endHour
            )
        );
    }

    public static async getTrackingDataJSONByOriginAndDestination(start: LatLngInterval, end: LatLngInterval) {
        return await API.fetch<TrackingDataJSON[]>(
            API.URLS.getTrackingDataJSONByOriginAndDestination(start, end)
        );
    }

    public static async getTrackingDataJSONByOriginAndDestinationAndDayOfWeek(
        start: LatLngInterval,
        end: LatLngInterval,
        weekday: Weekday,
        startHour: number,
        endHour: number
    ) {
        return await API.fetch<TrackingDataJSON[]>(
            API.URLS.getTrackingDataJSONByOriginAndDestinationAndDayOfWeek(
                start,
                end,
                weekday,
                startHour,
                endHour
            )
        );
    }

    private static async fetch<T>(url: string): Promise<T> {
        return (await Axios.get<T>(url)).data;
    }
}
