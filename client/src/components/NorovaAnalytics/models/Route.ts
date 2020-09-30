import moment from 'moment';

export type RouteJSON = {
    id: number;
    start_point: number;
    end_point: number;
    start_time: string;
    end_time: string;
    distance: number;
};

export default class Route {
    private id: number;
    private distance: number;
    private start_point: number;
    private end_point: number;
    private start_time: string;
    private end_time: string;

    public static Array = {
        from: function (routeJSONArray: RouteJSON[]): Route[] {
            let routeArray: Route[] = [];
            for (const routeJSON of routeJSONArray) {
                routeArray.push(new Route(routeJSON));
            }
            return routeArray;
        },
    };

    constructor(data: RouteJSON | Route) {
        if (data instanceof Route) {
            this.id = data.getID();
            this.distance = data.getDistance();
            this.start_point = data.getStartPoint();
            this.end_point = data.getEndpoint();
            this.start_time = data.getStartTime();
            this.end_time = data.getEndTime();
        } else {
            this.id = data.id;
            this.distance = data.distance;
            this.start_point = data.start_point;
            this.end_point = data.end_point;
            this.start_time = data.start_time;
            this.end_time = data.end_time;
        }
    }

    public getID() {
        return this.id;
    }

    public getDistance(): number {
        return this.distance;
    }

    public getTotalDistanceInKilometers(): number {
        return parseInt((Math.floor(this.getDistance()) / 1000).toFixed(2));
    }

    public getStartPoint(): number {
        return this.start_point;
    }

    public getEndpoint(): number {
        return this.end_point;
    }

    public getStartTime(): string {
        return this.start_time;
    }

    public getFormattedStartTime(): string {
        return moment(this.getStartTime()).format('HH:mm');
    }

    public getStartTimeInMinutes(): number {
        const format = moment(this.getStartTime()).format('HH:mm');
        const [hours, minutes] = format.split(':');
        return (parseInt(hours) * 60) + parseInt(minutes);
    }

    public getEndTime(): string {
        return this.end_time;
    }

    public getFormattedEndTime(): string {
        return moment(this.getEndTime()).format('HH:mm');
    }

    public getFormattedDate(format: string): string {
        return moment(this.getStartTime()).format(format);
    }

    public getDateInMilliseconds(): number {
        return moment(this.getStartTime()).toDate().getTime();
    }

    public getFormattedStartDateTime(): string {
        return moment(this.getStartTime()).format('DD.MM.YYYY HH:mm');
    }

    public getFormattedEndDateTime(): string {
        return moment(this.getEndTime()).format('DD.MM.YYYY HH:mm');
    }

    public getFormattedTravelTime(): number {
        return moment(this.getEndTime()).diff(
            moment(this.getStartTime()),
            'minutes'
        );
    }

    public getTravelTimeInMilliseconds(): number {
        return (
            moment(this.getEndTime()).toDate().valueOf() -
            moment(this.getStartTime()).toDate().valueOf()
        );
    }

    public getTravelTimeInMinutes(): number {
        return Math.floor(this.getTravelTimeInMilliseconds() / 1000 / 60);
    }

    public getKilometersPerHour(): number {
        const kilometers = this.getTotalDistanceInKilometers();
        const hour = this.getTravelTimeInMinutes() / 60;
        return Math.round(kilometers / hour);
    }
}
