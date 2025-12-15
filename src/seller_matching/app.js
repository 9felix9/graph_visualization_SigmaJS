// Import the necessary modules
import forceAtlas2 from "graphology-layout-forceatlas2";
import Sigma from "sigma";
import FA2Layout from "graphology-layout-forceatlas2/worker.js";
import { buildGraphSeller } from "./buildingSellerGraphFromJson.js";
import neighborhoodPreservation from "graphology-metrics/layout-quality/neighborhood-preservation.js";


let hoveredEdge, hoveredNode, renderer, graph;
let draggedNode = null;
let isDragging = false;
const neighborhoodPreservationLimit = 0.9;
let neighborNodes = new Set();

window.renderGraph = (rawLeads) => {
  if (renderer) {
    renderer.kill();
  }

  if (graph) {
    graph.clear();
  }
  //graph = buildGraphSeller(rawLeads);
  graph = buildGraphSeller(rawLeads);
  console.log("Graph after circular layout", graph);

  renderer = new Sigma(graph, document.getElementById("product-mind-map-container"), {
    enableEdgeEvents: true,
    renderEdgeLabels: true,
    zIndex: true, 
    itemSizesReference: "screen",
    zoomToSizeRatioFunction: (x) => Math.pow(x, 1/3), // scales the size of the nodes when zooming in/out --> default is Math.sqrt(x)
    edgeReducer(edge, data) {
      const res = { ...data };
      if (hoveredEdge) {
        if (edge === hoveredEdge) {
          res.color = "#cc0000";
          res.forceLabel = true;
          res.zIndex = 1;
          return res
        } else {
          res.label = "";
          res.color = "lightgrey";
          return res
        }
      }
      
      if (!hoveredEdge) {
        res.label = "";      
      }

      if (hoveredNode) {
        res.color = "lightgrey"
      }
      if (graph.target(edge) === hoveredNode || graph.source(edge) === hoveredNode) {
        res.color = "#cc0000"
        res.zIndex = 1;
      } 
      return res
    },
    nodeReducer(node, data) {
      const res = { ...data };
      if (hoveredEdge) {
        if (
          graph.source(hoveredEdge) === node ||
          graph.target(hoveredEdge) === node
        ) {
          res.size += 5;
          res.zIndex = 1;
          return res;
        } else {
          res.label = "";
          res.color = "lightgrey";
          return res;
        }
      }
      if (neighborNodes.has(node) || hoveredNode === node) {
        res.color = "green"  
        res.forceLabel = true;
      }
      if (hoveredNode && hoveredNode != node && !neighborNodes.has(node)) {
        res.color = "lightgrey"
        res.zIndex = -1
        res.label = ""
      }
      return res
    },
  });

  renderer.setSetting(
    "defaultDrawEdgeLabel",
    (context, edge, source, target, _ ) => {

      // Calculate the middle of the edge
      const midX = (source.x + target.x) / 2 + 10; // Shift text 10px to the right
      const midY = (source.y + target.y) / 2;

      // Set the font and size
      context.font = "20px Arial";
      context.fillStyle = "#1cab1a";
      context.textAlign = "start";
      context.textBaseline = "middle";

      // Draw the label at the edge middle
      context.fillText(edge.label, midX, midY);
    }
  );
  // Automatic settings for the ForceAtlas2 algorithm
  const sensibleSettings = forceAtlas2.inferSettings(graph);

  // Create an instance of the ForceAtlas2 algorithm with additional settings
  const fa2Layout = new FA2Layout(graph, {
    settings: {
      ...sensibleSettings, // weighted edges and edgeWeightInfluence is automatically set
      outboundAttractionDistribution: false,
      slowDown: sensibleSettings.slowDown * 7, // Slow down the convergence
      gravity: 0.2,
    },
  });

  // Start the ForceAtlas2 algorithm
  fa2Layout.start();

  renderer.on("enterEdge", (e) => {
    hoveredEdge = e.edge;
    renderer.refresh();
  });

  renderer.on("leaveEdge", (_) => {
    hoveredEdge = null;
    renderer.refresh();
  });

  renderer.on("enterNode", (n) => {
    hoveredNode = n.node;
    graph.neighbors(n.node).forEach(neighbor => {
      neighborNodes.add(neighbor) 
    })
    renderer.refresh();
  });

  renderer.on("leaveNode", (n) => {
    hoveredNode = null;
    neighborNodes.clear();
    renderer.refresh();
  });

  renderer.on("doubleClickNode", (n) => {
    const id = n.node
    n.preventSigmaDefault();
    navigator.clipboard.writeText(id).then(() => {
      console.log("UID copied: " + id);
      showCopyContainer("UID copied: " + id);
    }).catch(err => {
      console.error("Error copying: ", err);
    });
  });

  // start to drag a node when the mouse is pressed 
  // - set the node as highlighted
  // - set the dragging mode to true
  renderer.on("downNode", (n) => {
    draggedNode = n.node;
    isDragging = true;
    graph.setNodeAttribute(draggedNode, "highlighted", true);
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

  })

    // stop dragging the node when the mouse is released
    // - on mouse up, we reset the autoscale and the dragging mode
    // - remove the highlight attr
  renderer.getMouseCaptor().on("mouseup", () => {
    if (draggedNode) {
      graph.removeNodeAttribute(draggedNode, "highlighted");
    }
    isDragging = false;
    draggedNode = null;
  });


  function showCopyContainer(message) {
    const toast = document.getElementById('toast-message');
    toast.innerText = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';
  
    // Hide the message after 2 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      // Wait for the end of the transition before completely hiding the element
      setTimeout(() => {
        toast.style.display = 'none';
      }, 500); // Wait for the transition time (0.5s)
    }, 2000); // Time the message remains visible (2s)
  }

  const intervalID = setInterval(() => {
    let np = neighborhoodPreservation(graph);
    if (np > neighborhoodPreservationLimit) {
      fa2Layout.stop();
      console.log("Graph after force atlas layout", renderer);  
      fa2Layout.kill();
      clearInterval(intervalID);
    }
  }, 1000);
};