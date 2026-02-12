

// Making such specific classes with such long names seems kind of silly, but will help to keep the higher level code
//   both explicit and easy to follow.

// These classes will do specific things, to specific things (in specific ways)

// Basically middleware that the app dev should not need to pay much attention to usually.




// And likely will have some other class (system), maybe assigners, to set the routes on the server / server router.
//   Or within the website resource???

// So everything (main) that the server does will be done using various interchangable classes.
//   Some classes will cover some very specific use cases.

const zlib = require('zlib');



const Assigner = require('../Assigner');

const {is_array} = require('lang-tools');

// And will have some very or less specific assigners for some other things.
//   Like the compressed (text?) response headers.


const { promisify } = require('node:util');

// deflate, unzip 

const gzip_compress = promisify(zlib.gzip);
const br_compress = promisify(zlib.brotliCompress);


// zlib.gzip(buffer[, options], callback)


class Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner extends Assigner {

    constructor(spec = {}) {
        super(spec);

        // Store compression configuration
        this.compression_config = spec.compression || {};
        this.compression_stats = {
            total_items: 0,
            gzip_compressed: 0,
            brotli_compressed: 0,
            gzip_savings: 0,
            brotli_savings: 0
        };
    }

    // assign to bundle....
    //  or array would be better.

    // assign to (bundle) items in array.


    // These assign functions should (all probably) be async

    async assign(arr_bundled_items) {
        // Get compression configuration with defaults
        const enabled = this.compression_config.enabled !== false; // Default: true
        const algorithms = this.compression_config.algorithms || ['gzip', 'br'];
        const gzipLevel = this.compression_config.gzip?.level ?? 6;
        const brotliQuality = this.compression_config.brotli?.quality ?? 6;
        const threshold = this.compression_config.threshold ?? 1024;

        if (!enabled) {
            console.log('Compression disabled, skipping compression assignment');
            return;
        }

        // go through them....

        // Maybe check that the correct items are in the bundle.

        // Perhaps check for 1 of each js, css, html
        //   And could use a specific other class to assign these.

        //   Should be OK to make classes for really specific things.
        //     At this part of the system / API, it's not necessary / important to limit complexity in that way.

        // The goal is to provide a very simple high level interface. Powerful too.

        // Could assign a static_route property to the items in the bundles.





        if (is_array(arr_bundled_items)) {

            for (const item of arr_bundled_items) {
                //console.log('item', item);

                const {type} = item;

                // And need to create the uncompressed response buffer.

                // // response_buffers.identity I think....

                if (item.text) {
                    const originalSize = item.response_buffers.identity.length;
                    this.compression_stats.total_items++;

                    // Skip compression if below threshold
                    if (originalSize < threshold) {
                        console.log(`Skipping compression for ${item.type} (${originalSize} bytes < ${threshold} threshold)`);
                        continue;
                    }

                    // Async compression definitely seems much better here.
                    if (algorithms.includes('gzip')) {
                        const buf_gzipped = await gzip_compress(item.response_buffers.identity, { level: gzipLevel });
                        item.response_buffers.gzip = buf_gzipped;
                        const compressedSize = buf_gzipped.length;
                        const savings = originalSize - compressedSize;
                        this.compression_stats.gzip_compressed++;
                        this.compression_stats.gzip_savings += savings;
                        console.log(`Gzip compressed ${item.type}: ${originalSize} → ${compressedSize} bytes (${Math.round(savings/originalSize*100)}% savings)`);
                    }

                    if (algorithms.includes('br')) {
                        const buf_br = await br_compress(item.response_buffers.identity, {
                            params: {
                                //[zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
                                [zlib.constants.BROTLI_PARAM_QUALITY]: brotliQuality,
                                [zlib.constants.BROTLI_PARAM_SIZE_HINT]: item.response_buffers.identity.length,
                              }
                        });

                        item.response_buffers.br = buf_br;
                        const compressedSize = buf_br.length;
                        const savings = originalSize - compressedSize;
                        this.compression_stats.brotli_compressed++;
                        this.compression_stats.brotli_savings += savings;
                        console.log(`Brotli compressed ${item.type}: ${originalSize} → ${compressedSize} bytes (${Math.round(savings/originalSize*100)}% savings)`);
                    }
                } else {

                }
                //console.trace();
                //throw 'stop';
            }

            // Log compression statistics
            console.log('Compression Statistics:', {
                total_items: this.compression_stats.total_items,
                gzip_compressed: this.compression_stats.gzip_compressed,
                brotli_compressed: this.compression_stats.brotli_compressed,
                total_gzip_savings: `${Math.round(this.compression_stats.gzip_savings/1024)}KB`,
                total_brotli_savings: `${Math.round(this.compression_stats.brotli_savings/1024)}KB`
            });

        } else {
            console.trace();
            throw 'stop';
        }
    }
}


module.exports = Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner;


