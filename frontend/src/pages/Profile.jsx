import { useEffect, useState, useContext } from "react";
import { LoginContext } from "../contexts/LoginContext";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import {
  ArcElement,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
ChartJS.register(ArcElement, ChartDataLabels);

const Profile = () => {
  const { user } = useContext(LoginContext);
  const [foodLogs, setFoodLogs] = useState({});

  const getCaloriesData = () => {
    const labels = Object.keys(foodLogs);
    const data = labels.map(
      (date) => foodLogs[date]?.dailyTotals?.calories ?? 0
    );
  
    return {
      labels,
      datasets: [
        {
          label: "Calories per Day",
          data,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
      ],
    };
  };  

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch(`http://127.0.0.1:5000/api/food_logs?email=${user.email}`);
      const data = await res.json();
      setFoodLogs(data.logs || {});
    };

    if (user) {
      fetchLogs();
    }
  }, [user]);

  return (
    <div>
      <h2>My Food Logs</h2>
  
      {Object.keys(foodLogs).length === 0 ? (
        <p>No logs yet.</p>
      ) : (
        <>
          <h3>Daily Calorie Chart</h3>
          <Bar data={getCaloriesData()} />
  
          {Object.entries(foodLogs).map(([date, log]) => (
            <div key={date}>
              <h3>{date}</h3>
  
              {log.dailyTotals && (
                <p>
                  <strong>Totals:</strong>{" "}
                  {log.dailyTotals.calories ?? 0} kcal,{" "}
                  {log.dailyTotals.protein ?? 0}g protein,{" "}
                  {log.dailyTotals.fat ?? 0}g fat,{" "}
                  {log.dailyTotals.carbohydrates ?? 0}g carbs
                </p>
              )}
  
              {Object.entries(log.meals).map(([meal, foods]) => (
                <div key={meal}>
                  <strong>{meal.toUpperCase()}</strong>
                  <ul>
                    {foods.map((item, index) => (
                      <li key={index}>
                        {item.productName} – {item.servingAmount} {item.servingUnit}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default Profile;