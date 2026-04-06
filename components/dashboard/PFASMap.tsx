"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, GeoJSON as LeafletGeoJSONLayer } from "leaflet";

export interface CountyData {
  county: string;
  fips: string;
  pfoa_ppt: number;
  pfos_ppt: number;
  genx_ppt: number;
  pfna_ppt: number;
  pfhxs_ppt: number;
  pfbs_ppt: number;
  severityScore: number;
  hazardIndex: number;
  exceedsMCL: boolean;
  pwsCount: number;
  lastUpdated: string;
}

interface PFASMapProps {
  data: CountyData[];
  onCountySelect: (county: CountyData | null) => void;
  selectedFips: string | null;
}

function calcHazardIndex(d: CountyData): number {
  return (
    d.genx_ppt / 10 +
    d.pfna_ppt / 2000 +
    d.pfhxs_ppt / 10 +
    d.pfbs_ppt / 10
  );
}

function calcSeverity(d: CountyData): number {
  return Math.max(d.pfoa_ppt / 4, d.pfos_ppt / 4, calcHazardIndex(d));
}

// 5-level color scale matching the research recommendation
function getColor(d: CountyData): string {
  const s = calcSeverity(d);
  if (s >= 10)  return "#e74c3c"; // extreme
  if (s >= 5)   return "#e67e22"; // critical
  if (s >= 1.0) return "#f39c12"; // exceeds MCL
  if (s >= 0.5) return "#f1c40f"; // approaching
  return "#27ae60";               // safe
}

export function PFASMap({ data, onCountySelect, selectedFips }: PFASMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const geojsonLayerRef = useRef<LeafletGeoJSONLayer | null>(null);

  // Re-style selected county when selectedFips changes
  useEffect(() => {
    if (!geojsonLayerRef.current) return;
    geojsonLayerRef.current.eachLayer((lyr: any) => {
      const fips: string = lyr.feature?.properties?.FIPS;
      const countyData = data.find((d) => d.fips === fips);
      if (fips === selectedFips) {
        lyr.setStyle({ weight: 3, color: "#00d4aa", opacity: 1, fillOpacity: 0.9 });
      } else {
        lyr.setStyle({
          weight: 0.8,
          color: "rgba(255,255,255,0.25)",
          opacity: 0.6,
          fillColor: countyData ? getColor(countyData) : "#1e3a5f",
          fillOpacity: countyData ? 0.72 : 0.25,
        });
      }
    });
  }, [selectedFips, data]);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    import("leaflet").then((L) => {
      // Inject Leaflet CSS once
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (mapRef.current) return;

      const map = L.map(containerRef.current!, {
        center: [35.55, -79.4],
        zoom: 7,
        zoomControl: true,
        attributionControl: true,
        minZoom: 6,
        maxZoom: 13,
      });

      // Dark CartoDB base layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 19,
          attribution: "© <a href='https://carto.com'>CartoDB</a> © <a href='https://www.openstreetmap.org/copyright'>OSM</a>",
        }
      ).addTo(map);

      mapRef.current = map;

      // Build fips → CountyData lookup
      const dataMap = new Map(data.map((d) => [d.fips, d]));

      // Load bundled GeoJSON (no CORS, instant render)
      fetch("/data/nc-counties.geojson")
        .then((r) => {
          if (!r.ok) throw new Error(`GeoJSON fetch failed: ${r.status}`);
          return r.json();
        })
        .then((geojson) => {
          const layer = L.geoJSON(geojson, {
            style: (feature) => {
              const fips: string = feature?.properties?.FIPS;
              const cd = dataMap.get(fips);
              return {
                fillColor: cd ? getColor(cd) : "#1e3a5f",
                fillOpacity: cd ? 0.72 : 0.25,
                color: "rgba(255,255,255,0.25)",
                weight: 0.8,
                opacity: 0.6,
              };
            },
            onEachFeature: (feature, lyr) => {
              const fips: string = feature?.properties?.FIPS;
              const name: string = feature?.properties?.CountyName ?? "Unknown";
              const cd = dataMap.get(fips);

              lyr.on({
                mouseover(e) {
                  const t = e.target as any;
                  if (fips !== selectedFips) {
                    t.setStyle({ weight: 2, color: "#00d4aa", opacity: 0.9, fillOpacity: cd ? 0.88 : 0.4 });
                  }
                  t.bringToFront();
                },
                mouseout(e) {
                  if (fips !== selectedFips) {
                    layer.resetStyle(e.target as any);
                  }
                },
                click() {
                  onCountySelect(cd ?? null);
                },
              });

              // Tooltip shown on hover — county name + key metric
              const tipContent = cd
                ? `<div class="ltt-name">${name} County</div>
                   <div class="ltt-row"><span>Severity</span><span class="ltt-val ${cd.exceedsMCL ? "ltt-alert" : "ltt-safe"}">${calcSeverity(cd).toFixed(2)}× MCL</span></div>
                   <div class="ltt-row"><span>Max PFAS</span><span class="ltt-val">PFOA ${cd.pfoa_ppt} ppt</span></div>
                   <div class="ltt-row"><span>GenX</span><span class="ltt-val">${cd.genx_ppt} ppt</span></div>
                   <div class="ltt-hint">Click for full breakdown</div>`
                : `<div class="ltt-name">${name} County</div><div class="ltt-hint">No PFAS data recorded</div>`;

              lyr.bindTooltip(tipContent, {
                className: "ltt",
                sticky: true,
                direction: "top",
                offset: [0, -4],
              });
            },
          }).addTo(map);

          geojsonLayerRef.current = layer;

          // Fit map to NC bounds
          map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        })
        .catch((err) => {
          console.error("Failed to load county GeoJSON:", err);
          // Graceful fallback: show circle markers for counties with coordinates
          const COUNTY_CENTERS: Record<string, [number, number]> = {
            "37129": [34.27, -77.86], "37051": [35.05, -78.88],
            "37019": [33.93, -78.22], "37017": [34.61, -78.57],
            "37141": [34.51, -77.91], "37183": [35.79, -78.64],
            "37119": [35.25, -80.84], "37155": [34.64, -79.10],
          };
          data.forEach((d) => {
            const coords = COUNTY_CENTERS[d.fips];
            if (!coords) return;
            L.circleMarker(coords, {
              radius: 14,
              fillColor: getColor(d),
              fillOpacity: 0.8,
              color: "#fff",
              weight: 1.5,
            })
              .addTo(map)
              .bindTooltip(`${d.county} County — ${calcSeverity(d).toFixed(2)}× MCL`)
              .on("click", () => onCountySelect(d));
          });
        });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      geojsonLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <style>{`
        /* Leaflet container must have explicit height */
        .leaflet-container { background: #0e1b30 !important; }

        /* Custom tooltip */
        .ltt {
          background: rgba(14, 27, 48, 0.96) !important;
          border: 1px solid rgba(0, 212, 170, 0.3) !important;
          border-radius: 10px !important;
          padding: 10px 13px !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.5) !important;
          backdrop-filter: blur(12px);
          min-width: 180px;
          pointer-events: none;
        }
        .ltt::before { display: none !important; }
        .ltt-name {
          font-weight: 700;
          font-size: 13px;
          color: #fff;
          margin-bottom: 6px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 5px;
        }
        .ltt-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: rgba(255,255,255,0.55);
          margin-top: 3px;
        }
        .ltt-val { color: rgba(255,255,255,0.85); font-weight: 600; }
        .ltt-alert { color: #e74c3c !important; }
        .ltt-safe  { color: #27ae60 !important; }
        .ltt-hint {
          margin-top: 6px;
          font-size: 10px;
          color: rgba(0,212,170,0.6);
          font-style: italic;
        }

        /* Fix Leaflet zoom control colors */
        .leaflet-control-zoom a {
          background: rgba(14,27,48,0.9) !important;
          color: #fff !important;
          border-color: rgba(255,255,255,0.15) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(26,82,118,0.9) !important;
        }
        .leaflet-control-attribution {
          background: rgba(14,27,48,0.8) !important;
          color: rgba(255,255,255,0.35) !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: rgba(0,212,170,0.6) !important; }
      `}</style>
      <div ref={containerRef} className="h-full w-full" />
    </>
  );
}
