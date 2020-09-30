import { groupBy } from "../utils/array.utils";
import ActiveRoute from "./ActiveRoute";
import IDB from "./IDB";
import Route from "./Route";

export type TrackingDataJSON = {
    id: number;
    speed: number;
    timestamp: string;
    route: number;
    lat: number;
    lng: number;
    user: number;
};

export default class TrackingData {
    private id: number;
    private speed: number;
    private timestamp: string;
    private route: number;
    private lat: number;
    private lng: number;
    private user: number;

    public static Array = {
        from: function (trackingDataJSONArray: TrackingDataJSON[]): TrackingData[] {
            let trackingDataArray: TrackingData[] = [];
            for (const trackingDataJSON of trackingDataJSONArray) {
                trackingDataArray.push(new TrackingData(trackingDataJSON));
            }
            return trackingDataArray;
        }
    }

    public static JSON = {
        groupByRoute: function (data: TrackingDataJSON[]): TrackingDataJSON[][] {
            return Object.values(groupBy(data, 'route'))
                .map(route => { return route.length >= 10 ? route : undefined })
                .filter(value => value !== undefined)
                .sort((a, b) => a.timestamp - b.timestamp);
        } 
    }

    constructor(data: TrackingDataJSON) {
        this.id = data.id;
        this.speed = data.speed;
        this.timestamp = data.timestamp;
        this.route = data.route;
        this.lat = data.lat;
        this.lng = data.lng;
        this.user = data.user;
    }

    public getID() {
        return this.id;
    }

    public getSpeed() {
        return this.speed;
    }

    public getTimestamp() {
        return this.timestamp;
    }

    public getRouteId() {
        return this.route;
    }

    public getLatitude() {
        return this.lat;
    }

    public getLongitude() {
        return this.lng;
    }

    public getUserId() {
        return this.user;
    }

    public static async getActiveRoutesFromTrackingDataJSONMatrix(matrix: TrackingDataJSON[][]): Promise<ActiveRoute[]> {
        const idbRoutes = await IDB.getInstance()?.getAllRoutes() || [];
        const activeRoutes: ActiveRoute[] = [];
        matrix.forEach(trackingDataJSONArray => {
            const routeJSON = idbRoutes?.find(route => {
                return route.getID() === trackingDataJSONArray[0].route;
            });
            const trackingData = trackingDataJSONArray.map(data => new TrackingData(data));
            if (routeJSON && trackingData) {
                activeRoutes.push(new ActiveRoute(new Route(routeJSON), trackingData));
            }
        });
        return activeRoutes;
    }

    public static async mapTrackingDataJSONToTrackingData(matrix: TrackingDataJSON[][]): Promise<TrackingData[][]> {
        return matrix.map(array => array.map(data => new TrackingData(data)));
    }
}
