import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; 

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  //function to handle register form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null); 
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name: fullName,
        email,
        username,
        password,
      });

      setLoading(false);

      if (response.status === 201) {
        toast.success("Registration successful!");
        navigate('/login');
      }
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
    
    setFullName('');
    setEmail('');
    setUsername('');
    setPassword('');
  };
  
  return (
    <>
      <div className="loginRegister" style={{ width: "100%" }}>
        <div className="card d-flex">
          <img
            src="https://img.freepik.com/free-vector/mobile-login-concept-illustration_114360-83.jpg?t=st=1719081904~exp=1719085504~hmac=fb398424ad9d38e4016a281a903c3ababadc8e3c714a75e7d609e128b7826488&w=740"
            alt="login"
          ></img>
          <div>
            <h4 className="outfit-logReg mb-3">Register</h4>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  "Register"
                )}
              </button>
              {error && <p className="text-danger">{error}</p>}
              <hr></hr>
              <p>
                Already have an account?{" "}
                <Link className="links" to="/login">
                  Login
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
