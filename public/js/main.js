document.addEventListener("DOMContentLoaded", () => {
  console.log("Erf AI frontend initialized");

  // Initialize button
  const initializeBtn = document.getElementById("initializeBtn");
  if (initializeBtn) {
    initializeBtn.addEventListener("click", initializeModel);
  }

  // Predict button
  const predictBtn = document.getElementById("predictBtn");
  if (predictBtn) {
    predictBtn.addEventListener("click", makePrediction);
  }
});

/**
 * Initialize the AI model
 */
async function initializeModel() {
  console.log("Initializing AI model...");
  const initializeBtn = document.getElementById("initializeBtn");

  try {
    initializeBtn.disabled = true;
    initializeBtn.textContent = "Initializing...";

    const response = await fetch("/api/ai/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Initialization response:", data);

    if (data.success) {
      initializeBtn.classList.remove("btn-primary");
      initializeBtn.classList.add("btn-success");
      initializeBtn.textContent = "Model Initialized";

      // Enable predict button
      const predictBtn = document.getElementById("predictBtn");
      if (predictBtn) {
        predictBtn.disabled = false;
      }
    } else {
      throw new Error(data.message || "Initialization failed");
    }
  } catch (error) {
    console.error("Error initializing model:", error);
    initializeBtn.classList.remove("btn-primary");
    initializeBtn.classList.add("btn-danger");
    initializeBtn.textContent = "Initialization Failed";

    setTimeout(() => {
      initializeBtn.classList.remove("btn-danger");
      initializeBtn.classList.add("btn-primary");
      initializeBtn.textContent = "Initialize Model";
      initializeBtn.disabled = false;
    }, 3000);
  }
}

/**
 * Make a prediction with the AI model
 */
async function makePrediction() {
  console.log("Making prediction...");
  const predictBtn = document.getElementById("predictBtn");
  const resultDiv = document.getElementById("predictionResult");

  try {
    predictBtn.disabled = true;
    predictBtn.textContent = "Predicting...";

    // Create sample input data (10 features with random values)
    const sampleData = [Array.from({ length: 10 }, () => Math.random())];

    const response = await fetch("/api/ai/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputData: sampleData }),
    });

    const data = await response.json();
    console.log("Prediction response:", data);

    // Display results
    if (data.success) {
      resultDiv.style.display = "block";
      resultDiv.innerHTML = `
                <h5>Prediction Result:</h5>
                <pre>${JSON.stringify(data.predictions, null, 2)}</pre>
            `;
    } else {
      throw new Error(data.message || "Prediction failed");
    }
  } catch (error) {
    console.error("Error making prediction:", error);

    if (resultDiv) {
      resultDiv.style.display = "block";
      resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    Error: ${error.message || "Failed to make prediction"}
                </div>
                <p>Make sure you've initialized the model first.</p>
            `;
    }
  } finally {
    predictBtn.disabled = false;
    predictBtn.textContent = "Try Prediction";
  }
}
