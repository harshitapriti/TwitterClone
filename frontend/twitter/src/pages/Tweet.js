import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faHeart,
  faComment,
  faRetweet,
} from "@fortawesome/free-solid-svg-icons";
import "../App.css";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import moment from "moment";
import { jwtDecode } from "jwt-decode";

const Tweet = () => {
  const [replyModal, setReplyModal] = useState(false);
  const [tweet, setTweet] = useState(null); // Initialize as null
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { tweetId } = useParams(); // Extract tweet ID from the URL

  const loggedInUser = jwtDecode(localStorage.getItem("token"))._id;
  console.log("logged in user: ", loggedInUser);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found");
      return;
    }

    const fetchTweet = async () => {
      setLoading(true);
      console.log("tweet id from url: ", tweetId);
      try {
        const response = await axios.get(`/api/tweet/${tweetId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(response.data.tweet);
        setTweet(response.data.tweet);
      } catch (error) {
        console.error("Error fetching tweet:", error);
        setError("Error fetching tweet. Please try again later.");
      }
      setLoading(false);
    };

    fetchTweet();
  }, [tweetId]);

  const handleCommentClick = (tweetId) => {
    setReplyModal(true);
  };

  const handleCloseReplyModal = () => {
    setReplyModal(false);
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
        `/api/tweet/${tweetId}/reply`,
        { content: reply },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const createdReply = response.data.reply;

      //updating the state to include the new reply
      setTweet((prevTweet) => ({
        ...prevTweet,
        replies: [createdReply, ...prevTweet.replies],
      }));

      toast.success("Comment posted successfully");
      setReply("");
      setError(null);
    } catch (error) {
      console.error("Error posting comment", error);
      setError(error.response?.data?.error || error.message);
    }

    handleCloseReplyModal();
  };

  //handling delete button
  const handleDelete = async (id, isReply = false, parentTweetId = null) => {
    try {
      console.log(id);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      await axios.delete(`/api/tweet/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (isReply) {
        setTweet((prevTweet) => ({
          ...prevTweet,
          replies: prevTweet.replies.filter((reply) => reply._id !== id),
        }));
      }
      toast.success("Deleted successfully");
      console.log("Deleted successfully");
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  //handling like button
  const handleLike = async (id, isReply = false) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.post(
        `/api/tweet/${id}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const updatedTweet = response.data.tweet;

        if (isReply) {
          setTweet((prevTweet) => ({
            ...prevTweet,
            replies: prevTweet.replies.map((reply) =>
              reply._id === updatedTweet._id ? updatedTweet : reply
            ),
          }));
        } else {
          setTweet((prevTweet) =>
            prevTweet._id === updatedTweet._id ? updatedTweet : prevTweet
          );
        }

        console.log(response.data.message);
      } else if (response.status === 400) {
        console.error("You have already liked this tweet");
      }
    } catch (error) {
      console.error("Error liking tweet", error);
    }
  };

  //handling retweet button
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

        setTweet((prevTweet) =>
          prevTweet._id === updatedTweet._id ? updatedTweet : prevTweet
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
  if (error) return <div>{error}</div>;

  return (
    <>
      {/* Tweets Section */}
      {tweet && (
        <div key={tweet._id} className="col-8 tweetsCol">
          <div
            className="d-flex mt-2"
            style={{ justifyContent: "space-between" }}
          >
            <h6 className="outfit-logReg">Tweet</h6>
          </div>
          <div className="d-flex" style={{ color: "gray", marginTop: "2vh" }}>
            {tweet.retweetBy?.length > 0 && (
              <>
                <FontAwesomeIcon
                  className="btn"
                  icon={faRetweet}
                  size="lg"
                  style={{ color: "gray" }}
                />
                <p>retweeted by @{tweet.retweetBy[0]?.username}</p>
              </>
            )}
          </div>
          <div className="tweet d-flex">
            <Link
              className="allLinks"
              to={
                tweet.tweetedBy._id === loggedInUser
                  ? "/myprofile"
                  : `/profile/${tweet.tweetedBy._id}`
              }
            >
              <img
                className="defaultPic"
                src={
                  `http://localhost:3000/${tweet.tweetedBy?.profilePicture}` ||
                  "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?w=740&t=st=1719090033~exp=1719090633~hmac=dad49d15036e35502847523028cb75410160ad36dad78a058e1f55ce43ed9525"
                }
                alt="profile"
              ></img>
              <b className="mt-2" style={{ marginLeft: "1vw" }}>
                @{tweet.tweetedBy?.username}
              </b>
            </Link>{" "}
            &nbsp;&nbsp;
            <p style={{ marginTop: "1.3vh", color: "gray" }}>
              {moment(tweet.created).format("MMMM Do YYYY, h:mm a")}
            </p>
            <FontAwesomeIcon
              className="btn mt-2 ml-auto"
              icon={faTrash}
              size="sm"
              onClick={() => handleDelete(tweet._id)}
              style={{ color: "#000000", marginLeft: "auto" }}
            />
          </div>
          <div className="tweetContent" style={{ marginLeft: "5rem" }}>
            <p>{tweet.content}</p>
          </div>
          {tweet.image && (
            <div style={{ marginLeft: "5rem" }}>
              <img
                className="tweetImg img-fluid"
                src={`http://localhost:3000/${tweet.image}`}
                alt="tweet"
              ></img>
            </div>
          )}
          <div
            className="icons mt-2 d-flex"
            style={{ gap: "2vw", marginLeft: "5rem" }}
          >
            <div className="icons mt-2 d-flex">
              <FontAwesomeIcon
                className="btn"
                icon={faHeart}
                size="lg"
                onClick={() => handleLike(tweet._id)}
                style={{
                  color: tweet.likes?.includes(loggedInUser)
                    ? "red"
                    : "#000000",
                }}
              />
              {tweet.likes?.length}
            </div>
            <div className="icons mt-2 d-flex">
              <FontAwesomeIcon
                className="btn"
                icon={faComment}
                size="lg"
                onClick={handleCommentClick}
                style={{ color: "#000000" }}
              />
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

          {/* Replies Section */}
          {tweet.replies?.length > 0 &&
            tweet.replies.map((reply) => (
              <div
                key={reply._id}
                className="replies btn"
                style={{ marginTop: "2rem", textAlign: "left", width: "100%" }}
              >
                <div className="d-flex" style={{ marginLeft: "4rem" }}>
                  <Link
                    className="allLinks"
                    to={
                      reply.tweetedBy._id === loggedInUser
                        ? "/myprofile"
                        : `/profile/${reply.tweetedBy._id}`
                    }
                  >
                    <img
                      className="defaultPic"
                      src={
                        `http://localhost:3000/${reply.tweetedBy?.profilePicture}` ||
                        "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?w=740&t=st=1719090033~exp=1719090633~hmac=dad49d15036e35502847523028cb75410160ad36dad78a058e1f55ce43ed9525"
                      }
                      alt="profile"
                    ></img>
                    <b className="mt-2" style={{ marginLeft: "1vw" }}>
                      @{reply.tweetedBy?.username}
                    </b>
                  </Link>{" "}
                  &nbsp;&nbsp;
                  <p style={{ marginTop: "1.3vh", color: "gray" }}>
                    {moment(reply.created).format("MMMM Do YYYY, h:mm a")}
                  </p>
                  <FontAwesomeIcon
                    className="btn mt-2 ml-auto"
                    icon={faTrash}
                    size="sm"
                    onClick={() => handleDelete(reply._id, true, tweet._id)}
                    style={{ color: "#000000", marginLeft: "auto" }}
                  />
                </div>
                <div className="tweetContent" style={{ marginLeft: "9rem" }}>
                  <p>{reply.content}</p>
                  <div className="icons mt-2 d-flex" style={{ gap: "1vw" }}>
                    <div className="icons mt-2 d-flex">
                      <FontAwesomeIcon
                        className={`btn likedBtn ${
                          reply.likes?.includes(loggedInUser) ? "liked" : ""
                        }`}
                        icon={faHeart}
                        size="lg"
                        onClick={() => handleLike(reply._id, true)}
                      />
                      {reply.likes?.length}
                    </div>
                    <div className="icons mt-2 d-flex">
                      <FontAwesomeIcon
                        onClick={() => handleCommentClick(reply._id)}
                        className="btn"
                        icon={faComment}
                        size="lg"
                        style={{ color: "#000000" }}
                      />
                      {reply.replies?.length}
                    </div>
                    <div className="icons mt-2 d-flex">
                      <FontAwesomeIcon
                        className="btn"
                        icon={faRetweet}
                        size="lg"
                        onClick={() => handleRetweet(reply._id)}
                        style={{ color: "#000000" }}
                      />
                      {reply.retweetBy?.length}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Comment Modal */}
      {replyModal && (
        <div
          className="modal"
          tabindex="-1"
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
    </>
  );
};

export default Tweet;
