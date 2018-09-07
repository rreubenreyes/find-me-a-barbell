/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable react/no-access-state-in-setstate */
/* eslint-disable react/no-array-index-key */
/* eslint-disable camelcase */

import React from 'react'
import _ from 'lodash'
import { compose, withProps, lifecycle } from 'recompose'
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
} from 'react-google-maps'
import { SearchBox } from 'react-google-maps/lib/components/places/SearchBox'
import API_KEYS from '../data/api-keys'

const Map = compose(
  withProps({
    googleMapURL: `https://maps.googleapis.com/maps/api/js?key=${
      API_KEYS.gmaps
    }&v=3.exp&libraries=geometry,drawing,places`,
    loadingElement: <div data-name="loading" style={{ height: `100%` }} />,
    containerElement: <div data-name="container" style={{ height: `400px` }} />,
    mapElement: <div data-name="map" style={{ height: `100%` }} />,
  }),
  lifecycle({
    componentWillMount() {
      const refs = {}

      this.setState({
        bounds: null,
        center: {
          lat: 41.9,
          lng: -87.624,
        },
        markers: [],
        onMapMounted: (ref) => {
          refs.map = ref
        },
        onBoundsChanged: _.debounce(
          () => {
            this.setState({
              bounds: refs.map.getBounds(),
              center: refs.map.getCenter(),
            })
          },
          100,
          { maxWait: 500 },
        ),
        onSearchBoxMounted: (ref) => {
          refs.searchBox = ref
        },
        onPlacesChanged: () => {
          const places = refs.searchBox.getPlaces()
          const bounds = new google.maps.LatLngBounds()

          places.forEach((place) => {
            if (place.geometry.viewport) {
              bounds.union(place.geometry.viewport)
            } else {
              bounds.extend(place.geometry.location)
            }
          })

          this.setState((prevState) => {
            /* renders a marker with props */
            const { handleLocationMarked } = this.props
            const nextMarkers = places.map(place => ({
              details: place,
              position: place.geometry.location,
              onClick() {
                // TODO: show a popover with place details
                const { details, position } = this
                handleLocationMarked({ details, position })
              },
            }))

            const nextCenter = _.get(
              nextMarkers,
              `0.position`,
              this.state.center,
            )

            return {
              center: nextCenter,
              markers: [...prevState.markers, ...nextMarkers],
            }
          })
          // refs.map.fitBounds(bounds);
        },
      })
    },
    componentDidMount() {
      if (`geolocation` in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          this.setState({
            center: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          })
        })
      }
    },
  }),
  withScriptjs,
  withGoogleMap,
)(props => (
  <GoogleMap
    ref={props.onMapMounted}
    defaultZoom={15}
    center={props.center}
    onBoundsChanged={props.onBoundsChanged}
  >
    <SearchBox
      ref={props.onSearchBoxMounted}
      bounds={props.bounds}
      controlPosition={google.maps.ControlPosition.TOP_LEFT}
      onPlacesChanged={props.onPlacesChanged}
    >
      <input
        type="text"
        placeholder="Customized your placeholder"
        style={{
          boxSizing: `border-box`,
          border: `1px solid transparent`,
          width: `240px`,
          height: `32px`,
          marginTop: `27px`,
          padding: `0 12px`,
          borderRadius: `3px`,
          boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
          fontSize: `14px`,
          outline: `none`,
          textOverflow: `ellipses`,
        }}
      />
    </SearchBox>
    {props.markers.map((marker, index) => (
      <Marker
        key={index}
        position={marker.position}
        onClick={() => {
          marker.onClick()
        }}
      />
    ))}
  </GoogleMap>
))

export default Map
