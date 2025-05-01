import { useState, useContext, useEffect } from "react";
import { LoginContext } from "../contexts/LoginContext";
import Popup from "../components/PopUp";
import FoodLogModal from "../components/FoodLogModal";
import "./ViewProducts.css";

const BACKEND_API_URL = "http://127.0.0.1:5000/api";

function ViewProducts() {
  const [product, setProduct] = useState("");
  const [results, setResults] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Stuff for conditional (logged in/logged out) add to cart pop up display
  const { isLoggedIn, user } = useContext(LoginContext);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showLoginButton, setShowLoginButton] = useState(false);

  // Stuff for additional search filtering (query params)
  const [dataType, setDataType] = useState([]); // Array to hold selected data types
  const [sortBy, setSortBy] = useState("dataType.keyword"); // Making default sortBy dataType instead of description since description was searching the ingredient lists
  const [sortOrder, setSortOrder] = useState("asc"); // Default sort order is ascending
  const [brandOwner, setBrandOwner] = useState("");
  
  // for food logging
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
 

  // Fetch grocery list when user logs in
  useEffect(() => {
    
    if (isLoggedIn && user) {
      fetchGroceryList(user.email);
    }
  
  }, [isLoggedIn, user]);

  // Function to fetch grocery list from backend
  const fetchGroceryList = async (email) => {
    
    try {
    
      const response = await fetch(`${BACKEND_API_URL}/user?email=${email}`);
    
      if (response.ok) {
        const userData = await response.json();
        console.log("User data:", userData);
        setGroceryList(userData.groceryList || []);
      }
    
    } catch (error) {
      console.error("Error fetching grocery list:", error);
    }
  };

  // Function to update grocery list in backend
  const updateGroceryList = async (email, newGroceryList) => {
    
    try {
      
      await fetch(`${BACKEND_API_URL}/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, groceryList: newGroceryList }),
      });

    } catch (error) {
      console.error("Error updating grocery list:", error);
    }
  };

  // Function to search for products
  const searchProducts = async (page = 1) => {
  
    try {
  
      // Handle case where page # > total pages
      if (page > totalPages) {
        console.warn("Page number exceeds total pages. No more results to fetch.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
  
      const response = await fetch(
        // Include all query params that aren't null or empty
        `${BACKEND_API_URL}/search?product=${product}&page=${page}&pageSize=10&dataType=${dataType}&sortBy=${sortBy}&sortOrder=${sortOrder}&brandOwner=${brandOwner}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (page === 1) {
        setResults(data.results);
      } else {
        setResults((prevResults) => [...prevResults, ...data.results]);
      }

      setTotalPages(data.paging_info.total_pages);
      setIsLoading(false);
    
    } catch (error) {
    
      console.error("Error fetching products:", error);
      setIsLoading(false);
    }
  };

  // Function to load more products
  const loadMoreProducts = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    searchProducts(nextPage);
  };

  
  // Functions for adding/removing/incrementing/decrementing item from grocery list
  const addToGroceryList = (product) => {
  
    // If user is logged in, add product to grocery list and show success pop up
    if (isLoggedIn && user) {
  
      const existingProduct = groceryList.find(
        (item) => item.fdcId === product.fdcId
      );
  
      let newGroceryList;
  
      if (existingProduct) {
  
        // If product already exists in grocery list, increment quantity by 1
        existingProduct.quantity += 1;
        newGroceryList = [...groceryList];
  
      } else {
  
        // If product doesn't exist in grocery list, add it with quantity of 1
        product.quantity = 1;
        newGroceryList = [...groceryList, product];
  
      }
  
      setGroceryList(newGroceryList);
      updateGroceryList(user.email, newGroceryList);
      setShowPopup(true);
      setPopupMessage("Product added to grocery list!");
      setShowLoginButton(false);

      // Close popup after 5 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
    } else {
      // Else, show popup prompting user to login with button to login page
      setShowPopup(true);
      setPopupMessage("Please log in to add products to your grocery list.");
      setShowLoginButton(true);
    }
  };

  const removeFromGroceryList = (product) => {
    // Remove product from grocery list and show success pop up
    if (isLoggedIn && user) {
      const newGroceryList = groceryList.filter((item) => item.fdcId !== product.fdcId);
      setGroceryList(newGroceryList);
      updateGroceryList(user.email, newGroceryList);
      setShowPopup(true);
      setPopupMessage("Product removed from grocery list!");
      setShowLoginButton(false);

      // Close popup after 5 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
    }
  };

  const incrementQuantity = (product) => {
    // Increment quantity of product in grocery list
    if (isLoggedIn && user) {
      const newGroceryList = groceryList.map((item) =>
        item.fdcId === product.fdcId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setGroceryList(newGroceryList);
      updateGroceryList(user.email, newGroceryList);
    }
  };

  const decrementQuantity = (product) => {
    // Decrement quantity of product in grocery list
    if (isLoggedIn && user) {
      const newGroceryList = groceryList.map((item) =>
        item.fdcId === product.fdcId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
      setGroceryList(newGroceryList);
      updateGroceryList(user.email, newGroceryList);
    }
  };

  // Popup close function to pass to Popup component
  const handleClosePopup = () => {
    setShowPopup(false);
  };

  // Function to handle data type checkbox changes
  const handleDataTypeChange = (event) => {
    const value = event.target.value;
    setDataType((prevDataTypes) => {
      if (prevDataTypes.includes(value)) {
        // If already selected, remove it
        return prevDataTypes.filter((type) => type !== value);
      } else {
        // If not selected, add it
        return [...prevDataTypes, value];
      }
    });
  };

  const openLogModal = (product) => {
    setSelectedProduct(product);
    setShowLogModal(true);
  };
  
  const closeLogModal = () => {
    setShowLogModal(false);
  };
  
  const handleLogSubmit = async (logData) => {
    if (isLoggedIn && user){
    try {
      const response = await fetch(`${BACKEND_API_URL}/log_food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email, // need to ensure that this is being defined
          fdcId: logData.fdcId,
          productName: logData.productName, // updated to match modal properties
          servingAmount: logData.servingAmount,
          servingUnit: logData.servingUnit,
          mealType: logData.mealType,
          timestamp: logData.timestamp, // might change to just the date later
          nutrition: logData.nutrition,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || `Error: ${response.status}`;
        throw new Error(message);
      }

      const data = await response.json();
      alert(data.message || "Log added! :)");
      setShowLogModal(false);
    } catch (err) {
      console.error("Error logging food:", err);
      alert("Error logging food.");
    }

    //console.log("sending log data:", logData);
    // if someone is not logged in
    } else if (!isLoggedIn || !user) {
      alert("must be logged in to log food");
      return;
    }
  };
  

  return (
    <div className="ViewProducts">
      <h1>NomCents</h1>

      <div className="search-filters">
        <input
          type="text"
          placeholder="Search for a product..."
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />
        <button onClick={() => searchProducts(1)}>Search</button>
        
        <fieldset>
          <legend>Data Type</legend>
          <label>
            <input type="checkbox" value="Branded" onChange={handleDataTypeChange} /> Branded
          </label>
          <label>
            <input type="checkbox" value="Foundation" onChange={handleDataTypeChange} /> Foundation
          </label>
          <label>
            <input type="checkbox" value="Survey (FNDDS)" onChange={handleDataTypeChange} /> Survey (FNDDS)
          </label>
          <label>
            <input type="checkbox" value="SR Legacy" onChange={handleDataTypeChange} /> SR Legacy
          </label>
          <label>
            <input type="checkbox" value="Experimental" onChange={handleDataTypeChange} /> Experimental
          </label>
          <label>
            <input type="checkbox" value="Other" onChange={handleDataTypeChange} /> Other
          </label>
        </fieldset>

        <label htmlFor="sortBy">Sort By</label>
        <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="dataType.keyword">Data Type</option>
          <option value="fdcId">FDC ID</option>
          <option value="lowercaseDescription.keyword">Ingredients</option>
          <option value="brandOwner.keyword">Brand Owner</option>
          <option value="publishedDate">Published Date</option>
          <option value="modifiedDate">Modified Date</option>
        </select>

        <label htmlFor="sortOrder">Sort Order</label>
        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>

        <label htmlFor="brandOwner">Brand Owner</label>
        <input
          type="text"
          id="brandOwner"
          placeholder="Enter brand owner (optional)..."
          value={brandOwner}
          onChange={(e) => setBrandOwner(e.target.value)}
        />

      </div>

      <div>
        <h2>Search Results</h2>
        {isLoading && currentPage === 1 ? <p>Loading results...</p> : null}
        {results.length === 0 && !isLoading ? <p>No products found.</p> : null}
        <ul>
          <div className="search-results">
            { results.map((product) => {
              const inGroceryList = groceryList.find(
                (item) => item.fdcId === product.fdcId
              );
              return (
                <div key={product.fdcId}>
                  <div className="product-card">
                    <h3>{product.name}</h3>
                    <p> Brand Owner: {product.brandOwner}</p>
                    <p> Brand Name: {product.brandName}</p>
                    <p>Ingredients: {product.ingredients}</p>
                    <p>
                      <ul>
                        {product.foodNutrients
                          ? product.foodNutrients.map((nutrient) => (
                              <li key={nutrient.nutrientId}>
                                {nutrient.nutrientName}: {nutrient.value}
                              </li>
                            ))
                          : "None"}
                      </ul>
                    </p>
                    {inGroceryList ? (
                      <>
                        <button onClick={() => decrementQuantity(product)}>
                          -
                        </button>
                        <span>{inGroceryList.quantity}</span>
                        <button onClick={() => incrementQuantity(product)}>
                          +
                        </button>
                        <button onClick={() => removeFromGroceryList(product)}>
                          Remove from Grocery List
                        </button>
                      </>
                    ) : (
                      <button onClick={() => addToGroceryList(product)}>
                        Add to Grocery List
                      </button>
                    )}

                    {isLoggedIn && (
                      <button onClick={() => openLogModal(product)}>
                        Log Food
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ul>
      </div>
      {showPopup && (
        <Popup
          message={popupMessage}
          closePopup={handleClosePopup}
          showLoginButton={showLoginButton}
        />
      )}
      <button onClick={loadMoreProducts} disabled={isLoading || currentPage >= totalPages}>
        {isLoading ? "Loading..." : "Load More"}
      </button>

      {showLogModal && selectedProduct && (
        <FoodLogModal
          product={selectedProduct}
          onClose={closeLogModal}
          onSubmit={handleLogSubmit}
        />
      )}
    </div>
  );
}

export default ViewProducts;