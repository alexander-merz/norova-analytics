import { openDB, DBSchema, IDBPDatabase } from 'idb';

import User, { UserJSON } from './User';
import Route, { RouteJSON } from './Route';

import API from '../models/API';

interface userDB extends DBSchema {
    users: {
        key: string;
        value: UserJSON;
    };
}

interface routeDB extends DBSchema {
    routes: {
        key: string;
        value: RouteJSON;
        indexes: { user: number };
    };
}

const { only } = IDBKeyRange;

export default class IDB {
    private static instance: IDB | null = null;
    private static userDB: IDBPDatabase<userDB> | null = null;
    private static routeDB: IDBPDatabase<routeDB> | null = null;

    private constructor() { }

    public static async init(): Promise<IDB> {
        if (IDB.instance !== null) {
            return IDB.instance;
        }
        IDB.userDB = await openDB<userDB>('Users', 1, {
            upgrade(database) {
                if (!database.objectStoreNames.contains('users')) {
                    database.createObjectStore('users', {
                        keyPath: 'id',
                    });
                }
            },
        });
        IDB.routeDB = await openDB<routeDB>('Routes', 1, {
            upgrade(database) {
                if (!database.objectStoreNames.contains('routes')) {
                    const routeStore = database.createObjectStore('routes', {
                        keyPath: 'id',
                    });
                    routeStore.createIndex('user', 'user');
                }
            },
        });
        const userRecords = await IDB.userDB.count('users');
        const routeRecords = await IDB.routeDB.count('routes');
        const users = await API.getUsersAsJSON();
        const routes = await API.getRoutesAsJSON();
        if (userRecords !== users.length) {
            try {
                await IDB.userDB.clear('users');
                const tx = IDB.userDB.transaction('users', 'readwrite');
                for (const user of users) {
                    tx.store.add(user);
                }
                await tx.done;
                console.log('USERS SAVED');
            } catch (error) {
                console.log('USERS ABORTED');
            }
        }
        if (routeRecords !== routes.length) {
            try {
                await IDB.routeDB.clear('routes');
                const tx = IDB.routeDB.transaction('routes', 'readwrite');
                for (const route of routes) {
                    tx.store.add(route);
                }
                await tx.done;
                console.log('ROUTES SAVED');
            } catch (error) {
                console.log('ABORTED');
            }
        }
        IDB.instance = new IDB();
        return IDB.instance;
    }

    public static getInstance(): IDB | null {
        if (IDB.instance === null) return null;
        else return IDB.instance;
    }

    public async getAllUsers() {
        const userJSONArray = (await IDB.userDB?.getAll('users')) || [];
        return User.Array.from(userJSONArray);
    }

    public async getUserByUserId(userId: number) {
        const userJSON = await IDB.userDB?.get('users', only(userId));
        if (!userJSON) throw Error('No matching user id');
        return new User(userJSON);
    }

    public async getAllRoutes() {
        const routeJSONArray = (await IDB.routeDB?.getAll('routes')) || [];
        return Route.Array.from(routeJSONArray)
    }

    public async getRoutesByUserId(userId: number) {
        const routeJSONArray = await IDB.routeDB?.getAllFromIndex('routes', 'user', userId) || [];
        return Route.Array.from(routeJSONArray);
    }

    public async getRouteByRouteId(routeId: number) {
        const routeJSON = await IDB.routeDB?.get('routes', only(routeId));
        if (!routeJSON) throw Error('No matching route id');
        return new Route(routeJSON);
    }

}
