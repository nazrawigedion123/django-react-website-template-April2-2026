# Django + React Template 🚀

A modern, production-ready full-stack template combining Django's powerful backend with React's dynamic frontend. Features a premium dark theme UI, type-safe API integration, and seamless deployment workflow.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.12+-blue.svg)
![Django](https://img.shields.io/badge/django-4.2+-green.svg)
![React](https://img.shields.io/badge/react-19.2-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.9-blue.svg)

## ✨ Features

- 🎨 **Modern UI Design** - Premium dark theme with glassmorphism effects and smooth animations
- ⚡ **Lightning Fast** - Vite for instant HMR and optimized production builds
- 🔒 **Secure** - Django's battle-tested security features with JWT and **Google PKCE Flow**
- 📱 **Fully Responsive** - Beautiful on all devices from mobile to desktop
- 🔌 **API Ready** - Pre-configured Django REST Framework integration
- 📦 **Type Safe** - TypeScript throughout the frontend
- 🎯 **Production Ready** - Optimized deployment setup with `public_html` serving static assets

## 🛠️ Tech Stack

### Backend
- **Django 4.2+** - Web framework
- **Django REST Framework** - API development
- **SQLite** - Database (easily swappable to PostgreSQL/MySQL)
- **Python 3.12+**

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Vanilla CSS** - Styling with CSS custom properties

## 🚀 Quick Start

### Prerequisites

- Python 3.12 or higher
- Node.js 18 or higher
- npm or yarn

### 1. Fork This Repository

Click the "Fork" button at the top right of this repository to create your own copy.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/django-react-template.git
cd django-react-template
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install django djangorestframework

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start Django development server
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### 4. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend dev server will be available at `http://localhost:5173`

## 📁 Project Structure

```
django-react-auth-PKCE/
├── backend/                 # Django backend (configuration in config/)
│   ├── users/              # User management & OAuth logic
│   ├── config/             # Project settings & URLs
│   ├── manage.py
│   └── db.sqlite3
├── frontend/               # React frontend (Vite-based)
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components (including GoogleCallback)
│   │   ├── hooks/         # Custom React hooks (Auth, Mutations)
│   │   ├── services/      # API service layer
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── vite.config.ts
├── public_html/            # Production static files
│   ├── static/             # Django collected static files
│   ├── media/              # User uploaded media
│   └── index.html          # Built frontend entry point
└── README.md
```

## 🔧 Development Workflow

### Development Mode

Run both servers simultaneously for the best development experience:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

- Frontend: `http://localhost:5173` (with hot reload)
- Backend API: `http://localhost:8000/api/`
- Django Admin: `http://localhost:8000/admin/`

### Production Build & Deployment

The project is structured to serve all static assets from the `public_html` directory, making it compatible with most shared hosting and VPS setups.

1. **Build Frontend:**
```bash
cd frontend
npm run build
# The build output is moved to ../public_html
```

2. **Collect Backend Static Files:**
```bash
cd ../backend
python manage.py collectstatic --noinput
# Static files are collected into ../public_html/static/
```

3. **Server Configuration:**
Point your web server (Nginx/Apache) to use `public_html` as the document root for static files, while proxying API requests to the Django Gunicorn/Uvicorn server.

## 🔐 Google Auth (PKCE Flow)

This template implements the **Proof Key for Code Exchange (PKCE)** flow for secure Google Authentication, which modern web applications prefer over the implicit flow.

### How it works:
1. **Frontend Initiation**: The frontend generates a random `code_verifier` and a `code_challenge`.
2. **Google Redirect**: The user is redirected to Google with the `code_challenge`.
3. **Authorization Code**: Google redirects back with an `authorization_code`.
4. **Secure Exchange**: The frontend sends both the `authorization_code` and the original `code_verifier` to our backend.
5. **Backend Verification**: The backend exchanges these with Google for an access token, which is then used to identify the user and issue a JWT.

This flow ensures that even if the `authorization_code` is intercepted, it cannot be used without the `code_verifier` (which never leaves the client during the initial redirect).

## 🎨 Customization

### Change Theme Colors

Edit `frontend/src/index.css` and modify the CSS custom properties:

```css
:root {
  --color-primary: #8b5cf6;    /* Purple */
  --color-secondary: #ec4899;  /* Pink */
  --color-accent: #3b82f6;     /* Blue */
  /* ... */
}
```

### Add New Pages

1. Create a new component in `frontend/src/pages/`
2. Add the route in `frontend/src/App.tsx`:

```tsx
import NewPage from './pages/NewPage';

// In the Routes component:
<Route path="/new-page" element={<NewPage />} />
```

3. Add navigation link in `frontend/src/components/Navbar.tsx`

### Connect to Django API

Use the pre-configured API service:

```typescript
import api from '../services/api';

// GET request
const response = await api.get<DataType>('/endpoint');

// POST request
const response = await api.post<ResponseType>('/endpoint', { data });
```

## 📝 Creating Your Own Project

### 1. Rename the Project

**Backend:**
```bash
# Rename Django project
cd backend
python manage.py rename YOUR_PROJECT_NAME
```

Or manually update:
- `backend/config/` directory name
- References in `settings.py`, `wsgi.py`, `asgi.py`
- `manage.py` imports

**Frontend:**
```bash
# Update package.json
cd frontend
npm pkg set name="your-project-name"
```

### 2. Update Configuration

- Update `frontend/index.html` title
- Modify `backend/config/settings.py`:
  - Change `SECRET_KEY` (generate a new one)
  - Update `ALLOWED_HOSTS` for production
  - Configure database settings
  - Add your domain to `CORS_ALLOWED_ORIGINS`
  - Update Google OAuth credentials in `.env`

### 3. Set Up Your Repository

```bash
# Remove existing git history (optional)
rm -rf .git

# Initialize new repository
git init
git add .
git commit -m "Initial commit from django-react-template"

# Add your remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_PROJECT.git
git push -u origin main
```

## 🚢 Deployment

### Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=your-database-url
```

### Production Checklist

- [ ] Set `DEBUG = False` in production
- [ ] Generate a new `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set up a production database (PostgreSQL recommended)
- [ ] Configure static file serving (WhiteNoise or CDN)
- [ ] Set up HTTPS
- [ ] Configure CORS if frontend and backend are on different domains
- [ ] Run `python manage.py collectstatic`
- [ ] Set up proper logging
- [ ] Configure email backend for password resets

### Deployment Platforms

This template works great with:
- **Railway** - Easy Django + static file hosting
- **Heroku** - Classic PaaS
- **DigitalOcean App Platform** - Simple deployment
- **AWS/GCP/Azure** - Full control
- **Vercel/Netlify** (frontend) + Railway/Heroku (backend) - Separated deployment

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - feel free to use it for your own projects!

## 🙏 Acknowledgments

Built with:
- [Django](https://www.djangoproject.com/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## 📧 Support

If you have any questions or run into issues, please open an issue on GitHub.

---

**Happy coding!** 🎉 Start building your next amazing project with this template.
