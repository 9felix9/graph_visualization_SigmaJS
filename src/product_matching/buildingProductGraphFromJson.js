import Graph from "graphology";
import { circular } from "graphology-layout";

// graph without parallel edges
const graph = new Graph({ multi: false, type: "undirected" });

// adding nodes to the graph with default color black
function buildingNodesFromNodeList(leads) {
  const nodes = leads.nodes;
  for (const node in nodes) {
    const uid = nodes[node].nw_pid;
    const nw_id = nodes[node].network_id;
    const nw_name = nodes[node].network;
    const title = nodes[node].title;
    graph.addNode(uid, {
      label: `${title}`,
      nw_id: nw_id,
      color: nodes[node].color ? nodes[node].color : "black",
      hovered: false
    });
  }
}

// random color generator
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// building edges from the given json
function buildingEdgesFromEdgeList(leads) {
  const edges = leads.edges;
  for (const edge in edges) {
    const source = edges[edge].nodes[0];
    const target = edges[edge].nodes[1];
    const attributeKey = edges[edge].t;
    const attributeValue = edges[edge].v;
    const id = edges[edge].h;
    const edgeWeight = edges[edge].s;

    // merges the edge if it already exists with the same source and target
    if (graph.hasNode(source) && graph.hasNode(target)) {
      graph.addEdge(source, target, {
        weight: edgeWeight,
        label: attributeKey,
        info: attributeKey,
        value: attributeValue,
        size: 1,
        color: "lightgrey",
        id: id,
        hovered: false
      });
    }
  }
}

// function to update the size of nodes based on the degree of the node and the total number of nodes
// theres a hyperbole function in it to scale the size of the nodes in a better way --> small graph nodes are bigger and big graph nodes are smaller for better visualization
function updateNodeSizeFromDegree() {
  graph.forEachNode((node, attributes) => {
    attributes.size = 1;
  })
  
  const minSize = 2; // minimum size of the node
  const maxSize = 22; // maximum size of the node
  const degreeFactor = 110 // factor to scale the size of the node based on the degree of the node
  const graphOrder = graph.order; // total number of nodes in the graph
  const denominator = Math.sqrt(graphOrder); // square root of the total number of nodes in the graph
  
  graph.forEachNode((node, attributes) => {
    const nodeSize = minSize + degreeFactor * 3/graphOrder * graph.degree(node) / denominator;  
    if (nodeSize > maxSize) {
      attributes.size = maxSize
    }
    else if (nodeSize < minSize) {
      attributes.size = minSize
    }
    else {
      attributes.size = nodeSize
    }
  });
}

// Function that builds the graph and exports it to other modules
export function buildGraphProduct(leads) {
  buildingNodesFromNodeList(leads);
  buildingEdgesFromEdgeList(leads);
  updateNodeSizeFromDegree();
  circular.assign(graph);
  return graph;
}
