import MySQLService from '../services/MySQLService';
import { objectFromEntries } from '../utils/object.utils';

export default abstract class ApiEndpoint {
    private property_map: Readonly<Map<string, string>>;

    constructor() {
        this.property_map = new Map();
    }

    protected setPropertyMap(newPropertyMap: Readonly<Map<string, string>>) {
        this.property_map = newPropertyMap;
    }

    protected getConditions(query?: string, lookup = true): any {
        let conditions: any = {};
        if (query) {
            query.split('&').forEach((parameter) => {
                let property: string, value: string | number;
                [property, value] = parameter.split('=');
                if (lookup) {
                    if (this.property_map.has(property)) {
                        value = isNaN(parseInt(value)) ? value : parseInt(value);
                        const sql_property = this.property_map.get(property);
                        if (sql_property) conditions[sql_property] = value;
                    }
                } else {
                    conditions[property] = value;
                }
            });
        }
        return conditions;
    }

    async get(url_query: string = ''): Promise<any> {
        const result = await MySQLService
            .get(this.toString())
            .where(this.getConditions(url_query))
            .execute()
        return this.map(result);
    }

    protected map(query_result: any[]): any[] {
        return query_result.map((row_data_packet: any) => {
            return objectFromEntries(Object.entries(row_data_packet).map(([dataKey, dataValue]) => {
                const entries = Array.from(this.property_map.entries());
                const index = entries.findIndex(([mapKey, mapValue]) => dataKey === mapValue);
                const mappedKey = Array.from(this.property_map.keys())[index];
                return [mappedKey, dataValue];
            }));
        }).map((row_data_packet: any) => {
            Object.keys(row_data_packet).forEach((key) => {
                return key === 'undefined' && delete row_data_packet[key];
            });
            return row_data_packet;
        });
    }
}
