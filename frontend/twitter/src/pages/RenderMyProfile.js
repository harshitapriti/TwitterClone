import React from "react";
import HomePage from "./HomePage";
import MyProfile from "./MyProfile";

const RenderMyProfile = () => {
  return (
    <>
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
            <MyProfile />
          </div>
        </div>
      </div>
    </>
  );
};

export default RenderMyProfile;
