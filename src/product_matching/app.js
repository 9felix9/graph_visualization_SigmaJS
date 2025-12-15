// Import the necessary modules
import forceAtlas2 from "graphology-layout-forceatlas2";
import Sigma from "sigma";
import FA2Layout from "graphology-layout-forceatlas2/worker.js";
import { buildGraphProduct } from "./buildingProductGraphFromJson.js";
import neighborhoodPreservation from "graphology-metrics/layout-quality/neighborhood-preservation.js";

let renderer, graph;
let highlightedEdges = new Set();
let neighborNodes = new Set();
let draggedNode = null;
let isDragging = false;
let isHovering = false;
let isBigGraph = false;
let fa2_slowDownFactor = 0.2; // Slow down (>1) or speed up (<1) the convergence of the ForceAtlas2 algorithm

const npLimitSmallGraph = 0.85; // Threshold for stopping the algorithm when the neighborhood preservation is reached
const npLimitBigGraph = 0.7;
const graphSizeThreshold = 40000; // Threshold for the graph size to determine if the graph should be rendered/visualized continuesly with sigma or not

function showCopyContainer(message) {
  const toast = document.getElementById("product-toast-message");
  toast.innerText = message;
  toast.style.display = "block";
  toast.style.opacity = "1";

  // Hide the message after 2 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    // Wait for the end of the transition before completely hiding the element
    setTimeout(() => {
      toast.style.display = "none";
    }, 500); // Wait for the transition time (0.5s)
  }, 2000); // Time the message remains visible (2s)
}

window.renderGraph = (rawLeads) => {
  if (renderer) {
    renderer.kill(); // free the ressources of the current renderer
  }

  if (graph) {
    graph.clear();
  }
  //graph = buildGraphSeller(rawLeads);
  graph = buildGraphProduct(rawLeads);
  console.log("Graph after circular layout", graph);
  graph.size > graphSizeThreshold ? (isBigGraph = true) : (isBigGraph = false);

  // Automatic settings for the ForceAtlas2 algorithm
  const sensibleSettings = forceAtlas2.inferSettings(graph);

  // Create an instance of the ForceAtlas2 algorithm with additional settings
  const fa2Layout = new FA2Layout(graph, {
    settings: {
      ...sensibleSettings, // weighted edges and edgeWeightInfluence is automatically set
      slowDown: sensibleSettings.slowDown * fa2_slowDownFactor, // Slow down the convergence
      strongGravityMode: false,
      gravity: graph.size < 12000 ? 17 : 50, // 17 for smaller graphs,
      outboundAttractionDistribution: false,
    },
  });

  // Start the ForceAtlas2 algorithm
  fa2Layout.start();

  const startTime = Date.now();
  const limit = isBigGraph ? npLimitBigGraph : npLimitSmallGraph;
  
  const intervalID = setInterval(() => {
  let np = neighborhoodPreservation(graph);
  console.log("Neighborhood preservation: ", np);

    if (np > limit) {
      fa2Layout.stop();
      document
        .querySelectorAll("#product-mind-map-container .trustami-load-icon")
        .forEach((element) => {
          element.remove();
        });
      instantiateSigmaRenderer(
        graph,
        document.getElementById("product-mind-map-container")
      );
      bindEvents(renderer);
      console.log("Graph after force atlas layout", renderer);
      console.log("Time taken for the layout: ", Date.now() - startTime);
      fa2Layout.kill();
      clearInterval(intervalID);
    }
  }, 1000);

  // Stop the ForceAtlas2 algorithm after 10 seconds if the layout computation is not finished
  setTimeout(() => {
    if (fa2Layout.killed) return;
    fa2Layout.stop();
    document
      .querySelectorAll("#product-mind-map-container .trustami-load-icon")
      .forEach((element) => {
        element.remove();
      });
    instantiateSigmaRenderer(
      graph,
      document.getElementById("product-mind-map-container")
    );
    bindEvents(renderer);
    fa2Layout.kill();
    clearInterval(intervalID);
  }, 10000);


const instantiateSigmaRenderer = (graph, container) => {
  renderer = new Sigma(graph, container, {
    enableEdgeEvents: true,
    renderEdgeLabels: true,
    zIndex: true,
    itemSizesReference: "screen",
    zoomToSizeRatioFunction: (x) => Math.pow(x, 1 / 3), // scales the size of the nodes when zooming in/out --> default is Math.sqrt(x)
    edgeReducer(_, data) {
      const res = { ...data };
      if (isHovering) {
        res.color = res.hovered ? "#FF6347" : "lightgrey";
        res.label = res.hovered ? res.label : "";
        res.forceLabel = res.hovered || false;
        res.zIndex = res.hovered ? 1 : res.zIndex;
      } else {
        res.color = "lightgrey";
        res.label = "";
      }
      return res;
    },
    nodeReducer(_, data) {
      const res = { ...data };
      if (isHovering) {
        if (res.hovered) {
          res.color = "#FFA500";
          res.forceLabel = true;
        } else {
          res.color = "lightgrey";
          res.forceLabel = false;
        }
      }
      return res;
    },
  });
}
// binding the events to the renderer
const bindEvents = (renderer) => {
  renderer.on("enterEdge", (e) => {
    if (isDragging) return;
    document.body.style.cursor = "pointer";
    isHovering = true;
    graph.updateEdgeAttribute(e.edge, "hovered", () => true);
    neighborNodes = new Set([graph.source(e.edge), graph.target(e.edge)]);
    neighborNodes.forEach((node) => {
      graph.updateNode(node, (attr) => {
        attr.hovered = true;
        return attr;
      });
    });
  });

  renderer.on("leaveEdge", (e) => {
    if (isDragging) return;
    if (highlightedEdges.has(e.edge)) {
      return;
    }
    isHovering = false;
    document.body.style.cursor = "default";
    graph.updateEdgeAttribute(e.edge, "hovered", () => false);
    neighborNodes.forEach((node) => {
      graph.updateNodeAttribute(node, "hovered", () => false);
    });
    neighborNodes.clear();
  });

  renderer.on("enterNode", (n) => {
    if (isDragging) return;
    isHovering = true;
    document.body.style.cursor = "grab";
    neighborNodes = new Set(graph.neighbors(n.node));
    neighborNodes.add(n.node);
    graph.updateNode(n.node, (attr) => {
      attr.hovered = true;
      return attr;
    });
    graph.neighbors(n.node).forEach((neighbor) => {
      highlightedEdges.add(graph.edge(n.node, neighbor));
      graph.updateNode(neighbor, (attr) => {
        attr.hovered = true;
        return attr;
      });
      const [edgeKey] = graph.updateEdge(n.node, neighbor, (attr) => {
        attr.hovered = true;
        return attr;
      });
      highlightedEdges.add(edgeKey);

      // This is not necessary, as the renderer is already scheduled but is needed when the whole graph needs to get updated
      /*
      renderer.scheduleRender();
      renderer.scheduleRefresh(); 
      renderer.refresh()
      renderer.refresh({
        skipIndexation: true, // Skip the indexation step --> faster rendering
      });
      */
    });
  });

  renderer.on("leaveNode", (_) => {
    if (isDragging) return;
    isHovering = false;
    document.body.style.cursor = "default";
    highlightedEdges.forEach((edge) => {
      graph.updateEdgeAttribute(edge, "hovered", () => false);
    });
    neighborNodes.forEach((node) => {
      graph.updateNodeAttribute(node, "hovered", () => false);
    });
    highlightedEdges.clear();
    neighborNodes.clear();
  });

  renderer.on("doubleClickNode", (n) => {
    const id = n.node;
    n.preventSigmaDefault();
    navigator.clipboard
      .writeText(id)
      .then(() => {
        console.log("UID copied: " + id);
        showCopyContainer("UID copied: " + id);
      })
      .catch((err) => {
        console.error("Error copying: ", err);
      });
  });

  // start to drag a node when the mouse is pressed
  // - set the node as highlighted
  // - set the dragging mode to true
  renderer.on("downNode", (n) => {
    // isHovering = false;
    draggedNode = n.node;
    isDragging = true;
    //graph.setNodeAttribute(draggedNode, "highlighted", true);
  });

  // dragging the node
  // - set the position of the node to the mouse position
  // - prevent the default behavior of the mouse event
  // - only posssible when renedering is over
  renderer.getMouseCaptor().on("mousemovebody", (n) => {
    if (!isDragging || !draggedNode) {
      return;
    }
    const pos = renderer.viewportToGraph(n);

    graph.setNodeAttribute(draggedNode, "x", pos.x);
    graph.setNodeAttribute(draggedNode, "y", pos.y);
    n.preventSigmaDefault();
    n.original.preventDefault();
    n.original.stopPropagation();
  });

  // stop dragging the node when the mouse is released
  // - on mouse up, we reset the autoscale and the dragging mode
  // - remove the highlight attr
  renderer.getMouseCaptor().on("mouseup", () => {
    if (draggedNode) {
      //graph.removeNodeAttribute(draggedNode, "highlighted");
    }
    isDragging = false;
    draggedNode = null;
    isHovering = false;
  });
}

  return () => {
    // it returns a function that kills the process. This could be useful but in this case the renderer gets killed when calling the renderGraph function again
    renderer.kill(); 
  };
}
