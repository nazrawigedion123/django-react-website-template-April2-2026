import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '../hooks/auth/useAuthMutations';

const GoogleCallback: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { mutate: googleLogin, isError, error } = useGoogleLogin();
    const processedRef = useRef(false);

    useEffect(() => {
        if (processedRef.current) return;

        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const errorParam = params.get('error');

        if (errorParam) {
            console.error('Google login error:', errorParam);
            navigate('/login?error=Google login failed');
            return;
        }

        if (code) {
            const codeVerifier = sessionStorage.getItem('google_code_verifier');
            console.log('Code received from Google. Code Verifier exists:', !!codeVerifier);

            if (codeVerifier) {
                processedRef.current = true;
                console.log('Exchanging code for tokens...');

                googleLogin(
                    { code, codeVerifier },
                    {
                        onSuccess: (data) => {
                            console.log('Login successful, tokens received:', !!data.access);
                            sessionStorage.removeItem('google_code_verifier');
                            // Small delay to ensure state is updated
                            setTimeout(() => navigate('/dashboard'), 100);
                        },
                        onError: (loginError: any) => {
                            console.error('Exchange failed:', loginError);
                            processedRef.current = false; // Allow retry if needed
                        },
                    }
                );
            } else {
                console.error('No code verifier found in sessionStorage');
                navigate('/login?error=Session expired. Please try again.');
            }
        }
    }, [location, googleLogin, navigate]);

    if (isError) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <h2>Login Failed</h2>
                    <p>{(error as any)?.message || 'An error occurred during Google login.'}</p>
                    <button onClick={() => navigate('/login')} className="btn-auth-primary">Back to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                <h2>Processing Login...</h2>
                <div className="spinner"></div>
            </div>
        </div>
    );
};

export default GoogleCallback;
