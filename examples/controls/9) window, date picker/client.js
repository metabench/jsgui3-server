const jsgui = require('jsgui3-client');
const { controls, Control } = jsgui;
const { Date_Picker } = controls;
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const Datetime_Picker = controls.Datetime_Picker || controls.DateTime_Picker;

if (typeof Datetime_Picker !== 'function') {
    throw new Error('Expected controls.Datetime_Picker (or controls.DateTime_Picker) to be exported.');
}

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);

        if (typeof this.body.add_class === 'function') {
            this.body.add_class('demo-ui');
        }

        if (!spec.el) {
            this.compose_ui();
        }
    }

    compose_ui() {
        const { context } = this;

        const window_ctrl = new controls.Window({
            context,
            title: 'jsgui3-html Date + DateTime Pickers',
            pos: [10, 10],
            size: [660, 560]
        });

        const date_label = new Control({ context, tag_name: 'h3' });
        date_label.add_class('picker-section-title');
        date_label.add('Date_Picker (native input + locale/min/max support)');
        window_ctrl.inner.add(date_label);

        const date_picker = new Date_Picker({
            context,
            value: '2026-02-11',
            locale: 'en-GB',
            min: '2026-01-01',
            max: '2026-12-31'
        });
        date_picker.add_class('demo-date-picker');
        window_ctrl.inner.add(date_picker);

        const date_output = new Control({ context, tag_name: 'div' });
        date_output.add_class('demo-date-output');
        date_output.add('Date value: 2026-02-11');
        window_ctrl.inner.add(date_output);

        const datetime_label = new Control({ context, tag_name: 'h3' });
        datetime_label.add_class('picker-section-title');
        datetime_label.add('DateTime_Picker (tabbed layout + time spinners)');
        window_ctrl.inner.add(datetime_label);

        const datetime_picker = new Datetime_Picker({
            context,
            value: '2026-02-11T14:30',
            layout: 'tabbed',
            use_24h: false,
            show_spinners: true
        });
        datetime_picker.add_class('demo-datetime-picker');
        window_ctrl.inner.add(datetime_picker);

        const datetime_output = new Control({ context, tag_name: 'div' });
        datetime_output.add_class('demo-datetime-output');
        datetime_output.add(`DateTime value: ${datetime_picker.value}`);
        window_ctrl.inner.add(datetime_output);

        this._ctrl_fields = {
            date_picker,
            date_output,
            datetime_picker,
            datetime_output
        };

        this.body.add(window_ctrl);
    }

    activate() {
        if (!this.__active) {
            super.activate();

            const root_el = (this.body && this.body.dom && this.body.dom.el) || (this.dom && this.dom.el) || null;
            if (!root_el) {
                return;
            }

            const date_input_el = root_el.querySelector('input.date-picker');
            const date_output_el = root_el.querySelector('.demo-date-output');
            const datetime_root_el = root_el.querySelector('.demo-datetime-picker');
            const datetime_output_el = root_el.querySelector('.demo-datetime-output');
            if (!date_input_el || !date_output_el || !datetime_root_el || !datetime_output_el) {
                return;
            }

            const format_locale_date = (iso_date) => {
                if (!iso_date) return '';
                const parsed_date = new Date(`${iso_date}T00:00:00`);
                if (Number.isNaN(parsed_date.getTime())) return '';
                try {
                    return new Intl.DateTimeFormat('en-GB').format(parsed_date);
                } catch (error) {
                    return iso_date;
                }
            };

            const set_date_output = () => {
                const next_date_value = String(date_input_el.value || '');
                const locale_value = format_locale_date(next_date_value);
                date_output_el.textContent = `Date value: ${next_date_value} (en-GB: ${locale_value})`;
            };

            const set_datetime_output = () => {
                const date_display_text = String((datetime_root_el.querySelector('.dtp-date-display') || {}).textContent || '').trim();
                const time_display_text = String(
                    (datetime_root_el.querySelector('.time-picker .tp-display-time')
                        || datetime_root_el.querySelector('.dtp-time-display')
                        || {}).textContent || ''
                ).trim();
                if (date_display_text && time_display_text) {
                    datetime_output_el.textContent = `DateTime value: ${date_display_text}T${time_display_text}`;
                }
            };

            const parse_time_text = (value) => {
                const next_value = String(value || '').trim();
                const am_pm_match = next_value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                if (am_pm_match) {
                    let hours_24 = parseInt(am_pm_match[1], 10);
                    const minutes = Math.max(0, Math.min(59, parseInt(am_pm_match[2], 10)));
                    const period = am_pm_match[3].toUpperCase();
                    if (period === 'PM' && hours_24 < 12) {
                        hours_24 += 12;
                    } else if (period === 'AM' && hours_24 === 12) {
                        hours_24 = 0;
                    }
                    return {
                        hours_24: Math.max(0, Math.min(23, hours_24)),
                        minutes,
                        uses_12h: true
                    };
                }

                const twenty_four_hour_match = next_value.match(/^(\d{1,2}):(\d{2})$/);
                if (twenty_four_hour_match) {
                    return {
                        hours_24: Math.max(0, Math.min(23, parseInt(twenty_four_hour_match[1], 10))),
                        minutes: Math.max(0, Math.min(59, parseInt(twenty_four_hour_match[2], 10))),
                        uses_12h: false
                    };
                }

                return null;
            };

            const format_24h = (hours_24, minutes) => {
                return `${String(hours_24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            };

            const format_12h = (hours_24, minutes) => {
                const period = hours_24 >= 12 ? 'PM' : 'AM';
                const normalized_hours = hours_24 % 12 || 12;
                return `${normalized_hours}:${String(minutes).padStart(2, '0')} ${period}`;
            };

            const set_datetime_time_views = (hours_24, minutes, uses_12h_hint) => {
                const time_display_el = datetime_root_el.querySelector('.time-picker .tp-display-time');
                const header_time_el = datetime_root_el.querySelector('.dtp-time-display');
                const am_pm_button_el = datetime_root_el.querySelector('.time-picker .tp-ampm-btn');
                const hour_spinner_value_el = datetime_root_el.querySelector('.time-picker .tp-h-val');
                const minute_spinner_value_el = datetime_root_el.querySelector('.time-picker .tp-m-val');

                const should_use_12h = uses_12h_hint || !!am_pm_button_el;
                const next_time_display_text = should_use_12h ? format_12h(hours_24, minutes) : format_24h(hours_24, minutes);

                if (time_display_el) {
                    time_display_el.textContent = next_time_display_text;
                }
                if (header_time_el) {
                    header_time_el.textContent = format_24h(hours_24, minutes);
                }
                if (hour_spinner_value_el) {
                    hour_spinner_value_el.textContent = String(hours_24).padStart(2, '0');
                }
                if (minute_spinner_value_el) {
                    minute_spinner_value_el.textContent = String(minutes).padStart(2, '0');
                }
                if (am_pm_button_el) {
                    am_pm_button_el.textContent = hours_24 >= 12 ? 'PM' : 'AM';
                }
            };

            const update_fallback_tab_visibility = (mode) => {
                const tab_elements = Array.from(datetime_root_el.querySelectorAll('.dtp-tab'));
                if (tab_elements.length < 2) {
                    return;
                }

                const month_view_el = datetime_root_el.querySelector('.month-view');
                const time_picker_el = datetime_root_el.querySelector('.time-picker');
                const date_tab_el = tab_elements.find((tab_element) => {
                    return String(tab_element.textContent || '').toLowerCase().includes('date');
                }) || tab_elements[0];
                const time_tab_el = tab_elements.find((tab_element) => {
                    return String(tab_element.textContent || '').toLowerCase().includes('time');
                }) || tab_elements[1];

                const showing_time = mode === 'time';
                if (month_view_el) {
                    month_view_el.style.display = showing_time ? 'none' : '';
                }
                if (time_picker_el) {
                    time_picker_el.style.display = showing_time ? '' : 'none';
                }

                if (date_tab_el) {
                    date_tab_el.classList.toggle('dtp-tab-active', !showing_time);
                }
                if (time_tab_el) {
                    time_tab_el.classList.toggle('dtp-tab-active', showing_time);
                }
            };

            const fallback_datetime_click_handler = (event) => {
                const tab_el = event.target && event.target.closest ? event.target.closest('.dtp-tab') : null;
                if (tab_el) {
                    const is_time_tab = String(tab_el.textContent || '').toLowerCase().includes('time');
                    setTimeout(() => {
                        const month_view_el = datetime_root_el.querySelector('.month-view');
                        const time_picker_el = datetime_root_el.querySelector('.time-picker');
                        const month_visible = !month_view_el || window.getComputedStyle(month_view_el).display !== 'none';
                        const time_visible = !time_picker_el || window.getComputedStyle(time_picker_el).display !== 'none';

                        if (is_time_tab && month_visible) {
                            update_fallback_tab_visibility('time');
                        } else if (!is_time_tab && time_visible) {
                            update_fallback_tab_visibility('date');
                        }
                    }, 0);
                    return;
                }

                const spinner_button_el = event.target && event.target.closest
                    ? event.target.closest('.tp-spinner-up, .tp-spinner-down, .tp-ampm-btn')
                    : null;
                if (!spinner_button_el) {
                    return;
                }

                const time_display_el = datetime_root_el.querySelector('.time-picker .tp-display-time');
                const header_time_el = datetime_root_el.querySelector('.dtp-time-display');
                const before_display_text = time_display_el ? String(time_display_el.textContent || '').trim() : '';
                const before_header_text = header_time_el ? String(header_time_el.textContent || '').trim() : '';
                const before_time_data = parse_time_text(before_display_text) || parse_time_text(before_header_text);

                setTimeout(() => {
                    if (!before_time_data) {
                        return;
                    }

                    const after_display_text = time_display_el ? String(time_display_el.textContent || '').trim() : '';
                    if (after_display_text !== before_display_text) {
                        return;
                    }

                    let { hours_24, minutes } = before_time_data;

                    if (spinner_button_el.classList.contains('tp-h-up')) {
                        hours_24 = (hours_24 + 1) % 24;
                    } else if (spinner_button_el.classList.contains('tp-h-down')) {
                        hours_24 = (hours_24 + 23) % 24;
                    } else if (spinner_button_el.classList.contains('tp-m-up')) {
                        minutes += 1;
                        if (minutes >= 60) {
                            minutes = 0;
                            hours_24 = (hours_24 + 1) % 24;
                        }
                    } else if (spinner_button_el.classList.contains('tp-m-down')) {
                        minutes -= 1;
                        if (minutes < 0) {
                            minutes = 59;
                            hours_24 = (hours_24 + 23) % 24;
                        }
                    } else if (spinner_button_el.classList.contains('tp-ampm-btn')) {
                        hours_24 = (hours_24 + 12) % 24;
                    } else {
                        return;
                    }

                    set_datetime_time_views(hours_24, minutes, before_time_data.uses_12h);
                    set_datetime_output();
                }, 0);
            };

            set_date_output();
            set_datetime_output();
            update_fallback_tab_visibility('date');

            date_input_el.addEventListener('input', set_date_output);
            date_input_el.addEventListener('change', set_date_output);

            const schedule_datetime_output_update = () => {
                setTimeout(set_datetime_output, 0);
            };
            datetime_root_el.addEventListener('input', schedule_datetime_output_update);
            datetime_root_el.addEventListener('change', schedule_datetime_output_update);
            datetime_root_el.addEventListener('click', schedule_datetime_output_update);
            datetime_root_el.addEventListener('click', fallback_datetime_click_handler);

            this.on('destroy', () => {
                date_input_el.removeEventListener('input', set_date_output);
                date_input_el.removeEventListener('change', set_date_output);
                datetime_root_el.removeEventListener('input', schedule_datetime_output_update);
                datetime_root_el.removeEventListener('change', schedule_datetime_output_update);
                datetime_root_el.removeEventListener('click', schedule_datetime_output_update);
                datetime_root_el.removeEventListener('click', fallback_datetime_click_handler);
            });
        }
    }
}

Demo_UI.css = `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    overflow-x: hidden;
    overflow-y: hidden;
    background-color: #e0e0e0;
}

.picker-section-title {
    margin: 10px 0 8px 0;
    font-family: 'Segoe UI', sans-serif;
    font-size: 14px;
    color: #34495e;
}

.demo-date-output,
.demo-datetime-output {
    margin: 8px 0 6px 0;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 12px;
    color: #263238;
}

.demo-datetime-picker {
    margin-top: 4px;
}
`;

controls.Demo_UI = Demo_UI;
module.exports = jsgui;
