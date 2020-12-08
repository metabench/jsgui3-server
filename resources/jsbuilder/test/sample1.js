const {each, Evented_Class} = require('lang-mini');

const arr_sample = [1, 2, 3, 4, 5];
const arr_sample2 = ['a', 'a', 'a', 'a', 'a'];
const samples = [arr_sample, ['a', 'b', 'c', 'd', 'e']];
const astring = 'hello';

const mod_res = {};

let str_sample;

each(arr_sample, item => {
    str_sample.push(item + '');
})


mod_res.arr_sample = arr_sample;

Object.assign(mod_res, {
    samples: samples,
    astring: astring,
    str_sample: str_sample,
    another_string: 'This is a longer string.'
});

const fn1 = function(a, b, c) {
    return 'a string';
}

module.exports = mod_res;





