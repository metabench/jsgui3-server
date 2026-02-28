'use strict';

const jsgui = require('./client');
const { UserProfileEditor } = jsgui.controls;

let pass = 0, fail = 0;
function check(label, ok) {
    if (ok) { console.log(`  ✅ ${label}`); pass++; }
    else { console.log(`  ❌ ${label}`); fail++; }
}

console.log('\n═══ MVVM & Declarative API Check ═══\n');

// ── 1. Construction & Model Initialisation ──────────────────────────
const editor = new UserProfileEditor({
    first_name: 'John',
    last_name: 'Smith',
    is_active: true
});

check('Control instantiated', !!editor);
check('Has data.model layer', !!editor.data && !!editor.data.model);
check('Has view.data.model layer', !!editor.view && !!editor.view.data && !!editor.view.data.model);

// ── 2. Raw Model Values ─────────────────────────────────────────────
check('first_name stored correctly', editor.data.model.get('first_name').value === 'John');
check('last_name stored correctly', editor.data.model.get('last_name').value === 'Smith');
check('is_active stored correctly', editor.data.model.get('is_active').value === true);

// ── 3. Computed Properties ──────────────────────────────────────────
const fullName = editor.data.model.get('full_name').value;
check('Computed full_name = "John Smith"', fullName === 'John Smith');

const statusText = editor.data.model.get('status_text').value;
check('Computed status_text = "Active Account"', statusText === 'Active Account');

// ── 4. Server-Side HTML Rendering ───────────────────────────────────
const html = editor.all_html_render();
check('HTML renders without throwing', typeof html === 'string' && html.length > 0);
check('HTML has .profile-card wrapper', html.includes('profile-card'));
check('HTML has active-state class', html.includes('active-state'));
check('HTML has profile-header section', html.includes('profile-header'));
check('HTML has profile-body section', html.includes('profile-body'));
check('HTML has profile-footer section', html.includes('profile-footer'));
check('HTML has Toggle Status button', html.includes('Toggle Status'));
check('HTML has Save Profile button', html.includes('Save Profile'));
check('HTML has input elements for bind-value', html.includes('<input'));
check('HTML has First Name label', html.includes('First Name:'));
check('HTML has Last Name label', html.includes('Last Name:'));
// Note: bind-text content (e.g. "John Smith") is injected client-side
// during activation. SSR renders the structure; bind-text populates at runtime.

// ── 5. Model Mutation: Update first_name ─────────────────────────────
editor.data.model.set('first_name', 'Alice');
const updatedFullName = editor.data.model.get('full_name').value;
check('Computed full_name updates to "Alice Smith"', updatedFullName === 'Alice Smith');

// ── 6. Model Mutation: toggleStatus() ────────────────────────────────
editor.toggleStatus();
check('is_active toggled to false', editor.data.model.get('is_active').value === false);
check('Computed status_text = "Suspended Account"', editor.data.model.get('status_text').value === 'Suspended Account');

// ── 7. Toggle back ──────────────────────────────────────────────────
editor.toggleStatus();
check('is_active toggled back to true', editor.data.model.get('is_active').value === true);
check('Computed status_text back to "Active Account"', editor.data.model.get('status_text').value === 'Active Account');

// ── 8. Edge cases ───────────────────────────────────────────────────
editor.data.model.set('first_name', '');
check('Computed full_name with empty first = "Smith"', editor.data.model.get('full_name').value === 'Smith');

editor.data.model.set('last_name', '');
check('Computed full_name with both empty = ""', editor.data.model.get('full_name').value === '');

editor.data.model.set('first_name', 'Solo');
check('Computed full_name with empty last = "Solo"', editor.data.model.get('full_name').value === 'Solo');

// ── 9. CSS static property ──────────────────────────────────────────
check('UserProfileEditor.css defined', typeof UserProfileEditor.css === 'string' && UserProfileEditor.css.length > 100);
check('CSS contains .profile-card rule', UserProfileEditor.css.includes('.profile-card'));
check('CSS contains .active-state rule', UserProfileEditor.css.includes('.active-state'));
check('CSS contains .inactive-state rule', UserProfileEditor.css.includes('.inactive-state'));

// ── Verdict ─────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════');
console.log(`RESULTS: ${pass} passed, ${fail} failed`);
if (fail === 0) {
    console.log('\n✅ VERDICT: All MVVM & Declarative API checks passed!');
} else {
    console.log('\n⚠️  VERDICT: Some checks failed — review results above');
}
console.log('═══════════════════════════════════════════\n');

process.exit(fail > 0 ? 1 : 0);
