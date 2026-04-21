import Graph from "react-graph-vis";

const GraphView = () => {

  const graph = {
    nodes: [
      { id: 1, label: "Delhi" },
      { id: 2, label: "Mumbai" },
      { id: 3, label: "Bangalore" },
      { id: 4, label: "Jaipur" }
    ],
    edges: [
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 1, to: 4 },
      { from: 4, to: 2 }
    ]
  };

  return <Graph graph={graph} />;
};

export default GraphView; 