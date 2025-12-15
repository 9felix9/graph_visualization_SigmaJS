# Product Matching Visualization

This directory contains the product matching graph visualization implementation.

## Files

- **`app.js`** - Main application logic for product visualization
  - Implements ForceAtlas2 layout algorithm
  - Handles graph rendering with Sigma.js
  - Manages user interactions (hover, drag, click)
  - Adaptive performance for graphs up to 40k+ nodes
  - Neighborhood preservation monitoring (0.85 for small graphs, 0.7 for large)

- **`buildingProductGraphFromJson.js`** - Graph construction module
  - Parses product JSON data into Graphology graph structure
  - Creates nodes from product list with `nw_pid` identifiers
  - Builds edges based on product similarity scores
  - Applies color coding by network ID
  - Implements adaptive node sizing based on degree

## Usage

This module is bundled via Webpack and deployed to `dist/product_matching/`.

Entry point configured in `webpack.config.cjs`:
```javascript
entry: './src/product_matching/app.js'
```

## Data Format

Expects JSON with product nodes and similarity edges:
```json
{
  "nodes": {
    "128:B00EE4D1P4": {
      "network": "amazon_uk",
      "nw_pid": "128:B00EE4D1P4",
      "title": "Product Name"
    }
  },
  "edges": {
    "edge1": {
      "nodes": ["source_nw_pid", "target_nw_pid"],
      "s": 0.95,
      "t": "title"
    }
  }
}
```
