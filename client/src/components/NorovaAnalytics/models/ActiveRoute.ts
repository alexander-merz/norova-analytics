import Route from './Route';
import TrackingData, { TrackingDataJSON } from './TrackingData';
import User from './User';
import API from './API';
import IDB from './IDB';

export default class ActiveRoute extends Route {
    private trackingData: TrackingData[];

    constructor(route: Route, trackingData: TrackingData[]) {
        super(route);
        this.trackingData = trackingData;
    }

    public getTrackingData() {
        return this.trackingData;
    }

    public getMaxSpeed() {
        return Math.max(
            ...this.getTrackingData().map((data) =>
                Math.floor(data.getSpeed() * 3.6)
            )
        );
    }

    public getUserId(): number {
        return this.getTrackingData()[0].getUserId();
    }

    public async getUser(): Promise<User> {
        const userId = this.getUserId();
        const idb = IDB.getInstance();
        let user: User;
        if (idb) {
            user = await idb.getUserByUserId(userId);
            if (!user) throw Error('No user found for given user id');
            return user;
        }
        return await API.getUserById(userId);
    }

    public static async from(trackingDataJSONArray: TrackingDataJSON[]): Promise<ActiveRoute> {
        const trackingData = trackingDataJSONArray.map(json => new TrackingData(json))
        const route = await IDB.getInstance()?.getRouteByRouteId(trackingData[0].getRouteId());
        if (!route) throw Error('No route found for given route id');
        return new ActiveRoute(route, trackingData);
    }
}
