let sass_module;

const get_sass_module = () => {
	if (!sass_module) {
		try {
			sass_module = require('sass');
		} catch (err) {
			const error = new Error('SASS compiler not available. Install "sass" to compile SCSS/SASS.');
			error.cause = err;
			throw error;
		}
	}
	return sass_module;
};

const normalize_array = (value) => {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
};

const compile_string_with_sass = (source_string, options = {}) => {
	if (!source_string || !source_string.trim()) {
		return options.return_source_map ? {css: '', source_map: null} : '';
	}

	const sass = get_sass_module();
	const load_paths = normalize_array(options.load_paths);
	const output_style = options.output_style || 'expanded';
	const quiet_dependencies = options.quiet_dependencies === true;

	const compile_options = {
		syntax: options.syntax,
		loadPaths: load_paths,
		style: output_style,
		quietDeps: quiet_dependencies
	};

	if (options.source_map === true) {
		compile_options.sourceMap = true;
		compile_options.sourceMapIncludeSources = options.source_map_include_sources === true;
	}

	const compile_result = sass.compileString(source_string, compile_options);
	const css_output = compile_result.css || '';

	if (options.return_source_map) {
		return {
			css: css_output,
			source_map: compile_result.sourceMap || null
		};
	}

	return css_output;
};

class SASS_Compiler {
	constructor(spec = {}) {
		this.load_paths = normalize_array(spec.load_paths);
		this.output_style = spec.output_style || 'expanded';
		this.quiet_dependencies = spec.quiet_dependencies === true;
	}

	compile_scss_string(scss_string, options = {}) {
		return compile_string_with_sass(scss_string, {
			syntax: 'scss',
			load_paths: options.load_paths || this.load_paths,
			output_style: options.output_style || this.output_style,
			quiet_dependencies: options.quiet_dependencies !== undefined ? options.quiet_dependencies : this.quiet_dependencies,
			source_map: options.source_map,
			source_map_include_sources: options.source_map_include_sources,
			return_source_map: options.return_source_map === true
		});
	}

	compile_sass_string(sass_string, options = {}) {
		return compile_string_with_sass(sass_string, {
			syntax: 'indented',
			load_paths: options.load_paths || this.load_paths,
			output_style: options.output_style || this.output_style,
			quiet_dependencies: options.quiet_dependencies !== undefined ? options.quiet_dependencies : this.quiet_dependencies,
			source_map: options.source_map,
			source_map_include_sources: options.source_map_include_sources,
			return_source_map: options.return_source_map === true
		});
	}
}

module.exports = SASS_Compiler;
