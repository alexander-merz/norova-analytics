export function groupBy(array: any[], property: string): object {
    return array.reduce(function (rv, x) {
        (rv[x[property]] = rv[x[property]] || []).push(x);
        return rv;
    }, {});
}
