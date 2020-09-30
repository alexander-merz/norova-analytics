import mysql from 'mysql';
export default abstract class MySQL {
    constructor() {}
    protected static connection: mysql.Connection;
    protected static current: any = {
        table: null,
        query: null,
        reset: function () {
            this.table = null;
            this.query = null;
        },
    };
    protected host: string = process.env.SQL_HOST || '127.0.0.1';
    protected user: string = process.env.SQL_USER || 'root';
    protected password: string = process.env.SQL_PASSWORD || '';
    protected database: string = process.env.SQL_DATABASE || '';
}
