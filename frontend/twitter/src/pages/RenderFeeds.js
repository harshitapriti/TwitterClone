import React from "react";
import Feeds from "./Feeds";
import HomePage from "./HomePage";

const RenderFeeds = () => {
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
            <Feeds />
          </div>
        </div>
      </div>
    </>
  );
};

export default RenderFeeds;
