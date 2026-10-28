import { describe, expect, it } from "vitest";

import {
  distanceBetween,
  buildCumulativeDistances,
  positionAtDistance,
} from "#utils/geo.js";

const ONE_DEGREE_METERS = 111194.93;

const point = (lat, lng) => ({ lat, lng });

describe("distanceBetween", () => {
  it("returns 0 for the same point", () => {
    expect(distanceBetween(point(-22.2, -49.9), point(-22.2, -49.9))).toBe(0);
  });

  it("measures one degree of latitude", () => {
    const distance = distanceBetween(point(0, 0), point(1, 0));

    expect(distance).toBeCloseTo(ONE_DEGREE_METERS, 0);
  });

  it("is symmetric", () => {
    const a = point(-22.2139, -49.9458);
    const b = point(-23.5505, -46.6333);

    expect(distanceBetween(a, b)).toBeCloseTo(distanceBetween(b, a), 6);
  });
});

describe("buildCumulativeDistances", () => {
  it("returns [0] for a single point", () => {
    expect(buildCumulativeDistances([point(0, 0)])).toEqual([0]);
  });

  it("accumulates the distance of each segment", () => {
    const cumulative = buildCumulativeDistances([
      point(0, 0),
      point(1, 0),
      point(2, 0),
    ]);

    expect(cumulative).toHaveLength(3);
    expect(cumulative[0]).toBe(0);
    expect(cumulative[1]).toBeCloseTo(ONE_DEGREE_METERS, 0);
    expect(cumulative[2]).toBeCloseTo(2 * ONE_DEGREE_METERS, 0);
  });
});

describe("positionAtDistance", () => {
  const coordinates = [point(0, 0), point(0, 1), point(0, 2)];
  const cumulative = buildCumulativeDistances(coordinates);
  const total = cumulative[cumulative.length - 1];

  const expectPosition = (actual, expected) => {
    expect(actual.lat).toBeCloseTo(expected.lat, 5);
    expect(actual.lng).toBeCloseTo(expected.lng, 5);
  };

  it("returns the first point at distance 0", () => {
    expectPosition(positionAtDistance(coordinates, cumulative, 0), point(0, 0));
  });

  it("returns the last point at the total distance", () => {
    expectPosition(
      positionAtDistance(coordinates, cumulative, total),
      point(0, 2),
    );
  });

  it("interpolates inside a segment", () => {
    expectPosition(
      positionAtDistance(coordinates, cumulative, ONE_DEGREE_METERS / 2),
      point(0, 0.5),
    );
  });

  it("finds the right segment on a multi-segment route", () => {
    expectPosition(
      positionAtDistance(coordinates, cumulative, 1.5 * ONE_DEGREE_METERS),
      point(0, 1.5),
    );
  });

  it("clamps distances outside the route", () => {
    expectPosition(
      positionAtDistance(coordinates, cumulative, -100),
      point(0, 0),
    );
    expectPosition(
      positionAtDistance(coordinates, cumulative, total + 100),
      point(0, 2),
    );
  });

  it("does not produce NaN when consecutive points repeat", () => {
    const repeated = [point(0, 0), point(0, 0), point(0, 1)];
    const repeatedCumulative = buildCumulativeDistances(repeated);

    const position = positionAtDistance(
      repeated,
      repeatedCumulative,
      ONE_DEGREE_METERS / 2,
    );

    expectPosition(position, point(0, 0.5));
  });
});
