// May be irrelevant / directly equivalent with Platform.
//  Platform should be able to contain multiple platforms.


// Acts as an array / collection of platforms. Will use enumerator.
const {tof, each, Evented_Class} = require('lang-mini');

// A platform can require a variety of other platforms under it.



class Platforms extends Evented_Class {
    constructor(spec = {}) {
        // Each platform has a scope level.
        super(spec);

        let arr_requires = [];
        let arr_platforms = [];

        const tsr = tof(spec.requires);
        if (tsr === 'string') {
            arr_requires.push(spec.requires);
        } else {
            if (tsr === 'array') {
                each(spec.requires, item => spec.requires.push(item));
            }
        }
        // Platforms is one of the main thing that a project contains.

        
        // Can require platforms
        //  Can require single functions???
        //   In that case it would require the smallest platform that contains it, or it fishes the function out.
        //    Looks like we need tests for if a function is inline.

        if (spec.platforms) {
            const t = spec.platforms;
            if (t === 'array') {
                each(spec.platforms, platform => arr_platforms.push(platform));
            }
        }

        console.log('arr_requires', arr_requires);
        console.log('arr_platforms', arr_platforms);

        this.push = platform => {
            const idx = arr_platforms.length;
            arr_platforms.push(platform);
            this.raise('change', {
                'type': 'add',
                'value': platform
            });
        }


        // Still need the simple exports info
        //  despite it possibly being complex to get that info
        // 




        // A bunch of local variables get defined within each platform.

        // Make a platform about providing variables.

    }
}

module.exports = Platforms;