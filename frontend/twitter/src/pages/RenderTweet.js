import React from "react";
import HomePage from "./HomePage";
import Tweet from "./Tweet";

const RenderTweet = () => {
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
            <Tweet />
          </div>
        </div>
      </div>
    </>
  );
};

export default RenderTweet;
