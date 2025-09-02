# PillBridge - Medication Care Made Simple

PillBridge is a comprehensive medication management platform designed specifically for elderly patients and their caregivers. The application provides intelligent reminders, medication tracking, cognitive games, and emergency support features.

## Features

### 🏥 Dual User Roles
- **Patient accounts** with simplified, elderly-friendly interfaces
- **Caregiver accounts** with comprehensive monitoring dashboards
- Secure linking system using caregiver codes

### 💊 Medication Management
- Add medications with photos and audio reminders
- Automatic stock tracking and low-stock alerts
- Flexible scheduling (morning, afternoon, night doses)
- Visual medication cards with detailed information

### ⏰ Smart Reminders
- Browser notifications for medication times
- Audio playback support for personalized reminders
- Escalation system for missed doses
- Real-time caregiver alerts

### 🎮 Cognitive Features
- "Pill Recognition Challenge" mini-game
- Score tracking and progress monitoring
- Reinforcement learning for medication identification

### 🤖 AI Assistant
- **AI-powered chat** for caregivers to query patient data in natural language.
- Get summaries of patient's medication adherence, mood trends, and more.

### 👥 Caregiver Dashboard
- Monitor multiple patients
- View medication adherence and alerts
- Emergency contact management
- Real-time patient status updates

### 📱 Health Tracking
- Daily mood tracking with emoji interface
- Visual analytics and trend monitoring
- Medication adherence history

### 🚨 Emergency Support
- Quick access to emergency contacts
- Nearby pharmacy locator
- One-touch calling for emergency numbers

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js with Express.js
- **Styling**: Tailwind CSS with custom elderly-friendly design
- **Database**: MongoDB
- **Authentication**: Custom JWT authentication
- **API Client**: Axios for HTTP requests
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Prerequisites

1. **Node.js 18+** installed
2. **MongoDB** installed and running locally, or MongoDB Atlas account
3. **Git** (optional, for cloning)
4. Modern web browser with notification support

### Installation

1. **Clone or download the project**

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Set up MongoDB**
   - **Option A: Local MongoDB**
     - Install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
     - Start MongoDB service (usually `mongod` command)
   - **Option B: MongoDB Atlas (Cloud)**
     - Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
     - Create a cluster and get your connection string

5. **Set up environment variables**
   - Frontend environment (create `.env` in root):
     ```
     VITE_API_BASE_URL=http://localhost:3000
     VITE_APP_NAME=PillBridge
     VITE_APP_VERSION=1.0.0
     ```
   - Backend environment (create `backend/.env`):
     ```
     MONGODB_URI=mongodb://localhost:27017
     MONGODB_DB=pillbridge
     PORT=3000
     NODE_ENV=development
     JWT_SECRET=your_jwt_secret_key_here_change_in_production

     # Optional: For the AI Assistant feature
     OPENAI_API_KEY=your_openai_api_key_here
     ```
   - For MongoDB Atlas, replace `MONGODB_URI` with your connection string.
   - To enable the AI Assistant feature, you must provide an `OPENAI_API_KEY`. You can get an API key from the [OpenAI Platform](https://platform.openai.com/).

6. **Initialize the database**
   ```bash
   node mongo-setup.js
   ```

7. **Run the application**
   - **Quick start (Windows)**: Double-click `start-dev.bat`
   - **Manual start**:
     ```bash
     # Terminal 1 - Backend
     cd backend
     npm start

     # Terminal 2 - Frontend (new terminal)
     npm run dev
     ```

8. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`

## Database Schema

The MongoDB database will contain the following collections:

- **users**: Patient and caregiver profiles with authentication data
- **medications**: Medication details, dosages, and scheduling information
- **reminders**: Reminder history and acknowledgment tracking
- **mood_entries**: Daily mood tracking data with timestamps
- **game_scores**: Cognitive game performance metrics

### Database Indexes

The setup script creates optimized indexes for:
- User email uniqueness and caregiver code lookups
- Patient-specific medication and reminder queries
- Date-based mood entries and game scores
- Low stock medication alerts

## Usage Guide

### For Caregivers

1. **Register as a caregiver** - You'll receive a unique 6-character code
2. **Share your code** with patients who need your care
3. **Monitor patient dashboards** for medication adherence and alerts
4. **Receive escalated notifications** when patients miss medications

### For Patients

1. **Register as a patient** using your caregiver's code
2. **Add your medications** with photos, schedules, and instructions
3. **Receive automatic reminders** at scheduled times
4. **Track your daily mood** and medication adherence
5. **Play the pill recognition game** to reinforce learning

## Design Principles

### Elderly-Friendly Interface
- **Large buttons and text** (minimum 18px font size)
- **High contrast colors** for better visibility
- **Simple navigation** with clear visual hierarchy
- **Minimal cognitive load** with focused interfaces

### Accessibility Features
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Color contrast** meeting WCAG AA standards
- **Large touch targets** for easier interaction

## Security & Privacy

- **End-to-end encryption** for all data transmission
- **Row Level Security (RLS)** in the database
- **JWT-based authentication** with secure session management
- **HIPAA-compliant** data handling practices

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Support

For technical support or feature requests, please contact the development team or visit the project repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.