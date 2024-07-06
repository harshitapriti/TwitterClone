import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("/api/auth/login", { email, password });

      //checking if response and response.data are defined
      if (response && response.data) {
        const { token, user } = response.data.result;

        //storing token and user in local storage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        //navigating to the feeds page
        navigate("/feeds");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
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
            <h4 className="outfit-logReg mb-3">Login</h4>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input
                  type="email"
                  className="form-control"
                  id="exampleInputEmail1"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby="emailHelp"
                />
              </div>
              <div className="mb-3">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="exampleInputPassword1"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  "Login"
                )}
              </button>
              {error && <p className="text-danger">{error}</p>}
              <hr></hr>
              <p>
                Don't have an account?{" "}
                <Link className="links" to="/register">
                  Register
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
