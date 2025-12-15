const path = require('path');

module.exports = {
  entry: './src/product_matching/app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/product_matching'), // ausgabe wo die bundle.js gespeichert wird
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist/product_matching'), // wo die index.html liegt  
    },
    compress: true,
    port: 9000,
    open: true,
  },
};


// FOLLOWING IS BUNDLING FOR PRODUCTION
/*
const path = require('path');

module.exports = {
  entry: './src/product_matching/app.js',  // Einstiegspunkt
  output: {
    filename: 'bundle.js',  // Name des gebündelten Outputs
    path: path.resolve(__dirname, 'dist/product_matching'),  // Ausgabeverzeichnis
  },
  module: {
    rules: [
      {
        test: /\.js$/,  // Regel für JavaScript-Dateien
        exclude: /node_modules/,  // Schließt node_modules aus (außer die Dateien, die durch den entry-Punkt gebraucht werden)
        use: {
          loader: 'babel-loader',  // Nutze Babel für die Transpilation
        },
      },
      {
        test: /\.css$/,  // Regel für CSS-Dateien
        use: ['style-loader', 'css-loader'],  // Nutze CSS-Loader und Style-Loader für CSS-Dateien
      },
    ],
  },
  mode: 'production',  // Produktionsmodus für optimiertes Bundle
};
 */