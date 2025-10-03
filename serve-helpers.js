const fs = require('fs');
const lib_path = require('path');

const truthy = value => {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'number') return value !== 0;
	if (typeof value === 'string') return value.length > 0 && value !== 'false' && value !== '0';
	return Boolean(value);
};

const guess_caller_file = () => {
	const orig = Error.prepareStackTrace;
	try {
		Error.prepareStackTrace = (_, stack) => stack;
		const err = new Error();
		const stack = err.stack || [];
		Error.prepareStackTrace = orig;
		for (const frame of stack) {
			if (!frame || typeof frame.getFileName !== 'function') continue;
			const file = frame.getFileName();
			if (!file || file === __filename || file === lib_path.resolve(__dirname, 'serve.js') || file === lib_path.resolve(__dirname, 'server.js')) continue;
			if (file.includes('internal/') || file.includes('node:internal')) continue;
			return file;
		}
		return null;
	} catch (err) {
		Error.prepareStackTrace = orig;
		return null;
	}
};

const resolve_from_base = (base_dir, relative_path) => {
	if (!relative_path) return null;
	return lib_path.isAbsolute(relative_path) ? relative_path : lib_path.resolve(base_dir, relative_path);
};

const find_default_client_path = (preferred, caller_dir) => {
	if (preferred) {
		const abs_preferred = resolve_from_base(caller_dir, preferred);
		if (abs_preferred && fs.existsSync(abs_preferred)) return abs_preferred;
	}
	const search_dirs = [caller_dir, process.cwd()];
	const candidates = ['client.js', 'src/client.js', 'app/client.js'];
	for (const dir of search_dirs) {
		if (!dir) continue;
		for (const name of candidates) {
			const candidate_path = lib_path.resolve(dir, name);
			if (fs.existsSync(candidate_path)) return candidate_path;
		}
	}
	return null;
};

const load_default_control_from_client = client_path => {
	if (!client_path) return null;
	try {
		const mod = require(client_path);
		if (!mod) return null;
		if (typeof mod === 'function') return mod;
		if (mod.default && typeof mod.default === 'function') return mod.default;
		const candidate_controls = [];
		if (mod.controls && typeof mod.controls === 'object') {
			candidate_controls.push(...Object.values(mod.controls));
		}
		if (mod.control && typeof mod.control === 'function') {
			candidate_controls.push(mod.control);
		}
		if (mod.Ctrl && typeof mod.Ctrl === 'function') {
			candidate_controls.push(mod.Ctrl);
		}
		if (mod.default && mod.default.controls && typeof mod.default.controls === 'object') {
			candidate_controls.push(...Object.values(mod.default.controls));
		}
		for (const candidate_ctrl of candidate_controls) {
			if (typeof candidate_ctrl === 'function') return candidate_ctrl;
		}
	} catch (err) {
		return null;
	}
	return null;
};

const ensure_route_leading_slash = route => {
	if (!route) return '/';
	return route.startsWith('/') ? route : `/${route}`;
};

module.exports = {
    truthy,
    guess_caller_file,
    resolve_from_base,
    find_default_client_path,
    load_default_control_from_client,
    ensure_route_leading_slash
}