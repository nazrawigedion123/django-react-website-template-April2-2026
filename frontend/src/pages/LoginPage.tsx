import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await login({ email, password });
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.detail || 'Invalid email or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError(null);
            const verifier = generateCodeVerifier();
            const challenge = await generateCodeChallenge(verifier);

            // Store verifier for the callback
            sessionStorage.setItem('google_code_verifier', verifier);

            const clientId = import.meta.env.VITE_SOCIAL_AUTH_GOOGLE_CLIENT_ID;
            const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URL || 'http://localhost:5173/callback';

            if (!clientId) {
                setError('Google Client ID not found');
                return;
            }

            const searchParams = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'email profile',
                code_challenge: challenge,
                code_challenge_method: 'S256',
                access_type: 'online', // Ensure we get a refresh token if needed, or just standard flow
            });

            window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${searchParams.toString()}`;
        } catch (err) {
            console.error('Google login initialization failed', err);
            setError('Failed to initialize Google login');
        }
    };

    const queryParams = new URLSearchParams(location.search);
    const queryError = queryParams.get('error');

    // Show error from callback if present
    React.useEffect(() => {
        if (queryError) {
            setError(queryError);
        }
    }, [queryError]);


    return (
        <div className="auth-page">
            <div className="auth-bg-decor decor-1"></div>
            <div className="auth-bg-decor decor-2"></div>

            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Elevate your experience with secure access</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            className="form-control"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-auth-primary" disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-divider">or continue with</div>

                <div className="auth-social">
                    <button className="btn-google" onClick={handleGoogleLogin}>
                        <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" width="20" height="20" />
                        Log in with Google
                    </button>
                </div>

                <div className="auth-footer">
                    Don't have an account? <Link to="/register">Create one for free</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
