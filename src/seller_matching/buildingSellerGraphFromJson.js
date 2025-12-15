import Graph from "graphology";
import { random, circular } from "graphology-layout";

// graph without parallel edges
const graph = new Graph({ multi: false, type: "undirected" });

// adding nodes to the graph with default color black
function buildingNodesFromNodeList(leads) {
  const nodes = leads.nodes;
  for (const node in nodes) {
    const uid = nodes[node].uid;
    const tuid = nodes[node].tuid;
    const name = nodes[node].name;
    graph.addNode(uid, {
      label: `${name} (${uid})`,
      tuid: tuid,
      color: "black",
    });
  }

  // save the nodes with same tuid in Object
  const sameTuidNodes = graph.reduceNodes((acc, node, attributes) => {
    const tuid = attributes.tuid;
    if (attributes.tuid !== null) {
      // if the tuid is not in the object, create an array with the tuid as key
      if (!acc[tuid]) {
        acc[tuid] = [];
      }
      acc[tuid].push(node);
    }
    return acc;
  }, {}); // initial value is an empty object

  // set color for nodes with same tuid in the object
  if (sameTuidNodes) {
    for (const tuid in sameTuidNodes) {
      const randomColor = getRandomColor();
      sameTuidNodes[tuid].forEach((node) => {
        graph.setNodeAttribute(node, "color", randomColor);
      });
    }
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
    const attributeKey = edges[edge].k;
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
      });
    }
  }
}

// function to update the size of nodes based on the degree of the node and the total number of nodes
// theres a hyperbole function in it to scale the size of the nodes in a better way --> small graph nodes are bigger and big graph nodes are smaller for better visualization
function updateNodeSizeFromDegree() {
  const minSize = 6; // minimum size of the node
  const maxSize = 22; // maximum size of the node
  const degreeFactor = 110 // factor to scale the size of the node based on the degree of the node

  graph.forEachNode((node, attributes) => {
    const nodeSize = minSize + degreeFactor * 1/graph.order * graph.degree(node) / Math.sqrt(graph.order);  
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
export function buildGraph(leads) {
  buildingNodesFromNodeList(leads);
  buildingEdgesFromEdgeList(leads);
  updateNodeSizeFromDegree();
  circular.assign(graph);
  return graph;
}
