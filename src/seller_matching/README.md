# Seller Matching Visualization

This directory contains the seller matching graph visualization implementation.

## Files

- **`app.js`** - Main application logic for seller visualization
  - Implements ForceAtlas2 layout algorithm
  - Handles graph rendering with Sigma.js
  - Manages user interactions (hover, drag, click)
  - Higher quality threshold (0.9) for accurate seller clustering

- **`buildingSellerGraphFromJson.js`** - Graph construction module
  - Parses seller JSON data into Graphology graph structure
  - Creates nodes from seller list with `uid` identifiers
  - Builds edges based on matching attributes (email, phone, etc.)
  - Applies color coding by TUID (Trustami User ID)
  - Implements adaptive node sizing based on degree

## Usage

This module is bundled via Webpack and deployed to `dist/seller_matching/`.

Entry point configured in `webpack.config.cjs`:
```javascript
entry: './src/seller_matching/app.js'
```

## Data Format

Expects JSON with seller nodes and matching edges:
```json
{
  "nodes": {
    "seller1": {
      "uid": "unique_seller_id",
      "tuid": "trustami_user_id",
      "name": "Seller Name"
    }
  },
  "edges": {
    "edge1": {
      "nodes": ["source_uid", "target_uid"],
      "s": 0.85,
      "k": "email"
    }
  }
}
```
