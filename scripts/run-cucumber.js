const { spawn, spawnSync } = require('node:child_process');
const { existsSync, mkdirSync } = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const cucumberCli = path.join(
	projectRoot,
	'node_modules',
	'@cucumber',
	'cucumber',
	'bin',
	'cucumber.js'
);
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const resultsPath = path.join(projectRoot, 'test-results', `bdd-results-${runId}.json`);
const relativeResultsPath = path.relative(projectRoot, resultsPath).split(path.sep).join('/');
const evidenceDirectory = path.join(projectRoot, 'reports', 'evidence', runId);
const reportPath = path.join(projectRoot, 'reports', 'createorder-report.html');

mkdirSync(path.dirname(resultsPath), { recursive: true });
mkdirSync(evidenceDirectory, { recursive: true });

const testResult = spawnSync(process.execPath, [
	cucumberCli,
	...process.argv.slice(2),
	'--format',
	`json:${relativeResultsPath}`,
], {
	cwd: projectRoot,
	env: { ...process.env, BDD_RUN_ID: runId },
	stdio: 'inherit',
});

let reportGenerated = false;
if (!testResult.error && existsSync(resultsPath)) {
	const reportResult = spawnSync(process.execPath, [
		path.join(__dirname, 'generate-test-report.js'),
		resultsPath,
		evidenceDirectory,
		reportPath,
	], {
		cwd: projectRoot,
		stdio: 'inherit',
	});

	reportGenerated = !reportResult.error && reportResult.status === 0;
	if (!reportGenerated) {
		console.error(reportResult.error || 'Could not generate the order report.');
	}
}

if (testResult.error) {
	console.error(testResult.error);
}

if (reportGenerated) {
	const command = process.platform === 'win32'
		? 'cmd.exe'
		: process.platform === 'darwin'
			? 'open'
			: 'xdg-open';
	const args = process.platform === 'win32'
		? ['/c', 'start', '', reportPath]
		: [reportPath];
	const opener = spawn(command, args, { detached: true, stdio: 'ignore' });
	opener.unref();
}

process.exitCode = testResult.status ?? 1;
