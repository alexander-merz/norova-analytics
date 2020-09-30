export interface Observer {
    update(payload: any): void;
}

export interface Subject {
    observers: Observer[];
    attach(observer: Observer): void;
    detach(observer: Observer): void;
}
