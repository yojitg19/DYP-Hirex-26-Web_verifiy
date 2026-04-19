# VerifyID - Verified Professional Network Platform 🎯

## 🌟 What is VerifyID?

**VerifyID** is a professional networking platform that solves a critical problem: **How do you know if the professional you're connecting with is real?**

In today's digital world, it's easy to fake credentials online. VerifyID uses **facial recognition technology** to verify that professionals are who they claim to be. We connect verified professionals with legitimate job opportunities, building a trustworthy network where both professionals and companies can operate with confidence.

### The Problem We Solve
- 🚨 Fake profiles on traditional networking platforms
- 😤 Companies can't trust they're hiring real people
- 🔗 Professionals worry about connecting with fraudsters
- ❓ No way to verify someone's professional identity online

### Our Solution
✅ **Real Face Verification** - Every professional verifies their identity with a live face check  
✅ **One Identity, One Account** - Prevents duplicate accounts and fraud  
✅ **Verified Job Marketplace** - Only verified professionals can apply  
✅ **Professional Network** - Connect with authentic professionals in your field  

---

## 📸 Platform Overview

### Step 1: Secure Registration
Users create an account and provide their professional details.

![Registration Page](./images/1-register.png)

### Step 2: User Login
Secure authentication to access the platform.

![Login Page](./images/2-login.png)

### Step 3: Professional Verification
Submit your professional claim with your role and company.

![Submit Professional Claim](./images/3-submit-claim.png)

### Step 4: Dashboard & Profile
Once verified, access your professional dashboard with your trust score and verified identity.

![User Dashboard](./images/4-dashboard.png)

---

## 🏗️ How It Works (In Simple Terms)

**For Professionals:**
1. Sign up with your email and password
2. Provide your professional details (name, role, company)
3. Take a selfie to verify you're real
4. Browse and apply to jobs from verified companies
5. Build your professional network

**For Companies:**
1. Post job opportunities
2. See only verified professionals applying
3. Hire with confidence knowing candidates are real

---

## 💻 Technology We Used

While VerifyID is powerful, it's built on straightforward technology:

### Frontend (What Users See)
- **React** - A modern tool for building interactive web pages
- **Tailwind CSS** - Beautiful, responsive design framework
- **Vite** - Fast development environment

### Backend (The Brain)
- **Node.js** - Server that handles all requests and data
- **SQLite** - Lightweight database storing user profiles and jobs

### Face Verification (The Security)
- **Python & OpenCV** - Advanced facial recognition system
- Detects if a face is real, unique, and matches requirements

### Security
- **JWT Tokens** - Secure authentication method
- **Password Hashing** - Passwords are encrypted, never stored in plain text

---

## 📁 Project Structure (What Goes Where)

```
DYP-Hirex-26-Web_verifiy/
│
├── frontend/                          # The website users see
│   ├── src/
│   │   ├── pages/                     # Different pages (Register, Login, Jobs, Feed)
│   │   ├── components/                # Reusable building blocks
│   │   └── main.jsx                   # Routing configuration
│   ├── package.json                   # Frontend dependencies
│   └── vite.config.js                 # Build configuration
│
├── backend-main/                      # The server & database
│   ├── server.js                      # Main server code
│   ├── database.sqlite                # Where all data is stored
│   └── package.json                   # Backend dependencies
│
├── secureio/                          # Face verification service
│   ├── app.py                         # Python face detection code
│   └── requirements.txt               # Python dependencies
│
└── images/                            # Screenshots & assets
```

### Breaking It Down:

**Frontend Folder**: Contains the website's user interface. Think of it as the "shop window."

**Backend Folder**: Contains the server that handles all the work - storing data, checking authentication, processing jobs.

**SecureIO Folder**: The security system that checks faces. It runs separately and communicates with the main server.

---

## 🚀 Key Features

### ✨ User Registration & Authentication
- Simple signup with email and password
- Secure login with JWT tokens (24-hour sessions)
- Password encryption for safety

### 🔐 Face Verification System
- Real-time face detection
- Prevents duplicate accounts
- Ensures each account represents a real person
- Advanced liveness detection

### 💼 Professional Profiles
- Display your role, company, and experience
- Build professional credibility
- Show your verified identity

### 🎯 Job Marketplace
- Browse verified job openings
- Companies post positions they need to fill
- Only verified professionals can apply

### 🤝 Professional Network
- Connect with other verified professionals
- Build your professional community
- See what others in your field are doing

### 📊 Trust Dashboard
- View your trust score
- Track your verified status
- See all your professional claims

---

## 🛠️ How to Set Up VerifyID (For Developers)

### Prerequisites
You need to have installed:
- **Node.js** (for frontend and backend)
- **Python 3.8+** (for face verification)
- **Git** (to download the project)

### Step 1: Clone the Project
```bash
git clone https://github.com/yojitg19/DYP-Hirex-26-Web_verifiy.git
cd DYP-Hirex-26-Web_verifiy
```

### Step 2: Set Up the Backend
```bash
cd backend-main
npm install              # Install dependencies
node server.js          # Start the server
# Server runs at http://localhost:3000
```

### Step 3: Set Up the Face Verification Service
```bash
cd secureio
pip install -r requirements.txt    # Install Python dependencies
python app.py                       # Start face verification service
# Service runs at http://localhost:5000
```

### Step 4: Set Up the Frontend
```bash
cd frontend
npm install              # Install dependencies
npm run dev             # Start development server
# Visit http://localhost:5173 in your browser
```

---

## 🎮 Using the Platform

### For Testing/Demo:

1. **Register a New Account**
   - Go to the registration page
   - Enter email, password, and professional details
   - Click "Next"

2. **Face Verification**
   - Take a clear selfie in good lighting
   - The system checks if your face is real
   - You'll get verified instantly

3. **Explore Jobs**
   - Browse jobs posted by companies
   - View job details and requirements
   - Apply to positions

4. **View Your Profile**
   - See your verification status
   - Check your trust score
   - Update your professional information

---

## 📊 Database Overview

VerifyID stores information securely using SQLite:

- **Users** - Email, password, role, verification status
- **Profiles** - Professional bio, skills, experience, location
- **Jobs** - Job listings posted by companies
- **Face Verifications** - Verification records and status
- **Companies** - Company information and verification

All data is encrypted and stored locally.

---

## 🎯 Why This Matters for Hackathons

**Innovation** 🚀  
We're using AI (face recognition) to solve a real-world problem that affects millions of professionals daily.

**Practical** 💡  
This isn't just a concept - it's a working platform that actually verifies people in real-time.

**User-Centric** 👥  
The platform is built with both professionals and companies in mind.

**Scalable** 📈  
The architecture can handle growth from hundreds to millions of users.

**Secure** 🔒  
We take security seriously with encryption, JWT authentication, and facial verification.

---

## 🏆 What Makes VerifyID Stand Out

1. **Real-Time Verification** - Not just data validation, but actual face recognition
2. **Prevents Fraud** - Each person can only have one verified account
3. **Trustworthy Network** - Every person on the platform is verified
4. **Professional Focus** - Excludes students/freshers, targets real professionals
5. **Complete Solution** - Handles registration, verification, networking, and jobs all in one place

---

## 🔮 Future Enhancements

- Video verification for additional security
- LinkedIn integration for credential verification
- Mobile app for on-the-go access
- Advanced matching algorithm for jobs and professionals
- Background verification partnerships
- Referral rewards system
- Professional badges for different expertise areas

---

## 📝 Notes

- This project was built for the **DYP Hirex 2026** competition
- All code is designed to be clean, maintainable, and easy to understand
- The face verification system uses industry-standard OpenCV libraries

---

## 🤝 Contributing

This project is part of a hackathon competition. The team is continuously improving the platform based on feedback and emerging technologies.

---

## ⚡ Key Metrics

- **Frontend**: React 19 with Vite (lightning-fast build times)
- **Backend**: Node.js with SQLite (lightweight and efficient)
- **Face Recognition**: Python OpenCV (industry-standard)
- **Security**: JWT Authentication with 24-hour sessions
- **Database**: SQLite with 5 core tables for scalability

---

## 📞 Questions for Judges

**Q: Is this actually secure?**  
A: Yes. We use facial recognition, encrypted passwords, JWT tokens, and ensure one identity = one account.

**Q: Can it handle many users?**  
A: The architecture is designed to scale from hundreds to millions of users.

**Q: How fast is face verification?**  
A: Real-time - typically 1-2 seconds per verification.

**Q: What if someone tries to fake their face?**  
A: Our system detects liveness (real face vs. photo) and stores face embeddings to prevent duplicates.

---

## 🎓 For Hackathon Judges

VerifyID represents a **practical solution to a real problem** - trust in online professional networks. We've combined:
- ✅ Modern web technologies (React, Node.js)
- ✅ Security and verification (Face recognition)
- ✅ User experience (Simple, intuitive interface)
- ✅ Real-world use case (Hiring and networking)

The platform isn't just an idea - it **actually works** and can be deployed today.

---

## 👥 Team: Codex

Meet the talented team behind VerifyID:

| Name | Role |
|------|------|
| Yojit Giri | Team Leader |
| Pratiksha Suryawanshi | Team Member |
| Rayan Rahman | Team Member |
| Divya Chavan | Team Member |
| Shreenidhi Gupta | Team Member |

**Team Codex** - Building trustworthy digital networks for professionals worldwide! 🚀

---

**Built with ❤️ for the DYP Hirex 2026 Competition**
