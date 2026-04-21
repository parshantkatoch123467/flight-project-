import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const Dashboard = () => {

  const data = {
    labels: ["Mon","Tue","Wed","Thu","Fri"],
    datasets: [
      {
        label: "Bookings",
        data: [5,10,8,15,20],
        borderColor: "blue"
      }
    ]
  };

  return (
    <div style={{ width: "500px", margin: "auto" }}>
      <h2>📊 Booking Trends</h2>
      <Line data={data} />
    </div>
  );
};

export default Dashboard;