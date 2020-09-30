import mysql from 'mysql';
import MySQL from '../models/MySQL';

type MySQLConnectionData = {
    host?: string;
    user?: string;
    password?: string;
    database?: string;
};

export default class MySQLService extends MySQL {
    constructor({ host, user, password, database }: MySQLConnectionData = {}) {
        super();
        this.host = host || process.env.SQL_HOST || '127.0.0.1';
        this.user = user || process.env.SQL_USER || 'root';
        this.password = password || process.env.SQL_PASSWORD || 'root';
        this.database = database || process.env.SQL_DATABASE || '';
    }

    init(cb?: Function) {
        if (MySQLService.connection !== undefined) throw Error('Already connected');
        MySQLService.connection = mysql.createConnection({
            host: this.host,
            user: this.user,
            password: this.password,
            database: this.database,
        });
        MySQLService.connection.connect((error) => {
            if (error) throw error;
            else {
                console.log('Connected to ', this.database);
                if (cb) cb(MySQLService.connection);
            }
        });
    }

    static get(table_name: string): any {
        MySQLService.current.table = table_name;
        return this;
    }

    static where(conditions: any = {}): any {
        if (MySQLService.connection && MySQLService.current.table) {
            MySQLService.current.query = `select * from ${MySQLService.current.table}`;
            Object.keys(conditions).forEach((key, index) => {
                const condition = conditions[key] == 'not null'
                    ? `${key} is not null`
                    : `${key}="${conditions[key]}"`;
                MySQLService.current.query += index === 0 
                    ? ` where ${condition}`
                    : ` and ${condition}`;
            });
            return this;
        } else throw Error('Error while the concatination of conditions');
    }

    static limit(limit = 100): any {
        if (!MySQLService.connection) throw Error('No Connection');
        if (!MySQLService.current.table || !MySQLService.current.query)
            throw Error('Invalid order of method incovation');
        MySQLService.current.query += ` limit ${limit}`;
        return this;
    }

    static execute(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (Object.values(MySQLService.current).every(val => val != undefined)) {
                MySQLService.current.query += ';';
                MySQLService.connection.query(
                    MySQLService.current.query,
                    (error, result) => {
                        if (error) {
                            console.error(error);
                            reject(error);
                        } else {
                            MySQLService.current.reset();
                            resolve(result);
                        }
                    }
                );
            }
        });
    }

    static async query(query: string): Promise<any> {
        return new Promise((resolve, reject) => {
            MySQLService.connection.query(query, (error, result) => {
                if (error) {
                    console.log(error);
                    reject(error);
                } else resolve(result);
            });
        });
    }
}
