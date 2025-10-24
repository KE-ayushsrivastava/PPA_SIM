// src/pages/Login.jsx
import React, { useState, useContext } from "react";
import {
  TextField,
  Button,
  Snackbar,
  Alert,
  Box,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../assets/css/Login.css";
import logo from "../assets/img/ke-full-logo.svg";
import { AuthContext } from "../contexts/AuthContext";

const Login = () => {
  // global auth
  const { setUser, fetchMe } = useContext(AuthContext);

  // local state for inputs
  const [mode, setMode] = useState("signin"); // "signin" or "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // sign-up fields
  const [suUsername, setSuUsername] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");

  const navigate = useNavigate();

  // helper to show error
  function showError(msg) {
    setErrorMsg(msg || "Something went wrong");
    setErrorOpen(true);
  }

  // Sign In handler
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showError("Please enter email/username and password");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include", // important for httpOnly cookie
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.msg || "Invalid credentials. Please try again!");
      } else {
        // ✅ CSRF token store from response header
        const csrfToken = res.headers.get("X-CSRF-Token");
        if (csrfToken) {
          localStorage.setItem("csrfToken", csrfToken);
        }

        // update global user state
        if (setUser) setUser(data);

        // ensure /api/auth/me sync (optional)
        if (fetchMe) await fetchMe();

        // navigate to main page
        navigate("/main");
      }
    } catch (err) {
      console.error("login error", err);
      showError("Network error. Please try again.");
    }
  };

  // Sign Up handler (no auto-login per your choice)
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!suUsername || !suEmail || !suPassword) {
      showError("Please fill all required fields for signup");
      return;
    }
    if (suPassword !== suConfirm) {
      showError("Passwords do not match");
      return;
    }
    if (suPassword.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: suUsername.trim(),
          email: suEmail.trim(),
          password: suPassword,
        }),
      });

      const data = await res.json();
      if (res.status === 201) {
        // registration success — switch to signin and prefill email
        setMode("signin");
        setEmail(suEmail.trim());
        // clear signup
        setSuUsername("");
        setSuEmail("");
        setSuPassword("");
        setSuConfirm("");
      } else {
        showError(data.msg || "Registration failed");
      }
    } catch (err) {
      console.error("signup error", err);
      showError("Network error. Please try again.");
    }
  };

  return (
    <Box className="loginPage">
      <Box className="inFormBackground">
        {/* background circles */}
        <div className="circle"></div>
        <div className="circle"></div>

        {/* login card */}
        <Box className="inLoginForm">
          {mode === "signin" ? (
            <form onSubmit={handleLogin}>
              {/* logo */}
              <div className="logoWrapper">
                <img src={logo} alt="App Logo" className="logoImg" />
              </div>

              {/* title */}
              <div className="title">
                <Typography variant="h5" fontWeight={500}>
                  Welcome Back
                </Typography>
              </div>

              {/* email input */}
              <div className="inputGroup">
                <label htmlFor="email">Email or Username</label>
                <TextField
                  id="email"
                  placeholder="Enter Email or Username"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    style: {
                      color: "#fff",
                      backgroundColor: "rgba(255,255,255,0.07)",
                      borderRadius: "3px",
                    },
                  }}
                />
              </div>

              {/* password input */}
              <div className="inputGroup">
                <label htmlFor="password">Password</label>
                <TextField
                  id="password"
                  placeholder="Enter Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    style: {
                      color: "#fff",
                      backgroundColor: "rgba(255,255,255,0.07)",
                      borderRadius: "3px",
                    },
                  }}
                />
              </div>

              {/* submit button */}
              <Button type="submit" className="submitForm">
                <span>Let me in</span>
              </Button>

              {/* switch to signup */}
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "#fff" }}>
                  New here?{" "}
                  <Button
                    variant="text"
                    onClick={() => {
                      setMode("signup");
                      setErrorOpen(false);
                    }}
                    sx={{ color: "#fff", textTransform: "none" }}
                  >
                    Create account
                  </Button>
                </Typography>
              </Box>
            </form>
          ) : (
            /* Signup form */
            <form onSubmit={handleSignup}>
              <div className="logoWrapper">
                <img src={logo} alt="App Logo" className="logoImg" />
              </div>

              <div className="title">
                <Typography variant="h5" fontWeight={500}>
                  Create account
                </Typography>
              </div>

              <div className="inputGroup">
                <label htmlFor="suUsername">Username</label>
                <TextField
                  id="suUsername"
                  placeholder="Choose a username"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={suUsername}
                  onChange={(e) => setSuUsername(e.target.value)}
                  InputProps={{
                    style: {
                      color: "#fff",
                      backgroundColor: "rgba(255,255,255,0.07)",
                      borderRadius: "3px",
                    },
                  }}
                />
              </div>

              <div className="inputGroup">
                <label htmlFor="suEmail">Email</label>
                <TextField
                  id="suEmail"
                  placeholder="Enter Email"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={suEmail}
                  onChange={(e) => setSuEmail(e.target.value)}
                  InputProps={{
                    style: {
                      color: "#fff",
                      backgroundColor: "rgba(255,255,255,0.07)",
                      borderRadius: "3px",
                    },
                  }}
                />
              </div>

              <div className="inputGroup">
                <label htmlFor="suPassword">Password</label>
                <TextField
                  id="suPassword"
                  placeholder="Enter Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={suPassword}
                  onChange={(e) => setSuPassword(e.target.value)}
                  InputProps={{
                    style: {
                      color: "#fff",
                      backgroundColor: "rgba(255,255,255,0.07)",
                      borderRadius: "3px",
                    },
                  }}
                />
              </div>

              <div className="inputGroup">
                <label htmlFor="suConfirm">Confirm Password</label>
                <TextField
                  id="suConfirm"
                  placeholder="Confirm Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={suConfirm}
                  onChange={(e) => setSuConfirm(e.target.value)}
                  InputProps={{
                    style: {
                      color: "#fff",
                      backgroundColor: "rgba(255,255,255,0.07)",
                      borderRadius: "3px",
                    },
                  }}
                />
              </div>

              <Button type="submit" className="submitForm">
                <span>Create account</span>
              </Button>

              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "#fff" }}>
                  Already registered?{" "}
                  <Button
                    variant="text"
                    onClick={() => {
                      setMode("signin");
                      setErrorOpen(false);
                    }}
                    sx={{ color: "#fff", textTransform: "none" }}
                  >
                    Sign in
                  </Button>
                </Typography>
              </Box>
            </form>
          )}
        </Box>

        {/* Error Snackbar */}
        <Snackbar
          open={errorOpen}
          autoHideDuration={3000}
          onClose={() => setErrorOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            severity="error"
            variant="filled"
            onClose={() => setErrorOpen(false)}
            sx={{ width: "100%" }}
          >
            {errorMsg}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Login;
