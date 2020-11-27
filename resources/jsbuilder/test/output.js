const using_type_plugins = false;
const tof = (obj, t1) => {
  // remove t1?
  //  seems useless / undefined.
  //  08/06/2019
  let res = t1 || typeof obj; // need to detect the custom types first.
  //  only if using_type_plugins.
  //  for loading in types such as 'knex'.

  if (using_type_plugins) {
    let res;
    each(map_loaded_type_fn_checks, (fn_check, name, stop) => {
      if (fn_check(obj)) {
        res = name;
        stop();
      }
    });

    if (res) {
      return res;
    }
  }

  if (res === 'number' || res === 'string' || res === 'function' || res === 'boolean') {
    return res;
  }

  if (res === 'object') {
    if (typeof obj !== 'undefined') {
      if (obj === null) {
        //return 'null';
        console.trace();
        throw 'NYI';
      } // observables could have that type name.
      //  would fit in generally.
      //console.log('typeof obj ' + typeof obj);
      //console.log('obj === null ' + (obj === null));
      // Catches observables and controls.


      if (obj.__type) {
        return obj.__type;
      } else if (obj.__type_name) {
        return obj.__type_name;
      } else {
        if (obj instanceof Promise) {
          return 'promise';
        }

        if (is_ctrl(obj)) {
          //return res;
          return 'control';
        } // Inline array test, earlier on?


        if (obj instanceof Date) {
          return 'date';
        }

        if (is_array(obj)) {
          //res = 'array';
          //return res;
          return 'array';
        } else {
          if (obj instanceof Error) {
            res = 'error';
          } else if (obj instanceof RegExp) res = 'regex'; // For running inside Node.
          //console.log('twin ' + typeof window);
          // buffers can exist on the client (now) it seems...? browserify buffer.
          //  is this the best way to check?


          if (typeof window === 'undefined') {
            //console.log('obj.length ' + obj.length);
            //if (obj instanceof Buffer) res = 'buffer';
            if (obj && obj.readInt8) res = 'buffer'; // possibly duck typing instead.
            // stream recognition is important!
            //  find a way to get it to work in the browser.
            //if (obj && obj.prototype && obj.prototype.from && obj.prototype.alloc && obj.prototype.allocUnsafe) res = 'buffer';
            //if (obj instanceof Stream.Readable) res = 'readable_stream';
            //if (obj instanceof Stream.Writable) res = 'writable_stream';
          }
        } //console.log('res ' + res);


        return res;
      }
    } else {
      return 'undefined';
    }
  }

  return res;
};
const is_arr_of_t = function (obj, type_name) {
  let t = tof(obj),
      tv;

  if (t == 'array') {
    let res = true;
    each(obj, function (v, i) {
      //console.log('2) v ' + stringify(v));
      tv = tof(v); //console.log('tv ' + tv);
      //console.log('type_name ' + type_name);

      if (tv != type_name) res = false;
    });
    return res;
  } else {
    return false;
  }
};
const is_arr_of_arrs = function (obj) {
  return is_arr_of_t(obj, 'array');
};