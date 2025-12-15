# SigmaJS Leads Matching - Graph Visualization System

## Project Overview

This project is a sophisticated **dual-mode graph visualization system** built with **Sigma.js** and **Graphology** for visualizing and analyzing matching relationships in two distinct domains: **Product Matching** and **Seller Matching**. Both use interactive force-directed graph layouts to display complex network connections, but they serve different purposes and visualize different types of data.

## Two Visualization Modes

### 1. Product Matching (`src/product_matching/`)

Visualizes **product relationships across different networks** (Amazon, eBay, etc.).

**Purpose**: Identify and display products that are the same or similar across multiple online marketplaces.

**Data Structure**:
- **Nodes**: Products identified by `nw_pid` (network product ID)
- **Edges**: Similarity relationships based on product attributes (title, brand, specifications)
- **Node Colors**: Color-coded by network (e.g., all Amazon products in one color)
- **Edge Weights**: Given similarity scores between products

**Key Features**:
- Groups products by `network_id` with automatic color coding
- Displays product titles and network identifiers
- Edge labels show matching attributes (e.g., "title", "brand", "ean")

### 2. Seller Matching (`src/seller_matching/`)

Visualizes **seller relationships and potential duplicate seller accounts**.

**Purpose**: Identify sellers that may be the same entity across different platforms or accounts.

**Data Structure**:
- **Nodes**: Sellers identified by `uid` (user ID)
- **Edges**: Matching attributes between sellers (email, phone, address, payment info)
- **Node Colors**: Color-coded by `tuid` (Trustami User ID) - sellers with same TUID get same color
- **Edge Weights**: Confidence scores for seller matches

**Key Features**:
- Groups sellers by `tuid` with automatic color differentiation
- Shows seller names and unique identifiers
- Edge labels indicate matching criteria (e.g., "email", "phone", "address")

## Common Features

Both visualization modes share:

- **Interactive Force-Directed Layout**: ForceAtlas2 algorithm for optimal node positioning
- **Real-time Interaction**: Node dragging, hovering, and edge highlighting
- **Adaptive Performance**: Automatically adjusts based on graph size
- **Neighborhood Preservation**: Stops layout algorithm when quality threshold is reached
- **Toast Notifications**: Copy-to-clipboard feedback for product matching
- **Dynamic Node Sizing**: Scales based on node degree and total graph size

## Technology Stack

- **Sigma.js** (v3.0.0-beta): High-performance WebGL-based graph rendering
- **Graphology** (v0.25.4): Graph data structure and algorithms
- **ForceAtlas2**: Physics-based force-directed layout algorithm
- **Webpack** (v5.93.0): Module bundler for production builds
- **Babel** (v7.24.8): JavaScript transpiler for ES5 compatibility

## Graph Layout Algorithm

The system uses an **adaptive ForceAtlas2 implementation**:

### Product Matching Algorithm
- **Threshold**: 0.85 (small graphs < 40k nodes), 0.7 (large graphs)
- **Gravity**: 17 (small), 50 (large)
- **Slowdown Factor**: 0.2 (configurable)
- **Max Time**: 10 seconds timeout

### Seller Matching Algorithm
- **Threshold**: 0.9 (higher quality for seller clustering)
- **Uses standard sensible settings**
- **Focuses on accurate grouping of related sellers**

Both algorithms:
- Monitor neighborhood preservation metrics in real-time
- Automatically infer optimal settings based on graph structure
- Stop when layout quality (threshold) is sufficient or timeout is reached

## Data Format

### Product Matching JSON
```json
{
  "nodes": {
    "128:B00EE4D1P4": {
      "network": "amazon_uk",
      "nw_pid": "128:B00EE4D1P4",
      "color": "#32a98b",
      "title": "Product Name",
      "pid": "B00EE4D1P4"
    }
  },
  "edges": {
    "edge1": {
      "nodes": ["source_nw_pid", "target_nw_pid"],
      "s": 0.95,
      "t": "title",
      "v": "matching_value",
      "h": "edge_hash_id"
    }
  }
}
```

### Seller Matching JSON
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
      "k": "email",
      "v": "matching_attribute_value",
      "h": "edge_hash_id"
    }
  }
}
```

## Test Data

The `test_data/` folder contains JSON files for development and testing. **Important**: These files are designed to be **directly embedded into the HTML** during production deployment. The server injects graph data into the `<script id="product-leads-json">` tag in `index.html`. As the folder is only made up for testing purposes one could think about deleting it. 

## Development Setup

### Installation

```sh
npm install
```

### Development Server

Start webpack dev server with live reload:

```sh
npm start
```

Server runs on `http://localhost:9000` serving `dist/product_matching/` by default.

### Switch Between Modes

Edit `webpack.config.cjs` to change the visualization mode:

```javascript
// For PRODUCT MATCHING
module.exports = {
  entry: './src/product_matching/app.js',
  output: {
    path: path.resolve(__dirname, 'dist/product_matching'),
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist/product_matching'),
    },
  },
};

// For SELLER MATCHING
module.exports = {
  entry: './src/seller_matching/app.js',
  output: {
    path: path.resolve(__dirname, 'dist/seller_matching'),
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist/seller_matching'),
    },
  },
};
```

## Production Build

The `index.html` file runs in production without Node.js. To obtain a JavaScript file in CommonJS format, a bundling process is used. In this case, Webpack (for bundling) and Babel (for backwards-compatible JavaScript code).

### Creating Production Bundle

To obtain the `bundle.js` file, you must use the commented-out code in the `webpack.config.cjs` file. This creates an optimized `bundle.js` file for the production system.

Run the following command to obtain the bundled file:

```sh
npx webpack
```

or:

```sh
npm run build
```

### Production Deployment Flow

1. **Server-Side**: Backend injects graph JSON directly into HTML
2. **Bundle**: `bundle.js` contains all visualization logic
3. **Client-Side**: Browser renders graph from embedded data
4. **No Node.js**: Static files run entirely in browser

## Key Differences: Product vs Seller

| Aspect | Product Matching | Seller Matching |
|--------|------------------|-----------------|
| **Node ID** | `nw_pid` (network product ID) | `uid` (user ID) |
| **Color Grouping** | By `network_id` | By `tuid` (Trustami User ID) |
| **Edge Attribute** | `t` (type) | `k` (key) |
| **NP Threshold** | 0.85 / 0.7 | 0.9 |

## Performance Considerations

- **Large Graphs (>40k nodes)**: Lower NP threshold (0.7), reduced rendering frequency
- **Small Graphs (<40k nodes)**: Higher quality (0.85/0.9), continuous rendering
- **Node Sizing**: Hyperbolic scaling function based on degree and graph order
- **Edge Rendering**: Conditional labels and colors for performance
- **Memory**: ForceAtlas2 workers are properly killed after completion

## Browser Compatibility

Babel with `@babel/preset-env` transpiles to ES5 for broad browser support. WebGL required for Sigma.js rendering.
Consider using `<!DOCTYPE html>` at the beginning of final html document as there are visual bugs without it.

## Todo
Right now the product-matching graph process is much more performant than the seller-matching algorithm. This should be fixed in future. 