const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const fs_async = fs.promises;

const local_module_extensions = ['.js', '.mjs', '.cjs'];

const escape_for_regexp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const to_module_literal = (file_path) => file_path.replace(/\\/g, '\\\\');

const path_exists = async (file_path) => {
    try {
        await fs_async.access(file_path, fs.constants.F_OK);
        return true;
    } catch (err) {
        return false;
    }
};

const read_path_stat = async (file_path) => {
    try {
        return await fs_async.stat(file_path);
    } catch (err) {
        return null;
    }
};

const sort_path_items = (items) => {
    return Array.isArray(items)
        ? Array.from(items).sort((a, b) => String(a).localeCompare(String(b)))
        : [];
};

const sanitize_identifier = (value) => {
    const candidate = (value || '').trim().replace(/\.\.\./g, '');
    if (!candidate) return null;
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(candidate)) return null;
    return candidate;
};

const parse_identifier_list = (list_text) => {
    const text = (list_text || '').trim();
    if (!text) return [];

    const tokens = text.split(',');
    const identifiers = [];

    for (const raw_token of tokens) {
        let token = (raw_token || '').trim();
        if (!token) continue;

        // import { Name as Alias } ...
        if (token.includes(' as ')) {
            token = token.split(/\s+as\s+/)[0].trim();
        }
        // const { Name: alias } = ...
        if (token.includes(':')) {
            token = token.split(':')[0].trim();
        }
        // const { Name = fallback } = ...
        if (token.includes('=')) {
            token = token.split('=')[0].trim();
        }

        const identifier = sanitize_identifier(token);
        if (identifier) identifiers.push(identifier);
    }

    return identifiers;
};

const parse_destructured_entries = (list_text) => {
    const text = (list_text || '').trim();
    if (!text) return [];

    const tokens = text.split(',');
    const entries = [];

    for (const raw_token of tokens) {
        let token = (raw_token || '').trim();
        if (!token) continue;

        if (token.startsWith('...')) {
            token = token.slice(3).trim();
        }

        if (token.includes('=')) {
            token = token.split('=')[0].trim();
        }

        let source_name = token;
        let local_name = token;

        if (token.includes(' as ')) {
            const [source_part, local_part] = token.split(/\s+as\s+/);
            source_name = (source_part || '').trim();
            local_name = (local_part || '').trim();
        } else if (token.includes(':')) {
            const [source_part, local_part] = token.split(':');
            source_name = (source_part || '').trim();
            local_name = (local_part || '').trim();
        }

        const normalized_source = sanitize_identifier(source_name);
        const normalized_local = sanitize_identifier(local_name);
        if (!normalized_source || !normalized_local) continue;

        entries.push({
            source: normalized_source,
            local: normalized_local
        });
    }

    return entries;
};

const parse_static_bracket_identifier = (bracket_expression_text) => {
    const text = (bracket_expression_text || '').trim();
    const static_literal_match = /^(['"])([A-Za-z_$][A-Za-z0-9_$]*)\1$/.exec(text);
    if (!static_literal_match) return null;
    return sanitize_identifier(static_literal_match[2]);
};

const resource_family_feature_keys = Object.freeze([
    'resource',
    'resource_data_kv',
    'resource_data_transform',
    'resource_compilation',
    'resource_compiler',
    'resource_load_compiler'
]);

const derive_selected_root_features = (used_identifiers, options = {}) => {
    const force_resource_family = options.force_resource_family === true;
    const used_identifier_set = new Set(Array.isArray(used_identifiers) ? used_identifiers : []);
    const selected_root_features = new Set();

    const has_identifier = (name) => used_identifier_set.has(name);

    if (has_identifier('Router')) selected_root_features.add('router');

    const resource_identifiers = [
        'Resource',
        'Resource_Pool',
        'Data_KV',
        'Data_Transform',
        'Compilation',
        'Compiler',
        'load_compiler'
    ];
    const has_resource_identifier = resource_identifiers.some((name) => has_identifier(name));
    if (has_resource_identifier) selected_root_features.add('resource');

    if (has_identifier('Resource_Pool')) selected_root_features.add('resource_pool');
    if (has_identifier('Data_KV')) selected_root_features.add('resource_data_kv');
    if (has_identifier('Data_Transform')) selected_root_features.add('resource_data_transform');
    if (has_identifier('Compilation')) selected_root_features.add('resource_compilation');
    if (has_identifier('Compiler')) selected_root_features.add('resource_compiler');
    if (has_identifier('load_compiler')) {
        selected_root_features.add('resource_compiler');
        selected_root_features.add('resource_load_compiler');
    }
    if (has_identifier('gfx')) selected_root_features.add('gfx');
    if (has_identifier('mixins') || has_identifier('mx')) selected_root_features.add('mixins');

    if (force_resource_family) {
        for (const resource_feature_key of resource_family_feature_keys) {
            selected_root_features.add(resource_feature_key);
        }
    }

    if (
        selected_root_features.has('resource_pool') ||
        selected_root_features.has('resource_data_kv') ||
        selected_root_features.has('resource_data_transform') ||
        selected_root_features.has('resource_compilation') ||
        selected_root_features.has('resource_compiler') ||
        selected_root_features.has('resource_load_compiler')
    ) {
        selected_root_features.add('resource');
    }

    return Array.from(selected_root_features).sort();
};

class JSGUI3_HTML_Control_Optimizer {
    constructor(spec = {}) {
        this.package_name = spec.package_name || 'jsgui3-html';
        this.emit_manifest = spec.emit_manifest === true;
        this.allow_dynamic_controls = spec.allow_dynamic_controls === true;
        this.log = spec.log === true;
        this.include_controls = Array.isArray(spec.include_controls) ? spec.include_controls : [];
        this.exclude_controls = new Set(Array.isArray(spec.exclude_controls) ? spec.exclude_controls : []);
        this.cache_enabled = spec.cacheEnabled !== false;
        this.shared_cache_enabled = spec.sharedCache !== false;
        const default_cache_root = path.join(process.cwd(), '.jsgui3-server-cache');
        this.manifest_dir = spec.manifest_dir || path.join(default_cache_root, 'control-scan-manifests');
        this.shim_dir = spec.shim_dir || path.join(default_cache_root, 'jsgui3-html-shims');
        const include_controls_key = sort_path_items(this.include_controls).join(',');
        const exclude_controls_key = sort_path_items(Array.from(this.exclude_controls)).join(',');
        this.cache_namespace_key = `${this.package_name}|include:${include_controls_key}|exclude:${exclude_controls_key}`;

        if (this.cache_enabled && this.shared_cache_enabled) {
            if (!JSGUI3_HTML_Control_Optimizer.shared_entry_analysis_cache) {
                JSGUI3_HTML_Control_Optimizer.shared_entry_analysis_cache = new Map();
            }
            if (!JSGUI3_HTML_Control_Optimizer.shared_file_scan_cache) {
                JSGUI3_HTML_Control_Optimizer.shared_file_scan_cache = new Map();
            }
            if (!JSGUI3_HTML_Control_Optimizer.shared_local_module_resolution_cache) {
                JSGUI3_HTML_Control_Optimizer.shared_local_module_resolution_cache = new Map();
            }
            if (!JSGUI3_HTML_Control_Optimizer.shared_controls_map_cache) {
                JSGUI3_HTML_Control_Optimizer.shared_controls_map_cache = new Map();
            }
            this.entry_analysis_cache = JSGUI3_HTML_Control_Optimizer.shared_entry_analysis_cache;
            this.file_scan_cache = JSGUI3_HTML_Control_Optimizer.shared_file_scan_cache;
            this.local_module_resolution_cache = JSGUI3_HTML_Control_Optimizer.shared_local_module_resolution_cache;
            this.controls_map_cache = JSGUI3_HTML_Control_Optimizer.shared_controls_map_cache;
        } else {
            this.entry_analysis_cache = new Map();
            this.file_scan_cache = new Map();
            this.local_module_resolution_cache = new Map();
            this.controls_map_cache = new Map();
        }

        this.cache_stats = {
            entry_analysis_hits: 0,
            entry_analysis_misses: 0,
            file_scan_hits: 0,
            file_scan_misses: 0,
            module_resolution_hits: 0,
            module_resolution_misses: 0,
            controls_map_hits: 0,
            controls_map_misses: 0
        };
    }

    async optimize(entry_file_path) {
        const analysis = await this.scan_entry(entry_file_path);
        const manifest = this.build_manifest(analysis);

        if (!analysis.uses_jsgui3_html) {
            return {
                enabled: false,
                reason: 'no_jsgui3_html_usage',
                manifest
            };
        }

        if (analysis.dynamic_control_access_detected && !this.allow_dynamic_controls) {
            return {
                enabled: false,
                reason: 'dynamic_control_access_detected',
                manifest
            };
        }

        const shim_file_path = await this.write_shim_file(manifest);
        const plugin = this.create_esbuild_plugin(shim_file_path);

        const result = {
            enabled: true,
            reason: 'optimized',
            shim_file_path,
            plugin,
            manifest: Object.assign({}, manifest, { shim_file_path })
        };

        if (this.emit_manifest) {
            await this.write_manifest_file(result.manifest);
        }

        if (this.log) {
            const { selected_controls, reachable_files } = result.manifest;
            console.log('[JSGUI3_HTML_Control_Optimizer] enabled');
            console.log('[JSGUI3_HTML_Control_Optimizer] reachable_files:', reachable_files.length);
            console.log('[JSGUI3_HTML_Control_Optimizer] selected_controls:', selected_controls);
            console.log('[JSGUI3_HTML_Control_Optimizer] shim_file_path:', shim_file_path);
        }

        return result;
    }

    clone_analysis(analysis) {
        if (!analysis || typeof analysis !== 'object') {
            return analysis;
        }
        return {
            ...analysis,
            reachable_files: sort_path_items(analysis.reachable_files),
            used_identifiers: sort_path_items(analysis.used_identifiers),
            selected_controls: sort_path_items(analysis.selected_controls),
            selected_root_features: sort_path_items(analysis.selected_root_features),
            unmatched_identifiers: sort_path_items(analysis.unmatched_identifiers),
            package_aliases: sort_path_items(analysis.package_aliases),
            controls_aliases: sort_path_items(analysis.controls_aliases),
            dependency_items: Array.isArray(analysis.dependency_items)
                ? analysis.dependency_items.map((item) => ({...item}))
                : []
        };
    }

    async is_cached_analysis_valid(cached_analysis) {
        const dependency_items = Array.isArray(cached_analysis && cached_analysis.dependency_items)
            ? cached_analysis.dependency_items
            : [];

        for (const dependency_item of dependency_items) {
            const {file_path, mtime_ms, size} = dependency_item;
            const stat_result = await read_path_stat(file_path);
            if (!stat_result) return false;
            if (stat_result.mtimeMs !== mtime_ms) return false;
            if (stat_result.size !== size) return false;
        }

        return true;
    }

    async scan_entry(entry_file_path) {
        const absolute_entry_file_path = path.resolve(entry_file_path);
        const entry_cache_key = `${this.cache_namespace_key}::${absolute_entry_file_path}`;
        const jsgui3_html_root = path.dirname(require.resolve(this.package_name));
        if (this.cache_enabled) {
            const cached_analysis = this.entry_analysis_cache.get(entry_cache_key);
            if (cached_analysis && await this.is_cached_analysis_valid(cached_analysis)) {
                this.cache_stats.entry_analysis_hits += 1;
                return this.clone_analysis(cached_analysis);
            }
            this.cache_stats.entry_analysis_misses += 1;
        }

        const controls_map = await this.read_controls_require_map(jsgui3_html_root);
        const traversal_result = await this.collect_reachable_files(absolute_entry_file_path);
        const {
            reachable_files,
            dependency_items
        } = traversal_result;
        const dependency_stat_map = new Map(
            dependency_items.map((item) => [item.file_path, {
                mtimeMs: item.mtime_ms,
                size: item.size
            }])
        );

        const used_identifiers_set = new Set();
        const package_aliases_set = new Set();
        const controls_aliases_set = new Set();
        let uses_jsgui3_html = false;
        let dynamic_control_access_detected = false;
        let dynamic_resource_access_detected = false;

        for (const file_path of reachable_files) {
            const stat_result = dependency_stat_map.get(file_path) || await read_path_stat(file_path);
            if (!stat_result) continue;
            const scan_result = await this.read_file_scan_result(file_path, stat_result);

            if (scan_result.uses_jsgui3_html) uses_jsgui3_html = true;
            if (scan_result.dynamic_control_access_detected) dynamic_control_access_detected = true;
            if (scan_result.dynamic_resource_access_detected) dynamic_resource_access_detected = true;

            for (const identifier of scan_result.control_identifiers) {
                used_identifiers_set.add(identifier);
            }
            for (const package_alias of scan_result.package_aliases || []) {
                package_aliases_set.add(package_alias);
            }
            for (const controls_alias of scan_result.controls_aliases || []) {
                controls_aliases_set.add(controls_alias);
            }
        }

        for (const identifier of this.include_controls) {
            used_identifiers_set.add(identifier);
        }

        const used_identifiers = Array.from(used_identifiers_set).sort();
        const selected_root_features = derive_selected_root_features(used_identifiers, {
            force_resource_family: dynamic_resource_access_detected
        });
        const selected_controls = [];
        const unmatched_identifiers = [];

        for (const identifier of used_identifiers) {
            if (this.exclude_controls.has(identifier)) continue;
            if (controls_map[identifier]) {
                selected_controls.push(identifier);
            } else {
                unmatched_identifiers.push(identifier);
            }
        }

        const analysis = {
            package_name: this.package_name,
            entry_file_path: absolute_entry_file_path,
            reachable_files,
            uses_jsgui3_html,
            dynamic_control_access_detected,
            dynamic_resource_access_detected,
            used_identifiers,
            selected_root_features,
            selected_controls,
            unmatched_identifiers,
            package_aliases: Array.from(package_aliases_set).sort(),
            controls_aliases: Array.from(controls_aliases_set).sort(),
            controls_map,
            jsgui3_html_root,
            dependency_items
        };

        if (this.cache_enabled) {
            this.entry_analysis_cache.set(entry_cache_key, this.clone_analysis(analysis));
        }
        return analysis;
    }

    async collect_reachable_files(entry_file_path) {
        const pending = [entry_file_path];
        const visited = new Set();
        const dependency_items = [];

        while (pending.length > 0) {
            const next_file_path = pending.pop();
            const resolved_path = path.resolve(next_file_path);
            if (visited.has(resolved_path)) continue;

            if (!(await path_exists(resolved_path))) continue;
            visited.add(resolved_path);

            const stat_result = await read_path_stat(resolved_path);
            if (!stat_result) continue;
            dependency_items.push({
                file_path: resolved_path,
                mtime_ms: stat_result.mtimeMs,
                size: stat_result.size
            });

            const ext = path.extname(resolved_path).toLowerCase();
            if (!local_module_extensions.includes(ext)) continue;

            const module_requests = await this.read_file_module_requests(resolved_path, stat_result);
            for (const request_path of module_requests) {
                if (!(request_path.startsWith('.') || request_path.startsWith('/'))) continue;
                const resolved_request_path = await this.resolve_local_module(resolved_path, request_path);
                if (resolved_request_path) pending.push(resolved_request_path);
            }
        }

        dependency_items.sort((a, b) => String(a.file_path).localeCompare(String(b.file_path)));
        return {
            reachable_files: Array.from(visited).sort(),
            dependency_items
        };
    }

    async read_cached_file_source(file_path, stat_result) {
        if (!this.cache_enabled) {
            this.cache_stats.file_scan_misses += 1;
            return {
                file_path,
                mtime_ms: stat_result.mtimeMs,
                size: stat_result.size,
                source_text: await fs_async.readFile(file_path, 'utf8'),
                module_requests: null,
                scan_result: null
            };
        }

        const cached_item = this.file_scan_cache.get(file_path);
        if (cached_item && cached_item.mtime_ms === stat_result.mtimeMs && cached_item.size === stat_result.size) {
            this.cache_stats.file_scan_hits += 1;
            return cached_item;
        }

        this.cache_stats.file_scan_misses += 1;
        const source_text = await fs_async.readFile(file_path, 'utf8');
        const next_cached_item = {
            file_path,
            mtime_ms: stat_result.mtimeMs,
            size: stat_result.size,
            source_text,
            module_requests: null,
            scan_result: null
        };
        this.file_scan_cache.set(file_path, next_cached_item);
        return next_cached_item;
    }

    async read_file_module_requests(file_path, stat_result) {
        const cached_item = await this.read_cached_file_source(file_path, stat_result);
        if (!cached_item.module_requests) {
            cached_item.module_requests = this.extract_module_requests(cached_item.source_text);
        }
        return cached_item.module_requests;
    }

    async read_file_scan_result(file_path, stat_result) {
        const cached_item = await this.read_cached_file_source(file_path, stat_result);
        if (!cached_item.scan_result) {
            cached_item.scan_result = this.scan_source_text(cached_item.source_text);
        }
        return cached_item.scan_result;
    }

    extract_module_requests(source_text) {
        const requests = new Set();
        const regexes = [
            /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
            /\bimport\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g,
            /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
        ];

        for (const regex of regexes) {
            let match;
            while ((match = regex.exec(source_text)) !== null) {
                const module_request = match[1];
                if (module_request) requests.add(module_request);
            }
        }

        return Array.from(requests);
    }

    async resolve_local_module(from_file_path, request_path) {
        if (!this.cache_enabled) {
            this.cache_stats.module_resolution_misses += 1;
            return this._resolve_local_module_uncached(from_file_path, request_path);
        }

        const resolution_cache_key = `${from_file_path}::${request_path}`;
        if (this.local_module_resolution_cache.has(resolution_cache_key)) {
            this.cache_stats.module_resolution_hits += 1;
            return this.local_module_resolution_cache.get(resolution_cache_key);
        }

        this.cache_stats.module_resolution_misses += 1;
        const resolved_value = await this._resolve_local_module_uncached(from_file_path, request_path);
        this.local_module_resolution_cache.set(resolution_cache_key, resolved_value);
        return resolved_value;
    }

    async _resolve_local_module_uncached(from_file_path, request_path) {
        const from_dir = path.dirname(from_file_path);
        const base_path = request_path.startsWith('/')
            ? path.resolve(request_path)
            : path.resolve(from_dir, request_path);

        const candidates = [];
        const ext = path.extname(base_path);

        if (ext) {
            candidates.push(base_path);
        } else {
            candidates.push(base_path);
            for (const candidate_ext of local_module_extensions) {
                candidates.push(`${base_path}${candidate_ext}`);
            }
            for (const candidate_ext of local_module_extensions) {
                candidates.push(path.join(base_path, `index${candidate_ext}`));
            }
        }

        for (const candidate of candidates) {
            if (await path_exists(candidate)) {
                return candidate;
            }
        }

        return null;
    }

    scan_source_text(source_text) {
        const control_identifiers = new Set();
        const package_name_regex = escape_for_regexp(this.package_name);
        const package_aliases = new Set();
        const controls_aliases = new Set();
        const resource_aliases = new Set();
        const resource_subfeature_identifiers = [
            'Data_KV',
            'Data_Transform',
            'Compilation',
            'Compiler',
            'load_compiler'
        ];
        const resource_subfeature_regex_fragment = resource_subfeature_identifiers.join('|');
        const add_resource_alias = (alias_name) => {
            const normalized_alias = sanitize_identifier(alias_name);
            if (normalized_alias) resource_aliases.add(normalized_alias);
        };
        const add_control_identifier = (identifier) => {
            const normalized_identifier = sanitize_identifier(identifier);
            if (normalized_identifier) control_identifiers.add(normalized_identifier);
        };
        const add_resource_family_fallback_identifiers = () => {
            add_control_identifier('Resource');
            for (const identifier of resource_subfeature_identifiers) {
                add_control_identifier(identifier);
            }
        };

        const package_usage_regexes = [
            new RegExp(`require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)`, 'g'),
            new RegExp(`\\bfrom\\s*['"]${package_name_regex}['"]`, 'g')
        ];
        const uses_jsgui3_html = package_usage_regexes.some((regex) => regex.test(source_text));

        // Detect package aliases:
        //   const ui = require('jsgui3-html')
        //   import ui from 'jsgui3-html'
        //   import * as ui from 'jsgui3-html'
        const package_alias_regexes = [
            new RegExp(`\\b(?:const|let|var)\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)`, 'g'),
            new RegExp(`\\bimport\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s+from\\s*['"]${package_name_regex}['"]`, 'g'),
            new RegExp(`\\bimport\\s*\\*\\s*as\\s*([A-Za-z_$][A-Za-z0-9_$]*)\\s+from\\s*['"]${package_name_regex}['"]`, 'g')
        ];

        for (const regex of package_alias_regexes) {
            let match;
            while ((match = regex.exec(source_text)) !== null) {
                const alias_name = sanitize_identifier(match[1]);
                if (alias_name) package_aliases.add(alias_name);
            }
        }

        if (/\bjsgui\.controls\b/.test(source_text) || /\bjsgui\.[A-Z][A-Za-z0-9_$]*/.test(source_text)) {
            package_aliases.add('jsgui');
        }

        // Detect controls aliases:
        //   const c = require('jsgui3-html').controls
        //   const c = ui.controls
        const controls_alias_direct_regex = new RegExp(
            `\\b(?:const|let|var)\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\.controls\\b`,
            'g'
        );
        let direct_match;
        while ((direct_match = controls_alias_direct_regex.exec(source_text)) !== null) {
            const alias_name = sanitize_identifier(direct_match[1]);
            if (alias_name) controls_aliases.add(alias_name);
        }

        const controls_alias_direct_bracket_regex = new RegExp(
            `\\b(?:const|let|var)\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\s*\\[\\s*(['"])controls\\2\\s*\\]`,
            'g'
        );
        let controls_alias_direct_bracket_match;
        while ((controls_alias_direct_bracket_match = controls_alias_direct_bracket_regex.exec(source_text)) !== null) {
            const alias_name = sanitize_identifier(controls_alias_direct_bracket_match[1]);
            if (alias_name) controls_aliases.add(alias_name);
        }

        const resource_alias_direct_bracket_regex = new RegExp(
            `\\b(?:const|let|var)\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\s*\\[\\s*(['"])Resource\\2\\s*\\]`,
            'g'
        );
        let resource_alias_direct_bracket_match;
        while ((resource_alias_direct_bracket_match = resource_alias_direct_bracket_regex.exec(source_text)) !== null) {
            add_resource_alias(resource_alias_direct_bracket_match[1]);
            add_control_identifier('Resource');
        }

        for (const package_alias of package_aliases) {
            const escaped_package_alias = escape_for_regexp(package_alias);

            const alias_from_controls_regex = new RegExp(
                `\\b(?:const|let|var)\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*${escaped_package_alias}\\.controls\\b`,
                'g'
            );
            let alias_match;
            while ((alias_match = alias_from_controls_regex.exec(source_text)) !== null) {
                const alias_name = sanitize_identifier(alias_match[1]);
                if (alias_name) controls_aliases.add(alias_name);
            }

            const alias_from_controls_bracket_regex = new RegExp(
                `\\b(?:const|let|var)\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*${escaped_package_alias}\\s*\\[\\s*(['"])controls\\2\\s*\\]`,
                'g'
            );
            let alias_bracket_match;
            while ((alias_bracket_match = alias_from_controls_bracket_regex.exec(source_text)) !== null) {
                const alias_name = sanitize_identifier(alias_bracket_match[1]);
                if (alias_name) controls_aliases.add(alias_name);
            }

            const alias_from_resource_bracket_regex = new RegExp(
                `\\b(?:const|let|var)\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*${escaped_package_alias}\\s*\\[\\s*(['"])Resource\\2\\s*\\]`,
                'g'
            );
            let alias_resource_bracket_match;
            while ((alias_resource_bracket_match = alias_from_resource_bracket_regex.exec(source_text)) !== null) {
                add_resource_alias(alias_resource_bracket_match[1]);
                add_control_identifier('Resource');
            }

            const destructure_package_regex = new RegExp(
                `\\b(?:const|let|var)\\s*\\{([^}]+)\\}\\s*=\\s*${escaped_package_alias}\\b`,
                'g'
            );
            let destructure_match;
            while ((destructure_match = destructure_package_regex.exec(source_text)) !== null) {
                const entries = parse_destructured_entries(destructure_match[1]);
                for (const entry of entries) {
                    if (entry.source === 'controls') {
                        controls_aliases.add(entry.local);
                    } else {
                        add_control_identifier(entry.source);
                        if (entry.source === 'Resource') {
                            add_resource_alias(entry.local);
                        }
                    }
                }
            }
        }

        const import_destructure_regex = new RegExp(
            `\\bimport\\s*\\{([^}]+)\\}\\s*from\\s*['"]${package_name_regex}['"]`,
            'g'
        );
        let import_destructure_match;
        while ((import_destructure_match = import_destructure_regex.exec(source_text)) !== null) {
            const entries = parse_destructured_entries(import_destructure_match[1]);
            for (const entry of entries) {
                if (entry.source === 'controls') {
                    controls_aliases.add(entry.local);
                } else {
                    add_control_identifier(entry.source);
                    if (entry.source === 'Resource') {
                        add_resource_alias(entry.local);
                    }
                }
            }
        }

        let dynamic_control_access_detected = false;
        let dynamic_resource_access_detected = false;

        const scan_bracket_access_expression = (expression_text) => {
            const escaped_expression = escape_for_regexp(expression_text);
            const bracket_access_regex = new RegExp(`\\b${escaped_expression}\\s*\\[\\s*([^\\]]+)\\]`, 'g');
            let bracket_access_match;
            while ((bracket_access_match = bracket_access_regex.exec(source_text)) !== null) {
                const bracket_identifier = parse_static_bracket_identifier(bracket_access_match[1]);
                if (bracket_identifier) {
                    add_control_identifier(bracket_identifier);
                } else {
                    dynamic_control_access_detected = true;
                }
            }
        };

        scan_bracket_access_expression('jsgui.controls');
        scan_bracket_access_expression('jsgui');
        for (const controls_alias of controls_aliases) {
            scan_bracket_access_expression(controls_alias);
        }
        for (const package_alias of package_aliases) {
            scan_bracket_access_expression(`${package_alias}.controls`);
            scan_bracket_access_expression(package_alias);
        }

        const direct_package_controls_bracket_regex = new RegExp(
            `require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\.controls\\s*\\[\\s*([^\\]]+)\\]`,
            'g'
        );
        let direct_package_controls_bracket_match;
        while ((direct_package_controls_bracket_match = direct_package_controls_bracket_regex.exec(source_text)) !== null) {
            const bracket_identifier = parse_static_bracket_identifier(direct_package_controls_bracket_match[1]);
            if (bracket_identifier) {
                add_control_identifier(bracket_identifier);
            } else {
                dynamic_control_access_detected = true;
            }
        }

        const direct_package_bracket_regex = new RegExp(
            `require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\s*\\[\\s*([^\\]]+)\\]`,
            'g'
        );
        let direct_package_bracket_match;
        while ((direct_package_bracket_match = direct_package_bracket_regex.exec(source_text)) !== null) {
            const bracket_identifier = parse_static_bracket_identifier(direct_package_bracket_match[1]);
            if (bracket_identifier) {
                add_control_identifier(bracket_identifier);
            } else {
                dynamic_control_access_detected = true;
            }
        }

        // controls.Button / jsgui.controls.Button
        const dot_access_regexes = [/\bjsgui\.controls\.([A-Za-z_$][A-Za-z0-9_$]*)/g, /\bjsgui\.([A-Z][A-Za-z0-9_$]*)/g];
        for (const controls_alias of controls_aliases) {
            dot_access_regexes.push(new RegExp(`\\b${escape_for_regexp(controls_alias)}\\.([A-Za-z_$][A-Za-z0-9_$]*)`, 'g'));
        }
        for (const package_alias of package_aliases) {
            const escaped_package_alias = escape_for_regexp(package_alias);
            dot_access_regexes.push(new RegExp(`\\b${escaped_package_alias}\\.controls\\.([A-Za-z_$][A-Za-z0-9_$]*)`, 'g'));
            dot_access_regexes.push(new RegExp(`\\b${escaped_package_alias}\\.([A-Z][A-Za-z0-9_$]*)`, 'g'));
        }
        const direct_require_dot_access_regexes = [
            new RegExp(`require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\.controls\\.([A-Za-z_$][A-Za-z0-9_$]*)`, 'g'),
            new RegExp(`require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\.([A-Z][A-Za-z0-9_$]*)`, 'g')
        ];

        for (const regex of [...dot_access_regexes, ...direct_require_dot_access_regexes]) {
            let match;
            while ((match = regex.exec(source_text)) !== null) {
                const identifier = sanitize_identifier(match[1]);
                if (identifier) add_control_identifier(identifier);
            }
        }

        const resource_alias_direct_regex = new RegExp(
            `\\b(?:const|let|var)\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\.Resource\\b`,
            'g'
        );
        let resource_alias_direct_match;
        while ((resource_alias_direct_match = resource_alias_direct_regex.exec(source_text)) !== null) {
            add_resource_alias(resource_alias_direct_match[1]);
            add_control_identifier('Resource');
        }
        for (const package_alias of package_aliases) {
            const escaped_package_alias = escape_for_regexp(package_alias);
            const resource_alias_from_package_regex = new RegExp(
                `\\b(?:const|let|var)\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*${escaped_package_alias}\\.Resource\\b`,
                'g'
            );
            let resource_alias_from_package_match;
            while ((resource_alias_from_package_match = resource_alias_from_package_regex.exec(source_text)) !== null) {
                add_resource_alias(resource_alias_from_package_match[1]);
                add_control_identifier('Resource');
            }
        }

        const direct_resource_subfeature_regexes = [
            new RegExp(
                `require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\.Resource\\.(${resource_subfeature_regex_fragment})\\b`,
                'g'
            )
        ];
        for (const package_alias of package_aliases) {
            direct_resource_subfeature_regexes.push(
                new RegExp(`\\b${escape_for_regexp(package_alias)}\\.Resource\\.(${resource_subfeature_regex_fragment})\\b`, 'g')
            );
        }
        for (const regex of direct_resource_subfeature_regexes) {
            let match;
            while ((match = regex.exec(source_text)) !== null) {
                add_control_identifier(match[1]);
                add_control_identifier('Resource');
            }
        }

        const known_lower_case_property_regexes = [];
        for (const package_alias of package_aliases) {
            const escaped_package_alias = escape_for_regexp(package_alias);
            known_lower_case_property_regexes.push(new RegExp(`\\b${escaped_package_alias}\\.(gfx|mixins|mx)\\b`, 'g'));
            known_lower_case_property_regexes.push(new RegExp(`\\b${escaped_package_alias}\\.Resource\\.(load_compiler)\\b`, 'g'));
        }
        known_lower_case_property_regexes.push(
            new RegExp(`require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\.(gfx|mixins|mx)\\b`, 'g'),
            new RegExp(`require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\.Resource\\.(load_compiler)\\b`, 'g')
        );
        for (const regex of known_lower_case_property_regexes) {
            let match;
            while ((match = regex.exec(source_text)) !== null) {
                const identifier = sanitize_identifier(match[1]);
                if (identifier) add_control_identifier(identifier);
            }
        }

        // const { Button } = controls / jsgui.controls / require('jsgui3-html').controls / require('jsgui3-html')
        const destructuring_regexes = [
            /\b(?:const|let|var)\s*\{([^}]+)\}\s*=\s*jsgui\.controls\b/g,
            new RegExp(`\\b(?:const|let|var)\\s*\\{([^}]+)\\}\\s*=\\s*require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\.controls\\b`, 'g'),
            new RegExp(`\\b(?:const|let|var)\\s*\\{([^}]+)\\}\\s*=\\s*require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\b`, 'g'),
            new RegExp(`\\b(?:const|let|var)\\s*\\{([^}]+)\\}\\s*=\\s*require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\.Resource\\b`, 'g'),
            new RegExp(`\\bimport\\s*\\{([^}]+)\\}\\s*from\\s*['"]${package_name_regex}['"]`, 'g')
        ];
        for (const controls_alias of controls_aliases) {
            destructuring_regexes.push(new RegExp(`\\b(?:const|let|var)\\s*\\{([^}]+)\\}\\s*=\\s*${escape_for_regexp(controls_alias)}\\b`, 'g'));
        }
        for (const package_alias of package_aliases) {
            const escaped_package_alias = escape_for_regexp(package_alias);
            destructuring_regexes.push(new RegExp(`\\b(?:const|let|var)\\s*\\{([^}]+)\\}\\s*=\\s*${escaped_package_alias}\\.controls\\b`, 'g'));
            destructuring_regexes.push(new RegExp(`\\b(?:const|let|var)\\s*\\{([^}]+)\\}\\s*=\\s*${escaped_package_alias}\\b`, 'g'));
            destructuring_regexes.push(new RegExp(`\\b(?:const|let|var)\\s*\\{([^}]+)\\}\\s*=\\s*${escaped_package_alias}\\.Resource\\b`, 'g'));
        }

        for (const regex of destructuring_regexes) {
            let match;
            while ((match = regex.exec(source_text)) !== null) {
                const entries = parse_destructured_entries(match[1]);
                for (const entry of entries) {
                    if (entry.source === 'controls') {
                        controls_aliases.add(entry.local);
                    } else {
                        add_control_identifier(entry.source);
                        if (entry.source === 'Resource') {
                            add_resource_alias(entry.local);
                        }
                    }
                }
            }
        }

        const scan_resource_bracket_expression = (expression_text) => {
            const escaped_expression = escape_for_regexp(expression_text);
            const resource_bracket_regex = new RegExp(`\\b${escaped_expression}\\s*\\[\\s*([^\\]]+)\\]`, 'g');
            let resource_bracket_match;
            while ((resource_bracket_match = resource_bracket_regex.exec(source_text)) !== null) {
                const bracket_identifier = parse_static_bracket_identifier(resource_bracket_match[1]);
                if (bracket_identifier) {
                    add_control_identifier(bracket_identifier);
                    add_control_identifier('Resource');
                } else {
                    dynamic_resource_access_detected = true;
                    add_resource_family_fallback_identifiers();
                }
            }
        };

        const resource_alias_property_regexes = [];
        for (const resource_alias of resource_aliases) {
            resource_alias_property_regexes.push(
                new RegExp(`\\b${escape_for_regexp(resource_alias)}\\.(${resource_subfeature_regex_fragment})\\b`, 'g')
            );
            scan_resource_bracket_expression(resource_alias);
            const resource_alias_destructure_regex = new RegExp(
                `\\b(?:const|let|var)\\s*\\{([^}]+)\\}\\s*=\\s*${escape_for_regexp(resource_alias)}\\b`,
                'g'
            );
            let resource_alias_destructure_match;
            while ((resource_alias_destructure_match = resource_alias_destructure_regex.exec(source_text)) !== null) {
                const entries = parse_destructured_entries(resource_alias_destructure_match[1]);
                for (const entry of entries) {
                    add_control_identifier(entry.source);
                    add_control_identifier('Resource');
                }
            }
        }
        for (const package_alias of package_aliases) {
            scan_resource_bracket_expression(`${package_alias}.Resource`);
        }
        const direct_package_resource_bracket_regex = new RegExp(
            `require\\s*\\(\\s*['"]${package_name_regex}['"]\\s*\\)\\.Resource\\s*\\[\\s*([^\\]]+)\\]`,
            'g'
        );
        let direct_package_resource_bracket_match;
        while ((direct_package_resource_bracket_match = direct_package_resource_bracket_regex.exec(source_text)) !== null) {
            const bracket_identifier = parse_static_bracket_identifier(direct_package_resource_bracket_match[1]);
            if (bracket_identifier) {
                add_control_identifier(bracket_identifier);
                add_control_identifier('Resource');
            } else {
                dynamic_resource_access_detected = true;
                add_resource_family_fallback_identifiers();
            }
        }

        for (const regex of resource_alias_property_regexes) {
            let match;
            while ((match = regex.exec(source_text)) !== null) {
                add_control_identifier(match[1]);
                add_control_identifier('Resource');
            }
        }

        return {
            uses_jsgui3_html,
            dynamic_control_access_detected,
            dynamic_resource_access_detected,
            control_identifiers: Array.from(control_identifiers),
            package_aliases: Array.from(package_aliases),
            controls_aliases: Array.from(controls_aliases)
        };
    }

    async read_controls_require_map(jsgui3_html_root) {
        if (!this.cache_enabled) {
            this.cache_stats.controls_map_misses += 1;
            return this._read_controls_require_map_uncached(jsgui3_html_root);
        }

        if (this.controls_map_cache.has(jsgui3_html_root)) {
            this.cache_stats.controls_map_hits += 1;
            return this.controls_map_cache.get(jsgui3_html_root);
        }
        this.cache_stats.controls_map_misses += 1;
        const controls_map = await this._read_controls_require_map_uncached(jsgui3_html_root);
        this.controls_map_cache.set(jsgui3_html_root, controls_map);
        return controls_map;
    }

    async _read_controls_require_map_uncached(jsgui3_html_root) {
        const controls_file_path = path.join(jsgui3_html_root, 'controls', 'controls.js');
        const controls_source = await fs_async.readFile(controls_file_path, 'utf8');
        const controls_file_dir = path.dirname(controls_file_path);

        const controls_map = {};
        const require_regex = /([A-Za-z0-9_]+)\s*:\s*require\((['"])([^'"]+)\2\)(\.[A-Za-z0-9_]+)?/g;
        let match;
        while ((match = require_regex.exec(controls_source)) !== null) {
            const control_name = match[1];
            const require_path = match[3];
            const property_suffix = match[4] || '';

            const absolute_require_path = path.resolve(controls_file_dir, require_path);
            controls_map[control_name] = {
                absolute_require_path,
                property_suffix
            };
        }

        return controls_map;
    }

    build_manifest(analysis) {
        return {
            package_name: analysis.package_name,
            entry_file_path: analysis.entry_file_path,
            reachable_files: analysis.reachable_files,
            uses_jsgui3_html: analysis.uses_jsgui3_html,
            dynamic_control_access_detected: analysis.dynamic_control_access_detected,
            dynamic_resource_access_detected: analysis.dynamic_resource_access_detected === true,
            used_identifiers: analysis.used_identifiers,
            selected_root_features: analysis.selected_root_features || [],
            selected_controls: analysis.selected_controls,
            unmatched_identifiers: analysis.unmatched_identifiers,
            package_aliases: analysis.package_aliases || [],
            controls_aliases: analysis.controls_aliases || []
        };
    }

    async write_shim_file(manifest) {
        await fs_async.mkdir(this.shim_dir, {recursive: true});
        const jsgui3_html_root = path.dirname(require.resolve(this.package_name));

        const hash_input = JSON.stringify({
            entry: manifest.entry_file_path,
            selected_controls: manifest.selected_controls,
            selected_root_features: manifest.selected_root_features || [],
            package_name: manifest.package_name
        });
        const hash = crypto.createHash('sha256').update(hash_input).digest('hex').slice(0, 24);
        const shim_file_path = path.join(this.shim_dir, `jsgui3-html-controls-shim-${hash}.js`);

        const controls_map = await this.read_controls_require_map(jsgui3_html_root);
        const selected_control_lines = [];
        for (const control_name of manifest.selected_controls) {
            const map_item = controls_map[control_name];
            if (!map_item) continue;
            const {absolute_require_path, property_suffix} = map_item;
            selected_control_lines.push(
                `    ${control_name}: require('${to_module_literal(absolute_require_path)}')${property_suffix}`
            );
        }

        const html_core_path = to_module_literal(path.join(jsgui3_html_root, 'html-core', 'html-core.js'));
        const selected_root_features_set = new Set(Array.isArray(manifest.selected_root_features) ? manifest.selected_root_features : []);
        const root_feature_lines = [];

        if (selected_root_features_set.has('router')) {
            const router_path = to_module_literal(path.join(jsgui3_html_root, 'router', 'router.js'));
            root_feature_lines.push(`jsgui.Router = require('${router_path}');`);
        }

        const has_resource_feature =
            selected_root_features_set.has('resource') ||
            selected_root_features_set.has('resource_pool') ||
            selected_root_features_set.has('resource_data_kv') ||
            selected_root_features_set.has('resource_data_transform') ||
            selected_root_features_set.has('resource_compilation') ||
            selected_root_features_set.has('resource_compiler') ||
            selected_root_features_set.has('resource_load_compiler');
        if (has_resource_feature) {
            const resource_path = to_module_literal(path.join(jsgui3_html_root, 'resource', 'resource.js'));
            root_feature_lines.push(`jsgui.Resource = require('${resource_path}');`);
        }
        if (selected_root_features_set.has('resource_pool')) {
            const resource_pool_path = to_module_literal(path.join(jsgui3_html_root, 'resource', 'pool.js'));
            root_feature_lines.push(`jsgui.Resource_Pool = require('${resource_pool_path}');`);
        }
        if (selected_root_features_set.has('resource_data_kv')) {
            const data_kv_resource_path = to_module_literal(path.join(jsgui3_html_root, 'resource', 'data-kv-resource.js'));
            root_feature_lines.push(`jsgui.Resource.Data_KV = require('${data_kv_resource_path}');`);
        }
        if (selected_root_features_set.has('resource_data_transform')) {
            const data_transform_resource_path = to_module_literal(path.join(jsgui3_html_root, 'resource', 'data-transform-resource.js'));
            root_feature_lines.push(`jsgui.Resource.Data_Transform = require('${data_transform_resource_path}');`);
        }
        if (selected_root_features_set.has('resource_compilation')) {
            const compilation_resource_path = to_module_literal(path.join(jsgui3_html_root, 'resource', 'compilation-resource.js'));
            root_feature_lines.push(`jsgui.Resource.Compilation = require('${compilation_resource_path}');`);
        }
        if (selected_root_features_set.has('resource_compiler')) {
            const compiler_resource_path = to_module_literal(path.join(jsgui3_html_root, 'resource', 'compiler-resource.js'));
            root_feature_lines.push(`jsgui.Resource.Compiler = require('${compiler_resource_path}');`);
        }
        if (selected_root_features_set.has('resource_load_compiler')) {
            root_feature_lines.push(`
jsgui.Resource.load_compiler = (name, jsfn, options) => {
    const compiler_name = name;
    const compiler_fn = jsfn;
    const compiler_options = options || {};
    if (typeof compiler_name !== 'string' || compiler_name.length === 0) {
        throw new Error('Resource.load_compiler(name, fn, options) requires a non-empty string name');
    }
    if (typeof compiler_fn !== 'function') {
        throw new Error('Resource.load_compiler(name, fn, options) requires a function compiler implementation');
    }
    const compiler_resource = new jsgui.Resource.Compiler({ name: compiler_name });
    compiler_resource.transform = (input, transform_options = {}) => {
        const merged_options = Object.assign({}, compiler_options, transform_options);
        return compiler_fn(input, merged_options);
    };
    jsgui.Resource.compilers = jsgui.Resource.compilers || {};
    jsgui.Resource.compilers[compiler_name] = compiler_resource;
    const pool = compiler_options.pool || compiler_options.resource_pool;
    if (pool && typeof pool.add === 'function') {
        pool.add(compiler_resource);
    }
    return compiler_resource;
};`.trim());
        }

        if (selected_root_features_set.has('gfx')) {
            let gfx_require_target = 'jsgui3-gfx-core';
            try {
                gfx_require_target = to_module_literal(require.resolve('jsgui3-gfx-core', {paths: [jsgui3_html_root]}));
            } catch (err) {
                // Keep package-name fallback when direct path resolution is unavailable.
            }
            root_feature_lines.push(`jsgui.gfx = require('${gfx_require_target}');`);
        }

        if (selected_root_features_set.has('mixins')) {
            const mixins_path = to_module_literal(path.join(jsgui3_html_root, 'control_mixins', 'mx.js'));
            root_feature_lines.push(`jsgui.mixins = jsgui.mx = require('${mixins_path}');`);
        }

        const shim_source = `
const jsgui = require('${html_core_path}');
${root_feature_lines.join('\n')}
jsgui.controls = jsgui.controls || {};
Object.assign(jsgui.controls, {
${selected_control_lines.join(',\n')}
});
Object.assign(jsgui, jsgui.controls);
module.exports = jsgui;
`.trimStart();

        await fs_async.writeFile(shim_file_path, shim_source, 'utf8');
        return shim_file_path;
    }

    async write_manifest_file(manifest) {
        await fs_async.mkdir(this.manifest_dir, {recursive: true});
        const hash_input = JSON.stringify({
            entry: manifest.entry_file_path,
            selected_controls: manifest.selected_controls,
            selected_root_features: manifest.selected_root_features || [],
            package_name: manifest.package_name
        });
        const hash = crypto.createHash('sha256').update(hash_input).digest('hex').slice(0, 24);
        const manifest_file_path = path.join(this.manifest_dir, `jsgui3-html-control-scan-${hash}.json`);
        await fs_async.writeFile(manifest_file_path, JSON.stringify(manifest, null, 2), 'utf8');
    }

    create_esbuild_plugin(shim_file_path) {
        const package_name_regex = new RegExp(`^${escape_for_regexp(this.package_name)}$`);
        return {
            name: 'jsgui3-html-control-optimizer',
            setup(build) {
                build.onResolve({filter: package_name_regex}, () => ({path: shim_file_path}));
            }
        };
    }
}

module.exports = JSGUI3_HTML_Control_Optimizer;
