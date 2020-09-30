import React, { ReactNode } from "react";
import IDB from "./IDB";
import MapDrawer from "./MapDrawer";
import ActiveRoute from "./ActiveRoute";

export interface AnalyticsComponentProps {
    children?: any;
    activeRoutes?: ActiveRoute[];
    parentAnalyticsComponent?: AnalyticsComponent<AnalyticsComponentProps, AnalyticsComponentState>;
}

export interface AnalyticsComponentState {
    isFetchingData: boolean;
    activeRoutes: ActiveRoute[];
}

export default abstract class AnalyticsComponent
    <P extends AnalyticsComponentProps, S extends AnalyticsComponentState>
    extends React.Component<P, S>
{
    protected idb: IDB | null;
    protected mapDrawer: MapDrawer;
    constructor(props: Readonly<P>) {
        super(props);
        this.idb = IDB.getInstance();
        this.mapDrawer = MapDrawer.getInstance();
    }
    componentWillReceiveProps({ activeRoutes: nextActiveRoutes }: AnalyticsComponentProps) {
        this.setState(state => ({ ...state, activeRoutes: nextActiveRoutes || state.activeRoutes }));
    }
    shouldComponentUpdate(nextProps: AnalyticsComponentProps, nextState: AnalyticsComponentState) {
        return this.state !== nextState;
    }
    abstract render(): ReactNode;
}
