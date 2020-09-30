import React, { Component } from 'react';
import './WeekdayPicker.css';

export enum Weekday {
    Montag = 0,
    Dienstag = 1,
    Mittwoch = 2,
    Donnerstag = 3,
    Freitag = 4,
    Samstag = 5,
    Sonntag = 6
}

interface WeekdayPickerProps {
    primaryColor?: string;
    secondaryColor?: string;
    style?: React.CSSProperties;
    onWeekdayChange?: (weekday: Weekday) => void;
}

export interface WeekdayPickerState { weekday: Weekday }

export const INITIAL_WEEKDAY = Weekday.Montag;
const DEFAULT_PRIMARY_COLOR = 'rgb(0, 0, 0)';
const DEFAULT_SECONDARY_COLOR = 'rgba(0, 0, 0, 0.3)';

export default class WeekdayPicker extends Component<WeekdayPickerProps, WeekdayPickerState> {
    weekdayJSX = [
        <div key={Weekday.Montag} data-index={Weekday.Montag} className="weekday active">Mo</div>,
        <div key={Weekday.Dienstag} data-index={Weekday.Dienstag} className="weekday">Di</div>,
        <div key={Weekday.Mittwoch} data-index={Weekday.Mittwoch} className="weekday">Mi</div>,
        <div key={Weekday.Donnerstag} data-index={Weekday.Donnerstag} className="weekday">Do</div>,
        <div key={Weekday.Freitag} data-index={Weekday.Freitag} className="weekday">Fr</div>,
        <div key={Weekday.Samstag} data-index={Weekday.Samstag} className="weekday">Sa</div>,
        <div key={Weekday.Sonntag} data-index={Weekday.Sonntag} className="weekday">So</div>
    ];

    weekdayContainer: React.RefObject<HTMLDivElement> = React.createRef();

    constructor(props: WeekdayPickerProps) {
        super(props);
        this.state = { weekday: INITIAL_WEEKDAY };
        document.documentElement.style.setProperty(
            '--weekday-color',
            this.props.secondaryColor || DEFAULT_SECONDARY_COLOR
        );
        document.documentElement.style.setProperty(
            '--weekday-color-hover',
            this.props.secondaryColor || DEFAULT_SECONDARY_COLOR
        );
    }

    componentDidUpdate(prevProps: WeekdayPickerProps, prevState: WeekdayPickerState) {
        if (this.state.weekday === prevState.weekday) return;
        const weekdayElements = this.weekdayContainer.current?.children;
        if (weekdayElements) {
            weekdayElements[prevState.weekday].classList.remove('active');
            weekdayElements[this.state.weekday].classList.add('active');
        }
        if (this.props.onWeekdayChange)
            this.props.onWeekdayChange(this.state.weekday);
    }

    onClick(event: React.MouseEvent<HTMLDivElement>) {
        const index = (event.target as HTMLDivElement).dataset.index;
        if (!index) return;
        const weekday = parseInt(index) as Weekday;
        if (weekday >= 0 && weekday <= 6) {
            this.setState(({ weekday }));
        }
    }

    render() {
        return (
            <div className="weekday-picker" style={this.props.style}>
                <div
                    className="weekday-picker__head"
                    style={{
                        backgroundColor: this.props.primaryColor || DEFAULT_PRIMARY_COLOR
                    }}
                >
                    <h1>Wochentag</h1>
                </div>
                <div
                    ref={this.weekdayContainer}
                    className="weekday-picker__body"
                    onClick={this.onClick.bind(this)}
                >{this.weekdayJSX}</div>
            </div>
        )
    }

}
