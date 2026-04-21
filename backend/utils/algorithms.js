// algorithms.js

/**
 * Dijkstra's Algorithm
 * Finds the shortest path between a start node and an end node.
 * @param {Object} graph Adjacency list: { A: { B: { price: 100, duration: 60 } } }
 * @param {String} startNode The starting node
 * @param {String} endNode The target node
 * @param {String} weightKey The metric to minimize ('price' or 'duration')
 */
const dijkstra = (graph, startNode, endNode, weightKey = 'price') => {
  let distances = {};
  let prev = {};
  let pq = new Set(); // Using Set as a basic priority queue

  // Initialize
  for (let node in graph) {
    distances[node] = Infinity;
    prev[node] = null;
    pq.add(node);
  }
  distances[startNode] = 0;

  while (pq.size > 0) {
    // Find node with minimum distance
    let minNode = null;
    for (let node of pq) {
      if (minNode === null || distances[node] < distances[minNode]) {
        minNode = node;
      }
    }

    if (distances[minNode] === Infinity) break;
    if (minNode === endNode) break;

    pq.delete(minNode);

    // Update neighbors
    for (let neighbor in graph[minNode]) {
      let edgeWeight = graph[minNode][neighbor][weightKey];
      let alt = distances[minNode] + edgeWeight;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        prev[neighbor] = minNode;
      }
    }
  }

  // Construct path
  let path = [];
  let curr = endNode;
  if (prev[curr] !== null || curr === startNode) {
    while (curr !== null) {
      path.unshift(curr);
      curr = prev[curr];
    }
  }

  return {
    path: path.length > 0 ? path : null,
    cost: distances[endNode] !== Infinity ? distances[endNode] : null,
  };
};

/**
 * Kruskal's Algorithm
 * Finds the Minimum Spanning Tree (MST) of all nodes to show network efficiency.
 * @param {Array} edges Array of edges: [{ src: 'A', dest: 'B', weight: 100 }]
 * @param {Array} nodes Array of node names: ['A', 'B', 'C']
 */
const kruskal = (edges, nodes) => {
  // Sort edges by weight
  edges.sort((a, b) => a.weight - b.weight);

  const parent = {};
  nodes.forEach(node => parent[node] = node);
  
  // Initialize any dynamically added route nodes missing from primary location registry
  edges.forEach(edge => {
    if (parent[edge.src] === undefined) parent[edge.src] = edge.src;
    if (parent[edge.dest] === undefined) parent[edge.dest] = edge.dest;
  });

  const find = (i) => {
    if (parent[i] === i) return i;
    return parent[i] = find(parent[i]); // Path compression
  };

  const union = (i, j) => {
    let rootI = find(i);
    let rootJ = find(j);
    parent[rootI] = rootJ;
  };

  let mst = [];
  let mstCost = 0;

  for (let edge of edges) {
    let rootSrc = find(edge.src);
    let rootDest = find(edge.dest);

    if (rootSrc !== rootDest) {
      mst.push(edge);
      mstCost += edge.weight;
      union(rootSrc, rootDest);
    }
  }

  return { mst, totalCost: mstCost };
};

/**
 * Warshall's Algorithm
 * Transitive closure. Returns a boolean matrix representing reachability.
 */
const warshall = (nodes, edges) => {
  const n = nodes.length;
  const nodeIndex = {};
  nodes.forEach((node, i) => nodeIndex[node] = i);

  // Initialize adjacency matrix
  let dp = Array.from({ length: n }, () => Array(n).fill(false));

  edges.forEach(edge => {
    dp[nodeIndex[edge.src]][nodeIndex[edge.dest]] = true;
    // Assuming directed for flights, if undirected, set the reverse too
  });

  for (let i = 0; i < n; i++) dp[i][i] = true;

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        dp[i][j] = dp[i][j] || (dp[i][k] && dp[k][j]);
      }
    }
  }

  return { matrix: dp, nodeIndex };
};

/**
 * Merge Sort
 * Sorts array of objects by a key.
 */
const mergeSort = (arr, key) => {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), key);
  const right = mergeSort(arr.slice(mid), key);

  const merge = (l, r) => {
    let result = [], i = 0, j = 0;
    while (i < l.length && j < r.length) {
      if (l[i][key] < r[j][key]) result.push(l[i++]);
      else result.push(r[j++]);
    }
    return result.concat(l.slice(i)).concat(r.slice(j));
  };

  return merge(left, right);
};

/**
 * Dynamic Programming (Knapsack 0/1)
 * Given a budget (capacity), find the maximum number of distinct destinations
 * a user can visit, considering the cheapest flight from their home city.
 */
const knapsack = (items, capacity) => {
  // items: [{ id: 'Paris', cost: 500, value: 10 }, ...]
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    for (let w = 0; w <= capacity; w++) {
      if (item.cost <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - item.cost] + item.value);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // Backtrack to find items
  let res = dp[n][capacity];
  let w = capacity;
  let selected = [];

  for (let i = n; i > 0 && res > 0; i--) {
    if (res !== dp[i - 1][w]) {
      selected.push(items[i - 1]);
      res -= items[i - 1].value;
      w -= items[i - 1].cost;
    }
  }

  return { maxValue: dp[n][capacity], selected };
};

/**
 * Haversine formula to calculate distance between two geographical points.
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
};

/**
 * A* Algorithm
 * Finds optimized geographical shortest path substituting heuristic (Haversine distance).
 */
const aStar = (graph, startNode, endNode, locMap) => {
  let gScore = {}; // Cost from start
  let fScore = {}; // Cost from start + heuristic
  let prev = {};
  let openSet = new Set();
  
  for (let node in graph) {
    gScore[node] = Infinity;
    fScore[node] = Infinity;
    prev[node] = null;
  }
  
  if (!locMap[startNode] || !locMap[endNode]) return { path: null, cost: null };

  gScore[startNode] = 0;
  fScore[startNode] = haversineDistance(locMap[startNode].lat, locMap[startNode].lng, locMap[endNode].lat, locMap[endNode].lng);
  openSet.add(startNode);

  while (openSet.size > 0) {
    let current = null;
    for (let node of openSet) {
      if (current === null || fScore[node] < fScore[current]) {
        current = node;
      }
    }

    if (current === endNode || gScore[current] === Infinity) break;

    openSet.delete(current);

    for (let neighbor in graph[current]) {
      let edgeWeight = graph[current][neighbor].price; // weight by cost conceptually or real km, let's just use 1 to represent hops OR use actual rough km distance if we want pure geographical shortest? The prompt implies "shortest distance", wait. If the graph weight is price, then it's cost. If shortest distance, we should weigh by distance! Wait, edge weight for distance is physical distance!
      
      // Calculate physical distance between current and neighbor as the edge weight!
      if(!locMap[neighbor]) continue;
      let actualEdgeDist = haversineDistance(locMap[current].lat, locMap[current].lng, locMap[neighbor].lat, locMap[neighbor].lng);
      
      let tentative_gScore = gScore[current] + actualEdgeDist;

      if (tentative_gScore < gScore[neighbor]) {
        prev[neighbor] = current;
        gScore[neighbor] = tentative_gScore;
        fScore[neighbor] = gScore[neighbor] + haversineDistance(locMap[neighbor].lat, locMap[neighbor].lng, locMap[endNode].lat, locMap[endNode].lng);
        openSet.add(neighbor);
      }
    }
  }

  let path = [];
  let curr = endNode;
  if (prev[curr] !== null || curr === startNode) {
    while (curr !== null) {
      path.unshift(curr);
      curr = prev[curr];
    }
  }

  return {
    path: path.length > 0 ? path : null,
    cost: gScore[endNode] !== Infinity ? Math.round(gScore[endNode]) : null, // cost here is actually physical km distance
  };
};

module.exports = {
  dijkstra,
  kruskal,
  warshall,
  mergeSort,
  knapsack,
  aStar
};
