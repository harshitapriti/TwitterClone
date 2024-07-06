import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCakeCandles,
  faLocationDot,
  faCalendar,
  faTrash,
  faHeart,
  faComment,
  faRetweet,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import "../App.css";
import DatePicker from "react-datepicker";
import { toast } from "react-toastify";
import axios from "axios";
import moment from "moment";
import { jwtDecode } from "jwt-decode";

const MyProfile = () => {
  const [showModal, setShowModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState({
    preview: "",
    data: null,
  });
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [dob, setDob] = useState(null);
  const [replyModal, setReplyModal] = useState(false);
  const [tUser, setTUser] = useState("");
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTweetId, setCurrentTweetId] = useState(null);
  const [reply, setReply] = useState("");

  const token = localStorage.getItem("token");
  const decodedToken = jwtDecode(token); //decode the token
  const userId = decodedToken._id;

  //fetch user
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("Token not found");
        return;
      }

      try {
        const decodedToken = jwtDecode(token);
        const userId = decodedToken._id; //extracting the user ID from the token
        const response = await axios.get(`/api/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("tUser: ", response.data);
        setTUser(response.data);
      } catch (error) {
        console.error("Error fetching user details", error);
      }
    };

    fetchUser();
  }, []);

  const handleCommentClick = (tweetId) => {
    setReplyModal(true);
    setCurrentTweetId(tweetId);
  };

  const handleCloseReplyModal = () => {
    setReplyModal(false);
  };

  const handleEditClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  //for editing INFO
  const handleEditInfo = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const decodedToken = jwtDecode(token);
      const userId = decodedToken._id;
      console.log("User Id: ", userId);

      const response = await axios.put(
        `/api/user/${userId}`,
        { name, location, dob },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const editedInfo = response.data.user;
      console.log("info: ", editedInfo);
      setTUser(editedInfo);
      setName("");
      setLocation("");
      setDob("");
      toast.success("Profile updated successfully!");
      setShowModal(false); //close the modal after successful edit
    } catch (error) {
      console.error("Error updating info", error);
      toast.error("Error updating profile information");
    }
    handleCloseModal();
  };

  const handleUploadPhotoClick = () => {
    setShowPhotoModal(true);
  };

  const handleClosePhotoModal = () => {
    setShowPhotoModal(false);
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

  //handle image upload
  const handleImageUpload = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    if (selectedImage.data) {
      formData.append("profilePicture", selectedImage.data);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      const decodedToken = jwtDecode(token);
      const userId = decodedToken._id;

      const response = await axios.post(
        `/api/user/${userId}/uploadProfilePic`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("response", response.data);
      console.log("image path", response.data.imagePath);
      setTUser((prevUser) => ({
        ...prevUser,
        profilePicture: response.data.imagePath,
      }));
      toast.success("Profile picture uploaded successfully!");
      setSelectedImage(null);
      setShowPhotoModal(false);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error("Error uploading profile picture");
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

        //updating the tweets state to reflect the new state of the disliked tweet
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

  //getting user's tweets
  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found");
        }
        const decodedToken = jwtDecode(token);
        const userId = decodedToken._id;

        const response = await axios.get(`/api/user/${userId}/tweets`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Tweets", response.data);
        setTweets(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tweets:", error);
      }
    };
    fetchTweets();
  }, []);

  //handling tweet deletion
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
        <div className="mt-2">
          <h6 className="outfit-logReg">My Profile</h6>
        </div>
        <div style={{ width: "100%", height: "40vh", position: "relative" }}>
          <div style={{ backgroundColor: "#00b4d8", height: "20vh" }}></div>

          {/* Profile info */}
          {tUser.profilePicture ? (
            <img
              className="profileImg"
              src={tUser.profilePicture}
              alt="profile"
            />
          ) : (
            <img
              className="profileImg"
              src="https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?w=740&t=st=1719090033~exp=1719090633~hmac=dad49d15036e35502847523028cb75410160ad36dad78a058e1f55ce43ed9525"
              alt="profile"
            />
          )}
          <button
            type="button"
            className="btn btn-outline-primary mt-2"
            onClick={handleUploadPhotoClick}
            style={{ marginLeft: "58%", marginRight: "0.5vw" }}
          >
            Upload Profile Photo
          </button>
          <button
            type="button"
            className="btn btn-outline-dark mt-2"
            onClick={handleEditClick}
          >
            Edit
          </button>

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
              <p style={{ color: "gray" }}>
                {moment(tUser.created).format("MMMM Do, YYYY")}
              </p>
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
          <hr />

          <div className="mt-2">
            <h6
              className="outfit-logReg"
              style={{ display: "flex", justifyContent: "center" }}
            >
              Tweets & Replies
            </h6>
          </div>

          {/* tweets section */}
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
                  {tweet.retweetBy.length > 0 && (
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
                  <Link to="/myprofile" className="allLinks">
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
                    onClick={() => handleDelete(tweet._id)}
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
                        src={tweet.image}
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

                {/* replies section */}
                {tweet.replies.length > 0 &&
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
                            reply.tweetedBy._id === userId
                              ? "/myprofile"
                              : `/profile/${reply.tweetedBy._id}`
                          }
                        >
                          <img
                            className="defaultPic"
                            src={
                              reply.tweetedBy?.profilePicture ||
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
                          onClick={() => handleDelete(reply._id)}
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
                          {reply.retweetBy.length}
                        </div>
                      </div>
                    </div>
                  ))}
                <hr></hr>
              </div>
            ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showModal && (
        <div
          className="modal"
          tabIndex="-1"
          style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title outfit-logReg">Edit Profile</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <form style={{ width: "100%" }}>
                  <div className="mb-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-control"
                      placeholder="Name"
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="form-control"
                      placeholder="Location"
                    />
                  </div>
                  <div className="input-group mb-3">
                    <DatePicker
                      selected={dob}
                      onChange={(dob) => setDob(dob)}
                      placeholderText="Select DOB"
                      className="form-control"
                      dateFormat="MMMM d, yyyy"
                      showYearDropdown
                      showMonthDropdown
                      scrollableYearDropdown
                      yearDropdownItemNumber={50}
                      minDate={new Date(1970, 0, 1)} //January 1, 1970
                      maxDate={new Date()} //current date
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() =>
                        document
                          .querySelector(".react-datepicker-wrapper input")
                          .focus()
                      }
                    >
                      <FontAwesomeIcon
                        icon={faCalendar}
                        style={{ color: "#000000", marginTop: "4px" }}
                      />
                    </button>
                  </div>
                </form>
                <br />
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
                  onClick={handleEditInfo}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Photo Modal */}
      {showPhotoModal && (
        <div
          className="modal"
          tabIndex="-1"
          style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title outfit-logReg">
                  Upload Profile Photo
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleClosePhotoModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>Upload Image</p>
                <input
                  type="file"
                  className="form-control mt-3"
                  accept=".jpg, .png, .jpeg"
                  onChange={handleImageChange}
                />
                {selectedImage.preview && (
                  <img
                    src={selectedImage.preview}
                    className="img-fluid mt-3"
                    alt="upload"
                  />
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClosePhotoModal}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleImageUpload}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default MyProfile;
