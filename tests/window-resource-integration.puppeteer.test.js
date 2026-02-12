const assert = require('assert');
const http = require('http');
const path = require('path');
const { describe, it, before, after } = require('mocha');

const Server = require('../server');
const { get_free_port } = require('../port-utils');
const {
    ensure_puppeteer_module,
    launch_puppeteer_browser,
    start_control_example_server,
    stop_server_instance,
    open_page,
    assert_clean_page_probe,
    set_input_value_with_events,
    wait_for_text_content,
    drag_by,
    run_interaction_story,
    wait_for_condition
} = require('./helpers/puppeteer-e2e-harness');

const repo_root_path = path.join(__dirname, '..');
const examples_controls_root_path = path.join(repo_root_path, 'examples', 'controls');
const fixture_client_path = path.join(__dirname, 'fixtures', 'resource-monitor-client.js');
const dummy_client_path = path.join(__dirname, 'dummy-client.js');

const read_resource_state = (server_instance, resource_name) => {
    const resource = server_instance.resource_pool.get_resource(resource_name);
    return resource ? resource.status.state : null;
};

const fetch_text_response = (port, route_path = '/') => {
    return new Promise((resolve, reject) => {
        const request = http.get({
            hostname: '127.0.0.1',
            port,
            path: route_path
        }, (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
                resolve({
                    status_code: response.statusCode,
                    body_text: Buffer.concat(chunks).toString('utf8')
                });
            });
        });

        request.on('error', reject);
    });
};

const post_json_response = (port, route_path, payload = {}) => {
    return new Promise((resolve, reject) => {
        const body_text = JSON.stringify(payload);
        const request = http.request({
            hostname: '127.0.0.1',
            port,
            path: route_path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body_text, 'utf8')
            }
        }, (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
                const response_text = Buffer.concat(chunks).toString('utf8');
                let parsed_body = null;
                try {
                    parsed_body = response_text.length ? JSON.parse(response_text) : null;
                } catch {
                    parsed_body = response_text;
                }
                resolve({
                    status_code: response.statusCode,
                    body: parsed_body
                });
            });
        });

        request.on('error', reject);
        request.write(body_text);
        request.end();
    });
};

describe('Window Controls + Resource Integration Puppeteer Tests', function () {
    this.timeout(180000);

    let puppeteer_module = null;
    let browser_instance = null;

    before(async function () {
        this.timeout(60000);

        puppeteer_module = ensure_puppeteer_module();
        if (!puppeteer_module) {
            this.skip();
            return;
        }

        try {
            browser_instance = await launch_puppeteer_browser(puppeteer_module);
        } catch {
            this.skip();
        }
    });

    after(async function () {
        if (browser_instance) {
            await browser_instance.close();
            browser_instance = null;
        }
    });

    it('supports step-based, precise date/datetime control interactions', async () => {
        const { server_instance, port } = await start_control_example_server({
            examples_root_path: examples_controls_root_path,
            dir_name: '9) window, date picker',
            ctrl_name: 'Demo_UI'
        });

        let page = null;
        let page_probe = null;

        try {
            const open_result = await open_page(browser_instance, `http://127.0.0.1:${port}/`);
            page = open_result.page;
            page_probe = open_result.page_probe;

            const initial_datetime_text = { value: '' };
            const initial_time_display = { value: '' };

            const story_steps = [
                {
                    name: 'wait_for_controls',
                    run: async (target_page) => {
                        await target_page.waitForSelector('input.date-picker[type="date"]');
                        await target_page.waitForSelector('.demo-datetime-picker.datetime-picker');
                    }
                },
                {
                    name: 'set_primary_date',
                    run: async (target_page) => {
                        await set_input_value_with_events(target_page, 'input.date-picker', '2026-07-15', ['input', 'change']);
                    },
                    assert: async (target_page) => {
                        await target_page.waitForFunction(() => {
                            const output_element = document.querySelector('.demo-date-output');
                            return output_element && String(output_element.textContent || '').includes('2026-07-15');
                        });
                    }
                },
                {
                    name: 'switch_to_time_tab',
                    run: async (target_page) => {
                        initial_datetime_text.value = await target_page.$eval('.demo-datetime-output', (element) => {
                            return String(element.textContent || '').trim();
                        });
                        initial_time_display.value = await target_page.$eval('.demo-datetime-picker .tp-display-time', (element) => {
                            return String(element.textContent || '').trim();
                        });

                        const clicked = await target_page.evaluate(() => {
                            const root_element = document.querySelector('.demo-datetime-picker');
                            if (!root_element) return false;
                            const time_tab = Array.from(root_element.querySelectorAll('.dtp-tab')).find((tab_element) => {
                                return String(tab_element.textContent || '').toLowerCase().includes('time');
                            });
                            if (!time_tab) return false;
                            time_tab.click();
                            return true;
                        });

                        assert.strictEqual(clicked, true, 'Expected to click DateTime time tab');
                        await target_page.waitForSelector('.demo-datetime-picker .time-picker');
                    }
                },
                {
                    name: 'advance_time_spinners',
                    run: async (target_page) => {
                        const did_click_spinners = await target_page.evaluate(() => {
                            const hour_spinner = document.querySelector('.demo-datetime-picker .tp-spinner-up.tp-h-up');
                            const minute_spinner = document.querySelector('.demo-datetime-picker .tp-spinner-up.tp-m-up');
                            if (!hour_spinner || !minute_spinner) return false;
                            hour_spinner.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                            minute_spinner.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                            return true;
                        });
                        assert.strictEqual(did_click_spinners, true, 'Expected DateTime spinner controls to be present');
                    },
                    assert: async (target_page) => {
                        await target_page.waitForFunction((before_output_text, before_time_text) => {
                            const output_element = document.querySelector('.demo-datetime-output');
                            const time_element = document.querySelector('.demo-datetime-picker .tp-display-time');
                            if (!output_element && !time_element) return false;
                            const next_output_text = String((output_element && output_element.textContent) || '').trim();
                            const next_time_text = String((time_element && time_element.textContent) || '').trim();
                            return next_output_text !== before_output_text || next_time_text !== before_time_text;
                        }, {}, initial_datetime_text.value, initial_time_display.value);
                    }
                },
                {
                    name: 'drag_window_and_keep_controls_live',
                    run: async (target_page) => {
                        await drag_by(target_page, '.window .title.bar', 90, 55);
                        await set_input_value_with_events(target_page, 'input.date-picker', '2026-10-04', ['input', 'change']);
                    },
                    assert: async (target_page) => {
                        await target_page.waitForFunction(() => {
                            const output_element = document.querySelector('.demo-date-output');
                            return output_element && String(output_element.textContent || '').includes('Date value: 2026-10-04');
                        });
                    }
                }
            ];

            const step_results = await run_interaction_story({
                page,
                story_name: 'date_time_control_story',
                steps: story_steps
            });

            assert.strictEqual(step_results.length, story_steps.length);

            assert_clean_page_probe(page_probe);
        } finally {
            if (page_probe && typeof page_probe.detach === 'function') {
                page_probe.detach();
            }
            if (page) {
                await page.close();
            }
            await stop_server_instance(server_instance);
        }
    });

    it('verifies client-side resource lifecycle controls against server resource state and SSE events', async () => {
        const fixture_module = require(fixture_client_path);
        const resource_monitor_ctrl = fixture_module.controls && fixture_module.controls.Resource_Monitor_App;
        assert(resource_monitor_ctrl, 'Expected Resource_Monitor_App control export in test fixture');

        const port = await get_free_port();
        let server_instance = null;

        server_instance = await Server.serve({
            host: '127.0.0.1',
            port,
            ctrl: resource_monitor_ctrl,
            clientPath: fixture_client_path,
            resources: {
                e2e_worker: {
                    type: 'process',
                    command: process.execPath,
                    args: ['-e', 'setInterval(() => {}, 1000);'],
                    autoRestart: false,
                    processManager: {
                        type: 'direct'
                    }
                }
            },
            events: true,
            api: {
                'resource/status': () => {
                    const resource = server_instance.resource_pool.get_resource('e2e_worker');
                    return {
                        ok: !!resource,
                        status: resource ? resource.status : null,
                        summary: server_instance.resource_pool.summary
                    };
                },
                'resource/start': async () => {
                    const resource = server_instance.resource_pool.get_resource('e2e_worker');
                    if (!resource) {
                        return { ok: false, error: 'missing_resource' };
                    }
                    await resource.start();
                    return {
                        ok: true,
                        status: resource.status
                    };
                },
                'resource/stop': async () => {
                    const resource = server_instance.resource_pool.get_resource('e2e_worker');
                    if (!resource) {
                        return { ok: false, error: 'missing_resource' };
                    }
                    await resource.stop();
                    return {
                        ok: true,
                        status: resource.status
                    };
                },
                'resource/restart': async () => {
                    const resource = server_instance.resource_pool.get_resource('e2e_worker');
                    if (!resource) {
                        return { ok: false, error: 'missing_resource' };
                    }
                    await resource.restart();
                    return {
                        ok: true,
                        status: resource.status
                    };
                }
            }
        });

        let page = null;
        let page_probe = null;

        try {
            const started_running = await wait_for_condition(() => {
                return read_resource_state(server_instance, 'e2e_worker') === 'running';
            }, 6000, 25);
            assert.strictEqual(started_running, true, 'Expected e2e_worker to start in running state');

            const root_route_ready = await wait_for_condition(async () => {
                try {
                    const response = await fetch_text_response(port, '/');
                    return response.status_code === 200 && response.body_text.includes('resource-monitor-root');
                } catch {
                    return false;
                }
            }, 20000, 200);
            assert.strictEqual(root_route_ready, true, 'Expected root route to be ready before browser navigation');

            const open_result = await open_page(browser_instance, `http://127.0.0.1:${port}/`);
            page = open_result.page;
            page_probe = open_result.page_probe;

            await page.waitForSelector('#resource-state');
            await wait_for_text_content(page, '#resource-state', 'running');

            const resource_story_steps = [
                {
                    name: 'stop_via_client_button',
                    run: async (target_page) => {
                        await target_page.click('#resource-stop-btn');
                    },
                    assert: async (target_page) => {
                        await wait_for_text_content(target_page, '#resource-state', 'stopped');
                    }
                },
                {
                    name: 'start_via_client_button',
                    run: async (target_page) => {
                        await target_page.click('#resource-start-btn');
                    },
                    assert: async (target_page) => {
                        await wait_for_text_content(target_page, '#resource-state', 'running');
                    }
                },
                {
                    name: 'restart_via_client_button',
                    run: async (target_page) => {
                        await target_page.click('#resource-restart-btn');
                    },
                    assert: async (target_page) => {
                        const ready_running = await target_page.waitForFunction(() => {
                            const state_element = document.getElementById('resource-state');
                            const events_count_element = document.getElementById('resource-events-count');
                            if (!state_element || !events_count_element) return false;

                            const state_text = String(state_element.textContent || '').trim();
                            const events_count = Number.parseInt(String(events_count_element.textContent || '0'), 10) || 0;
                            return state_text === 'running' && events_count >= 2;
                        }, { timeout: 8000 });

                        assert(ready_running, 'Expected running state and recorded resource events after restart');
                    }
                }
            ];

            const story_result = await run_interaction_story({
                page,
                story_name: 'resource_control_story',
                steps: resource_story_steps
            });
            assert.strictEqual(story_result.length, resource_story_steps.length);

            const client_debug_state = await page.evaluate(() => {
                return window.__resource_client_debug || { api_calls: [], sse_events: [] };
            });

            const invoked_routes = client_debug_state.api_calls.map((entry) => entry.route);
            assert(invoked_routes.includes('/api/resource/status'), 'Expected status API route invocation from client');
            assert(invoked_routes.includes('/api/resource/stop'), 'Expected stop API route invocation from client');
            assert(invoked_routes.includes('/api/resource/start'), 'Expected start API route invocation from client');
            assert(invoked_routes.includes('/api/resource/restart'), 'Expected restart API route invocation from client');

            const has_sse_state_event = client_debug_state.sse_events.some((entry) => {
                return entry && entry.event_name === 'resource_state_change';
            });
            assert.strictEqual(has_sse_state_event, true, 'Expected client to receive resource_state_change SSE events');

            const settled_running = await wait_for_condition(() => {
                return read_resource_state(server_instance, 'e2e_worker') === 'running';
            }, 6000, 25);
            assert.strictEqual(settled_running, true, 'Expected e2e_worker to settle back to running state');

            assert_clean_page_probe(page_probe, {
                allowed_request_failure_patterns: [
                    '/events',
                    'ERR_ABORTED'
                ]
            });
        } finally {
            if (page_probe && typeof page_probe.detach === 'function') {
                page_probe.detach();
            }
            if (page) {
                await page.close();
            }
            await stop_server_instance(server_instance);
        }
    });

    it('replays SSE events after reconnect using lastEventId continuity', async () => {
        const dummy_module = require(dummy_client_path);
        const dummy_ctrl = dummy_module.controls && dummy_module.controls.Dummy_Control;
        assert(dummy_ctrl, 'Expected Dummy_Control export in dummy test client');

        const port = await get_free_port();
        let server_instance = null;

        server_instance = await Server.serve({
            host: '127.0.0.1',
            port,
            ctrl: dummy_ctrl,
            clientPath: dummy_client_path,
            events: true,
            api: {
                'events/push': (input) => {
                    const payload = input && typeof input === 'object' ? input : {};
                    const sequence = Number(payload.seq) || 0;
                    const publish_result = server_instance.sse_publisher.broadcast('manual_test', {
                        seq: sequence
                    });
                    return {
                        ok: true,
                        eventId: publish_result.eventId
                    };
                }
            }
        });

        let page = null;
        let page_probe = null;

        try {
            const root_route_ready = await wait_for_condition(async () => {
                try {
                    const response = await fetch_text_response(port, '/');
                    return response.status_code === 200;
                } catch {
                    return false;
                }
            }, 20000, 200);
            assert.strictEqual(root_route_ready, true, 'Expected root route to be ready before browser navigation');

            const open_result = await open_page(browser_instance, `http://127.0.0.1:${port}/`);
            page = open_result.page;
            page_probe = open_result.page_probe;

            await page.evaluate(() => {
                window.__sse_replay_state = {
                    events: [],
                    connected: false
                };

                window.__connect_replay_source = (last_event_id) => {
                    if (window.__replay_event_source) {
                        try {
                            window.__replay_event_source.close();
                        } catch {
                            // Ignore close errors.
                        }
                    }

                    const query_suffix = last_event_id
                        ? `?clientId=replay_client&lastEventId=${encodeURIComponent(String(last_event_id))}`
                        : '?clientId=replay_client';

                    const event_source = new EventSource(`/events${query_suffix}`);
                    window.__replay_event_source = event_source;
                    window.__sse_replay_state.connected = false;

                    event_source.onopen = () => {
                        window.__sse_replay_state.connected = true;
                    };

                    event_source.addEventListener('manual_test', (event) => {
                        let payload = {};
                        try {
                            payload = JSON.parse(String(event.data || '{}'));
                        } catch {
                            payload = { raw: event.data };
                        }

                        window.__sse_replay_state.events.push({
                            id: Number(event.lastEventId),
                            seq: Number(payload.seq)
                        });
                    });
                };

                window.__close_replay_source = () => {
                    if (window.__replay_event_source) {
                        window.__replay_event_source.close();
                        window.__replay_event_source = null;
                    }
                    window.__sse_replay_state.connected = false;
                };
            });

            await page.evaluate(() => window.__connect_replay_source());
            const did_connect = await wait_for_condition(async () => {
                return page.evaluate(() => window.__sse_replay_state && window.__sse_replay_state.connected === true);
            }, 8000, 25);
            assert.strictEqual(did_connect, true, 'Expected replay EventSource to connect');

            const first_push = await post_json_response(port, '/api/events/push', { seq: 1 });
            assert.strictEqual(first_push.status_code, 200);
            assert.strictEqual(first_push.body.ok, true);

            const first_event_received = await wait_for_condition(async () => {
                return page.evaluate(() => {
                    const replay_state = window.__sse_replay_state || { events: [] };
                    return replay_state.events.some((entry) => entry.seq === 1);
                });
            }, 8000, 25);
            assert.strictEqual(first_event_received, true, 'Expected seq=1 to arrive before disconnect');

            const first_event_id = await page.evaluate(() => {
                const replay_state = window.__sse_replay_state || { events: [] };
                const first_entry = replay_state.events.find((entry) => entry.seq === 1);
                return first_entry ? first_entry.id : null;
            });
            assert(Number.isFinite(first_event_id), 'Expected first replay event id');

            await page.evaluate(() => window.__close_replay_source());

            const second_push = await post_json_response(port, '/api/events/push', { seq: 2 });
            const third_push = await post_json_response(port, '/api/events/push', { seq: 3 });
            assert.strictEqual(second_push.status_code, 200);
            assert.strictEqual(third_push.status_code, 200);

            await page.evaluate((last_event_id) => window.__connect_replay_source(last_event_id), first_event_id);
            const replay_received = await wait_for_condition(async () => {
                return page.evaluate(() => {
                    const replay_state = window.__sse_replay_state || { events: [] };
                    const has_seq_2 = replay_state.events.some((entry) => entry.seq === 2);
                    const has_seq_3 = replay_state.events.some((entry) => entry.seq === 3);
                    return has_seq_2 && has_seq_3;
                });
            }, 8000, 25);
            assert.strictEqual(replay_received, true, 'Expected replayed seq=2 and seq=3 after reconnect');

            const replay_event_ids = await page.evaluate(() => {
                const replay_state = window.__sse_replay_state || { events: [] };
                return replay_state.events
                    .filter((entry) => entry.seq === 2 || entry.seq === 3)
                    .map((entry) => entry.id);
            });
            assert(replay_event_ids.every((event_id) => Number.isFinite(event_id) && event_id > first_event_id));

            assert_clean_page_probe(page_probe, {
                allowed_request_failure_patterns: [
                    '/events',
                    'ERR_ABORTED'
                ]
            });
        } finally {
            if (page_probe && typeof page_probe.detach === 'function') {
                page_probe.detach();
            }
            if (page) {
                await page.close();
            }
            await stop_server_instance(server_instance);
        }
    });
});
