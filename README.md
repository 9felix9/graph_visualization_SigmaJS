# Erklärung

Die `index.html` Datei läuft in production ohne Node.js. Um eine JS-Datei im CommonJS Format zu erhalten  wird ein Bundling-Verfahen verwendet. In diesem Fall Webpack (zum bundlen) und Babel (für abwärtskompatiblen JS-Code). 
Damit man allerdings die `bundle.js` Datei erhält, muss man den auskommentierten Code in der `webpack.config.cjs`-Datei benutzen. Dieser Erstellt eine optimierte `bundle.js` Datei für das Production-System. 

Man führt den folgenden Befehl aus, um die gebündelte Datei zu erhalten:

```sh
npx webpack