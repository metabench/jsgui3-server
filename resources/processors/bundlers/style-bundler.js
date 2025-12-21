const SASS_Compiler = require('../compilers/SASS_Compiler');

const normalize_sources = (value) => {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
};

const normalize_style_segments = (value) => {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
};

const coerce_style_segments = (segments) => {
	return normalize_style_segments(segments)
		.map((segment) => {
			if (!segment) return null;
			if (typeof segment === 'string') {
				return {type: 'css', source: segment};
			}
			const type_value = segment.type || segment.syntax || segment.lang;
			const source_value = segment.source ?? segment.value;
			if (!type_value || source_value === undefined || source_value === null) return null;
			const normalized_type = typeof type_value === 'string' ? type_value.toLowerCase() : type_value;
			return {type: normalized_type, source: source_value};
		})
		.filter(Boolean)
		.filter((segment) => segment.type === 'css' || segment.type === 'scss' || segment.type === 'sass');
};

const join_sources = (sources) => {
	return sources.filter(Boolean).join('\n');
};

const serialize_source_map = (source_map) => {
	if (!source_map) return '';
	return JSON.stringify(source_map);
};

const build_inline_source_map_comment = (source_map) => {
	const source_map_json = serialize_source_map(source_map);
	if (!source_map_json) return '';
	const base64_map = Buffer.from(source_map_json, 'utf8').toString('base64');
	return `/*# sourceMappingURL=data:application/json;base64,${base64_map} */`;
};

const get_sourcemap_config = (style_config) => {
	const sourcemap_config = style_config.sourcemaps || {};
	const enabled = sourcemap_config.enabled === true || (style_config.debug === true && sourcemap_config.enabled !== false);
	return {
		enabled,
		inline: sourcemap_config.inline !== false,
		include_sources: sourcemap_config.include_sources !== false
	};
};

const compile_style_segments = (style_segments, style_config) => {
	const scss_extra_sources = normalize_sources(style_config.scss_sources);
	const sass_extra_sources = normalize_sources(style_config.sass_sources);

	const load_paths = normalize_sources(style_config.load_paths);
	const output_style = style_config.output_style;
	const quiet_dependencies = style_config.quiet_dependencies;
	const compile_css_with_sass = style_config.compile_css_with_sass !== false;
	const sourcemap_config = get_sourcemap_config(style_config);

	const normalized_segments = [...style_segments];
	for (const source of scss_extra_sources) {
		if (source) normalized_segments.push({type: 'scss', source});
	}
	for (const source of sass_extra_sources) {
		if (source) normalized_segments.push({type: 'sass', source});
	}

	const has_css_segments = normalized_segments.some((segment) => segment.type === 'css');
	const has_scss_segments = normalized_segments.some((segment) => segment.type === 'scss');
	const has_sass_segments = normalized_segments.some((segment) => segment.type === 'sass');

	const needs_sass = has_sass_segments || has_scss_segments || (compile_css_with_sass && has_css_segments);
	if (!needs_sass) {
		return {
			css: join_sources(normalized_segments.map((segment) => segment.source)),
			used_sass_toolchain: false
		};
	}

	const sass_compiler = new SASS_Compiler({
		load_paths,
		output_style,
		quiet_dependencies
	});

	const compile_individually = has_sass_segments || !compile_css_with_sass;

	if (!compile_individually) {
		const scss_input = join_sources(normalized_segments.map((segment) => segment.source));
		const scss_result = sass_compiler.compile_scss_string(scss_input, {
			source_map: sourcemap_config.enabled,
			source_map_include_sources: sourcemap_config.include_sources,
			return_source_map: sourcemap_config.enabled
		});
		const scss_output = typeof scss_result === 'string' ? scss_result : (scss_result.css || '');
		const scss_source_map = typeof scss_result === 'string' ? null : (scss_result.source_map || null);

		let combined_css = scss_output;
		if (sourcemap_config.enabled && sourcemap_config.inline) {
			const inline_comment = build_inline_source_map_comment(scss_source_map);
			if (inline_comment) {
				combined_css = [combined_css, inline_comment].filter(Boolean).join('\n');
			}
		}

		return {
			css: combined_css,
			used_sass_toolchain: true
		};
	}

	const compiled_chunks = [];
	let compiled_segment_count = 0;
	let raw_css_appended = false;
	let single_source_map = null;

	for (const segment of normalized_segments) {
		if (!segment || !segment.source) continue;
		if (segment.type === 'css' && !compile_css_with_sass) {
			compiled_chunks.push(segment.source);
			raw_css_appended = true;
			continue;
		}

		if (segment.type === 'css' || segment.type === 'scss') {
			const scss_result = sass_compiler.compile_scss_string(segment.source, {
				source_map: sourcemap_config.enabled,
				source_map_include_sources: sourcemap_config.include_sources,
				return_source_map: sourcemap_config.enabled
			});
			const scss_output = typeof scss_result === 'string' ? scss_result : (scss_result.css || '');
			const scss_source_map = typeof scss_result === 'string' ? null : (scss_result.source_map || null);
			if (scss_output) compiled_chunks.push(scss_output);
			compiled_segment_count += 1;
			if (compiled_segment_count === 1) {
				single_source_map = scss_source_map;
			} else {
				single_source_map = null;
			}
		} else if (segment.type === 'sass') {
			const sass_result = sass_compiler.compile_sass_string(segment.source, {
				source_map: sourcemap_config.enabled,
				source_map_include_sources: sourcemap_config.include_sources,
				return_source_map: sourcemap_config.enabled
			});
			const sass_output = typeof sass_result === 'string' ? sass_result : (sass_result.css || '');
			const sass_source_map = typeof sass_result === 'string' ? null : (sass_result.source_map || null);
			if (sass_output) compiled_chunks.push(sass_output);
			compiled_segment_count += 1;
			if (compiled_segment_count === 1) {
				single_source_map = sass_source_map;
			} else {
				single_source_map = null;
			}
		}
	}

	let combined_css = compiled_chunks.filter(Boolean).join('\n');
	if (sourcemap_config.enabled && sourcemap_config.inline && compiled_segment_count === 1 && !raw_css_appended) {
		const inline_comment = build_inline_source_map_comment(single_source_map);
		if (inline_comment) {
			combined_css = [combined_css, inline_comment].filter(Boolean).join('\n');
		}
	}

	return {
		css: combined_css,
		used_sass_toolchain: true
	};
};

const compile_styles = (style_payload = {}, style_config = {}) => {
	const style_segments = coerce_style_segments(style_payload.style_segments || style_payload.segments);
	const has_non_css_segments = style_segments.some((segment) => segment.type !== 'css');
	if (style_segments.length > 0 && has_non_css_segments) {
		return compile_style_segments(style_segments, style_config);
	}

	const css_sources = normalize_sources(style_payload.css);
	const scss_sources = normalize_sources(style_payload.scss);
	const sass_sources = normalize_sources(style_payload.sass);

	const scss_extra_sources = normalize_sources(style_config.scss_sources);
	const sass_extra_sources = normalize_sources(style_config.sass_sources);

	const load_paths = normalize_sources(style_config.load_paths);
	const output_style = style_config.output_style;
	const quiet_dependencies = style_config.quiet_dependencies;

	const has_scss_sources = scss_sources.length > 0 || scss_extra_sources.length > 0;
	const has_sass_sources = sass_sources.length > 0 || sass_extra_sources.length > 0;
	const should_use_sass = has_scss_sources || has_sass_sources;
	const compile_css_with_sass = style_config.compile_css_with_sass !== false;
	const sourcemap_config = get_sourcemap_config(style_config);

	const css_string = join_sources(css_sources);

	if (!should_use_sass) {
		return {
			css: css_string,
			used_sass_toolchain: false
		};
	}

	const sass_compiler = new SASS_Compiler({
		load_paths,
		output_style,
		quiet_dependencies
	});

	let scss_output = '';
	let sass_output = '';
	let scss_source_map = null;
	let sass_source_map = null;

	if (has_scss_sources || (compile_css_with_sass && css_string)) {
		const scss_sources_to_compile = [];
		if (compile_css_with_sass && css_string) scss_sources_to_compile.push(css_string);
		scss_sources_to_compile.push(...scss_sources, ...scss_extra_sources);

		const scss_input = join_sources(scss_sources_to_compile);
		if (scss_input) {
			const scss_result = sass_compiler.compile_scss_string(scss_input, {
				source_map: sourcemap_config.enabled,
				source_map_include_sources: sourcemap_config.include_sources,
				return_source_map: sourcemap_config.enabled
			});
			if (typeof scss_result === 'string') {
				scss_output = scss_result;
			} else {
				scss_output = scss_result.css || '';
				scss_source_map = scss_result.source_map || null;
			}
		}
	}

	if (has_sass_sources) {
		const sass_sources_to_compile = [...sass_sources, ...sass_extra_sources];
		const sass_input = join_sources(sass_sources_to_compile);
		if (sass_input) {
			const sass_result = sass_compiler.compile_sass_string(sass_input, {
				source_map: sourcemap_config.enabled,
				source_map_include_sources: sourcemap_config.include_sources,
				return_source_map: sourcemap_config.enabled
			});
			if (typeof sass_result === 'string') {
				sass_output = sass_result;
			} else {
				sass_output = sass_result.css || '';
				sass_source_map = sass_result.source_map || null;
			}
		}
	}

	let combined_css = [scss_output, sass_output].filter(Boolean).join('\n');
	const raw_css_appended = !compile_css_with_sass && css_string;
	if (raw_css_appended) {
		combined_css = [css_string, combined_css].filter(Boolean).join('\n');
	}

	if (sourcemap_config.enabled && sourcemap_config.inline) {
		const has_scss_output = Boolean(scss_output);
		const has_sass_output = Boolean(sass_output);
		const can_inline_map = !raw_css_appended && ((has_scss_output && !has_sass_output) || (!has_scss_output && has_sass_output));
		if (can_inline_map) {
			const selected_map = has_scss_output ? scss_source_map : sass_source_map;
			const inline_comment = build_inline_source_map_comment(selected_map);
			if (inline_comment) {
				combined_css = [combined_css, inline_comment].filter(Boolean).join('\n');
			}
		}
	}

	return {
		css: combined_css,
		used_sass_toolchain: true
	};
};

module.exports = {
	compile_styles
};
