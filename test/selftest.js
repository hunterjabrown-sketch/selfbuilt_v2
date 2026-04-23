/**
 * SelfBuilt self-test — runs real prompts against the live server and validates
 * structural integrity of every DSL response.
 *
 * Usage:
 *   node test/selftest.js
 *
 * Requires the three servers to be running (Node :3001, CAD :3002, Vite :5174).
 * Set BASE_URL if the Node API is not on localhost:3001.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// ---------- lumber catalog (mirrors selfbuilt-workshop.html) ----------
const LUMBER_KEYS = new Set([
  '2x2_pine','2x4_pine','2x6_pine','2x8_pine','2x10_pine','4x4_pine',
  '1x4_pine','1x6_pine','1x8_pine','1x12_pine',
  '2x4_cedar','2x6_cedar','1x6_cedar','4x4_cedar',
  'plywood_3_4','plywood_1_2','plywood_1_4','mdf_3_4','osb_7_16','masonite_1_8',
  'dowel_1in','dowel_3_4in',
  'coping_pipe_2in','coping_pipe_2_375in','rebar_1_2in',
]);
const VALID_METHODS = new Set([
  'pocket_screw','wood_screw','lag_bolt','carriage_bolt','dowel',
  'biscuit','glue_only','nail','dado','hinge',
]);
const VALID_LOAD_CLASSES = new Set(['structural','shear','fastening','light']);
const NO_FASTENER_METHODS = new Set(['glue_only','dado']);
const OUTDOOR_LUMBER = new Set(['2x4_cedar','2x6_cedar','1x6_cedar','4x4_cedar']);

// ---------- validation ----------
function validateDesign(d, label) {
  const errs = [];
  const warns = [];

  if (!d || typeof d !== 'object') { errs.push('not an object'); return { errs, warns }; }
  if (!Array.isArray(d.parts) || d.parts.length === 0) errs.push('no parts');

  const partIds = new Set();
  (d.parts || []).forEach((p, i) => {
    const ref = p.id || `part[${i}]`;
    if (!p.id) errs.push(`${ref}: missing id`);
    else partIds.add(p.id);
    if (!p.lumber) errs.push(`${ref}: missing lumber`);
    else if (!LUMBER_KEYS.has(p.lumber)) errs.push(`${ref}: unknown lumber "${p.lumber}"`);
    if (!Array.isArray(p.size_in) || p.size_in.length !== 3) errs.push(`${ref}: size_in must be [x,y,z]`);
    if (!Array.isArray(p.position_in) || p.position_in.length !== 3) errs.push(`${ref}: position_in must be [x,y,z]`);
    if (p.shape === 'arc') {
      if (!p.arc || typeof p.arc.radius_in !== 'number' || p.arc.radius_in <= 0)
        errs.push(`${ref}: arc shape requires arc.radius_in > 0`);
      if (!p.arc || typeof p.arc.depth_in !== 'number' || p.arc.depth_in <= 0)
        errs.push(`${ref}: arc shape requires arc.depth_in > 0`);
    }
  });

  const isOutdoor = (d.parts || []).some(p => OUTDOOR_LUMBER.has(p.lumber));

  if (!Array.isArray(d.joins) || d.joins.length === 0) {
    warns.push('no joins defined');
  } else {
    d.joins.forEach((j, i) => {
      const ref = j.id || `join[${i}]`;
      if (!j.method) { errs.push(`${ref}: missing method`); return; }
      if (!VALID_METHODS.has(j.method)) errs.push(`${ref}: unknown method "${j.method}"`);

      // Part reference integrity — handle both array and comma-separated string (model quirk)
      let toList = Array.isArray(j.to) ? j.to
        : typeof j.to === 'string' ? j.to.split(',').map(s => s.trim())
        : j.to ? [j.to] : [];
      const targets = toList.concat([j.from]).filter(Boolean);
      targets.forEach(id => { if (!partIds.has(id)) errs.push(`${ref}: references unknown part "${id}"`); });

      // Structural fields — required by new schema
      if (!j.load_class) warns.push(`${ref}: missing load_class (expected structural|shear|fastening|light)`);
      else if (!VALID_LOAD_CLASSES.has(j.load_class)) errs.push(`${ref}: invalid load_class "${j.load_class}"`);

      const needsFastener = !NO_FASTENER_METHODS.has(j.method);
      if (needsFastener) {
        if (typeof j.fastener_size_in !== 'number' || j.fastener_size_in <= 0)
          warns.push(`${ref}: missing/invalid fastener_size_in`);
        if (typeof j.count_per_join !== 'number' || j.count_per_join <= 0)
          warns.push(`${ref}: missing/invalid count_per_join`);
        // Penetration sanity: fastener should be > 1" (absolute floor)
        if (typeof j.fastener_size_in === 'number' && j.fastener_size_in < 1)
          errs.push(`${ref}: fastener_size_in ${j.fastener_size_in}" is suspiciously short`);
      }

      // Outdoor hardware check
      if (isOutdoor && needsFastener && j.load_class === 'structural') {
        const notes = (j.notes || '').toLowerCase();
        if (!/hdg|stainless|galvanized|galvan|exterior|coated/.test(notes))
          warns.push(`${ref}: outdoor structural join — notes should specify HDG/stainless`);
      }
    });
  }

  // Span check: shelves > 30" unsupported on 3/4 ply
  (d.parts || []).forEach(p => {
    if (p.lumber === 'plywood_3_4' && Array.isArray(p.size_in)) {
      const maxFace = Math.max(...p.size_in.filter((v, i) => {
        const th = p.size_in[i];
        return th !== 0.75;
      }));
      if (maxFace > 30) warns.push(`part ${p.id}: 3/4" plywood face dim ${maxFace}" — verify unsupported span ≤ 30"`);
    }
  });

  return { errs, warns };
}

// ---------- test cases ----------
const TESTS = [
  {
    label: 'Indoor side table (lamp table)',
    prompt: 'A small side table about 18 inches tall to hold a lamp next to my couch.',
    expect: { minParts: 4, maxParts: 20, minJoins: 2, outdoor: false },
  },
  {
    label: 'Bookshelf (tall, needs back panel)',
    prompt: 'A bookshelf about 6 feet tall and 30 inches wide for paperback books.',
    expect: { minParts: 3, maxParts: 20, minJoins: 2, outdoor: false },
  },
  {
    label: 'Outdoor picnic table (cedar, HDG hardware)',
    prompt: 'A classic picnic table for the backyard, cedar, seats 6.',
    expect: { minParts: 5, maxParts: 25, minJoins: 3, outdoor: true },
  },
  {
    label: 'Raised garden bed (cedar, outdoor)',
    prompt: 'A raised garden bed, about 4 feet by 8 feet, 18 inches tall.',
    expect: { minParts: 4, maxParts: 30, minJoins: 2, outdoor: true },
  },
  {
    label: 'Quarter pipe skate ramp (arc + coping)',
    prompt: 'Build me a 4-foot-tall quarter pipe skateboard ramp, 8 feet wide.',
    expect: { minParts: 6, maxParts: 30, minJoins: 2, outdoor: false, requiresArc: true },
  },
];

// ---------- helpers ----------
const green  = (s) => `\x1b[32m${s}\x1b[0m`;
const red    = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;
const dim    = (s) => `\x1b[2m${s}\x1b[0m`;

async function fetchSystemPrompt() {
  const res = await fetch(`${BASE_URL.replace(':3001', ':5174')}/selfbuilt-workshop.html`);
  const html = await res.text();
  const m = html.match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/);
  if (!m) throw new Error('Could not extract SYSTEM_PROMPT from workshop HTML');
  const prompt = m[1];
  // Backticks inside the template literal silently break the JS module.
  const innerTicks = (prompt.match(/`/g) || []).length;
  if (innerTicks > 0) {
    console.warn(yellow(`⚠ SYSTEM_PROMPT contains ${innerTicks} unescaped backtick(s) — JS module will break!`));
  }
  return prompt;
}

async function callDsl(systemPrompt, userPrompt) {
  const res = await fetch(`${BASE_URL}/api/dsl`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = (data.text || '').trim();
  const first = text.indexOf('{');
  const last  = text.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error(`No JSON object in response:\n${text.slice(0, 300)}`);
  return JSON.parse(text.slice(first, last + 1));
}

function runExpectChecks(design, expect) {
  const issues = [];
  const parts = design.parts || [];
  const joins = design.joins || [];
  if (parts.length < expect.minParts)
    issues.push(`only ${parts.length} parts (expected ≥ ${expect.minParts})`);
  if (parts.length > expect.maxParts)
    issues.push(`${parts.length} parts seems high (expected ≤ ${expect.maxParts})`);
  if (joins.length < expect.minJoins)
    issues.push(`only ${joins.length} joins (expected ≥ ${expect.minJoins})`);
  if (expect.outdoor) {
    const hasOutdoorLumber = parts.some(p => OUTDOOR_LUMBER.has(p.lumber));
    if (!hasOutdoorLumber)
      issues.push('no outdoor lumber (expected cedar for outdoor build)');
  }
  if (expect.requiresArc) {
    const hasArc = parts.some(p => p.shape === 'arc');
    if (!hasArc)
      issues.push('no arc parts (skate ramp must have curved transitions)');
    const hasCoping = parts.some(p => /coping_pipe/.test(p.lumber || ''));
    if (!hasCoping)
      issues.push('no coping pipe (skate ramp must have steel coping)');
  }
  return issues;
}

// ---------- runner ----------
async function run() {
  console.log(bold('\nSelfBuilt DSL Self-Test'));
  console.log(dim(`API: ${BASE_URL}  |  ${TESTS.length} test cases\n`));

  let systemPrompt;
  try {
    process.stdout.write('Fetching system prompt from Vite … ');
    systemPrompt = await fetchSystemPrompt();
    console.log(green('ok'));
  } catch (e) {
    console.log(red(`FAILED: ${e.message}`));
    process.exit(1);
  }

  let passed = 0, failed = 0;
  const results = [];

  for (const tc of TESTS) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(bold(`▶ ${tc.label}`));
    console.log(dim(`  "${tc.prompt}"`));

    const t0 = Date.now();
    let design;
    try {
      design = await callDsl(systemPrompt, tc.prompt);
    } catch (e) {
      console.log(red(`  API error: ${e.message}`));
      failed++;
      results.push({ label: tc.label, status: 'FAIL', reason: e.message });
      continue;
    }
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    const { errs, warns } = validateDesign(design, tc.label);
    const expectIssues = runExpectChecks(design, tc.expect);

    const allErrs = [...errs, ...expectIssues];
    const status = allErrs.length === 0 ? 'PASS' : 'FAIL';

    const joins = design.joins || [];
    const loadClassCoverage = joins.length === 0 ? 0 :
      joins.filter(j => j.load_class).length / joins.length;
    const fastenerCoverage = joins.length === 0 ? 0 :
      joins.filter(j => typeof j.fastener_size_in === 'number').length / joins.length;

    console.log(`  ${status === 'PASS' ? green('PASS') : red('FAIL')}  ${elapsed}s  |  ${(design.parts||[]).length} parts  ${joins.length} joins  |  load_class ${(loadClassCoverage*100).toFixed(0)}%  fastener_size ${(fastenerCoverage*100).toFixed(0)}%`);
    console.log(`  ${dim('name:')} ${design.name || '(none)'}`);

    if (allErrs.length) {
      allErrs.forEach(e => console.log(`  ${red('✗')} ${e}`));
    }
    if (warns.length) {
      warns.forEach(w => console.log(`  ${yellow('⚠')} ${w}`));
    }

    // Show BOM summary
    const bomLines = [];
    joins.forEach(j => {
      const count = j.count_per_join || 2;
      const conns = Array.isArray(j.to) ? j.to.length : 1;
      const len = j.fastener_size_in ? `${j.fastener_size_in}"` : '(default)';
      if (!NO_FASTENER_METHODS.has(j.method)) {
        bomLines.push(`    ${count * conns}× ${j.method} @ ${len}`);
      }
    });
    if (bomLines.length) {
      console.log(`  ${dim('BOM preview:')}`);
      bomLines.slice(0, 5).forEach(l => console.log(dim(l)));
      if (bomLines.length > 5) console.log(dim(`    … +${bomLines.length - 5} more`));
    }

    if (status === 'PASS') passed++; else failed++;
    results.push({ label: tc.label, status, errs: allErrs, warns });
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(bold('Results:') + `  ${green(passed + ' passed')}  ${failed ? red(failed + ' failed') : dim('0 failed')}  of ${TESTS.length} total`);

  if (failed > 0) {
    console.log(red('\nFailed tests:'));
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  • ${r.label}`);
      (r.errs || []).forEach(e => console.log(`    ${e}`));
    });
    process.exit(1);
  } else {
    console.log(green('\nAll tests passed.'));
  }
}

run().catch(e => {
  console.error(red('Fatal:'), e.message);
  process.exit(1);
});
