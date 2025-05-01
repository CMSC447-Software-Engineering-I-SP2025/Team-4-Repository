import { useState } from "react";
const FoodLogModal = ({ product, onClose, onSubmit }) => {
  const [servingAmount, setServingAmount] = useState("");
  const [servingUnit, setServingUnit] = useState("g"); // set grams as default value
  const [mealType, setMealType] = useState("breakfast");

  const handleSubmit = () => {
    if (!servingAmount) return alert("Please enter a serving size!"); 

    onSubmit({
      fdcId: product.fdcId,
      productName: product.name, // to match the backend expected field name
      servingAmount,    // ex. 150
      servingUnit,      // ex. "oz"
      mealType,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Food Log</h3>
        <p>{product.name}</p>

        <label>Serving Size:</label>
        <input
          type="number"
          value={servingAmount}
          onChange={(e) => setServingAmount(e.target.value)}
        />

        <label>Unit:</label>
        <select value={servingUnit} onChange={(e) => setServingUnit(e.target.value)}>
          <option value="g">grams (g)</option>
          <option value="oz">ounces (oz)</option>
          <option value="lb">pounds (lb)</option>
          <option value="fl oz">fluid ounces (fl oz)</option>
          <option value="each">each</option>  {/*for items best measured as a count*/}
        </select>

        <label>Meal Type:</label>
        <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snacks">Snacks</option>
        </select>

        <button onClick={handleSubmit}>Submit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default FoodLogModal;
