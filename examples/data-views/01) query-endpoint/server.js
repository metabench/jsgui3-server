/**
 * Data Views Example — Query Endpoint
 *
 * Demonstrates using the data view infrastructure to serve paginated,
 * sorted, filtered data from an in-memory array via the standard
 * query protocol.
 *
 * Run:   node examples/data-views/01) query-endpoint/server.js
 * Test:  curl -X POST http://localhost:8090/api/data/products \
 *             -H "Content-Type: application/json" \
 *             -d '{"page":1,"page_size":5,"sort":{"key":"price","dir":"desc"}}'
 */

const Server = require('../../../server');

// ── Sample data ────────────────────────────────────────────────
const products = [];
const categories = ['Electronics', 'Books', 'Clothing', 'Home', 'Sports'];
const adjectives = ['Premium', 'Classic', 'Modern', 'Vintage', 'Ultra'];
const nouns = ['Widget', 'Gadget', 'Tool', 'Device', 'Accessory'];

for (let i = 1; i <= 100; i++) {
    products.push({
        id: i,
        name: `${adjectives[i % adjectives.length]} ${nouns[i % nouns.length]} ${i}`,
        category: categories[i % categories.length],
        price: Math.round((Math.random() * 200 + 10) * 100) / 100,
        stock: Math.floor(Math.random() * 500),
        rating: Math.round((Math.random() * 4 + 1) * 10) / 10
    });
}

// ── Serve ──────────────────────────────────────────────────────
Server.serve({
    port: 8090,
    data: {
        products: {
            data: products,
            schema: {
                columns: [
                    { key: 'id', label: 'ID', sortable: true },
                    { key: 'name', label: 'Name', sortable: true, filterable: true },
                    { key: 'category', label: 'Category', sortable: true, filterable: true },
                    { key: 'price', label: 'Price', sortable: true },
                    { key: 'stock', label: 'Stock', sortable: true },
                    { key: 'rating', label: 'Rating', sortable: true }
                ],
                default_page_size: 10
            }
        }
    }
}).then(() => {
    console.log('Data views example running at http://localhost:8090');
    console.log('Query endpoint: POST http://localhost:8090/api/data/products');
    console.log('');
    console.log('Example requests:');
    console.log('  All items:      curl -X POST http://localhost:8090/api/data/products -H "Content-Type: application/json" -d "{}"');
    console.log('  Page 2:         curl -X POST http://localhost:8090/api/data/products -H "Content-Type: application/json" -d \'{"page":2,"page_size":5}\'');
    console.log('  Sort by price:  curl -X POST http://localhost:8090/api/data/products -H "Content-Type: application/json" -d \'{"sort":{"key":"price","dir":"desc"}}\'');
    console.log('  Filter books:   curl -X POST http://localhost:8090/api/data/products -H "Content-Type: application/json" -d \'{"filters":{"category":{"op":"equals","value":"Books"}}}\'');
});
