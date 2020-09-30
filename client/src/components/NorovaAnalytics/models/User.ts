export type UserJSON = {
    id: number;
    username: string;
    token: string;
    type: string;
    total_time: number;
    total_distance: number;
};

export default class User {
    private id: number;
    private username: string;
    private token: string;
    private type: string;
    private total_time: number;
    private total_distance: number;

    public static Array = {
        from: function (userJSONArray: UserJSON[]): User[] {
            let userArray: User[] = [];
            for (const userJSON of userJSONArray) {
                userArray.push(new User(userJSON));
            }
            return userArray;
        },
    };

    constructor(data: UserJSON) {
        this.id = data.id;
        this.username = data.username;
        this.token = data.token;
        this.type = data.type;
        this.total_time = data.total_time;
        this.total_distance = data.total_distance;
    }

    public getID() {
        return this.id;
    }

    public getUsername() {
        return this.username;
    }

    public getToken() {
        return this.token;
    }

    public getType() {
        return this.type;
    }

    public getTotalDistance() {
        return this.total_distance;
    }

    public getTotalTime() {
        return this.total_time;
    }
}
