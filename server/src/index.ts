import http from 'http';
import dotenv from 'dotenv';
import MySQLService from './services/MySQLService';
import { SQL_STATEMENTS } from './utils/sql.injection';
import { UrlDispatcher } from './services/UrlDisptacher';

dotenv.config();

try{
    new MySQLService().init();
} catch (error) {
    console.error(error);
    process.exit(1);
}

http.createServer(async (req, res) => {

    if (req.url && req.method && req.url.includes('api')) {

        if (SQL_STATEMENTS.some(sql => req.url?.includes(sql))) res.end();
        const { endpoint, method, query } = UrlDispatcher.dispatch(req.url);

        let result;
        try {
            const endpointHandler = new (await import(`.${endpoint}`)).default();
            result = await endpointHandler[method](query);
        } catch (error) {
            console.log(error);
        } finally {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(result || []));
        }

    } else res.end();

}).listen(process.env.PORT || 8080);
