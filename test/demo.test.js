const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'mitchell-firm-brain.html'),
  'utf8',
);

function openDemo(t) {
  const scriptErrors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => scriptErrors.push(error));

  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    runScripts: 'dangerously',
    url: 'http://127.0.0.1/mitchell-firm-brain.html',
    virtualConsole,
    beforeParse(window) {
      window.matchMedia = () => ({
        matches: true,
        addEventListener() {},
        removeEventListener() {},
      });
      window.scrollTo = () => {};
    },
  });

  t.after(() => dom.window.close());
  return { document: dom.window.document, dom, scriptErrors };
}

async function waitFor(assertion, timeout = 1800) {
  const started = Date.now();
  let lastError;

  while (Date.now() - started < timeout) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  }

  throw lastError;
}

test('declares a real mobile viewport', (t) => {
  const { document } = openDemo(t);
  const viewport = document.querySelector('meta[name="viewport"]');

  assert.ok(viewport, 'mobile browsers need an explicit viewport declaration');
  assert.equal(viewport.content, 'width=device-width, initial-scale=1');
});

test('shows the Mitchell Firm logo in the primary brand area', (t) => {
  const { document } = openDemo(t);
  const brand = document.querySelector('.brand');
  const logo = document.querySelector('.brand img.firm-logo');

  assert.ok(brand, 'the primary brand area should remain present');
  assert.ok(logo, 'the supplied firm logo should anchor the sidebar');
  assert.equal(logo.getAttribute('src'), 'assets/mitchell-firm-logo.png');
  assert.equal(logo.getAttribute('alt'), 'The Mitchell Firm');
  assert.equal(logo.getAttribute('width'), '338');
  assert.equal(logo.getAttribute('height'), '197');
  assert.equal(brand.querySelector('.prod')?.textContent.trim(), 'Company Brain');
  assert.match(brand.querySelector('.demo-label')?.textContent ?? '', /sample matters/i);
});

test('opens on a Today dashboard with four operational summaries', (t) => {
  const { document, scriptErrors } = openDemo(t);

  const dashboard = document.querySelector('#view-dashboard');
  const dashboardNav = document.querySelector('[data-view="dashboard"]');

  assert.ok(dashboard, 'the Today dashboard should exist');
  assert.ok(dashboard.classList.contains('active'), 'the dashboard should be the opening view');
  assert.equal(dashboardNav.getAttribute('aria-current'), 'page');
  assert.equal(document.querySelector('#viewTitle').textContent, 'Today');
  assert.equal(dashboard.querySelectorAll('.metric-card').length, 4);
  assert.deepEqual(scriptErrors, []);
});

test('dashboard command action opens the existing Ask workflow', (t) => {
  const { document } = openDemo(t);

  const commandAction = document.querySelector('#view-dashboard [data-go="ask"]');
  assert.ok(commandAction, 'the dashboard should provide an Ask action');
  commandAction.click();

  assert.ok(document.querySelector('#view-ask').classList.contains('active'));
  assert.equal(document.querySelector('[data-view="ask"]').getAttribute('aria-current'), 'page');
  assert.equal(document.querySelector('#viewTitle').textContent, 'Ask the brain');
});

test('labels the capture workflow as Research Agent', (t) => {
  const { document } = openDemo(t);
  const researchAgentNav = document.querySelector('[data-view="captures"]');

  assert.match(researchAgentNav.textContent.trim(), /^Research Agent/);
  assert.doesNotMatch(researchAgentNav.textContent, /web capture/i);

  researchAgentNav.click();

  assert.equal(document.querySelector('#viewTitle').textContent, 'Research Agent');
  assert.equal(document.title, 'Research Agent · Mitchell Firm Brain');
});

test('all existing workflow destinations remain navigable', (t) => {
  const { document } = openDemo(t);
  const destinations = [
    'ask',
    'matters',
    'captures',
    'intake',
    'reliability',
    'sovereignty',
    'plan',
  ];

  for (const destination of destinations) {
    document.querySelector(`[data-view="${destination}"]`).click();

    assert.ok(document.querySelector(`#view-${destination}`).classList.contains('active'));
    assert.equal(document.querySelectorAll('.view.active').length, 1);
    assert.equal(document.querySelectorAll('.navbtn[aria-current="page"]').length, 1);
  }
});

test('a scripted prompt still produces a cited answer', async (t) => {
  const { document } = openDemo(t);
  document.querySelector('[data-view="ask"]').click();

  document.querySelector('.prompt').click();
  await new Promise((resolve) => setTimeout(resolve, 90));

  assert.equal(document.querySelectorAll('#thread .msg.user').length, 1);
  assert.equal(document.querySelectorAll('#thread .msg:last-child .cite').length, 2);
});

test('capture and intake approval reach their completed states', async (t) => {
  const { document, scriptErrors } = openDemo(t);

  const initialCaptureCount = document.querySelectorAll('#capBody tr').length;
  document.querySelector('#runCapture').click();
  await waitFor(() => {
    assert.equal(document.querySelector('#runCapture').textContent, 'Capture again');
  });
  assert.equal(document.querySelectorAll('#capBody tr').length, initialCaptureCount + 4);

  document.querySelector('#intakeApprove').click();
  assert.equal(document.querySelector('#intakeApprove').textContent, 'Sent 3 actions');
  assert.equal(document.querySelector('#intakeApprove').disabled, true);
  assert.deepEqual(scriptErrors, []);
});

test('the demo does not present inert edit actions', async (t) => {
  const { document } = openDemo(t);

  const editButtons = () => [...document.querySelectorAll('button')]
    .filter((button) => button.textContent.trim().toLowerCase().startsWith('edit'));

  assert.equal(editButtons().length, 0);

  document.querySelector('[data-view="ask"]').click();
  document.querySelector('[data-key="email"]').click();
  await waitFor(() => {
    assert.ok(document.querySelector('#thread .action'));
  });
  assert.equal(editButtons().length, 0);
});
