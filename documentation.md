# NorOvA Analytics
NorOvA Analytics ist die Wurzelkomponente der Applikation.
In ihr werden die Analysekomponenten als Reiter gerendert.
NorOvA Analytics interagiert mit zwei klassenbasierten Diensten:

- `MapDrawer`
- `IDB`

Beide Klassen verkörpert das Entwurfsmuster Singleton.
Von ihnen können nur eine Instanz erzeugt werden.

`NorOvA Analytics` **muss** die Komponente `Map` der React-Leaflet-Bibliothek rendern.

# IDB
Die Klasse `IDB` ist die Schnittstelle zur `IndexedDB`.
Sie bedient sich nicht an der nativen `IndexedDB`-API, sondern an einer Promise-basierten Erweiterung (vgl. [https://www.npmjs.com/package/idb](https://www.npmjs.com/package/idb)).
Routen- und Benutzerdaten werden in der IndexedDB abgelegt.
Trackingdaten werden aufgrund ihres Umfangs nicht in der IndexedDB abgelegt.

Die Datenbanken sind als Membervariablen hinterlegt

```typescript
private static userDB: IDBPDatabase<userDB> | null = null;
private static routeDB: IDBPDatabase<routeDB> | null = null;
```

Die IDB wird in `componentDidMount` in `NorOvA Analytics` initialisiert.

# MapDrawer
Die Klasse `MapDrawer` ist die Schnittstelle zur Leaflet-Karte (`L.Map`) und wird im Konstruktor von `NorOvA Analytics` instanziiert:

```typescript
this.mapDrawer = MapDrawer.getInstance();
```

Damit die Klasse `MapDrawer` Zugriff auf die Leaflet-Karte erhält, muss eine Kartenreferenz übergeben werden.

Mit Kartenreferenz ist ein `RefObject` gemeint (vgl. [https://reactjs.org/docs/refs-and-the-dom.html](https://reactjs.org/docs/refs-and-the-dom.html)):

```typescript
private mapReference: React.RefObject<Map> = React.createRef();
this.mapDrawer.bind(this.mapReference);
```

Ist `MapDrawer` instanziiert und die Karte gebunden, können über öffentliche Methoden auf der Karte gezeichnet werden. Analysekomponente nutzen hierfür die Methode `drawFromActiveRoute`:

```typescript
public async drawFromActiveRoute(route: ActiveRoute, identifier?: number, color?: string)
```

`route` ist eine Instanz von `ActiveRoute` und kapselt die Koordinatenpunkte der Strecken.

`identifier` und `color` sind optionale Argumente, die für die **Benutzeranalyse** notwendig sind, um die Strecken durch Benutzer-ID und Farbe zu differenzieren.

Darüber hinaus implementiert `MapDrawer` das Interface `Subject`.
Ein Subjekt kann mehrere Beobachter registrieren und bei einer Zustandsveränderung kontaktieren.

Dieses Entwurfsmuster ist für räumliche Analysen notwendig, in denen eine Interaktion mit der Karte Längen- und Breitengrade liefern. Die Analysekomponenten müssen über diese Eckdaten unterrichtet werden, woraufhin sie die Datenbeschaffung einleiten.

In der Methode `bind` werden zwei EventListener registriert, die auf eine Zeichnung bzw. dem Editieren einer Zeichnung reagieren:

```typescript
this.map.on(L.Draw.Event.CREATED, ({ layer }) => {
    layer.addTo(this.shapes);
    this.notify(layer.getBounds());
});
this.map.on(L.Draw.Event.EDITED, ({ layers }: any) => {
    const editedLayers = Object.values(layers._layers) as L.Layer[];
    const layer = editedLayers.shift() as L.Layer;
    this.notify((layer as any).getBounds());
})
```
In beiden Fällen werden die registrierten Beobachter über Längen- und Breitengradintervall des gezeichneten Rechteckes informiert.

# AnalyticsComponent
Die abstrakte Klasse `AnalyticsComponent` ist der Blueprint von Analysekomponente. Sie erbt von der React-Klasse `Component`. Sie definiert `protected` Variablen für den Zugriff auf `MapDrawer` und `IDB`, welche sie konkreten Ableitungen vererbt.

```typescript
protected idb: IDB | null;
protected mapDrawer: MapDrawer;
constructor(props: Readonly<P>) {
    super(props);
    this.idb = IDB.getInstance();
    this.mapDrawer = MapDrawer.getInstance();
}
```

`AnalyticsComponent` definiert Interfaces für Props und State, von denen die  Unterklassen erben.
Die gegenwärtigen Strecken, werden durch das Zustandsattribut `activeRoutes` abgebildet und können optional als `Props` übergeben werden:

```typescript
export interface AnalyticsComponentProps {
    activeRoutes?: ActiveRoute[];
}

export interface AnalyticsComponentState {
    activeRoutes: ActiveRoute[];
}
```

Gelangen neue Koordinaten über Props in die Analysekomponente, wird der interne Zustand aktualisiert:

```typescript
componentWillReceiveProps({ activeRoutes: nextActiveRoutes }: AnalyticsComponentProps) {
    this.setState(state => ({ ...state, activeRoutes nextActiveRoutes || state.activeRoutes }));
}
```

Kommt es zu einer Zustandsveränderung, genauer gesagt zu einer Veränderungen von `state.activeRoutes`, dann startet der Datenbeschaffungsprozess der Analysekomponente. Dies wird in der Methode `componentDidMount` der Unterklassen definiert und kann je nach Art der Komponente weitere Kontrollstrukturen enthalten.

# UserAnalytics

## Props
```typescript
interface UserAnalyticsProps extends AnalyticsComponentProps {
    isComparable?: boolean;
    routeColor?: string;
    userToCompareTo?: User;
}
```

- `isComparable`: Indikator, ob die Komponente imstande ist eine weitere `UserAnalytics` Komponente zu rendern
- `routeColor` : Farbe der Strecke als einfache Zeichenkette, RGB oder Hexadezimal 
- `userToCompareTo`: Benutzer-Objekt der übergeordneten `UserAnalytics` Komponente 

## State
```typescript
export interface UserAnalyticsState extends AnalyticsComponentState {
    users: User[],
    routes: Route[],
    routeColor: string,
    inCompareMode: boolean,
    currentUser: User | undefined,
}
```

- `users`: Array aller Benutzer (von `IDB`)
- `routes`: Array aller Strecken (von `IDB`)
- `routeColor`: Streckenfarbe. Der Wert entspricht dem gleichnamigen Propattribut und kann durch einen Color-Picker neu definiert werden. Die Standardfarbe ist `#000`
- `inCompareMode`: Indikator, ob sich die Komponente im Direktvergleich befinden, sprich eine weitere `UserAnalytics` Komponene rendert.
- `currentUser`: Der gegenwärtig ausgewählte Benutzer aus dem Dropdown-Menü

## Methoden

```typescript
async onUserChange(event: ChangeEvent<HTMLSelectElement>)
```
Beschaffung aller Routendatensätze eines entsprechenden Benutzers. Über das `select` Element wird die aktuell ausgewählte `option` und somit `ID` des Benutzers in Erfahrung gebracht. `currentUser` wird gesetzt.

```typescript
async onRouteChange(event: ChangeEvent<HTMLSelectElement>)
```
Beschaffung aller Trackingdatensätze einer entsprechenden Route. Über das `select` Element wird die aktuell ausgewählte `option` und somit `ID` der Route in Erfahrung gebracht. `ActiveRoute` Instanzen werden erzeugt, in einem Array untergebracht und als Wert für `activeRoutes` gesetzt, woraufhin die Komponente aktualisiert.

# TimeAnalytics

## Props
```typescript
interface TimeAnalyticsProps extends AnalyticsComponentProps {
    hasPeriodMode: boolean;
    date?: Date;
    isPeriodEnd?: boolean;
    minDate?: Date;
    maxDate?: Date;
    minHour?: number;
    onDateChange?: (state: TimeAnalyticsState) => void;
}
```

- `hasPeriodMode`: Indikator, ob die Komponente imstande ist eine weitere `TimeAnalytics` Komponente zu rendern
- `date` : Optionales vorausgewähltes Datum
- `isPeriodEnd`: Indikator, die es sich um die zweite `TimeAnalytics` Komponente und somit um das Ende der Zeitspanne handelt.
- `minDate`: Das frühsteste auswählbare Datum
- `maxDate`: Das späteste auswählbare Datum
- `minHour`: Die Untergrenze des Stundenintervalls
- `onDateChange`: Callback-Funktion von der Elternkomponente. Sie wird aufgerufen, wenn es sich bei der Komponente um das Ende der Zeitspanne (also den zweiten Kalender) handelt und ein neues Datum ausgewählt wurde.

## State
```typescript
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

export interface TimeAnalyticsState extends AnalyticsComponentState, HourState, DateState {
    inPeriodMode: boolean;
}
```

Der Zustand von `TimeAnalytics` setzt sich aus zwei Zuständen zusammen. Über einen Datepicker und zwei Stunden-Schieberegler kann der Benutzer den Zeitpunkt oder das Zeitintervall frei wählen.

## Methoden

```typescript
onDateChange(date: Date | null)
```
Ereignisbehandlung von einer Veränderung des Datums. Auslöser ist eine Interaktion mit dem `React-Datepicker`. Das Datum wird über `setState` gesetzt. Handelt es sich um den zweiten Kalender, wird die Callback-Funktion `props.onDateChange` in `componentDidUpdate` aufgerufen und der Wert an die Elternkomponente emittiert:

```typescript
if (isPeriodEnd && date.getTime() !== prevState.date.getTime() && onDateChange) {
    onDateChange(this.state);
}
```

---

```typescript
onHourChange(hourChange: { startHour: number, endHour: number })
```
Ereignisbehandlung einer Veränderung der Stunden-Schieberegler.

```typescript
onChildDateChange({ date }: TimeAnalyticsState) {
    this.setState(state => ({ ...state, maxDate: date }));
}
```
`onChildDateChange` definiert wie auf eine Datumsveränderung in der Kindskomponente reagiert wird. Das `maxDate` der auswählbaren Zeitspanne ist gleich des aktuellen Wertes des zweiten Kalenders.

Eltern- und Kindskomponente referenzieren sich gegenseitig, wodurch beide Komponente Zugriff auf alle Konfigurationen besitzen.

Die Elternkomponente referenziert das Kind über ein RefObject:

```typescript
childAnalyticsComponent: React.RefObject<TimeAnalytics> = React.createRef();
```
Die Kindskomponente kann über `props.minDate` das Datum der Elternkomponente auslesen. Das geschieht über eine Kontrollstruktur in `componentDidUpdate`:

```typescript
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
}
```

# SpatialAnalytics

- `SpatialAnalytics` erlaubt es Rechtecke auf der Karte zu zeichnen und die Strecken auf die gezeichnete Fläche einzugrenzen. 
- Die Eckpunkte definieren Minimum und Maximum von Längen- und Breitengrad.
- Sie implementiert das Interface `Observer`, um auf Veränderungen von `MapDrawer` zu reagieren.
- Die Analysekomponente verfügt über keinen eigenen Konfigurationsbereich. 
- Sie ist vollständig auf die Mitteilung der Eckpunkte von `MapDrawer` angewiesen.

## Props

```typescript
interface SpatialAnalyticsProps extends AnalyticsComponentProps {
    onDrawEnd?: (latLngBounds: LatLngBounds) => void;
}
```
- `onDrawEnd` ist eine Callback-Funktion für die Emission der Längen- und Breitengrade an die übergeordnete Komponente. Das ist notwendig für die erweiterte Analyse.

## State

```typescript
export interface SpatialAnalyticsState extends AnalyticsComponentState {
    maxActiveRoutes: number;
    latLngBounds: LatLngBounds | undefined;
}
```

- `maxActiveRoutes`: Maximalanzahl an Strecken, die gezeichnet werden sollen.
- `latLngBounds`: Längen- und Breitengradintervall. `LatLngBounds` ist ein `Type` der Leaflet-Bibliothek.

