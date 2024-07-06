import React from "react";
import HomePage from "./HomePage";
import Profile from "./Profile";

const RenderProfile = () => {
  return (
    <div>
      <div className="home">
        <div className="tweets">
          <div
            className="row"
            style={{
              width: "60%",
              backgroundColor: "white",
              boxShadow: "2px 2px 4px gray",
            }}
          >
            <HomePage />
            <Profile />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenderProfile;
