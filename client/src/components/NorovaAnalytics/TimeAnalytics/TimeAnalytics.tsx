import React, { useState } from 'react';
import DatePicker from 'react-datepicker';

import AnalyticsComponent, { AnalyticsComponentProps, AnalyticsComponentState } from '../models/AnalyticsComponent';
import Spinner from '../Spinner/Spinner';

import API from '../models/API';
import ActiveRoute from '../models/ActiveRoute';
import TrackingData, { TrackingDataJSON } from '../models/TrackingData';

import './TimeAnalytics.css';
import ActiveRouteSortableTable from '../ActiveRouteSortableTable/ActiveRouteSortableTable';

interface TimeAnalyticsProps extends AnalyticsComponentProps {
    hasPeriodMode: boolean;
    date?: Date;
    isPeriodEnd?: boolean;
    minDate?: Date;
    maxDate?: Date;
    minHour?: number;
    onDateChange?: (state: TimeAnalyticsState) => void;
}

export interface TimeAnalyticsState extends AnalyticsComponentState, HourState, DateState {
    inPeriodMode: boolean;
}

export interface DateState {
    date: Date;
    minDate?: Date;
    maxDate?: Date;
}

export interface HourState {
    startHour: number;
    endHour: number;
    minHour?: number;
}

export interface HourSelectionProps {
    min: number;
    max: number;
    disabled?: boolean | undefined;
    onHourChange: (state: { startHour: number, endHour: number }) => void;
    initialStartValue?: number;
    initialEndValue?: number;
}

export const INITIAL_FROM_HOUR = 0;
export const INITIAL_TO_HOUR = 24;

export const HourSelection = (props: HourSelectionProps) => {
    const [startHour, setStartHour] = useState<number>(props.initialStartValue || 0);
    const [endHour, setEndHour] = useState<number>(props.initialEndValue || 24);
    const onHourChange = (event: React.MouseEvent<HTMLInputElement>) => {
        const { id, value } = event.target as HTMLInputElement;
        const hour = parseInt(value);
        if (id === 'start') {
            setStartHour(hour);
            props.onHourChange({ startHour: hour, endHour });
        }
        if (id === 'end') {
            setEndHour(hour);
            props.onHourChange({ startHour, endHour: hour });
        }
    }
    return (
        <div className="hour-selection">
            <label>Von </label>
            <input
                type="range"
                name="hour" id="start"
                className="no-arrow"
                defaultValue={startHour}
                min={props.min}
                max={endHour - 1}
                disabled={props.disabled || false}
                onMouseUp={onHourChange}
            />
            <label>{startHour}</label>
            <label> bis </label>
            <input
                type="range"
                name="hour" id="end"
                className="no-arrow"
                defaultValue={endHour}
                min={startHour + 1}
                max={props.max}
                disabled={props.disabled || false}
                onMouseUp={onHourChange}
            />
            <label>{endHour}</label>
            <label> Uhr</label>
        </div>
    );
}

export default class TimeAnalytics extends AnalyticsComponent<TimeAnalyticsProps, TimeAnalyticsState> {

    childAnalyticsComponent: React.RefObject<TimeAnalytics> = React.createRef();

    constructor(props: Readonly<TimeAnalyticsProps>) {
        super(props);
        this.state = {
            date: this.props.date || this.props.minDate || new Date(),
            startHour: INITIAL_FROM_HOUR,
            endHour: INITIAL_TO_HOUR,
            activeRoutes: [],
            inPeriodMode: false,
            maxDate: this.props.maxDate || new Date(),
            minDate: this.props.minDate,
            minHour: this.props.minHour,
            isFetchingData: false
        };
    }

    async componentDidUpdate(prevProps: TimeAnalyticsProps, prevState: TimeAnalyticsState) {
        const { isPeriodEnd, onDateChange } = this.props;
        const { activeRoutes, date, minDate, startHour, endHour, inPeriodMode } = this.state;
        const [year, month, day] = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
        let trackingDataJSON: TrackingDataJSON[] = [];

        if (activeRoutes.length !== 0 && activeRoutes !== prevState.activeRoutes) {
            this.mapDrawer.removeAllLayers();
            for (const activeRoute of activeRoutes) {
                this.mapDrawer.drawFromActiveRoute(activeRoute);
            }
            return;
        }

        if (isPeriodEnd && date.getTime() !== prevState.date.getTime() && onDateChange) {
            onDateChange(this.state);
        }

        if (!this.state.isFetchingData) return;

        if (
            date.getTime() !== prevState.date.getTime() ||
            startHour !== prevState.endHour ||
            endHour !== prevState.startHour
        ) {

            if (isPeriodEnd) {

                if (minDate !== undefined && this.state.minHour !== undefined) {
                    const start = {
                        startYear: minDate.getFullYear(),
                        startMonth: minDate.getMonth() + 1,
                        startDay: minDate.getDate()
                    };
                    const end = { endYear: year, endMonth: month, endDay: day };
                    trackingDataJSON = await API.getTrackingDataJSONByPeriod({ ...start, ...end });
                }

            } else if (this.childAnalyticsComponent.current && inPeriodMode) {

                const childState = this.childAnalyticsComponent.current.state;
                const start = { startYear: year, startMonth: month, startDay: day };
                const end = {
                    endYear: childState.date.getFullYear(),
                    endMonth: childState.date.getMonth() + 1,
                    endDay: childState.date.getDate()
                };
                trackingDataJSON = await API.getTrackingDataJSONByPeriod({ ...start, ...end });

            } else {

                trackingDataJSON = await API.getTrackingDataJSONByDate(
                    { year, month, day, startHour, endHour }
                );

            }
            console.log(trackingDataJSON.length);
            if (trackingDataJSON.length === 0) {
                this.setState(state => ({ ...state, isFetchingData: false }));
            }
            const activeRoutes: ActiveRoute[] = [];
            const groupedTrackingDataJSON = TrackingData.JSON.groupByRoute(trackingDataJSON);
            for (const trackingDataJSON of groupedTrackingDataJSON) {
                const activeRoute = await ActiveRoute.from(trackingDataJSON)
                activeRoutes.push(activeRoute);
            }
            console.log(activeRoutes);
            this.setState(state => ({ ...state, activeRoutes, isFetchingData: false }));
        }
    }

    componentWillReceiveProps(nextProps: Readonly<TimeAnalyticsProps>) {
        const { minDate, minHour, activeRoutes } = this.state;
        if (activeRoutes.length !== nextProps.activeRoutes?.length) {
            this.setState(state => ({ ...state, activeRoutes: nextProps.activeRoutes || state.activeRoutes }));
            return;
        }
        if (minDate && minDate?.getTime() !== nextProps.minDate?.getTime()) {
            this.setState(state => ({ ...state, minDate: nextProps.minDate }));
        }
        if (minHour && minHour !== nextProps.minHour) {
            this.setState(state => ({ ...state, minHour: nextProps.minHour }));
        }
    }

    componentWillUnmount() {
        if (this.props.hasPeriodMode) this.mapDrawer.removeAllLayers();
    }

    onDateChange(date: Date | null) {
        if (date === null) return;
        const { isPeriodEnd, minDate } = this.props;
        if (this.childAnalyticsComponent.current) {
            const { minDate } = this.childAnalyticsComponent.current.props;
            if (minDate && date.getTime() > minDate?.getTime()) return;
        }
        if (isPeriodEnd && minDate && date.getTime() <= minDate.getTime()) return;
        this.setState(state => ({ ...state, date, isFetchingData: true }));
    }

    onChildDateChange({ date }: TimeAnalyticsState) {
        this.setState(state => ({ ...state, maxDate: date }));
    }

    onHourChange(hourChange: { startHour: number, endHour: number }) {
        console.log(hourChange);
        this.setState(state => ({
            ...state,
            ...hourChange,
            isFetchingData: true
        }));
    }

    onPeriodToggle() {
        const inPeriodMode = !this.state.inPeriodMode;
        const maxDate = inPeriodMode ? this.state.date : new Date()
        this.setState(state => ({ ...state, inPeriodMode, maxDate }));
    }

    onPeriodEndChange(childState: TimeAnalyticsState) {
        this.setState(state => ({ ...state, maxDate: childState.date }));
    }

    onTBodyClick(cell: HTMLTableCellElement) {
        const row = cell.parentElement as HTMLTableRowElement;
        if (row.dataset.id) this.mapDrawer.highlight(parseInt(row.dataset.id));
    }

    render() {
        const { date, minDate, maxDate, startHour, endHour, inPeriodMode } = this.state;
        const fromHourOptions = [], toHourOptions = [];
        for (let i = 0; i < endHour; i++) {
            fromHourOptions.push(<option key={i} value={i}>{i} Uhr</option>);
        }
        for (let i = startHour + 1; i <= 24; i++) {
            toHourOptions.push(<option key={i} value={i}>{i} Uhr</option>)
        }
        return (
            <div className="time-analytics">
                <div>
                    <DatePicker
                        inline
                        selected={date}
                        onChange={(date) => this.onDateChange(date)}
                        maxDate={maxDate}
                        minDate={minDate}
                    />
                    {
                        this.props.hasPeriodMode && !this.props.isPeriodEnd
                        &&
                        <div className="flex-row">
                            <HourSelection
                                min={0}
                                max={24}
                                disabled={inPeriodMode || this.props.isPeriodEnd}
                                onHourChange={this.onHourChange.bind(this)}
                            ></HourSelection>
                            <span id="togglePeriod">
                                <input
                                    type="checkbox"
                                    name="togglePeriod"
                                    onChange={this.onPeriodToggle.bind(this)}
                                />
                                <label>Periode</label>
                            </span>
                        </div>
                    }
                </div>
                {
                    inPeriodMode
                    &&
                    <TimeAnalytics
                        ref={this.childAnalyticsComponent}
                        hasPeriodMode={false}
                        isPeriodEnd={true}
                        parentAnalyticsComponent={this}
                        onDateChange={this.onChildDateChange.bind(this)}
                        activeRoutes={this.state.activeRoutes}
                        minDate={date}
                        minHour={startHour}
                    />
                }
                {
                    (this.props.hasPeriodMode && !this.childAnalyticsComponent.current)
                    &&
                    <ActiveRouteSortableTable activeRoutes={this.state.activeRoutes} />
                }
                {
                    this.props.isPeriodEnd
                    &&
                    <ActiveRouteSortableTable activeRoutes={this.state.activeRoutes} />
                }
                {this.state.isFetchingData && <Spinner />}
            </div>
        );
    }
}
