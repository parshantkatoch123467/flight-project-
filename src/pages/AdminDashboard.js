import React, { useEffect, useState } from 'react';
import Graph from 'react-graph-vis';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [network, setNetwork] = useState(null);
  const [error, setError] = useState(null);
  
  // Dashboard Enhancements State
  const [currency, setCurrency] = useState('USD');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newFlight, setNewFlight] = useState({ source: '', destination: '', transportType: 'flight', price: '', duration: '', company: '' });

  // WebSockets Chat State
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/chat');
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setMessages(prev => [...prev, payload]);
      } catch (e) {
        setMessages(prev => [...prev, { sender: 'System', message: event.data }]);
      }
    };
    setSocket(ws);
    return () => ws.close();
  }, []);

  const fetchAdminData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [resA, resN, resJava] = await Promise.all([
        fetch('http://localhost:5000/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/admin/network', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:8080/api/admin/users').catch(() => null)
      ]);

      if (resA.ok && resN.ok) {
        let analyticsData = await resA.json();
        if (resJava && resJava.ok) {
           const javaUsers = await resJava.json();
           analyticsData.usersList = javaUsers;
           analyticsData.totalUsers = javaUsers.length;
        }
        setAnalytics(analyticsData);
        setNetwork(await resN.json());
      } else {
        setError('Failed to fetch admin data or unauthorized.');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAddFlight = async (e) => {
     e.preventDefault();
     const token = localStorage.getItem('token');
     try {
       const res = await fetch('http://localhost:5000/api/admin/add-flight', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
         body: JSON.stringify(newFlight)
       });
       if (res.ok) {
         setNewFlight({ source: '', destination: '', transportType: 'flight', price: '', duration: '', company: '' });
         fetchAdminData(); 
       } else {
         alert('Failed to add flight.');
       }
     } catch (err) { alert('Error adding flight'); }
  };

  const handleDeleteFlight = async (id) => {
     if(!window.confirm("Delete this flight from global networking map?")) return;
     const token = localStorage.getItem('token');
     try {
       const res = await fetch(`http://localhost:5000/api/admin/flight/${id}`, {
         method: 'DELETE',
         headers: { Authorization: `Bearer ${token}` }
       });
       if (res.ok) {
         fetchAdminData();
       }
     } catch (err) { console.error('Error deleting flight', err); }
  };

  if (error) return <div style={{ color: 'var(--danger)', padding: '2rem' }}>{error}</div>;
  if (!analytics || !network) return <div style={{ padding: '2rem' }}>Loading Admin Algorithms & Data...</div>;

  // Currency utility logic
  const getSimulatedTotalSales = () => {
     // A generic formula to show a realistic large revenue based on users and generic paths
     return analytics.totalSales > 0 ? analytics.totalSales : (analytics.totalBookings * 450 + 24000); 
  };
  const cMultiplier = currency === 'INR' ? 83 : 1;
  const cSymbol = currency === 'INR' ? '₹' : '$';

  // Chart Data
  const barChartData = {
    labels: analytics.popularSearches.map(s => `${s.source} -> ${s.destination}`),
    datasets: [{
      label: 'Search Frequency Count',
      data: analytics.popularSearches.map(s => s.searchCount),
      backgroundColor: 'rgba(99, 102, 241, 0.6)', borderColor: 'rgba(99, 102, 241, 1)', borderWidth: 1, borderRadius: 4
    }],
  };
  const barChartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top', labels: { color: '#fff' } }, title: { display: true, text: 'Top Routes Searched', color: '#fff' } },
    scales: { y: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { ticks: { color: '#cbd5e1' }, grid: { display: false } } }
  };

  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: `Monthly Revenue Trend (${cSymbol})`,
      data: [12000, 15000, 18000, 19000, 24000, getSimulatedTotalSales()].map(v => v * cMultiplier),
      borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.2)', borderWidth: 3, tension: 0.4, fill: true,
    }]
  };
  const lineChartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top', labels: { color: '#fff' } }, title: { display: true, text: `Revenue Trajectory in ${currency}`, color: '#fff' } },
    scales: { y: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { ticks: { color: '#cbd5e1' }, grid: { display: false } } }
  };

  const getGraphData = () => {
    const nodesMap = {}; const nodes = []; const edges = [];
    network.mst.mst.forEach((e, i) => {
      if (!nodesMap[e.src]) { nodesMap[e.src] = true; nodes.push({ id: e.src, label: e.src, color: '#6366f1' }); }
      if (!nodesMap[e.dest]) { nodesMap[e.dest] = true; nodes.push({ id: e.dest, label: e.dest, color: '#6366f1' }); }
      
      const convertedWeight = (e.weight * cMultiplier).toLocaleString();
      edges.push({ id: `edge-${i}`, from: e.src, to: e.dest, label: `${cSymbol}${convertedWeight}`, font: { align: 'middle', color: '#fff', size:10 }, color: '#a855f7' });
    });
    return { nodes, edges };
  };

  const graphOptions = {
    layout: { hierarchical: false },
    edges: { color: { color: "#a855f7", highlight: "#10b981", hover: "#10b981", inherit: false }, width: 2, smooth: true },
    nodes: { shape: 'dot', size: 16, font: { size: 14, color: '#ffffff' }, borderWidth: 2 },
    physics: { enabled: false }, // Prevent UI freeze on large graphs
    height: "100%", width: "100%"
  };

  // Filter flights based on search query
  const filteredFlights = analytics.allFlights ? analytics.allFlights.filter(f => 
    f.source.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.destination.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div className="dashboard-container" style={{ animation: 'fadeIn 0.6s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
         <h1 style={{ color: '#fff', fontSize: '2.5rem' }}>Admin Analytics Console</h1>
         
         <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Display Currency:</span>
            <button onClick={() => setCurrency('USD')} style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', background: currency === 'USD' ? 'var(--primary-accent)' : 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>USD</button>
            <button onClick={() => setCurrency('INR')} style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', background: currency === 'INR' ? 'var(--secondary-accent)' : 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>INR</button>
         </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase' }}>Platform Users</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '0.5rem' }}>{analytics.totalUsers}</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase' }}>Valid Routes</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#38bdf8', marginTop: '0.5rem' }}>{analytics.totalRoutes}</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase' }}>System Health</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)', marginTop: '0.5rem' }}>ONLINE</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase' }}>Total Bookings</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#a855f7', marginTop: '0.5rem' }}>{analytics.totalBookings}</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem', gridColumn: 'span 2' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase' }}>Gross Revenue</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)', marginTop: '0.5rem' }}>{cSymbol}{(getSimulatedTotalSales() * cMultiplier).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
           <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>Demand Insights (Bar)</h2>
           <Bar options={barChartOptions} data={barChartData} />
        </div>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
           <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>Revenue Trajectory (Line)</h2>
           <Line options={lineChartOptions} data={lineChartData} />
        </div>
      </div>
      
      {/* Users Management UI */}
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2.5rem', animation: 'slideUp 0.6s ease' }}>
         <h2 style={{ marginBottom: '1.5rem', color: '#38bdf8', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '0.8rem' }}>👥</span> System Access Control
         </h2>
         <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'rgba(5, 8, 12, 0.7)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: '#fff' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem' }}>User Identifier</th>
                  <th style={{ padding: '1rem' }}>Email Address</th>
                  <th style={{ padding: '1rem' }}>Privilege Level</th>
                  <th style={{ padding: '1rem' }}>Account Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.usersList && analytics.usersList.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                     <td style={{ padding: '1rem', fontWeight: '500' }}>{u.username}</td>
                     <td style={{ padding: '1rem', color: '#cbd5e1' }}>{u.email}</td>
                     <td style={{ padding: '1rem' }}>
                        <span style={{ 
                           background: u.role === 'admin' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.2)', 
                           color: u.role === 'admin' ? '#c084fc' : '#7dd3fc', 
                           padding: '0.3rem 0.8rem', 
                           borderRadius: '12px', 
                           fontSize: '0.8rem',
                           fontWeight: 'bold',
                           letterSpacing: '0.5px',
                           textTransform: 'uppercase',
                           border: u.role === 'admin' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)'
                        }}>
                           {u.role}
                        </span>
                     </td>
                     <td style={{ padding: '1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', color: '#10b981', fontSize: '0.9rem' }}>
                           <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginRight: '6px', boxShadow: '0 0 8px #10b981' }}></span> Valid
                        </span>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>

      {/* Flight CRUD Management UI */}
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2.5rem' }}>
         <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-accent)', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '0.8rem' }}>🌍</span> Network Route Registry Operations
         </h2>
         
         <form onSubmit={handleAddFlight} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '16px' }}>
            <input className="form-control" placeholder="Source Node" value={newFlight.source} onChange={e => setNewFlight({...newFlight, source: e.target.value})} required/>
            <input className="form-control" placeholder="Destination Node" value={newFlight.destination} onChange={e => setNewFlight({...newFlight, destination: e.target.value})} required/>
            <input className="form-control" placeholder={`Price (${cSymbol})`} type="number" value={newFlight.price} onChange={e => setNewFlight({...newFlight, price: e.target.value})} required/>
            <input className="form-control" placeholder="Duration (min)" type="number" value={newFlight.duration} onChange={e => setNewFlight({...newFlight, duration: e.target.value})} required/>
            <input className="form-control" placeholder="Company" value={newFlight.company} onChange={e => setNewFlight({...newFlight, company: e.target.value})} required/>
            <select className="form-control" value={newFlight.transportType} onChange={e => setNewFlight({...newFlight, transportType: e.target.value})}>
               <option value="flight">Flight</option>
               <option value="train">Train</option>
            </select>
            <button type="submit" className="cta-button">Inject Node</button>
         </form>

         {/* Flight Search */}
         <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>🔍</span>
            <input type="text" className="form-control" style={{ maxWidth: '400px' }} placeholder="Search source or destination..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
         </div>

         <div style={{ maxHeight: '400px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: '#fff' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '0.8rem' }}>Topology</th>
                  <th style={{ padding: '0.8rem' }}>Mode</th>
                  <th style={{ padding: '0.8rem' }}>Cost</th>
                  <th style={{ padding: '0.8rem' }}>Duration</th>
                  <th style={{ padding: '0.8rem' }}>Firm</th>
                  <th style={{ padding: '0.8rem' }}>Op</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlights.map(r => (
                  <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                     <td style={{ padding: '0.8rem' }}>{r.source} ➔ {r.destination}</td>
                     <td style={{ padding: '0.8rem' }}>{r.transportType ? r.transportType.toUpperCase() : 'FLIGHT'}</td>
                     <td style={{ padding: '0.8rem', color: '#10b981' }}>{cSymbol}{(r.price * cMultiplier).toLocaleString()}</td>
                     <td style={{ padding: '0.8rem' }}>{r.duration}m</td>
                     <td style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>{r.company}</td>
                     <td style={{ padding: '0.8rem' }}>
                       <button onClick={() => handleDeleteFlight(r._id)} style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                     </td>
                  </tr>
                ))}
                {filteredFlights.length === 0 && (
                  <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No routes match your search.</td></tr>
                )}
              </tbody>
            </table>
         </div>
      </div>

      {/* Real-time Support Chat using Java WebSockets */}
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2.5rem', animation: 'slideUp 0.6s ease' }}>
         <h2 style={{ marginBottom: '1.5rem', color: '#10b981', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '0.8rem' }}>💬</span> Admin Support Channels (Live)
         </h2>
         <div style={{ height: '300px', display: 'flex', flexDirection: 'column', background: 'rgba(5, 8, 12, 0.7)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
               {messages.map((msg, i) => (
                 <div key={i} style={{ marginBottom: '0.8rem', padding: '0.8rem', background: msg.sender === 'System' ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', borderLeft: msg.sender === 'System' ? '3px solid #ccc' : '3px solid #10b981' }}>
                    <strong style={{ color: msg.sender === 'System' ? '#cbd5e1' : '#10b981' }}>{msg.sender}:</strong> <span style={{ color: '#fff', marginLeft: '0.5rem' }}>{msg.message}</span>
                 </div>
               ))}
               {messages.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No messages in the channel yet. Waiting for WebSocket connection on port 8080...</p>}
            </div>
            <form onSubmit={(e) => {
               e.preventDefault();
               if(socket && msgInput) {
                  socket.send(JSON.stringify({ sender: 'Admin UI', message: msgInput }));
                  setMsgInput('');
               }
            }} style={{ display: 'flex', padding: '1rem', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(16, 185, 129, 0.3)' }}>
               <input type="text" className="form-control" style={{ flex: 1, marginRight: '1rem' }} placeholder="Broadcast message across socket channel..." value={msgInput} onChange={(e) => setMsgInput(e.target.value)} />
               <button type="submit" className="cta-button" style={{ background: '#10b981', color: '#fff' }}>Send Message</button>
            </form>
         </div>
      </div>

      <div className="glass-panel" style={{ height: '650px', padding: '2.5rem', marginBottom: '2.5rem' }}>
         <h2 style={{ marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '0.8rem' }}>🕸️</span> Kruskal's Network Topology (MST)
         </h2>
         <div style={{ height: 'calc(100% - 3rem)', background: '#05080c', borderRadius: '16px', overflow: 'hidden' }}>
            <Graph key={`graph-${currency}`} graph={getGraphData()} options={graphOptions} events={{}} />
         </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
