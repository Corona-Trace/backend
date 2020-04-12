import { promises as fs } from "fs";

import { allowed as ALLOWED_GEO } from "./allowedGeo";

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

type Point = { lat: number; lon: number };

export function milesToKm(miles: number): number {
  return 1.609344 * miles;
}

// haversine formula, result in kms
export function geoDist(pt1: Point, pt2: Point): number {
  const R = 6371;
  const latRadians = deg2rad(pt2.lat - pt1.lat);
  const lonRadians = deg2rad(pt2.lon - pt1.lon);

  const a =
    Math.sin(latRadians / 2) * Math.sin(latRadians / 2) +
    Math.cos(deg2rad(pt1.lat)) *
      Math.cos(deg2rad(pt2.lat)) *
      Math.sin(lonRadians / 2) *
      Math.sin(lonRadians / 2);

  return R * (2 * Math.asin(Math.sqrt(a)));
}

export function geoInCircle(base: { point: Point; radius: number }, pt: Point) {
  const dist = geoDist(base.point, pt);
  if (dist <= base.radius) {
    return true;
  }

  return false;
}

export function inAllowedGeo(pt: Point) {
  return ALLOWED_GEO.some((allowed) => {
    return geoInCircle(allowed, pt);
  });
}
