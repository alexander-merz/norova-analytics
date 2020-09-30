import moment from 'moment';

export function convertTimeStampFormat(timeStamp: string): string {
    return moment(timeStamp).format('DD.MM.YYYY HH:mm');
}

type DestructedTimestamp = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
};

export function destructTimestamp(timestamp: string): DestructedTimestamp {
    const date = timestamp.slice(0, 10);
    const time = timestamp.slice(
        timestamp.indexOf('T') + 1,
        timestamp.indexOf('.')
    );
    const [year, month, day] = date.split('-').map((value) => parseInt(value));
    const [hour, minute, second] = time
        .split(':')
        .map((value) => parseInt(value));
    return { year, month, day, hour, minute, second };
}
