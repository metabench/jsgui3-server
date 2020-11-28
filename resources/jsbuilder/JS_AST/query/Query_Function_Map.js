
const {each} = require('lang-mini');


class Query_Function_Map {
    constructor(spec) {
        const map_fns = new Map();
        const map_ngrams = new Map();

        const arr_fns = [];
        const arr_ngrams = [];

        const ngram_assign_fn = (single_word_term_name, fn) => {
            if (!map_fns.has(single_word_term_name)) {
                map_fns.set(single_word_term_name, fn);
                arr_fns.push(fn);
            } else {
                throw 'Already loaded the word "' + single_word_term_name + '".';
            }
            return true;
        }

        const ngram_assign_term = (single_word_term_name, str_ngram) => {
            if (!map_ngrams.has(single_word_term_name)) {
                map_ngrams.set(str_ngram, single_word_term_name);
            } else {
                throw 'Phrase "' + str_ngram + '" is already loaded for the word "' + single_word_term_name + '".';
            }
            return true;
        }

        const ngrams = {
            assign: function() {
                const a = arguments;
                const al = a.length;
                if (al === 2) {
                    if (typeof a[0] === 'string' && typeof a[1] === 'string') {

                        const c0 = a[0].split(' ');
                        const c1 = a[1].split(' ');

                        if (c0.length > 1) {
                            throw 'stop';
                        }
                        return ngram_assign_term(a[0], a[1]);
                    } else {
                        if (typeof a[0] === 'string' && Array.isArray(a[1])) {
                            each(a[1], item => ngrams.assign(a[0], item));
                        } else {
                            throw 'stop';
                        }
                        //
                    }
                    //if (typeof a[1] === 'string' && typeof a[0] === 'function') {
                    //    return ngram_assign_term(a[1], a[0]);
                    //}
                } else {

                    if (al === 1) {
                        if (typeof a[0] === 'object') {

                            if (!Array.isArray(a[0])) {
                                const o = a[0];
                                each(o, (value, key) => {
                                    ngrams.assign(key, value);
                                })
                            } else {
                                throw 'stop';
                            }

                        }
                    } else {
                        throw 'stop';
                    }
                    //throw 'NYI';
                }
            }
        };
        
        Object.defineProperty(ngrams, 'list', {
            get() { 
                return Array.from(map_ngrams.keys()).sort();
            },
            enumerable: true,
            configurable: false
        });
        const functions = {
            //count: () => arr_fns.length,
            assign: function() {
                const a = arguments;
                const al = a.length;
                if (al === 2) {
                    if (typeof a[0] === 'string' && typeof a[1] === 'function') {

                        const c0 = a[0].split(' ');
                        //const c1 = a[1].split(' ');
                        if (c0.length > 1) {
                            throw 'stop';
                        }
                        return ngram_assign_fn(a[0], a[1]);
                        //
                    }
                    //if (typeof a[1] === 'string' && typeof a[0] === 'function') {
                    //    return ngram_assign_term(a[1], a[0]);
                    //}
                } else {
                    if (al === 1) {
                        //throw 'NYI';

                        if (Array.isArray(a[0])) {
                            each(a[0], fn => functions.assign(fn));
                        }

                        if (typeof a[0] === 'function') {
                            const n = a[0].name;
                            if (n !== undefined) {
                                return functions.assign(n, a[0]);
                            } else {
                                throw 'Must provide a function name if the function does not already have it as its property.'
                            }
                        }
                    } else {
                        throw 'stop';
                    }
                }
            }
        };

        Object.defineProperty(functions, 'count', {
            get() { 
                return arr_fns.length;
            },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(functions, 'names', {
            get() { 
                return Array.from(map_fns.keys()).sort();
            },
            enumerable: true,
            configurable: false
        });

        // map_fns

        this.get = str_ngram => {
            const term = map_ngrams.get(str_ngram);
            if (term) {
                const fn = map_fns.get(term);

                if (fn) {
                    return fn;
                } else {
                    console.log('term', term);
                    console.trace();
                    throw 'stop';
                    // should not happen.
                }

            } else {
                console.log('term not found for ngram: "' + str_ngram + '".');
            }
        }

        Object.defineProperty(this, 'ngrams', {
            get() { 
                return ngrams;
            },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'functions', {
            get() { 
                return functions;
            },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'fns', {
            get() { 
                return functions;
            },
            enumerable: true,
            configurable: false
        });
    }
}

module.exports = Query_Function_Map;