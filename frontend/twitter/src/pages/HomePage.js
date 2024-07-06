import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faHouse,
  faUser,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import "../App.css";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const HomePage = () => {
  const [user, setUser] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  //fetch user
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("Token not found");
        return;
      }

      try {
        const decodedToken = jwtDecode(token); //decode the token
        const userId = decodedToken._id; //extract the user ID from the token

        const response = await axios.get(`/api/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user details", error);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="col-4 sidebar">
      <div className="sideNavs">
        <Link to="/feeds">
          <FontAwesomeIcon
            className="mb-4 mt-2"
            icon={faMessage}
            size="lg"
            style={{ color: "#74C0FC" }}
          />
        </Link>
        <Link to="/feeds" className="d-flex gap-2 sidebarLink">
          <FontAwesomeIcon
            className="mb-2"
            icon={faHouse}
            size="lg"
            style={{ color: "#000000" }}
          />
          <h6 style={{ textDecoration: "none" }}>Home</h6>
        </Link>
        <Link to="/myprofile" className="d-flex gap-2 sidebarLink">
          <FontAwesomeIcon
            icon={faUser}
            size="lg"
            style={{ color: "#000000" }}
          />
          <h6>Profile</h6>
        </Link>
        <Link
          to="/login"
          onClick={handleLogout}
          className="d-flex gap-2 sidebarLink"
        >
          <FontAwesomeIcon
            icon={faRightFromBracket}
            size="lg"
            style={{ color: "#000000" }}
          />
          <h6>Logout</h6>
        </Link>
      </div>
      <Link to="/myprofile" className="d-flex sidebarLink mb-2">
        {user.profilePicture ? (
          <img
            className="defaultPic"
            src={`http://localhost:3000/${user.profilePicture}`}
            alt="profile"
          ></img>
        ) : (
          <img
            className="defaultPic"
            src="https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?w=740&t=st=1719090033~exp=1719090633~hmac=dad49d15036e35502847523028cb75410160ad36dad78a058e1f55ce43ed9525"
            alt="profile"
          />
        )}

        <div
          className="username"
          style={{ marginTop: "3px", marginLeft: "6px" }}
        >
          <b>{user.name}</b> <br />@{user.username}
        </div>
      </Link>
    </div>
  );
};

export default HomePage;
