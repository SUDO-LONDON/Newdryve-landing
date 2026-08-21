# Driving test centre location data

This directory contains the current Great Britain car practical test-centre seed used by Newdryve.

## Sources

- Active centre names come from DVSA table DRT122F for July 2026: https://www.gov.uk/government/statistical-data-sets/driving-test-and-theory-test-data-cars
- Addresses and postcodes were matched against the downloadable current-location index at https://drivingtestcentres.co.uk/data/locations-index.json. That index states that its locations were checked against the official DVSA finders on 14 August 2026.
- Coordinates are Office for National Statistics postcode centroids returned by https://postcodes.io. They are deliberately labelled `coordinatePrecision: 'postcode'` and must not be presented as building entrances.
- Basingstoke's current postcode did not resolve through the postcode lookup. Its coordinate uses the validated location-index point and is labelled `coordinatePrecision: 'site'`.

The downloadable location index was matched by the current DVSA centre name and its finder/statistics aliases. Four current names needed explicit resolution: Enfield (Brancroft Way), Greenham, Medway Ambley Road, and Worthing. No centre was silently dropped or fuzzy-matched.

## Stable contract

`name` remains the current human-facing DVSA name. `slug` is the stable application/database key: lowercase ASCII, punctuation removed, and words separated by hyphens. Coordinates and postcodes may be refreshed without changing a slug. A genuine DVSA rename must be reviewed rather than automatically replacing an existing slug.

The application picker uses a separate, explicit city-grouping layer keyed by
those slugs. It groups districts and suburbs under the city an instructor would
normally search for (for example, Wood Green under London) without changing the
raw DVSA locality. Larger metro groupings are curated rather than inferred, and
ambiguous or rural locations remain searchable by their own town. The form also
indexes every centre name, so searching for a centre selects its canonical city.

## Validation performed

- 314 centre records across 260 curated application city groups
- all 56 explicit city overrides reference an existing stable centre slug
- 314 unique names, slugs, and postcodes
- every record has finite latitude and longitude
- every coordinate is inside a broad Great Britain bounding box (`49..61` latitude, `-9..2.5` longitude)
- 313 postcode-centroid coordinates and one documented site-coordinate fallback
- Astro typecheck and production build must pass after every refresh

Postcode centroids are suitable anchors for coarse mileage coverage and 10–90 minute isochrones, but they are not suitable for turn-by-turn arrival instructions. If entrance-level coordinates are added later, keep `slug` unchanged and change `coordinatePrecision` to `site` only after verification.
