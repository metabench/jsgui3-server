const jsgui = require('jsgui3-html');
const { Control, controls } = jsgui;
const { tpl } = require('../../../../jsgui3-html/html-core/html-core');
const Data_Model_View_Model_Control = require('../../../../jsgui3-html/html-core/Data_Model_View_Model_Control');
const { ensure_control_models } = require('../../../../jsgui3-html/html-core/control_model_factory');
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

// Alias for tpl HTML parser which lowercases tags
controls.text_input = controls.Text_Input;

class UserProfileEditor extends Data_Model_View_Model_Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'user_profile_editor';
        super(spec);

        // Ensure data.model and view.data.model exist
        ensure_control_models(this, spec);

        // Raw models
        this.data.model.set('first_name', spec.first_name || 'Jane');
        this.data.model.set('last_name', spec.last_name || 'Doe');
        this.data.model.set('is_active', spec.is_active !== undefined ? spec.is_active : true);

        // Generate full_name transparently via Computed Property
        this.computed(this.data.model, ['first_name', 'last_name'],
            (first, last) => `${first || ''} ${last || ''}`.trim(),
            { propertyName: 'full_name' }
        );

        // Generate a display status
        this.computed(this.data.model, ['is_active'],
            (is_active) => is_active ? 'Active Account' : 'Suspended Account',
            { propertyName: 'status_text' }
        );

        this.compose_ui();
    }

    compose_ui() {
        // Build the layout entirely declaratively, intercepting view model bindings automatically.
        // - bind-text reacts to model changes and displays text content
        // - bind-value builds a two-way binding on input fields
        // - bind-class reacts to model state to toggle active/inactive CSS hooks
        // - on-click establishes native event listener routing

        tpl`
            <div class="profile-card" bind-class=${{ 'active-state': this.mbind('is_active'), 'inactive-state': [this.data.model, 'is_active', v => !v] }}>
                <div class="profile-header">
                    <h2 bind-text=${[this.data.model, 'full_name']}></h2>
                    <span class="badge" bind-text=${[this.data.model, 'status_text']}></span>
                </div>
                
                <div class="profile-body">
                    <div class="field-row">
                        <label>First Name:</label>
                        <Text_Input class="text-input" bind-value=${this.mbind('first_name')} />
                    </div>
                    
                    <div class="field-row">
                        <label>Last Name:</label>
                        <Text_Input class="text-input" bind-value=${this.mbind('last_name')} />
                    </div>
                </div>

                <div class="profile-footer">
                    <button class="btn" on-click=${() => this.toggleStatus()}>Toggle Status</button>
                    <button class="btn primary" on-click=${() => this.saveProfile()}>Save Profile</button>
                </div>
            </div>
        `.mount(this, controls);
    }

    toggleStatus() {
        const current = this.data.model.get('is_active').value;
        this.data.model.set('is_active', !current);
    }

    saveProfile() {
        alert("Saved Profile for: " + this.data.model.get('full_name').value);
        console.log("Saved: ", this.data.model.get('full_name').value);
    }
}

UserProfileEditor.css = `
.profile-card {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 20px;
    max-width: 400px;
    font-family: sans-serif;
    transition: background-color 0.3s ease;
}

.profile-card.active-state {
    background-color: #f9fff9;
    border-color: #4caf50;
}

.profile-card.inactive-state {
    background-color: #fff9f9;
    border-color: #f44336;
}

.profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 15px;
}

.profile-header h2 {
    margin: 0;
    font-size: 1.5rem;
}

.badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
}

.active-state .badge {
    background-color: #e8f5e9;
    color: #2e7d32;
}

.inactive-state .badge {
    background-color: #ffebee;
    color: #c62828;
}

.field-row {
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
}

.field-row label {
    font-size: 0.9rem;
    color: #555;
    margin-bottom: 4px;
}

.text-input {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
}

.profile-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #eee;
}

.btn {
    padding: 8px 16px;
    border: 1px solid #ccc;
    background: #fff;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
}

.btn:hover {
    background: #f0f0f0;
}

.btn.primary {
    background: #2196f3;
    color: white;
    border-color: #1976d2;
}

.btn.primary:hover {
    background: #1976d2;
}
`;


class Demo_Page extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_page_mvvm_declarative';
        super(spec);
        const { context } = this;

        if (typeof this.body.add_class === 'function') {
            this.body.add_class('demo-page');
        }

        const compose = () => {
            const h1 = new controls.h1({ context });
            h1.add('MVVM & Declarative API Demo');
            this.body.add(h1);

            const container = new controls.div({ context, class: 'params-container' });
            this.body.add(container);

            const editor = new UserProfileEditor({
                context,
                first_name: 'John',
                last_name: 'Smith',
                is_active: true
            });
            container.add(editor);
        };

        if (!spec.el) {
            compose();
        }
    }
}

Demo_Page.css = `
body {
    background: #f0f2f5;
    color: #333;
    font-family: sans-serif;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.params-container {
    margin-top: 30px;
    width: 100%;
    max-width: 600px;
}
`;

controls.Demo_Page = Demo_Page;
controls.UserProfileEditor = UserProfileEditor;

module.exports = jsgui;
