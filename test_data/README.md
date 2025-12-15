# Test Data

This directory contains sample JSON files used for development and testing of the graph visualization system.

## Purpose

These JSON files are designed to be **directly embedded into the HTML** during production deployment. In production, the server injects the graph data into the `<script id="product-leads-json">` tag in `index.html`.

## Usage

During development:
1. Copy the JSON content from a test file
2. Paste it into the `<script id="product-leads-json">` tag in `dist/product_matching/index.html` or `dist/seller_matching/index.html`
3. Run the development server to visualize the graph

## Note

This folder is primarily for testing purposes and could be considered for deletion in production deployments, as the server will provide real-time data injection.
