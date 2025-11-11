Visit Website: [Click Here](https://neural-study-xi.vercel.app)

## Introduction

Neural Study is an offline-first learning hub designed to support students in areas with limited or unstable internet access. The platform delivers bilingual (English and Hindi) courses, quizzes, and downloadable learning materials that remain fully accessible even without connectivity. It locally caches lessons, securely syncs progress whenever a connection is available, and provides multilingual tools that empower both students and teachers—making it especially effective for rural learning environments.

# Tech Stack

<table>
<tr>
<td align="center" width="50%">

## Frontend  
<strong>Technologies:</strong><br/><br/>

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router-DOM-CA4245?logo=reactrouter)
![Axios](https://img.shields.io/badge/Axios-Client-5A29E4?logo=axios)
![React-i18next](https://img.shields.io/badge/React--i18next-Multilingual-26A69A?logo=i18next)
![IndexedDB](https://img.shields.io/badge/IndexedDB-IDB-006699?logo=googlechrome)
![Workbox](https://img.shields.io/badge/Workbox-PWA%20Support-FF6F00?logo=googlechrome)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-Linting-4B32C3?logo=eslint)
![CSS Modules](https://img.shields.io/badge/CSS-Modules-1572B6?logo=css3)

</td>

<td align="center" width="50%">

## Backend  
<strong>Technologies:</strong><br/><br/>

![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![Mongoose](https://img.shields.io/badge/Mongoose-ODM-47A248?logo=mongodb)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens)
![Bcryptjs](https://img.shields.io/badge/Bcryptjs-Hashing-3384D5)
![CORS](https://img.shields.io/badge/CORS-Enabled-593D88)
![Cookie Parser](https://img.shields.io/badge/Cookie--Parser-Enabled-FFB300)
![Validator](https://img.shields.io/badge/Validator-Data%20Validation-00C853)
![Dotenv](https://img.shields.io/badge/Dotenv-Env%20Config-3D9970)
![i18next Backend](https://img.shields.io/badge/i18next-FS%20%2B%20HTTP%20Middleware-0DB7ED)
![Nodemon](https://img.shields.io/badge/Nodemon-Auto%20Reload-76D04B?logo=nodemon)

</td>
</tr>
</table>


## Key Features

- **Offline-first learning** – Caches courses, lectures, and tests locally so students can continue studying without internet; syncs progress automatically when online.
- **Bilingual support** – Full English & Hindi localization across student and teacher interfaces.
- **Student dashboard** – Browse courses, view details, track downloads, and manage saved content.
- **Interactive tests** – Attempt quizzes and exams with tracked history and per-lecture progress.
- **Media & downloads manager** – Preview videos, audio, documents, and JSON files with detailed storage insights.
- **Teacher tools** – Upload and manage lectures, review analytics snippets, and switch languages within a responsive dashboard.
- **Unified notifications** – Toast messages, status banners, and a consistent global loader for system feedback.
- **Account & sync settings** – Login, manage profiles, enable manual sync, Wi-Fi-only mode, and auto-sync preferences.


# 📁 NeuralStudyOfflineSite – Project Structure

```md
NeuralStudyOfflineSite/
├─ README.md
├─ locales/
│  ├─ en/translation.json
│  └─ hi/translation.json
├─ backend/
│  ├─ .env / .env.example
│  ├─ package.json / package-lock.json
│  ├─ scripts/
│  │  └─ seedCourses.js
│  └─ src/
│     ├─ app.js / server.js
│     ├─ config/
│     │  └─ db.js
│     ├─ controllers/
│     │  ├─ authController.js
│     │  ├─ courseController.js
│     │  ├─ lectureController.js
│     │  └─ testController.js
│     ├─ i18n/
│     │  └─ config.js
│     ├─ middleware/
│     │  ├─ auth.js
│     │  └─ i18n.js
│     ├─ models/
│     │  ├─ Course.js
│     │  ├─ Lecture.js
│     │  ├─ LectureRating.js
│     │  ├─ Test.js
│     │  ├─ TestAttempt.js
│     │  └─ User.js
│     └─ routes/
│        ├─ authRoutes.js
│        ├─ courseRoutes.js
│        ├─ lectureRoutes.js
│        └─ testRoutes.js
└─ frontend/
   ├─ .env
   ├─ package.json / package-lock.json
   ├─ public/ (logo & static assets)
   ├─ index.html / vite.config.js / eslint.config.js
   └─ src/
      ├─ App.jsx / App.css / main.jsx / index.css
      ├─ api/
      ├─ assets/
      ├─ components/
      │  ├─ CenteredLoader.*, Navbar.*, Footer.*, ToastStack.*, etc.
      ├─ data/
      ├─ hooks/
      ├─ i18n/
      ├─ pages/
      │  ├─ AuthPage.*, DownloadsPage.*, ExploreCoursesPage.*, CourseDetailPage.*, ProfilePage.*, SettingsPage.*, Tests*, etc.
      │  └─ teacher/
      │     ├─ TeacherLayout.*, TeacherProfilePage.*, TeacherUploadLecturePage.*, TeacherUploadsPage.*
      ├─ services/
      ├─ storage/
      ├─ theme/
      └─ utils/
```

