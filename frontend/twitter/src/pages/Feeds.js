import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faHeart,
  faComment,
  faRetweet,
} from "@fortawesome/free-solid-svg-icons";
import "../App.css";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import moment from "moment";

const Feeds = () => {
  const [showModal, setShowModal] = useState(false);
  const [replyModal, setReplyModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState({
    preview: "",
    data: null,
  }); //initialize data as null
  const [content, setContent] = useState("");
  const [reply, setReply] = useState("");
  const [tweets, setTweets] = useState([]);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTweetId, setCurrentTweetId] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleTweetClick = () => {
    setShowModal(true);
  };

  const handleCommentClick = (tweetId) => {
    setReplyModal(true);
    setCurrentTweetId(tweetId);
  };

  const handleCloseReplyModal = () => {
    setReplyModal(false);
    setCurrentTweetId(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedImage({ preview: "", data: null }); //reset selectedImage
  };

  const handleImageChange = (e) => {
    if (e.target.files.length > 0 && e.target.files[0]) {
      const img = {
        preview: URL.createObjectURL(e.target.files[0]),
        data: e.target.files[0],
      };
      setSelectedImage(img);
    } else {
      console.error("No image selected or invalid file");
    }
  };

  //handling tweet post
  const handleTweetPost = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("content", content);
    if (selectedImage.data) {
      formData.append("image", selectedImage.data);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.post("/api/tweet", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(response.data);
      const createdTweet = response.data.tweet;

      //update the state to include the new tweet
      setTweets((prevTweets) => [createdTweet, ...prevTweets]);
      toast.success("Tweet posted successfully!");
      setContent("");
      setSelectedImage({ preview: "", data: null });
      setError(null);
    } catch (error) {
      console.error("Error posting tweet:", error);
      toast.error("Error posting tweet");
      setError(error.response?.data?.error || error.message);
    }

    handleCloseModal();
  };

  //handling reply post
  const handleReplyPost = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.post(
        `/api/tweet/${currentTweetId}/reply`,
        { content: reply },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const createdReply = response.data.reply;

      //update the state to include the new reply
      setTweets((prevTweets) =>
        prevTweets.map((tweet) =>
          tweet._id === currentTweetId
            ? { ...tweet, replies: [createdReply, ...tweet.replies] }
            : tweet
        )
      );

      toast.success("Comment posted successfully");
      setReply("");
      setError(null);
    } catch (error) {
      console.error("Error posting comment", error);
      setError(error.response?.data?.error || error.message);
    }

    handleCloseReplyModal();
  };

  //handle like button
  const handleLike = async (tweetId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.post(
        `/api/tweet/${tweetId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const updatedTweet = response.data.tweet;

        //update the tweets state to reflect the new state of the disliked tweet
        setTweets((prevTweets) =>
          prevTweets.map((tweet) =>
            tweet._id === updatedTweet._id ? updatedTweet : tweet
          )
        );

        console.log(response.data.message);
      } else if (response.status === 400) {
        console.error("You have already liked this tweet");
      }
    } catch (error) {
      console.error("Error liking tweet", error);
      setError(error.response?.data?.error || error.message);
    }
  };

  //handle retweet button
  const handleRetweet = async (tweetId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.post(
        `/api/tweet/${tweetId}/retweet`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const updatedTweet = response.data.tweet;
        console.log(updatedTweet);

        setTweets((prevTweets) =>
          prevTweets.map((tweet) =>
            tweet._id === updatedTweet._id ? updatedTweet : tweet
          )
        );

        toast.success("Retweet successful");
      } else {
        toast.warning("You have already retweeted this tweet");
      }
    } catch (error) {
      console.error("Error retweeting tweet", error);
      toast.error("Failed to retweet");
    }
  };

  //fetching tweets
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("/api/tweet/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          console.log("Tweets", response.data);
          setTweets(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching tweets:", error);
          setError("Error fetching tweets. Please try again later.");
          setLoading(false);
        });
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  //fetch current user
  const fetchCurrentUser = (token) => {
    try {
      const decodedToken = jwtDecode(token); //decode the token
      console.log("id", decodedToken._id);
      setCurrentUser(decodedToken);
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  };

  //handle tweet deletion
  const handleDelete = async (
    tweetId,
    isReply = false,
    parentTweetId = null
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      await axios.delete(`/api/tweet/${tweetId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTweets((prevTweets) =>
        prevTweets.filter((tweet) => tweet._id !== tweetId)
      );
      toast.success("Tweet deleted successfully");
    } catch (error) {
      console.error("Error deleting tweet:", error);
      toast.error("Failed to delete tweet");
    }
  };

  //loading component
  if (loading) {
    return (
      <div
        className="spinner-border text-primary"
        role="status"
        style={{ display: "flex", margin: "16rem" }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <div className="col-8 tweetsCol">
        <div
          className="d-flex mt-2"
          style={{ justifyContent: "space-between", marginBottom: "0.7vh" }}
        >
          <h6 className="outfit-logReg">Home</h6>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleTweetClick}
          >
            Tweet
          </button>
        </div>

        {tweets &&
          tweets.map((tweet) => (
            <div
              key={tweet._id}
              className="btn"
              style={{ textAlign: "left", width: "100%" }}
            >
              {tweet.retweetBy?.length > 0 && (
                <div
                  className="d-flex"
                  style={{ color: "gray", marginLeft: "3rem" }}
                >
                  <FontAwesomeIcon
                    icon={faRetweet}
                    size="lg"
                    style={{ color: "gray", marginTop: "0.7vh" }}
                  />
                  &nbsp;
                  <p>retweeted by @{tweet.retweetBy[0]?.username}</p>
                </div>
              )}

              <div className="tweet d-flex" style={{ marginLeft: "1rem" }}>
                <Link
                  className="allLinks"
                  to={
                    tweet.tweetedBy._id === currentUser._id
                      ? "/myprofile"
                      : `/profile/${tweet.tweetedBy._id}`
                  }
                >
                  <img
                    className="defaultPic"
                    src={
                      tweet.tweetedBy?.profilePicture ||
                      "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?w=740&t=st=1719090033~exp=1719090633~hmac=dad49d15036e35502847523028cb75410160ad36dad78a058e1f55ce43ed9525"
                    }
                    alt="profile"
                  />
                  <b className="mt-2" style={{ marginLeft: "1vw" }}>
                    @{tweet.tweetedBy?.username}
                  </b>
                </Link>{" "}
                &nbsp;&nbsp;
                <p style={{ marginTop: "1.3vh", color: "gray" }}>
                  {moment(tweet.created).format("MMMM Do YYYY, h:mm a")}
                </p>
                {currentUser && tweet.tweetedBy?._id === currentUser._id && (
                  <FontAwesomeIcon
                    className="btn mt-2 ml-auto"
                    icon={faTrash}
                    size="sm"
                    onClick={() => handleDelete(tweet._id)}
                    style={{ color: "#000000", marginLeft: "auto" }}
                  />
                )}
              </div>

              <Link
                to={`/tweet/${tweet._id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="tweetContent"
                  style={{ marginLeft: "5rem", color: "black" }}
                >
                  <p>{tweet.content}</p>
                  {tweet.image && (
                    <>
                      <img
                        className="tweetImg img-fluid"
                        src={tweet.image}
                        alt="tweet"
                      />
                    </>
                  )}
                </div>
              </Link>

              <div
                className="icons mt-2 d-flex"
                style={{ gap: "2vw", marginLeft: "5rem" }}
              >
                <div className="icons mt-2 d-flex">
                  <FontAwesomeIcon
                    type="button"
                    className={`btn likedBtn ${
                      tweet.likes?.includes(currentUser._id) ? "liked" : ""
                    }`}
                    icon={faHeart}
                    size="lg"
                    onClick={() => handleLike(tweet._id)}
                  />
                  {tweet.likes?.length}
                </div>
                <div className="icons mt-2 d-flex">
                  {currentUser && (
                    <FontAwesomeIcon
                      className="btn"
                      icon={faComment}
                      size="lg"
                      onClick={() => handleCommentClick(tweet._id)}
                      style={{ color: "#000000" }}
                    />
                  )}
                  {tweet.replies?.length}
                </div>
                <div className="icons mt-2 d-flex">
                  <FontAwesomeIcon
                    className="btn"
                    icon={faRetweet}
                    size="lg"
                    onClick={() => handleRetweet(tweet._id)}
                    style={{ color: "#000000" }}
                  />
                  {tweet.retweetBy?.length}
                </div>
              </div>

              {/* Render replies if available */}
              {tweet.replies?.length > 0 &&
                tweet.replies.map((reply) => (
                  <div
                    key={reply._id}
                    className="replies btn"
                    style={{ textAlign: "left", width: "100%" }}
                  >
                    <div className="d-flex" style={{ marginLeft: "4rem" }}>
                      <Link
                        className="allLinks"
                        to={
                          tweet.tweetedBy._id === currentUser._id
                            ? "/myprofile"
                            : `/profile/${tweet.tweetedBy._id}`
                        }
                      >
                        <img
                          className="defaultPic"
                          src={
                            reply.tweetedBy?.profilePicture ||
                            "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?w=740&t=st=1719090033~exp=1719090633~hmac=dad49d15036e35502847523028cb75410160ad36dad78a058e1f55ce43ed9525"
                          }
                          alt="profile"
                          style={{ marginRight: "1vw" }}
                        />
                        <b className="mt-2">@{reply.tweetedBy?.username}</b>
                      </Link>{" "}
                      &nbsp;&nbsp;
                      <p style={{ marginTop: "1.3vh", color: "gray" }}>
                        {moment(reply.created).format("MMMM Do YYYY, h:mm a")}
                      </p>
                      {currentUser &&
                        reply.tweetedBy._id === currentUser._id && (
                          <FontAwesomeIcon
                            className="btn mt-2 ml-auto"
                            icon={faTrash}
                            size="sm"
                            onClick={() => handleDelete(reply._id)}
                            style={{ color: "#000000", marginLeft: "auto" }}
                          />
                        )}
                    </div>
                    <div
                      className="tweetContent"
                      style={{ marginLeft: "8rem" }}
                    >
                      <p>{reply.content}</p>

                      <div className="icons mt-2 d-flex" style={{ gap: "1vw" }}>
                        <div className="icons mt-2 d-flex">
                          <FontAwesomeIcon
                            type="button"
                            className={`btn likedBtn ${
                              reply.likes?.includes(currentUser._id)
                                ? "liked"
                                : ""
                            }`}
                            icon={faHeart}
                            size="lg"
                            onClick={() => handleLike(reply._id)}
                          />
                          {reply.likes?.length}
                        </div>

                        <div className="icons mt-2 d-flex">
                          {currentUser && (
                            <FontAwesomeIcon
                              className="btn"
                              icon={faComment}
                              size="lg"
                              onClick={() => handleCommentClick(reply._id)}
                              style={{ color: "#000000" }}
                            />
                          )}
                          {reply.replies.length}
                        </div>
                        <div className="icons mt-2 d-flex">
                          <FontAwesomeIcon
                            className="btn"
                            icon={faRetweet}
                            size="lg"
                            onClick={() => handleRetweet(reply._id)}
                            style={{ color: "#000000" }}
                          />
                          {reply.retweetBy.length}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              <hr></hr>
            </div>
          ))}
      </div>

      {/* Modals */}

      {showModal && (
        <div
          className="modal"
          tabIndex="-1"
          style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title outfit-logReg">New Tweet</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{
                    width: "100%",
                    height: "20vh",
                    borderRadius: "10px",
                  }}
                />
                <br />
                <p>Upload Image</p>
                <input
                  type="file"
                  className="form-control mt-3"
                  accept=".jpg, .png, .jpeg, .gif"
                  onChange={handleImageChange}
                />
                {selectedImage.preview && (
                  <img
                    src={selectedImage.preview}
                    className="img-fluid mt-3"
                    alt="upload"
                  ></img>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleTweetPost}
                >
                  Tweet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {replyModal && (
        <div
          className="modal"
          tabIndex="-1"
          style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title outfit-logReg">Reply</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseReplyModal}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  style={{
                    width: "100%",
                    height: "20vh",
                    borderRadius: "10px",
                  }}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseReplyModal}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleReplyPost}
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}
    </>
  );
};

export default Feeds;
