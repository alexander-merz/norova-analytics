import React from 'react'
import SortableTable, { TableStructure } from '../SortableTable/SortableTable';
import ActiveRoute from '../models/ActiveRoute';
import MapDrawer from '../models/MapDrawer';

interface ActiveRouteSortableTableProps {
    activeRoutes: ActiveRoute[];
}

const getAverageDistance = (activeRoutes: ActiveRoute[]): string => {
    if (activeRoutes.length === 0) return '0';
    const routeDistances = activeRoutes.map(route => route.getTotalDistanceInKilometers());
    const totalDistance = routeDistances.reduce((acc, cur) => acc += cur);
    const averageDistance = totalDistance / activeRoutes.length;
    return averageDistance.toFixed(0);
}

const getAverageTravelTime = (activeRoutes: ActiveRoute[]): string => {
    if (activeRoutes.length === 0) return '00:00';
    const routeTravelTimes = activeRoutes.map(route => route.getTravelTimeInMinutes());
    const totalTravelTime = routeTravelTimes.reduce((acc, cur) => acc += cur);
    const averageTravelTime = totalTravelTime / activeRoutes.length;
    return averageTravelTime.toFixed(0);
}

const getAverageSpeed = (activeRoutes: ActiveRoute[]): string => {
    if (activeRoutes.length === 0) return '0';
    const routeSpeeds = activeRoutes.map(route => route.getKilometersPerHour());
    const totalSpeed = routeSpeeds.reduce((acc, cur) => acc += cur);
    const averageSpeed = totalSpeed / activeRoutes.length;
    return averageSpeed.toFixed(0);
}


const ActiveRouteSortableTable = (props: ActiveRouteSortableTableProps) => {
    const { activeRoutes } = props;
    const contentThead = ['route','date', 'distance', 'start time', 'end time', 'travel time', 'avg speed', 'user'];
    const onTBodyClick = (cell: HTMLTableCellElement) => {
        const row = cell.parentElement as HTMLTableRowElement;
        if (row.dataset.id) {
            MapDrawer.getInstance().highlight(parseInt(row.dataset.id));
        }
    }
    const contentTbody = activeRoutes.map(activeRoute => {
        return {
            key: activeRoute.getID(),
            td: [
                {
                    value: activeRoute.getID(),
                    text: `${activeRoute.getID()}`
                },
                {
                    value: activeRoute.getDateInMilliseconds(),
                    text: `${activeRoute.getFormattedDate('DD.MM.YYYY')}`
                },
                {
                    value: activeRoute.getTotalDistanceInKilometers(),
                    text: `${activeRoute.getTotalDistanceInKilometers()} km`
                },
                {
                    value: activeRoute.getFormattedStartTime(),
                    text: `${activeRoute.getFormattedStartTime()}`
                },
                {
                    value: activeRoute.getFormattedEndTime(),
                    text: `${activeRoute.getFormattedEndTime()}`
                },
                {
                    value: activeRoute.getTravelTimeInMilliseconds(),
                    text: `${activeRoute.getFormattedTravelTime()} min`
                },
                {
                    value: activeRoute.getKilometersPerHour(),
                    text: `${activeRoute.getKilometersPerHour()} km/h`
                },
                {
                    value: activeRoute.getUserId(),
                    text: `${activeRoute.getUserId()}`
                },
            ]
        };
    });
    const contentStructure: TableStructure = { thead: contentThead, tbody: contentTbody };
    const averageThead = ['avg distance', 'avg travel time', 'avg speed'];
    const averageTbody = [{
        key: 1,
        td: [
            { text: `${getAverageDistance(activeRoutes)} km` },
            { text: `${getAverageTravelTime(activeRoutes)} min` },
            { text: `${getAverageSpeed(activeRoutes)} km/h` },
        ]
    }];
    const averageStructure: TableStructure = { thead: averageThead, tbody: averageTbody };

    return (
        <div>
            {
                props.activeRoutes.length > 0
                &&
                <div>
                    <h1 style={{ textAlign: "center" }}>
                        {activeRoutes.length} Routen gefunden
                    </h1>
                    <SortableTable
                        tableStructure={averageStructure}
                    />
                </div>
            }
            <SortableTable
                tableStructure={contentStructure}
                onTBodyClick={onTBodyClick}
            />
        </div>
    );
}

export default ActiveRouteSortableTable;
