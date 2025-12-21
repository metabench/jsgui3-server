const fs = require('fs');
const path = require('path');

const Server_Page_Context = require('../../page-context');

const repo_root_path = path.join(__dirname, '..', '..');
const examples_controls_root_path = path.join(repo_root_path, 'examples', 'controls');
const results_dir_path = path.join(repo_root_path, 'lab', 'results');

const count_occurrences = (haystack, needle) => {
    let idx = 0;
    let count = 0;
    while (true) {
        idx = haystack.indexOf(needle, idx);
        if (idx === -1) return count;
        count++;
        idx += needle.length;
    }
};

const count_class_occurrences = (html, class_name) => {
    const class_regex = new RegExp(`class="[^"]*\\b${class_name}\\b`, 'g');
    const matches = html.match(class_regex);
    return matches ? matches.length : 0;
};

const count_regex_occurrences = (html, regex) => {
    const matches = html.match(regex);
    return matches ? matches.length : 0;
};

const render_example_html = ({ dir_name, ctrl_name }) => {
    const example_dir_path = path.join(examples_controls_root_path, dir_name);
    const example_client_path = path.join(example_dir_path, 'client.js');

    const jsgui = require(example_client_path);
    const ctrl = jsgui.controls && jsgui.controls[ctrl_name];
    if (!ctrl) {
        throw new Error(`Missing exported control jsgui.controls.${ctrl_name} in ${example_client_path}`);
    }

    const context = new Server_Page_Context();
    const ctrl_instance = new ctrl({ context });
    if (typeof ctrl_instance.all_html_render === 'function') {
        return ctrl_instance.all_html_render();
    }

    if (typeof ctrl_instance.render === 'function') {
        return ctrl_instance.render();
    }

    throw new Error(`Control ${ctrl_name} does not expose render methods`);
};

const make_count_check = (html, id, description, needle, expected) => {
    const actual = count_occurrences(html, needle);
    return {
        id,
        description,
        expected,
        actual,
        pass: actual === expected
    };
};

const make_class_count_check = (html, id, description, class_name, expected) => {
    const actual = count_class_occurrences(html, class_name);
    return {
        id,
        description,
        expected,
        actual,
        pass: actual === expected
    };
};

const make_contains_check = (html, id, description, needle) => {
    const actual = html.includes(needle);
    return {
        id,
        description,
        expected: true,
        actual,
        pass: actual === true
    };
};

const make_regex_count_check = (html, id, description, regex, expected) => {
    const actual = count_regex_occurrences(html, regex);
    return {
        id,
        description,
        expected,
        actual,
        pass: actual === expected
    };
};

const examples = [
    {
        dir_name: '1) window',
        ctrl_name: 'Demo_UI',
        checks: (html) => [
            make_count_check(html, 'window_count', 'Window control count', 'data-jsgui-type="window"', 1),
            make_contains_check(html, 'window_title_text', 'Window title text present', 'jsgui3-html Window Control'),
            make_count_check(html, 'window_button_count', 'Window button count', 'data-jsgui-type="button"', 3)
        ]
    },
    {
        dir_name: '4) window, tabbed panel',
        ctrl_name: 'Demo_UI',
        checks: (html) => [
            make_class_count_check(html, 'tab_label_count', 'Tab label count', 'tab-label', 2),
            make_contains_check(html, 'tab_label_one', 'Tab 1 label text present', 'tab 1'),
            make_contains_check(html, 'tab_label_two', 'Tab 2 label text present', 'tab 2'),
            make_count_check(html, 'tab_input_checked', 'Default checked tab input count', 'checked="checked"', 1)
        ]
    },
    {
        dir_name: '8) window, checkbox/a)',
        ctrl_name: 'Demo_UI',
        checks: (html) => [
            make_regex_count_check(
                html,
                'checkbox_input_count',
                'Checkbox input count',
                /\stype="checkbox"/g,
                1
            ),
            make_contains_check(html, 'checkbox_label_text', 'Checkbox label text present', 'A checkbox')
        ]
    },
    {
        dir_name: '9) window, date picker',
        ctrl_name: 'Demo_UI',
        checks: (html) => [
            make_class_count_check(html, 'date_picker_present', 'Date picker container present', 'date-picker', 1),
            make_regex_count_check(
                html,
                'date_input_count',
                'Date input type count',
                /\stype="date"/g,
                1
            )
        ]
    }
];

const build_results = () => {
    const results = {
        generated_at: new Date().toISOString(),
        examples: []
    };

    for (const example of examples) {
        const html = render_example_html(example);
        const checks = example.checks(html);
        const passed = checks.filter((check) => check.pass).length;
        const failed = checks.length - passed;

        results.examples.push({
            dir_name: example.dir_name,
            ctrl_name: example.ctrl_name,
            checks,
            summary: {
                total: checks.length,
                passed,
                failed
            }
        });
    }

    results.summary = results.examples.reduce(
        (acc, example) => {
            acc.total += example.summary.total;
            acc.passed += example.summary.passed;
            acc.failed += example.summary.failed;
            return acc;
        },
        { total: 0, passed: 0, failed: 0 }
    );

    return results;
};

const render_markdown = (results) => {
    const lines = [];
    lines.push('# Window Examples DOM Audit');
    lines.push('');
    lines.push(`Generated at: ${results.generated_at}`);
    lines.push('');
    lines.push(`Total checks: ${results.summary.total}`);
    lines.push(`Passed: ${results.summary.passed}`);
    lines.push(`Failed: ${results.summary.failed}`);
    lines.push('');

    for (const example of results.examples) {
        lines.push(`## ${example.dir_name}`);
        lines.push('');
        lines.push(`Control: ${example.ctrl_name}`);
        lines.push('');
        lines.push('| Check | Expected | Actual | Pass |');
        lines.push('| --- | --- | --- | --- |');
        for (const check of example.checks) {
            const expected = Array.isArray(check.expected) ? check.expected.join(', ') : String(check.expected);
            const actual = Array.isArray(check.actual) ? check.actual.join(', ') : String(check.actual);
            lines.push(`| ${check.description} | ${expected} | ${actual} | ${check.pass ? 'yes' : 'no'} |`);
        }
        lines.push('');
    }

    return lines.join('\n');
};

const write_results = (results) => {
    fs.mkdirSync(results_dir_path, { recursive: true });
    const json_path = path.join(results_dir_path, 'window_examples_dom_audit.json');
    const md_path = path.join(results_dir_path, 'window_examples_dom_audit.md');

    fs.writeFileSync(json_path, JSON.stringify(results, null, 2));
    fs.writeFileSync(md_path, render_markdown(results));

    return { json_path, md_path };
};

const main = () => {
    const results = build_results();
    const { json_path, md_path } = write_results(results);

    console.log('Window examples DOM audit complete.');
    console.log(`JSON: ${json_path}`);
    console.log(`Markdown: ${md_path}`);

    if (results.summary.failed > 0) {
        process.exitCode = 1;
    }
};

if (require.main === module) {
    main();
}
