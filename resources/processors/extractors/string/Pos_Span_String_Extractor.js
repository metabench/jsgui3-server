const Extractor = require('../Extractor');

const invert_arr_pos_spans = (arr_pos_spans, str_len) => {


    // Create the array of inverted ones...
    //  The one before the first.
    //  The gaps between each of them.
    //  The one after the last.

    const res = [];

    if (arr_pos_spans.length === 0) {
        res.push([0, str_len]);
    } else {

        if (arr_pos_spans[0][0] > 0) {
            res.push([0, arr_pos_spans[0][0]]);
        } else {

        }



        if (arr_pos_spans.length > 1) {
            // there are gaps

            let i = 0;
            // while there are remaining ones...?

            for (i = 0; i < arr_pos_spans.length - 1; i++) {
                res.push([arr_pos_spans[i][1], arr_pos_spans[i+1][0]])
            }
            //console.log('i', i);
            res.push([arr_pos_spans[i][1], str_len])



        } else if (arr_pos_spans.length === 1) {
            res.push([arr_pos_spans[0][1], str_len])
        }



        


    }

    



    return res;




}

class Pos_Span_String_Extractor extends Extractor {
    constructor(spec) {
        super(spec);
    }
    extract(str, arr_pos_spans, options = {}) {

        // Possibly invert the arr_pos_spans

        if (options.invert){
            arr_pos_spans = invert_arr_pos_spans(arr_pos_spans, str.length);

            //console.log('inverted arr_pos_spans', arr_pos_spans);
        }

        let arr_str_res = [];

        // getting the strings within the arr_pos_spans....

        const n_spans = arr_pos_spans.length;
        for (let c = 0; c < n_spans; c++) {
            const pos_span = arr_pos_spans[c];
            arr_str_res.push(str.substring(pos_span[0], pos_span[1]));
            
        }

        const str_res = arr_str_res.join('');
        return str_res;

        // Create a new span

    }
}

module.exports = Pos_Span_String_Extractor;