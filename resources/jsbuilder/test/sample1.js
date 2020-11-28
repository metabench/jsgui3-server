const {each} = require('lang-mini');

const arr_sample = [1, 2, 3, 4, 5];
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
    another_string: 'This is a longer string.',
    str_sample: str_sample
});


module.exports = mod_res;





