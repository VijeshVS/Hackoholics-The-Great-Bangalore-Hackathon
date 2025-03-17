# The Great Bangalore Hackathon
# Supply Demand Management and Reducing Ride Denials 

## 📌 Problem Statement (Provided by Namma Yatri)  
Ride denials and increased passenger wait times during peak hours disrupt urban mobility. The goal is to **optimize the supply-demand balance** by:  
- **Predicting and addressing** driver-side concerns leading to ride denials.  
- **Encouraging drivers** to accept more trips through incentives and rewards.  
- **Reducing passenger wait times** by efficiently connecting them to available drivers.  
- **Implementing real-time surge balancing** for a fairer ride distribution.  

## 💡 Our Solution  
### 🚀 **1. Demand Prediction Model**  
- Developed an **XGBoost Regressor** to predict **taxi demand** in Bangalore.  
- Created a **synthetic dataset** simulating peak-hour trends due to lack of public data.  
- Enabled drivers to **anticipate high-demand areas** for better supply allocation.  

### 🎮 **2. Gamification for Drivers**  
- Introduced **daily streaks, missions, and challenges** to boost engagement.  
- Drivers earn **rewards, coupons, and discounts** upon achieving milestones.  
- Proposed **partnerships with fuel, insurance, and service companies** for meaningful incentives.  

### 📅 **3. Pre-Booking Commitment System**  
- Requires **both passengers and drivers** to commit a small **percentage of the fare** before confirming a ride.  
- If either party cancels, the **other is compensated** through an exponential deduction model.  
- Helps **reduce last-minute cancellations** and ensures commitment.  

### 🔄 **4. Ride Sorting Based on Driver Preferences**  
- Instead of strict ride filtering, **drivers can sort available rides** based on:  
  - **Shortest wait time**  
  - **Ride duration**  
  - **Fare price**  
- This ensures **flexibility for drivers** while keeping passenger wait times low.  

## 🛠 Tech Stack  
### **Frontend**  
- Next.js, React.js  

### **Backend**  
- Express.js, WebSockets  

### **Machine Learning & Data Processing**  
- Pandas, Scikit-learn, NumPy  
- XGBoost for demand prediction  

### **APIs Used**  
- Google Maps API  
- Google Distance Matrix API  

## 👨‍💻 Contributors  
- **Vaibhav PR**  
- **Chethohaar**  
- **Dhruva D**  
- **Vijesh Shetty**  
