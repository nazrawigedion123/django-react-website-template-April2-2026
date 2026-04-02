import { useState, useEffect } from 'react';
import './Home.css';

const Home = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="home">
            <section className={`hero ${isVisible ? 'visible' : ''}`}>
                <div className="hero-background">
                    <div className="gradient-orb orb-1"></div>
                    <div className="gradient-orb orb-2"></div>
                    <div className="gradient-orb orb-3"></div>
                </div>

                <div className="hero-content">
                    <h1 className="hero-title">
                        Build Amazing Apps with
                        <span className="gradient-text"> Django & React</span>
                    </h1>
                    <p className="hero-subtitle">
                        A modern, production-ready template combining the power of Django's backend
                        with React's dynamic frontend. Start building your next big idea today.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-hero-primary">
                            Get Started
                            <span className="btn-icon">→</span>
                        </button>
                        <button className="btn-hero-secondary">
                            View Documentation
                        </button>
                    </div>
                </div>
            </section>

            <section className="features">
                <h2 className="section-title">Why Choose This Template?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🚀</div>
                        <h3>Lightning Fast</h3>
                        <p>Optimized build process with Vite for instant hot module replacement and blazing fast production builds.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3>Secure by Default</h3>
                        <p>Django's battle-tested security features protect your application from common vulnerabilities.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🎨</div>
                        <h3>Beautiful UI</h3>
                        <p>Modern, responsive design with smooth animations and premium aesthetics out of the box.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>API Ready</h3>
                        <p>Pre-configured Django REST framework integration for seamless frontend-backend communication.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📱</div>
                        <h3>Fully Responsive</h3>
                        <p>Looks perfect on all devices, from mobile phones to large desktop screens.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🛠️</div>
                        <h3>Developer Friendly</h3>
                        <p>TypeScript support, ESLint configuration, and hot reload for the best development experience.</p>
                    </div>
                </div>
            </section>

            <section className="cta">
                <div className="cta-content">
                    <h2>Ready to Build Something Amazing?</h2>
                    <p>Join thousands of developers using this template to create production-ready applications.</p>
                    <button className="btn-cta">Start Your Project Now</button>
                </div>
            </section>
        </div>
    );
};

export default Home;
