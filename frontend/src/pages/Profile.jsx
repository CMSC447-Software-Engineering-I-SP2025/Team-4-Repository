import { useEffect, useState, useContext } from "react";
import { LoginContext } from "../contexts/LoginContext";

const Profile = () => {
  const { user } = useContext(LoginContext);
  const [foodLogs, setFoodLogs] = useState({});

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
      <h2>Your Food Logs</h2>
      {Object.keys(foodLogs).length === 0 ? (
        <p>No logs yet.</p>
      ) : (
        Object.entries(foodLogs).map(([date, log]) => (
          <div key={date}>
            <h3>{date}</h3>
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
        ))
      )}
    </div>
  );
};

export default Profile;