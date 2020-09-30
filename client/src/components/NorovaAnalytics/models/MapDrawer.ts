import React from 'react';

import L from 'leaflet';
import { Map } from 'react-leaflet';

import ActiveRoute from './ActiveRoute';
import { Subject, Observer } from './ObserverPattern';

import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw/dist/leaflet.draw';

const ERRORS = Object.freeze({
    NOT_BOUND: Error('MapDrawer is not bound to an instance of L.Map.'),
    NOT_DRAWABLE: Error('Element could not be drawn to the map'),
});

const ROUTE_WEIGHT = 3;
const HIGHLIGHTED_ROUTE_WEIGHT = 6;

export default class MapDrawer implements Subject {
    private static instance: MapDrawer | undefined = undefined;
    private map: L.Map | undefined = undefined;
    public polylines: L.LayerGroup;
    public shapes: L.FeatureGroup;
    private drawControl: L.Control.Draw;
    observers: Observer[] = [];

    private constructor() {
        this.polylines = new L.LayerGroup();
        this.shapes = new L.FeatureGroup();
        this.drawControl = new L.Control.Draw({
            position: 'topright',
            draw: {
                circle: false,
                circlemarker: false,
                marker: false,
                polygon: false,
                polyline: false,
                rectangle: {
                    metric: true,
                    repeatMode: true,
                    shapeOptions: {
                        color: '#008b58',
                    }
                },
            },
            edit: {
                featureGroup: this.shapes,
            }
        });
    }

    public static getInstance(): MapDrawer {
        if (!MapDrawer.instance) MapDrawer.instance = new MapDrawer();
        return MapDrawer.instance;
    }

    public bind(mapReference: React.RefObject<Map>): MapDrawer {
        try {
            this.map = mapReference.current?.leafletElement as L.Map;
            this.polylines.addTo(this.map);
            this.shapes.addTo(this.map);
            this.map.on(L.Draw.Event.CREATED, ({ layer }) => {
                layer.addTo(this.shapes);
                this.notify(layer.getBounds());
            });
            this.map.on(L.Draw.Event.EDITED, ({ layers }: any) => {
                const editedLayers = Object.values(layers._layers) as L.Layer[];
                const layer = editedLayers.shift() as L.Layer;
                this.notify((layer as any).getBounds());
            })
        } catch (error) {
            throw ERRORS.NOT_BOUND;
        }
        return this;
    }

    public attach(observer: Observer) {
        this.observers.push(observer);
    }

    public detach(givenObserver: Observer) {
        this.observers = this.observers.filter((observer) => {
            return observer !== givenObserver;
        });
    }

    private notify(payload: any) {
        for (const observer of this.observers) {
            observer.update(payload);
        }
    }

    public addDrawControl() {
        this.map?.addControl(this.drawControl);
    }

    public removeDrawControl() {
        this.map?.removeControl(this.drawControl);
    }

    public async drawFromActiveRoute(route: ActiveRoute, identifier?: number, color?: string) {
        if (!this.map) throw ERRORS.NOT_BOUND;
        identifier = identifier || route.getID();
        color = color || '#000';
        const coordinates = route.getTrackingData().map((data) => {
            return new L.LatLng(data.getLatitude(), data.getLongitude());
        });
        const tooltipText = `
            Datum: ${route.getFormattedDate('DD.MM.YYYY')}<br>
            Strecke: ${route.getTotalDistanceInKilometers()} km<br>
            Start: ${route.getFormattedStartTime()}<br>
            Ende: ${route.getFormattedEndTime()}<br>
            Dauer: ${route.getTravelTimeInMinutes()} Minuten<br>
            Höchstgeschw.: ${route.getMaxSpeed()} km/h<br>
            &#8960;-Geschw.: ${route.getKilometersPerHour()} km/h<br>
            User: ${(await route.getUser()).getUsername()}
        `;
        const createdLayer = this.drawPolyline(
            coordinates,
            color,
            tooltipText
        );
        this.polylines.eachLayer((layer: any) => {
            if (layer == createdLayer) {
                layer.layerID = identifier;
            }
        });
    }

    public drawPolyline(latlng: L.LatLng[], color: string, text?: string) {
        const layer = L.polyline(latlng, { color, weight: ROUTE_WEIGHT });
        if (text) layer.bindTooltip(text);
        return layer.addTo(this.polylines);
    }

    public drawCircle(latlng: L.LatLngExpression, radius: number) {
        return this.addLayer(L.circle(latlng, { radius, color: '#008b58' }));
    }

    public addLayer(layer: L.Layer) {
        return layer.addTo(this.polylines);
    }

    public removeAllLayers() {
        this.polylines.clearLayers();
    }

    public removeLayersById(givenId: number) {
        const layers = this.polylines.getLayers();
        const layersToRemove = layers.filter((layer: any) => {
            return layer.layerID === givenId;
        });
        for (const layer of layersToRemove) {
            this.polylines.removeLayer(layer);
        }
    }

    public removeShapes() {
        this.shapes.eachLayer(layer => layer.remove());
    }

    public removePolylines() {
        this.polylines.eachLayer((layer) => {
            if (layer instanceof L.Polyline) {
                layer.remove();
            }
        });
    }

    public fitBounds(bounds: L.LatLngBoundsExpression) {
        this.map?.fitBounds(bounds);
    }

    public panTo(bounds: L.LatLngExpression) {
        this.map?.panTo(bounds);
    }

    public highlight(givenId: number) {
        this.polylines.eachLayer((layer: any) => {
            if (layer instanceof L.Polyline) {
                if ((layer as any).layerID === givenId) {
                    const currentColor = layer.options.color;
                    layer.setStyle({
                        color: currentColor === '#000' ? '#ffff00' : '#000',
                        weight: currentColor === '#000' ? HIGHLIGHTED_ROUTE_WEIGHT : ROUTE_WEIGHT
                    });
                    layer.bringToFront();
                    this.panTo((layer as any).getCenter());
                } else {
                    layer.setStyle({
                        color: '#000',
                        weight: ROUTE_WEIGHT
                    });
                    layer.bringToBack();
                }
            }
        });
    }
}
