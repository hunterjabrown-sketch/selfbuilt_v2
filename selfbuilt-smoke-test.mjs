// Smoke test for the Self Built DSL compilers.
// Mirrors the LUMBER, JOIN_METHODS, and pure functions from public/selfbuilt-workshop.html.
// Run: node selfbuilt-smoke-test.mjs

const LUMBER = {
  "2x2_pine":  { kind: "beam",  cross_in: [1.5, 1.5],  display: "2x2 pine" },
  "2x4_pine":  { kind: "beam",  cross_in: [1.5, 3.5],  display: "2x4 pine" },
  "2x6_pine":  { kind: "beam",  cross_in: [1.5, 5.5],  display: "2x6 pine" },
  "4x4_pine":  { kind: "beam",  cross_in: [3.5, 3.5],  display: "4x4 pine" },
  "1x4_pine":  { kind: "beam",  cross_in: [0.75, 3.5], display: "1x4 pine" },
  "plywood_3_4": { kind: "sheet", thickness_in: 0.75, display: "3/4\" plywood" },
  "dowel_1in":   { kind: "round", diameter_in: 1.0,  display: "1\" dowel" }
};

const JOIN_METHODS = {
  "pocket_screw":  { tools: ["pocket hole jig","drill","clamp"], min_per_join: 4,
                     hardware: { item: "2-1/2\" pocket hole screws", per_qty: 1 } },
  "wood_screw":    { tools: ["drill","driver bits"],             min_per_join: 2,
                     hardware: { item: "2-1/2\" wood screws", per_qty: 1 } },
  "lag_bolt":      { tools: ["impact driver","socket set","drill"], min_per_join: 5,
                     hardware: { item: "3/8\" x 4\" lag bolt + washer", per_qty: 1 } }
};

function cutLengthOf(part) {
  const lumber = LUMBER[part.lumber];
  const [sx, sy, sz] = part.size_in;
  if (!lumber) return Math.max(sx, sy, sz);
  if (lumber.kind === "beam") {
    const [a, b] = lumber.cross_in;
    for (const d of [sx, sy, sz]) {
      if (Math.abs(d - a) > 0.05 && Math.abs(d - b) > 0.05) return d;
    }
    return Math.max(sx, sy, sz);
  }
  if (lumber.kind === "sheet") {
    const sorted = [sx, sy, sz].sort((a,b) => a - b);
    return sorted[2];
  }
  if (lumber.kind === "round") {
    for (const d of [sx, sy, sz]) {
      if (Math.abs(d - lumber.diameter_in) > 0.05) return d;
    }
  }
  return Math.max(sx, sy, sz);
}

function buildCutList(design) {
  const groups = new Map();
  design.parts.forEach(p => {
    const lumber = LUMBER[p.lumber];
    const key = p.lumber + "|" + [...p.size_in].sort((a,b)=>a-b).join("x");
    if (groups.has(key)) {
      groups.get(key).qty++;
      groups.get(key).examples.push(p.label || p.id);
    } else {
      let dimsStr;
      if (lumber.kind === "beam") dimsStr = `${cutLengthOf(p).toFixed(2)}″ long`;
      else if (lumber.kind === "sheet") {
        const t = lumber.thickness_in;
        const face = p.size_in.filter(d => Math.abs(d - t) > 0.05).sort((a,b)=>b-a);
        dimsStr = `${face[0].toFixed(2)}″ × ${face[1].toFixed(2)}″`;
      } else dimsStr = `${cutLengthOf(p).toFixed(2)}″ long`;
      groups.set(key, { lumber: p.lumber, display: lumber.display, dims: dimsStr, qty: 1, examples: [p.label || p.id] });
    }
  });
  return Array.from(groups.values()).sort((a,b) => a.display.localeCompare(b.display));
}

function buildBOM(design) {
  const items = new Map();
  (design.joins || []).forEach(j => {
    const m = JOIN_METHODS[j.method];
    if (!m || !m.hardware) return;
    const conns = Array.isArray(j.to) ? j.to.length : 1;
    const qty = (j.qty_per_join || 1) * conns * m.hardware.per_qty;
    items.set(m.hardware.item, (items.get(m.hardware.item) || 0) + qty);
  });
  return Array.from(items.entries()).map(([item, qty]) => ({ item, qty }));
}

// --- Test fixture: a simple 4-leg side table ---
const sideTable = {
  name: "Side table",
  description: "Simple 4-leg side table, 18\" square, 22\" tall.",
  overall_dimensions_in: { width: 18, height: 22, depth: 18 },
  parts: [
    { id: "leg_fl", label: "Front-left leg",  lumber: "2x2_pine", size_in: [1.5, 21.25, 1.5], position_in: [0, 0, 0] },
    { id: "leg_fr", label: "Front-right leg", lumber: "2x2_pine", size_in: [1.5, 21.25, 1.5], position_in: [16.5, 0, 0] },
    { id: "leg_bl", label: "Back-left leg",   lumber: "2x2_pine", size_in: [1.5, 21.25, 1.5], position_in: [0, 0, 16.5] },
    { id: "leg_br", label: "Back-right leg",  lumber: "2x2_pine", size_in: [1.5, 21.25, 1.5], position_in: [16.5, 0, 16.5] },
    { id: "apron_f",label: "Front apron",     lumber: "1x4_pine", size_in: [15, 3.5, 0.75], position_in: [1.5, 17.75, 0] },
    { id: "apron_b",label: "Back apron",      lumber: "1x4_pine", size_in: [15, 3.5, 0.75], position_in: [1.5, 17.75, 17.25] },
    { id: "apron_l",label: "Left apron",      lumber: "1x4_pine", size_in: [0.75, 3.5, 15], position_in: [0, 17.75, 1.5] },
    { id: "apron_r",label: "Right apron",     lumber: "1x4_pine", size_in: [0.75, 3.5, 15], position_in: [17.25, 17.75, 1.5] },
    { id: "top",    label: "Tabletop",        lumber: "plywood_3_4", size_in: [18, 0.75, 18], position_in: [0, 21.25, 0] }
  ],
  joins: [
    { id: "aprons_to_legs", method: "pocket_screw", from: "apron_f", to: ["leg_fl","leg_fr","leg_bl","leg_br"], qty_per_join: 2 },
    { id: "top_to_aprons",  method: "wood_screw",   from: "top",     to: ["apron_f","apron_b","apron_l","apron_r"], qty_per_join: 2 }
  ]
};

console.log("=== CUT LIST ===");
const cuts = buildCutList(sideTable);
cuts.forEach(c => console.log(`  ${c.qty}× ${c.display.padEnd(15)} ${c.dims.padEnd(20)}  (${c.examples.join(", ")})`));

console.log("\n=== HARDWARE BOM ===");
const bom = buildBOM(sideTable);
bom.forEach(b => console.log(`  ${b.qty}× ${b.item}`));

// --- Sanity assertions ---
const legs = cuts.find(c => c.lumber === "2x2_pine");
const aprons = cuts.find(c => c.lumber === "1x4_pine");
const top = cuts.find(c => c.lumber === "plywood_3_4");

const assertions = [
  ["4 legs grouped together", legs.qty === 4],
  ["legs cut to 21.25\"", legs.dims.includes("21.25")],
  ["4 aprons grouped together (all same size_in shape)", aprons.qty === 4],
  ["aprons cut to 15\"", aprons.dims.includes("15.00")],
  ["1 top", top.qty === 1],
  ["top reads 18 x 18", top.dims.includes("18.00") ],
  ["pocket screws: 4 connections × 2 each = 8", bom.find(b=>b.item.includes("pocket")).qty === 8],
  ["wood screws: 4 connections × 2 each = 8",   bom.find(b=>b.item.includes("wood screws")).qty === 8]
];

console.log("\n=== ASSERTIONS ===");
let pass = 0, fail = 0;
for (const [name, ok] of assertions) {
  console.log(`  ${ok ? "✓" : "✗"} ${name}`);
  ok ? pass++ : fail++;
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
