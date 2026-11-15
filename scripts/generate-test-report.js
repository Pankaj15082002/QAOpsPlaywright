const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const [resultsPath, evidenceDirectory, reportPath] = process.argv.slice(2);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function scenarioFileName(uri, name) {
  const featureName = path.basename(uri || 'feature').replace(/\.[^.]+$/, '');
  const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug(featureName)}-${slug(name)}`;
}

function formatDuration(milliseconds) {
  return milliseconds < 1000
    ? `${Math.round(milliseconds)} ms`
    : `${(milliseconds / 1000).toFixed(2)} s`;
}

const features = JSON.parse(readFileSync(resultsPath, 'utf8'));
const reportDirectory = path.dirname(reportPath);
const scenarios = features.flatMap((feature) => (feature.elements || [])
  .filter((element) => element.type === 'scenario' || element.keyword === 'Scenario')
  .map((scenario) => {
    const steps = (scenario.steps || [])
      .filter((step) => step.name && step.keyword)
      .map((step) => ({
        keyword: step.keyword.trim(),
        name: step.name,
        status: String(step.result?.status || 'unknown').toLowerCase(),
        durationMs: Number(step.result?.duration || 0) / 1_000_000,
        error: step.result?.error_message,
      }));
    const failed = steps.some((step) => ['failed', 'undefined', 'ambiguous'].includes(step.status));
    const passed = steps.length > 0 && steps.every((step) => step.status === 'passed');
    const fileName = scenarioFileName(feature.uri, scenario.name);
    const screenshotPath = path.join(evidenceDirectory, `${fileName}.png`);
    const videoPath = path.join(evidenceDirectory, `${fileName}.webm`);
    const evidenceLink = (filePath) => path.relative(reportDirectory, filePath).split(path.sep).join('/');

    return {
      name: scenario.name || 'Unnamed scenario',
      status: failed ? 'failed' : passed ? 'passed' : 'skipped',
      durationMs: steps.reduce((total, step) => total + step.durationMs, 0),
      steps,
      screenshot: existsSync(screenshotPath) ? evidenceLink(screenshotPath) : null,
      video: existsSync(videoPath) ? evidenceLink(videoPath) : null,
    };
  }));

const allSteps = scenarios.flatMap((scenario) => scenario.steps);
const passedSteps = allSteps.filter((step) => step.status === 'passed').length;
const failedSteps = allSteps.filter((step) => ['failed', 'undefined', 'ambiguous'].includes(step.status)).length;
const skippedSteps = allSteps.length - passedSteps - failedSteps;
const totalDurationMs = scenarios.reduce((total, scenario) => total + scenario.durationMs, 0);
const scenarioMarkup = scenarios.map((scenario, index) => {
  const steps = scenario.steps.map((step) => `
        <li class="step-row">
          <span class="step-keyword">${escapeHtml(step.keyword)}</span>
          <span class="step-name">${escapeHtml(step.name)}${step.error ? `<pre>${escapeHtml(step.error)}</pre>` : ''}</span>
          <span class="status status-${escapeHtml(step.status)}">${escapeHtml(step.status)}</span>
        </li>`).join('');
  const screenshot = scenario.screenshot
    ? `<a href="${escapeHtml(scenario.screenshot)}" target="_blank" rel="noreferrer"><img class="screenshot" src="${escapeHtml(scenario.screenshot)}" alt="Screenshot for ${escapeHtml(scenario.name)}"></a>`
    : '<p class="empty-evidence">No screenshot captured.</p>';
  const video = scenario.video
    ? `<video controls preload="metadata" src="${escapeHtml(scenario.video)}">Video playback is not supported by this browser.</video>`
    : '<p class="empty-evidence">No video recording available.</p>';

  return `
      <article class="scenario">
        <header class="scenario-header">
          <div><p class="scenario-index">Scenario #${index + 1}</p><h2>Scenario: ${escapeHtml(scenario.name)}</h2></div>
          <span class="status status-${scenario.status}">${scenario.status}</span>
        </header>
        <ol class="steps">${steps}
        </ol>
        <section class="evidence">
          <div><h3>Screenshot evidence</h3>${screenshot}</div>
          <div><h3>Video recording</h3>${video}</div>
        </section>
      </article>`;
}).join('');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>E-commerce order test report</title>
  <style>
    :root { color-scheme: light; font-family: "Segoe UI", sans-serif; color: #17212b; background: #f2f5f4; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    main { width: min(980px, calc(100% - 32px)); margin: 42px auto; }
    .eyebrow { margin: 0 0 8px; color: #47766b; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    h1 { margin: 0; font-size: 30px; }
    .meta { margin: 8px 0 24px; color: #617078; }
    .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid #dce4e2; background: #fff; }
    .metric { padding: 18px 20px; border-right: 1px solid #e6ecea; }
    .metric:last-child { border-right: 0; }
    .metric-label { display: block; color: #617078; font-size: 13px; }
    .metric-value { display: block; margin-top: 6px; font-size: 27px; font-weight: 700; }
    .note { margin: 12px 0 26px; color: #65747b; font-size: 13px; }
    .scenario { margin-top: 18px; border: 1px solid #dce4e2; background: #fff; }
    .scenario-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 20px; border-bottom: 1px solid #e6ecea; }
    .scenario-index { margin: 0 0 5px; color: #68777e; font-size: 12px; text-transform: uppercase; }
    h2 { margin: 0; font-size: 20px; }
    .status { display: inline-flex; align-items: center; justify-content: center; min-width: 76px; padding: 5px 9px; border-radius: 3px; font-size: 12px; font-weight: 700; text-transform: capitalize; }
    .status-passed { color: #176245; background: #e4f4eb; }
    .status-failed { color: #9c3030; background: #fde9e7; }
    .status-skipped, .status-pending, .status-unknown, .status-undefined { color: #785c1f; background: #fbf1d8; }
    .steps { margin: 0; padding: 0; list-style: none; }
    .step-row { display: grid; grid-template-columns: 64px 1fr auto; align-items: center; gap: 12px; padding: 13px 20px; border-bottom: 1px solid #edf1f0; }
    .step-keyword { color: #47766b; font-size: 13px; font-weight: 700; }
    .step-name { min-width: 0; overflow-wrap: anywhere; }
    pre { white-space: pre-wrap; color: #9c3030; }
    .evidence { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; padding: 20px; background: #f8faf9; }
    h3 { margin: 0 0 12px; font-size: 14px; }
    .screenshot, video { display: block; width: 100%; max-height: 420px; object-fit: contain; background: #e7ecea; }
    .empty-evidence { margin: 0; color: #78868c; font-size: 13px; }
    @media (max-width: 640px) {
      main { margin: 24px auto; }
      .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric:nth-child(2) { border-right: 0; }
      .metric:nth-child(-n+2) { border-bottom: 1px solid #e6ecea; }
      .scenario-header { align-items: flex-start; }
      .step-row { grid-template-columns: 54px 1fr; }
      .step-row .status { grid-column: 2; justify-self: start; }
      .evidence { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Automation results</p>
    <h1>E-commerce order report</h1>
    <p class="meta">Execution duration: ${formatDuration(totalDurationMs)}</p>
    <section class="summary" aria-label="Execution summary">
      <div class="metric"><span class="metric-label">Scenarios</span><span class="metric-value">${scenarios.length}</span></div>
      <div class="metric"><span class="metric-label">Passed steps</span><span class="metric-value">${passedSteps}</span></div>
      <div class="metric"><span class="metric-label">Failed steps</span><span class="metric-value">${failedSteps}</span></div>
      <div class="metric"><span class="metric-label">Skipped steps</span><span class="metric-value">${skippedSteps}</span></div>
    </section>
    <p class="note">Counts and duration are based on the selected feature files and this execution. Dry-run steps are shown as skipped.</p>
    ${scenarioMarkup || '<p>No scenarios were found in this run.</p>'}
  </main>
</body>
</html>`;

writeFileSync(reportPath, html, 'utf8');
console.log(`E-commerce report generated: ${reportPath}`);