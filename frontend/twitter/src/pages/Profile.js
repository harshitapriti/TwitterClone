import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCake as faCakeCandles,
  faLocationDot,
  faCalendar,
  faTrash,
  faHeart,
  faComment,
  faRetweet,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useParams } from "react-router-dom";
import "../App.css";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import moment from "moment";
import { jwtDecode } from "jwt-decode";

const Profile = () => {
  const [replyModal, setReplyModal] = useState(false);
  const [tUser, setTUser] = useState("");
  const [tweets, setTweets] = useState([]);
  const { userId } = useParams();
  const [isFollowing, setIsFollowing] = useState(false);
  const [reply, setReply] = useState("");
  const [currentTweetId, setCurrentTweetId] = useState(null);

  const loggedInUser = jwtDecode(localStorage.getItem("token"))._id;
  console.log("logged in user: ", loggedInUser);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found");
        return;
      }

      try {
        const response = await axios.get(`/api/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("User Data:", response.data);
        setTUser(response.data);

        //checking if logged user is in the followers list
        const loggedUser = jwtDecode(token)._id;
        setIsFollowing(
          response.data.followers.some(
            (follower) => follower._id === loggedUser
          )
        );
      } catch (error) {
        console.error("Error fetching user details", error);
      }
    };

    fetchUser();
  }, [userId]); //added userId as dependency

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found");
        }

        const response = await axios.get(`/api/user/${userId}/tweets`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Tweets", response.data);
        setTweets(response.data);
      } catch (error) {
        console.error("Error fetching tweets:", error);
      }
    };

    fetchTweets();
  }, [userId]);

  //handle follow button
  const handleFollow = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.post(
        `/api/user/${userId}/follow`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Follow status:", response.data);
      if (response.status === 200) {
        toast.success("Followed");
        setTUser(response.data.userToFollow);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  //handle unfollow button
  const handleUnfollow = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.post(
        `/api/user/${userId}/unfollow`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Unfollow status:", response.data);
      if (response.status === 200) {
        toast.success("Unfollowed");
        setTUser(response.data.userToUnfollow);
        setIsFollowing(false);
      }
    } catch (error) {
      console.error("Unfollow error:", error);
    }
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
    }
  };

  const handleCommentClick = (tweetId) => {
    setReplyModal(true);
    setCurrentTweetId(tweetId);
  };

  const handleCloseReplyModal = () => {
    setReplyModal(false);
  };

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

      //updating the state to include the new reply
      setTweets((prevTweets) =>
        prevTweets.map((tweet) =>
          tweet._id === currentTweetId
            ? { ...tweet, replies: [createdReply, ...tweet.replies] }
            : tweet
        )
      );

      toast.success("Comment posted successfully");
      setReply("");
    } catch (error) {
      console.error("Error posting comment", error);
    }

    handleCloseReplyModal();
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

  return (
    <>
      <div className="col-8 tweetsCol">
        <div className="mt-2">
          <h6 className="outfit-logReg">Profile</h6>
        </div>
        <div style={{ width: "100%", height: "40vh", position: "relative" }}>
          <div style={{ backgroundColor: "#00b4d8", height: "20vh" }}></div>

          {tUser.profilePicture ? (
            <img
              className="profileImg"
              src={`http://localhost:3000/${tUser.profilePicture}`}
              alt="profile"
            />
          ) : (
            <img
              className="profileImg"
              src="https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?w=740&t=st=1719090033~exp=1719090633~hmac=dad49d15036e35502847523028cb75410160ad36dad78a058e1f55ce43ed9525"
              alt="profile"
            />
          )}
          {isFollowing ? (
            <button
              type="submit"
              onClick={handleUnfollow}
              className="btn btn-dark followBtn"
            >
              Unfollow
            </button>
          ) : (
            <button
              type="submit"
              onClick={handleFollow}
              className="btn btn-dark followBtn"
            >
              Follow
            </button>
          )}
          <div className="profileInfo">
            <p className="profileName" style={{ marginBottom: "0px" }}>
              {tUser.name}
            </p>
            <p className="username mt-0" style={{ color: "gray" }}>
              @{tUser.username}
            </p>
            <div
              className="d-flex"
              style={{ flexDirection: "row", gap: "2rem" }}
            >
              <div className="d-flex gap-2">
                <FontAwesomeIcon
                  icon={faCakeCandles}
                  style={{ color: "#000000", marginTop: "4px" }}
                />
                <p style={{ color: "gray" }}>
                  {moment(tUser.dob).format("MMMM Do, YYYY")}
                </p>
              </div>
              <div className="d-flex gap-2">
                <FontAwesomeIcon
                  icon={faLocationDot}
                  style={{ color: "#000000", marginTop: "4px" }}
                />
                <p style={{ color: "gray" }}>{tUser.location}</p>
              </div>
            </div>
            <div className="d-flex gap-2">
              <FontAwesomeIcon
                icon={faCalendar}
                style={{ color: "#000000", marginTop: "4px" }}
              />
              <p style={{ color: "gray" }}>Joined on June 23, 2024</p>
            </div>
            <div className="d-flex follow mt-2" style={{ gap: "1rem" }}>
              <p style={{ fontWeight: "bold" }}>
                {tUser.following?.length} Following
              </p>
              <p style={{ fontWeight: "bold" }}>
                {tUser.followers?.length} Followers
              </p>
            </div>
          </div>
          <hr></hr>
          <div className="mt-2">
            <h6
              className="outfit-logReg"
              style={{ display: "flex", justifyContent: "center" }}
            >
              Tweets & Replies
            </h6>
          </div>

          {tweets &&
            tweets.map((tweet) => (
              <div
                key={tweet._id}
                className="tweet"
                style={{ marginTop: "2rem" }}
              >
                <div
                  className="d-flex mt-4"
                  style={{ color: "gray", marginLeft: "3rem" }}
                >
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
                <div className="d-flex">
                  <Link
                    to={`/profile/${tweet.tweetedBy?._id}`}
                    className="allLinks"
                  >
                    <img
                      className="defaultPic"
                      src={
                        `http://localhost:3000/${tweet.tweetedBy?.profilePicture}` ||
                        "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?w=740&t=st=1719090033~exp=1719090633~hmac=dad49d15036e35502847523028cb75410160ad36dad78a058e1f55ce43ed9525"
                      }
                      alt="profile"
                    />
                    <b className="mt-2" style={{ marginLeft: "1vw" }}>
                      @{tweet.tweetedBy?.username}
                    </b>
                  </Link>
                  <p
                    style={{
                      marginTop: "1.5vh",
                      marginLeft: "1vw",
                      color: "gray",
                    }}
                  >
                    {moment(tweet.created).format("MMMM Do YYYY, h:mm a")}
                  </p>
                  <FontAwesomeIcon
                    className="btn mt-2 ml-auto"
                    icon={faTrash}
                    size="sm"
                    style={{ color: "#000000", marginLeft: "auto" }}
                  />
                </div>
                <Link
                  to={`/tweet/${tweet._id}`}
                  style={{ textDecoration: "none", color: "#000000" }}
                >
                  <div className="tweetContent" style={{ marginLeft: "3rem" }}>
                    <p>{tweet.content}</p>
                  </div>
                  <div style={{ marginLeft: "3rem" }}>
                    {tweet.image && (
                      <img
                        className="tweetImg img-fluid"
                        src={`http://localhost:3000/${tweet.image}`}
                        alt="tweet"
                      />
                    )}
                  </div>
                </Link>
                <div
                  className="icons mt-2 d-flex"
                  style={{ gap: "2vw", marginLeft: "3rem" }}
                >
                  <div className="icons mt-2 d-flex">
                    <FontAwesomeIcon
                      className={`btn likedBtn ${
                        tweet.likes?.includes(userId) ? "liked" : ""
                      }`}
                      icon={faHeart}
                      size="lg"
                      onClick={() => handleLike(tweet._id)}
                    />
                    {tweet.likes?.length}
                  </div>
                  <div className="icons mt-2 d-flex">
                    <FontAwesomeIcon
                      onClick={() => handleCommentClick(tweet._id)}
                      className="btn"
                      icon={faComment}
                      size="lg"
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

                {tweet.replies?.length > 0 &&
                  tweet.replies.map((reply) => (
                    <div
                      key={reply._id}
                      className="replies"
                      style={{ marginTop: "2rem", marginLeft: "3rem" }}
                    >
                      <div className="d-flex">
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
                          />
                          <b className="mt-2" style={{ marginLeft: "1vw" }}>
                            @{reply.tweetedBy?.username}
                          </b>
                        </Link>
                        <p
                          style={{
                            marginTop: "1.5vh",
                            marginLeft: "1vw",
                            color: "gray",
                          }}
                        >
                          {moment(reply.created).format("MMMM Do YYYY, h:mm a")}
                        </p>
                        <FontAwesomeIcon
                          className="btn mt-2 ml-auto"
                          icon={faTrash}
                          size="sm"
                          style={{ color: "#000000", marginLeft: "auto" }}
                        />
                      </div>
                      <div
                        className="tweetContent"
                        style={{ marginLeft: "5rem" }}
                      >
                        <p>{reply.content}</p>
                      </div>
                      <div
                        className="icons mt-2 d-flex"
                        style={{ gap: "1vw", marginLeft: "3rem" }}
                      >
                        <div className="icons mt-2 d-flex">
                          <FontAwesomeIcon
                            className={`btn likedBtn ${
                              reply.likes?.includes(userId) ? "liked" : ""
                            }`}
                            icon={faHeart}
                            size="lg"
                            onClick={() => handleLike(reply._id)}
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
                  ))}
                <hr></hr>
              </div>
            ))}
        </div>
      </div>

      {/* Comment Modal */}
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
    </>
  );
};

export default Profile;
