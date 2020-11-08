class Variable_Name_Provider { //Namer
    constructor(spec = {}) {
        
        const reserved = {};

        Object.defineProperty(this, 'reserved', {
            get() { return reserved; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        // for the moment, x, and then a letter.

        const map_counts = {
            'l': 0,
            'x': 0,
            'p': 0,
            'a': 0
        }


        // l as well for local

        this.get_l = () => {
            return 'l' + map_counts['l']++
        }

        this.get_x = () => {
            return 'x' + map_counts['x']++
        }
        this.get_p = () => {
            return 'p' + map_counts['p']++
        }
        this.get_a = () => {
            return 'a' + map_counts['a']++
        }


    }
}

module.exports = Variable_Name_Provider;