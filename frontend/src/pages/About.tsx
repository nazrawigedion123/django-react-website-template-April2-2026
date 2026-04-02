import './About.css';

const About = () => {
    return (
        <div className="about">
            <div className="about-container">
                <div className="about-header">
                    <h1 className="about-title">About This Template</h1>
                    <p className="about-subtitle">
                        A powerful combination of Django and React for modern web development
                    </p>
                </div>

                <div className="about-content">
                    <section className="about-section">
                        <h2>🎯 What is This?</h2>
                        <p>
                            This is a production-ready template that seamlessly integrates Django's robust
                            backend capabilities with React's modern frontend framework. It's designed to
                            help developers quickly bootstrap full-stack web applications with best practices
                            built-in from day one.
                        </p>
                    </section>

                    <section className="about-section">
                        <h2>⚙️ Technology Stack</h2>
                        <div className="tech-grid">
                            <div className="tech-item">
                                <h3>Backend</h3>
                                <ul>
                                    <li>Django 4.2+</li>
                                    <li>Django REST Framework</li>
                                    <li>SQLite (easily swappable)</li>
                                    <li>Python 3.12+</li>
                                </ul>
                            </div>
                            <div className="tech-item">
                                <h3>Frontend</h3>
                                <ul>
                                    <li>React 19</li>
                                    <li>TypeScript</li>
                                    <li>Vite</li>
                                    <li>React Router</li>
                                </ul>
                            </div>
                            <div className="tech-item">
                                <h3>Development</h3>
                                <ul>
                                    <li>ESLint</li>
                                    <li>Hot Module Replacement</li>
                                    <li>Type Safety</li>
                                    <li>Modern CSS</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="about-section">
                        <h2>✨ Key Features</h2>
                        <div className="features-list">
                            <div className="feature-item">
                                <span className="feature-number">01</span>
                                <div>
                                    <h3>Seamless Integration</h3>
                                    <p>Django serves the React build in production, with hot reload in development</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <span className="feature-number">02</span>
                                <div>
                                    <h3>API-First Architecture</h3>
                                    <p>Pre-configured REST API setup with type-safe frontend service layer</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <span className="feature-number">03</span>
                                <div>
                                    <h3>Modern UI/UX</h3>
                                    <p>Beautiful, responsive design with smooth animations and premium aesthetics</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <span className="feature-number">04</span>
                                <div>
                                    <h3>Developer Experience</h3>
                                    <p>TypeScript, ESLint, and modern tooling for the best development workflow</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="about-section">
                        <h2>🚀 Getting Started</h2>
                        <div className="code-block">
                            <pre>
                                {`# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend setup (in a new terminal)
cd frontend
npm install
npm run dev

# Build for production
npm run build`}
                            </pre>
                        </div>
                    </section>

                    <section className="about-section cta-section">
                        <h2>Ready to Build?</h2>
                        <p>
                            This template provides everything you need to start building your application.
                            Customize it, extend it, and make it your own!
                        </p>
                        <button className="btn-about-primary">View Documentation</button>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default About;
